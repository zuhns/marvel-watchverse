import { describe, it, expect, vi } from "vitest";
import {
  rememberProfile,
  readProfile,
  validateUsername,
} from "../src/lib/profile";
import {
  ackPending,
  reconcileCloud,
  syncProgress,
  type ProgressChange,
} from "../src/lib/cloud";
import { createHandler } from "../supabase/functions/watchverse-sync/handler";
const date = "2026-10-08T12:00:00Z";
describe("profilo persistente", () => {
  it("normalizza il nome e non consente di sostituirlo", () => {
    let value: string | null = null;
    const storage = {
      getItem: () => value,
      setItem: (_k: string, v: string) => {
        value = v;
      },
    };
    expect(rememberProfile(storage, " Zuhns ")).toBe("zuhns");
    expect(readProfile(storage)).toBe("zuhns");
    expect(() => rememberProfile(storage, "altra-persona")).toThrow();
    expect(() => validateUsername("../bad")).toThrow();
  });
});
describe("riconciliazione progressi cloud", () => {
  it("mantiene modifiche locali durante una lettura cloud e propaga rimozioni", () => {
    const rows = [
      { title_id: "iron-man", watched_at: date, updated_at: date },
      { title_id: "thor", watched_at: null, updated_at: date },
    ];
    const pending = {
      "iron-man": { id: "iron-man", watchedAt: null, changedAt: date },
      hulk: { id: "hulk", watchedAt: date, changedAt: date },
    };
    expect(reconcileCloud(rows, pending)).toEqual({
      hulk: { watchedAt: date },
    });
  });
  it("un ack in ritardo non cancella un nuovo click sullo stesso titolo", () => {
    const sent: ProgressChange = {
      id: "iron-man",
      watchedAt: date,
      changedAt: date,
    };
    const newer = {
      ...sent,
      watchedAt: null,
      changedAt: "2026-10-08T12:00:01Z",
    };
    expect(ackPending({ "iron-man": newer }, [sent])).toEqual({
      "iron-man": newer,
    });
    expect(ackPending({ "iron-man": sent }, [sent])).toEqual({});
    const sameTimeRemoval = { ...sent, watchedAt: null };
    expect(ackPending({ "iron-man": sameTimeRemoval }, [sent])).toEqual({
      "iron-man": sameTimeRemoval,
    });
  });
  it("rifiuta dati cloud corrotti senza applicarli", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          progress: [
            { title_id: "iron-man", watched_at: "broken", updated_at: date },
          ],
        }),
      ),
    );
    await expect(
      syncProgress("zuhns", [], "https://example.test/sync"),
    ).rejects.toThrow("Risposta cloud");
    vi.unstubAllGlobals();
  });
});
describe("API username-only", () => {
  it("accede allo stesso profilo e restituisce anche le rimozioni", async () => {
    const repo = vi
      .fn()
      .mockResolvedValue([
        { title_id: "iron-man", watched_at: null, updated_at: date },
      ]);
    const handler = createHandler(repo);
    const response = await handler(
      new Request("https://example.test/sync", {
        method: "POST",
        headers: {
          origin: "https://zuhns.github.io",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          username: " Zuhns ",
          changes: [{ id: "iron-man", watchedAt: null, changedAt: date }],
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(repo).toHaveBeenCalledWith("zuhns", [
      { id: "iron-man", watchedAt: null, changedAt: date },
    ]);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "https://zuhns.github.io",
    );
    expect((await response.json()).progress[0].watched_at).toBeNull();
  });
  it("rifiuta enumerazione, nomi, ID e richieste non valide prima del database", async () => {
    const repo = vi.fn();
    const handler = createHandler(repo);
    for (const body of [
      { username: "../x", changes: [] },
      {
        username: "zuhns",
        changes: [{ id: "../x", watchedAt: date, changedAt: date }],
      },
      {
        username: "zuhns",
        changes: [{ id: "ok", watchedAt: null, changedAt: "broken" }],
      },
    ]) {
      const response = await handler(
        new Request("https://example.test/sync", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      );
      expect(response.status).toBe(400);
    }
    expect(
      (await handler(new Request("https://example.test/sync"))).status,
    ).toBe(405);
    expect(repo).not.toHaveBeenCalled();
  });
  it("gestisce preflight e rifiuta origini non autorizzate", async () => {
    const handler = createHandler(vi.fn());
    expect(
      (
        await handler(
          new Request("https://example.test/sync", {
            method: "OPTIONS",
            headers: { origin: "https://zuhns.github.io" },
          }),
        )
      ).status,
    ).toBe(204);
    expect(
      (
        await handler(
          new Request("https://example.test/sync", {
            method: "POST",
            headers: { origin: "https://other.example" },
          }),
        )
      ).status,
    ).toBe(403);
  });
});
