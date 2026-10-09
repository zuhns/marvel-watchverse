export interface Change {
  id: string;
  watchedAt: string | null;
  changedAt: string;
}
export type Repository = (
  username: string,
  changes: Change[],
) => Promise<unknown[]>;
export function createHandler(
  repository: Repository,
  origins = [
    "https://zuhns.github.io",
    "http://127.0.0.1:4173",
    "http://127.0.0.1:5173",
  ],
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
      if (
        !/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username) ||
        !Array.isArray(body.changes) ||
        body.changes.length > 1000
      )
        throw Error("Invalid request");
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
      const progress = await repository(username, body.changes);
      return Response.json({ username, progress }, { headers });
    } catch (e) {
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
