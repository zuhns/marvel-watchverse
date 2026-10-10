import { describe, expect, it } from "vitest";
import { gems, readInfinity, snapTargets } from "../src/lib/infinity";
import { titles } from "../src/lib/catalog";
describe("Infinity quest", () => {
  it("keeps only real gems, deduplicates them and never inserts an unfound gem", () => {
    expect(
      readInfinity(
        '{"collected":["space","space","fake"],"inserted":["space","time"]}',
      ),
    ).toEqual({ collected: ["space"], inserted: ["space"] });
    expect(readInfinity("broken")).toEqual({ collected: [], inserted: [] });
    expect(new Set(gems.map((g) => g.id)).size).toBe(6);
  });
  it("selects half of the films, including half of the visible unique films", () => {
    const movies = titles.filter((t) => t.type === "movie").map((t) => t.id),
      visible = movies.slice(0, 12);
    const result = snapTargets(
      movies,
      [...visible, visible[0], "a-series"],
      () => 0.37,
    );
    expect(result.size).toBe(Math.floor(movies.length / 2));
    expect(visible.filter((id) => result.has(id))).toHaveLength(6);
    expect([...result].every((id) => movies.includes(id))).toBe(true);
    expect(result.has("a-series")).toBe(false);
  });
  it("works with a single film, empty results and a fully visible archive", () => {
    expect(snapTargets([], []).size).toBe(0);
    expect(snapTargets(["one"], ["one"]).size).toBe(0);
    expect(snapTargets(["a", "b", "c", "d"], ["a"]).has("a")).toBe(true);
    expect(snapTargets(["a", "b", "c", "d"], ["a", "b", "c", "d"]).size).toBe(
      2,
    );
  });
});
