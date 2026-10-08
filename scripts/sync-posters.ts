import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import type { Title, Poster } from "../src/types";
const token = process.env.TMDB_READ_TOKEN;
if (!token) {
  console.error(
    "Imposta TMDB_READ_TOKEN nell’ambiente del processo. Non usare un prefisso VITE_.",
  );
  process.exit(1);
}
const titles = JSON.parse(
  readFileSync("src/data/titles.json", "utf8"),
) as Title[];
const manifest = JSON.parse(
  readFileSync("src/data/posters.json", "utf8"),
) as Record<string, Poster>;
const missing: { id: string; reason: string }[] = [];
const get = async (path: string) => {
  const r = await fetch(`https://api.themoviedb.org/3/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw Error(`TMDB HTTP ${r.status}`);
  return r.json();
};
for (const title of titles) {
  try {
    if (!title.tmdbId)
      throw Error("Identificativo TMDB mancante: verifica manuale richiesta.");
    const kind = title.type === "series" ? "tv" : "movie";
    const root = await get(`${kind}/${title.tmdbId}?language=en-US`);
    const date = root.release_date ?? root.first_air_date;
    const expected = title.season
      ? (titles.find((t) => t.tmdbId === title.tmdbId && t.season === 1)
          ?.year ?? title.year)
      : title.year;
    if (date && Math.abs(Number(date.slice(0, 4)) - expected) > 1)
      throw Error("Anno non corrispondente all’identificativo.");
    if (kind === "movie" && (!root.title || root.first_air_date))
      throw Error("Tipologia TMDB non corrispondente.");
    if (kind === "tv" && (!root.name || !root.first_air_date))
      throw Error("Tipologia TMDB non corrispondente.");
    let poster = root.poster_path;
    let seasonSpecific = false;
    if (title.season) {
      const season = await get(
        `tv/${title.tmdbId}/season/${title.season}?language=en-US`,
      );
      if (season.poster_path) {
        poster = season.poster_path;
        seasonSpecific = true;
      }
    }
    if (!poster) throw Error("Poster non disponibile.");
    const url = `https://image.tmdb.org/t/p/w500${poster}`;
    const r = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok || !r.headers.get("content-type")?.startsWith("image/"))
      throw Error("URL immagine non valido.");
    manifest[title.id] = {
      url,
      localPath: null,
      sourceUrl: `https://www.themoviedb.org/${kind}/${title.tmdbId}${title.season ? `/season/${title.season}` : ""}`,
      verified: true,
      checkedAt: new Date().toISOString(),
      seasonSpecific,
    };
  } catch (e) {
    missing.push({ id: title.id, reason: String(e) });
  }
}
writeFileSync("src/data/posters.json", JSON.stringify(manifest, null, 2));
mkdirSync("reports", { recursive: true });
writeFileSync(
  "reports/posters-sync.json",
  JSON.stringify({ checkedAt: new Date().toISOString(), missing }, null, 2),
);
console.log(
  `Sincronizzazione conclusa: ${missing.length} elementi da verificare.`,
);
if (missing.length) process.exitCode = 1;
