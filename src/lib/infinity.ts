export const gems = [
  { id: "space", name: "Spazio", color: "#399dff", page: "home" },
  { id: "reality", name: "Realtà", color: "#ff3e57", page: "archive" },
  { id: "power", name: "Potere", color: "#b872ff", page: "universes" },
  { id: "mind", name: "Mente", color: "#ffe66b", page: "progress" },
  { id: "time", name: "Tempo", color: "#56f4a3", page: "friends" },
  { id: "soul", name: "Anima", color: "#ffad54", page: "footer" },
] as const;
export type GemId = (typeof gems)[number]["id"];
export const infinityStorageKey = "marvel-watchverse.infinity.v1";
export function readInfinity(raw: string | null): {
  collected: GemId[];
  inserted: GemId[];
} {
  try {
    const value = JSON.parse(raw || "null");
    const valid = (list: unknown): GemId[] =>
      Array.isArray(list)
        ? [
            ...new Set(
              list.filter((id): id is GemId =>
                gems.some((gem) => gem.id === id),
              ),
            ),
          ]
        : [];
    const collected = valid(value?.collected);
    return {
      collected,
      inserted: valid(value?.inserted).filter((id) => collected.includes(id)),
    };
  } catch {
    return { collected: [], inserted: [] };
  }
}
function shuffle(ids: string[], random: () => number) {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function snapTargets(
  movieIds: string[],
  visibleIds: string[],
  random = Math.random,
): Set<string> {
  const all = [...new Set(movieIds)],
    visible = [...new Set(visibleIds)].filter((id) => all.includes(id));
  const visibleSet = new Set(visible);
  const victims = shuffle(visible, random).slice(
    0,
    Math.min(Math.floor(all.length / 2), Math.ceil(visible.length / 2)),
  );
  const remaining = shuffle(
    all.filter((id) => !visibleSet.has(id)),
    random,
  );
  return new Set([
    ...victims,
    ...remaining.slice(0, Math.floor(all.length / 2) - victims.length),
  ]);
}
