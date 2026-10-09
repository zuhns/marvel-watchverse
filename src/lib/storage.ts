import type { Backup, Preferences, Watched, Format } from "../types";
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
  const p = b.preferences as unknown as Record<string, unknown>;
  if (!["release", "chronology", "recommended"].includes(String(p.order)))
    throw Error("Ordine di visione non valido.");
  for (const k of ["state", "availability", "search"] as const)
    if (typeof p[k] !== "string") throw Error("Preferenze non valide.");
  if (
    !["all", "seen", "unseen"].includes(String(p.state)) ||
    !["all", "released", "upcoming"].includes(String(p.availability))
  )
    throw Error("Filtri non validi.");
  const selection = (key: string, legacy: string, all: string) => {
    if (p[key] !== undefined) {
      const a = p[key];
      if (
        !Array.isArray(a) ||
        a.length > 100 ||
        a.some((v) => typeof v !== "string" || v.length > 150)
      )
        throw Error("Selezione multipla non valida.");
      return [...new Set(a)] as string[];
    }
    if (typeof p[legacy] !== "string") throw Error("Preferenze non valide.");
    return p[legacy] === all ? [] : [p[legacy] as string];
  };
  const formats = selection("formats", "format", "all");
  if (formats.some((f) => !["movie", "series", "short", "special"].includes(f)))
    throw Error("Formati non validi.");
  if (p.nerdMode !== undefined && typeof p.nerdMode !== "boolean")
    throw Error("Modalità Nerd non valida.");
  if (
    p.advancedNerdMode !== undefined &&
    typeof p.advancedNerdMode !== "boolean"
  )
    throw Error("Modalità Nerd Multiverso non valida.");
  const preferences: Preferences = {
    order: p.order as Preferences["order"],
    categories: selection("categories", "category", "Tutti"),
    universes: selection("universes", "universe", "Tutti"),
    formats: formats as Format[],
    nerdMode: p.nerdMode === true,
    advancedNerdMode: p.advancedNerdMode === true,
    state: p.state as string,
    availability: p.availability as string,
    search: p.search as string,
  };
  return {
    version: 1,
    exportedAt:
      typeof b.exportedAt === "string"
        ? b.exportedAt
        : new Date().toISOString(),
    watched: Object.fromEntries(Object.entries(b.watched)),
    preferences,
  };
}
export function loadState(storage: Pick<Storage, "getItem">) {
  try {
    const s = storage.getItem(STORAGE_KEY);
    if (!s) return { watched: {} as Watched, preferences: { ...defaults } };
    const raw = JSON.parse(s);
    const state = parseBackup(raw);
    if (raw.preferences?.advancedNerdMode === undefined)
      state.preferences = {
        ...state.preferences,
        order: defaults.order,
        formats: [...defaults.formats],
        nerdMode: false,
        advancedNerdMode: false,
      };
    return state;
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
