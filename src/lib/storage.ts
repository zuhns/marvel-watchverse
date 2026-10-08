import type { Backup, Preferences, Watched } from "../types";
import { defaults } from "./catalog";
export const STORAGE_KEY = "marvel-watchverse.v1";
export function parseBackup(value: unknown): Backup {
  if (!value || typeof value !== "object")
    throw Error("Il file non contiene un backup valido.");
  const b = value as Partial<Backup>;
  if (
    b.version !== 1 ||
    !b.watched ||
    typeof b.watched !== "object" ||
    Array.isArray(b.watched) ||
    !b.preferences ||
    typeof b.preferences !== "object"
  )
    throw Error("Formato del backup non supportato.");
  for (const [id, v] of Object.entries(b.watched)) {
    if (
      !/^[a-z0-9][a-z0-9-]*$/.test(id) ||
      !v ||
      typeof v !== "object" ||
      typeof v.watchedAt !== "string" ||
      !Number.isFinite(Date.parse(v.watchedAt))
    )
      throw Error("Il backup contiene progressi non validi.");
  }
  const p = b.preferences;
  if (!["release", "chronology", "recommended"].includes(p.order))
    throw Error("Ordine di visione non valido.");
  for (const k of [
    "category",
    "universe",
    "format",
    "state",
    "availability",
    "search",
  ] as const)
    if (typeof p[k] !== "string") throw Error("Preferenze non valide.");
  if (
    !["all", "movie", "series", "short", "special"].includes(p.format) ||
    !["all", "seen", "unseen"].includes(p.state) ||
    !["all", "released", "upcoming"].includes(p.availability)
  )
    throw Error("Filtri non validi.");
  return {
    version: 1,
    exportedAt:
      typeof b.exportedAt === "string"
        ? b.exportedAt
        : new Date().toISOString(),
    watched: Object.fromEntries(Object.entries(b.watched)),
    preferences: { ...defaults, ...p },
  };
}
export function loadState(storage: Pick<Storage, "getItem">) {
  try {
    const s = storage.getItem(STORAGE_KEY);
    return s
      ? parseBackup(JSON.parse(s))
      : { watched: {} as Watched, preferences: { ...defaults } };
  } catch {
    return { watched: {} as Watched, preferences: { ...defaults } };
  }
}
export function saveState(
  storage: Pick<Storage, "setItem">,
  watched: Watched,
  preferences: Preferences,
) {
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify(makeBackup(watched, preferences)),
  );
}
export function makeBackup(watched: Watched, preferences: Preferences): Backup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    watched,
    preferences,
  };
}
export function mergeWatched(current: Watched, incoming: Watched): Watched {
  return Object.fromEntries([
    ...Object.entries(current),
    ...Object.entries(incoming),
  ]);
}
