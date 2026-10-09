export interface Change {
  id: string;
  watchedAt: string | null;
  changedAt: string;
}
export type Repository = (
  username: string,
  changes: Change[],
  marathonId?: string,
) => Promise<unknown[]>;
export interface SocialCommand {
  action: string;
  friend?: string;
  name?: string;
  marathonId?: string;
}
export class PublicError extends Error {}
export function createHandler(
  repository: Repository,
  origins = [
    "https://zuhns.github.io",
    "http://127.0.0.1:4173",
    "http://127.0.0.1:5173",
  ],
  social?: (username: string, command: SocialCommand) => Promise<unknown>,
) {
  return async (request: Request) => {
    const origin = request.headers.get("origin");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Vary: "Origin",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
    };
    if (origin && !origins.includes(origin))
      return Response.json(
        { error: "Origin not allowed" },
        { status: 403, headers },
      );
    if (origin) headers["Access-Control-Allow-Origin"] = origin;
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (request.method !== "POST")
      return Response.json(
        { error: "Method not allowed" },
        { status: 405, headers },
      );
    try {
      if (Number(request.headers.get("content-length") ?? 0) > 100_000)
        return Response.json(
          { error: "Request too large" },
          { status: 413, headers },
        );
      const text = await request.text();
      if (text.length > 100_000)
        return Response.json(
          { error: "Request too large" },
          { status: 413, headers },
        );
      const body = JSON.parse(text);
      const username =
        typeof body.username === "string"
          ? body.username.trim().toLowerCase()
          : "";
      if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username))
        throw Error("Invalid request");
      const action = body.action ?? "sync";
      if (
        body.marathonId !== undefined &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          body.marathonId,
        )
      )
        throw Error("Invalid marathon");
      if (action !== "sync") {
        if (
          !social ||
          ![
            "social",
            "friend_add",
            "friend_remove",
            "friend_view",
            "marathon_create",
            "marathon_accept",
            "marathon_decline",
          ].includes(action)
        )
          throw Error("Invalid action");
        const friend =
          typeof body.friend === "string"
            ? body.friend.trim().toLowerCase()
            : undefined;
        if (
          [
            "friend_add",
            "friend_remove",
            "friend_view",
            "marathon_create",
          ].includes(action) &&
          (!friend || !/^[a-z0-9][a-z0-9._-]{2,31}$/.test(friend))
        )
          throw Error("Invalid friend");
        if (
          action === "marathon_create" &&
          (typeof body.name !== "string" ||
            body.name.trim().length < 3 ||
            body.name.trim().length > 60)
        )
          throw Error("Invalid name");
        if (
          ["marathon_accept", "marathon_decline"].includes(action) &&
          !body.marathonId
        )
          throw Error("Invalid invitation");
        return Response.json(
          await social(username, {
            action,
            friend,
            name: body.name?.trim(),
            marathonId: body.marathonId,
          }),
          { headers },
        );
      }
      if (!Array.isArray(body.changes) || body.changes.length > 1000)
        throw Error("Invalid changes");
      const now = Date.now();
      const ids = new Set();
      for (const c of body.changes) {
        if (
          !c ||
          typeof c.id !== "string" ||
          !/^[a-z0-9][a-z0-9-]{0,179}$/.test(c.id) ||
          ids.has(c.id) ||
          typeof c.changedAt !== "string" ||
          !Number.isFinite(Date.parse(c.changedAt)) ||
          Date.parse(c.changedAt) > now + 60_000 ||
          (c.watchedAt !== null &&
            (typeof c.watchedAt !== "string" ||
              !Number.isFinite(Date.parse(c.watchedAt))))
        )
          throw Error("Invalid progress");
        ids.add(c.id);
      }
      const progress = body.marathonId
        ? await repository(username, body.changes, body.marathonId)
        : await repository(username, body.changes);
      return Response.json({ username, progress }, { headers });
    } catch (e) {
      if (e instanceof PublicError)
        return Response.json({ error: e.message }, { status: 400, headers });
      if (
        e instanceof SyntaxError ||
        (e instanceof Error && /^Invalid/.test(e.message))
      )
        return Response.json(
          { error: "Invalid request" },
          { status: 400, headers },
        );
      return Response.json(
        { error: "Sync unavailable" },
        { status: 503, headers },
      );
    }
  };
}
