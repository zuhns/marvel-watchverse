import raw from "../data/titles.json";
import posterData from "../data/posters.json";
import type { Title, Poster, Order, Preferences, Watched } from "../types";
export const titles = raw as Title[];
export const posters = posterData as Record<string, Poster>;
export const labels = {
  movie: "Film",
  series: "Serie",
  short: "Corto",
  special: "Speciale",
};
export const orderLabels: Record<Order, string> = {
  release: "Ordine di uscita",
  chronology: "Cronologia interna",
  recommended: "Percorso consigliato",
};
export const defaults: Preferences = {
  order: "recommended",
  categories: [],
  universes: [],
  formats: ["movie", "series"],
  nerdMode: false,
  advancedNerdMode: false,
  state: "all",
  availability: "released",
  search: "",
};
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function sortTitles(list: Title[], order: Order): Title[] {
  return [...list].sort((a, b) =>
    order === "release"
      ? a.releaseDate.localeCompare(b.releaseDate) || a.id.localeCompare(b.id)
      : order === "recommended"
        ? a.recommendedOrder - b.recommendedOrder
        : a.timelineGroup.localeCompare(b.timelineGroup) ||
          (a.chronologicalOrder ?? Infinity) -
            (b.chronologicalOrder ?? Infinity) ||
          a.releaseOrder - b.releaseOrder,
  );
}
export function filterTitles(list: Title[], p: Preferences, w: Watched) {
  const q = normalize(p.search.trim());
  return list.filter(
    (t) =>
      includedInMode(t, p.nerdMode, p.advancedNerdMode) &&
      (!p.categories.length || p.categories.includes(t.category)) &&
      (!p.universes.length || p.universes.includes(t.universe)) &&
      (!p.formats.length || p.formats.includes(t.type)) &&
      (p.state === "all" || (p.state === "seen" ? !!w[t.id] : !w[t.id])) &&
      (p.availability === "all" || t.status === p.availability) &&
      (!q ||
        normalize(
          [
            t.title,
            t.originalTitle,
            t.year,
            t.franchise,
            t.universe,
            ...(t.characters ?? []),
          ].join(" "),
        ).includes(q)),
  );
}
export function stats(list: Title[], w: Watched) {
  const released = list.filter((t) => t.status === "released");
  const seen = released.filter((t) => w[t.id]).length;
  return {
    total: released.length,
    seen,
    remaining: released.length - seen,
    percent: released.length ? Math.round((seen / released.length) * 100) : 0,
  };
}
export function nextTitle(list: Title[], order: Order, w: Watched) {
  return sortTitles(list, order).find(
    (t) => t.status === "released" && !w[t.id],
  );
}
export const multiverseUniverses = [
  "Hulk animato 1982",
  "Hulk televisivo 1977",
  "Marvel animato 1990s",
  "Spider-Man animato 1967",
  "Spider-Man animato 1981",
  "Spider-Man animato 1994",
  "Spider-Man televisivo 1977",
  "Spider-Man Toei",
  "Avengers EMH",
  "Disk Wars",
  "Fantastic Four animato 2006",
  "Future Avengers",
  "Hit-Monkey",
  "Iron Man Armored Adventures",
  "Marvel animato — Film indipendenti",
  "Marvel animato 2010s",
  "Spectacular Spider-Man",
  "Spider-Man animato 2017",
  "Spider-Man Unlimited",
  "Spidey and Friends",
  "Super Hero Squad",
  "X-Men animato 1992",
  "X-Men Evolution",
  "Wolverine and the X-Men",
];
export const sideUniverses = [
  "Blade",
  "The Gifted",
  "Legion",
  "Helstrom — Continuità indipendente",
  "Marvel Television — SHIELD",
  "Marvel Television — Agent Carter",
  "Marvel Television — Inhumans",
  "Marvel Television — Runaways",
  "Marvel Television — Cloak & Dagger",
  "MODOK",
  "Spider-Noir",
  "Spider-Man — Continuità alternativa",
];
export function contentTier(t: Title): "core" | "nerd" | "multiverse" {
  // A series belongs to one tier, including seasons released after 1998.
  // MCU animation has its own narrative branches and stays in the main path.
  if (sideUniverses.includes(t.universe)) return "nerd";
  if (
    multiverseUniverses.includes(t.universe) ||
    (t.category === "Animazione" && !t.universe.startsWith("MCU")) ||
    t.year < 1998 ||
    t.originalTitle === "Nick Fury: Agent of S.H.I.E.L.D."
  )
    return "multiverse";
  return "core";
}
export function includedInMode(t: Title, nerdMode: boolean, advanced = false) {
  const tier = contentTier(t);
  return (
    tier === "core" ||
    (tier === "nerd" && nerdMode) ||
    (tier === "multiverse" && advanced)
  );
}
export const modeTitles = (
  list: Title[],
  nerdMode: boolean,
  advanced = false,
) => list.filter((t) => includedInMode(t, nerdMode, advanced));
export const pathTitles = (list: Title[], p: Preferences) =>
  modeTitles(list, p.nerdMode, p.advancedNerdMode).filter(
    (t) => !p.formats.length || p.formats.includes(t.type),
  );
