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
  category: "Tutti",
  universe: "Tutti",
  format: "all",
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
      (p.category === "Tutti" || t.category === p.category) &&
      (p.universe === "Tutti" || t.universe === p.universe) &&
      (p.format === "all" || t.type === p.format) &&
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
