import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

describe("database dei progressi", () => {
  let db: PGlite;
  beforeAll(async () => {
    db = await PGlite.create();
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to service_role;",
    );
    await db.exec(
      readFileSync(
        new URL("../supabase/schemas/watchverse.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        new URL("../supabase/schemas/social.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec("set role service_role");
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });

  async function sync(username: string, changes: object[] = []) {
    return (
      await db.query<{
        title_id: string;
        watched_at: Date | null;
        updated_at: Date;
      }>("select * from public.watchverse_sync($1,$2::jsonb)", [
        username,
        JSON.stringify(changes),
      ])
    ).rows;
  }

  it("mantiene modifiche indipendenti, rimozioni e isolamento tra profili", async () => {
    const initial = "2026-10-08T12:00:00Z";
    const later = "2026-10-08T12:01:00Z";
    await sync("alice", [
      { id: "iron-man", watchedAt: initial, changedAt: initial },
    ]);
    await sync("alice", [{ id: "thor", watchedAt: later, changedAt: later }]);
    expect((await sync("alice")).map((r) => r.title_id).sort()).toEqual([
      "iron-man",
      "thor",
    ]);
    await sync("alice", [
      { id: "iron-man", watchedAt: null, changedAt: later },
    ]);
    await sync("alice", [
      { id: "iron-man", watchedAt: initial, changedAt: initial },
    ]);
    expect(
      (await sync("alice")).find((r) => r.title_id === "iron-man")?.watched_at,
    ).toBeNull();
    expect(
      (await sync("alice")).find((r) => r.title_id === "thor")?.watched_at,
    ).not.toBeNull();
    expect(await sync("bob")).toEqual([]);
  });

  it("impedisce accesso diretto e RPC alle chiavi pubbliche", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await expect(
        db.query("select * from public.watchverse_profiles"),
      ).rejects.toThrow(/permission denied/);
      await expect(
        db.query("select * from public.watchverse_progress"),
      ).rejects.toThrow(/permission denied/);
      await expect(sync("alice")).rejects.toThrow(/permission denied/);
      await db.exec("reset role");
    }
    await db.exec("set role service_role");
  });
  it("amici e maratone richiedono profili reali, accettazione e appartenenza", async () => {
    const social = async (
      name: string,
      action: string,
      target: string | null = null,
      label: string | null = null,
      group: string | null = null,
    ) =>
      (
        await db.query<{
          data: {
            friends: string[];
            marathons: { id: string; status: string }[];
            progress: unknown[];
          };
        }>("select public.watchverse_social($1,$2,$3,$4,$5::uuid) as data", [
          name,
          action,
          target,
          label,
          group,
        ])
      ).rows[0].data;
    await expect(social("alice", "friend_add", "missing")).rejects.toThrow(
      "Profile not found",
    );
    expect((await social("alice", "friend_add", "bob")).friends).toEqual([
      "bob",
    ]);
    expect((await social("alice", "friend_view", "bob")).progress).toEqual([]);
    const group = (
      await social("alice", "marathon_create", "bob", "Prima maratona")
    ).marathons[0].id;
    const groupSync = (name: string, changes: object[] = []) =>
      db.query(
        "select * from public.watchverse_marathon_sync($1,$2::uuid,$3::jsonb)",
        [name, group, JSON.stringify(changes)],
      );
    expect((await groupSync("alice")).rows).toEqual([]);
    await expect(groupSync("bob")).rejects.toThrow("Marathon access denied");
    expect(
      (await social("bob", "marathon_accept", null, null, group)).marathons[0]
        .status,
    ).toBe("accepted");
    await groupSync("bob", [
      {
        id: "iron-man",
        watchedAt: "2026-10-09T12:00:00Z",
        changedAt: "2026-10-09T12:00:00Z",
      },
    ]);
    expect((await groupSync("alice")).rows).toHaveLength(1);
    expect(await sync("bob")).toEqual([]); // Il profilo personale non viene modificato.
    await expect(groupSync("outsider")).rejects.toThrow(
      "Marathon access denied",
    );
    await db.exec("set role anon");
    await expect(
      db.query("select * from public.watchverse_marathon_progress"),
    ).rejects.toThrow(/permission denied/);
    await expect(social("alice", "social")).rejects.toThrow(
      /permission denied/,
    );
    await db.exec("reset role; set role service_role");
  });
});
