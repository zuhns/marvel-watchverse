import { readFileSync } from "node:fs";
import type { Title, Poster } from "../src/types";
const titles = JSON.parse(
  readFileSync("src/data/titles.json", "utf8"),
) as Title[];
const posters = JSON.parse(
  readFileSync("src/data/posters.json", "utf8"),
) as Record<string, Poster>;
const errors: string[] = [];
const ids = new Set<string>();
for (const t of titles) {
  if (ids.has(t.id)) errors.push(`ID duplicato: ${t.id}`);
  ids.add(t.id);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(t.id)) errors.push(`ID non valido: ${t.id}`);
  if (
    !t.title ||
    !t.universe ||
    !t.continuity ||
    !t.timelineGroup ||
    !t.sourceUrl
  )
    errors.push(`Metadati incompleti: ${t.id}`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(t.releaseDate) ||
    !Number.isFinite(Date.parse(t.releaseDate))
  )
    errors.push(`Data non valida: ${t.id}`);
  if (t.status === "released" && t.releaseDate > "2026-10-08")
    errors.push(`Uscita futura trattata come pubblicata: ${t.id}`);
  if (!["movie", "series", "short", "special"].includes(t.type))
    errors.push(`Formato non valido: ${t.id}`);
  if (!posters[t.id]) errors.push(`Manifest poster assente: ${t.id}`);
  if (posters[t.id]?.verified && !posters[t.id]?.url)
    errors.push(`Verifica senza URL: ${t.id}`);
}
if (titles.length < 200)
  errors.push("Il catalogo deve includere almeno 200 produzioni/stagioni.");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  `Catalogo valido: ${titles.length} ID univoci; ${Object.values(posters).filter((p) => p.verified).length} poster verificati.`,
);
