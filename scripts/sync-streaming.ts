import { readFile, writeFile, mkdir } from "node:fs/promises";
import {
  publicEntities,
  contentOf,
  offersOf,
  normalizeTitle,
} from "./lib/justwatch";
import {
  streamingKey,
  streamingSearch,
  type StreamingDataset,
  type StreamingEntry,
} from "../src/lib/streaming";
import type { Title } from "../src/types";
const titles: Title[] = JSON.parse(
  await readFile("src/data/titles.json", "utf8"),
);
const output = "public/data/streaming-it.json";
const overrides: Record<string, { year: number }> = JSON.parse(
  await readFile("scripts/data/justwatch-overrides.json", "utf8"),
);
let previous: StreamingDataset | undefined;
try {
  previous = JSON.parse(await readFile(output, "utf8"));
} catch {
  /* first refresh */
}
const entries: Record<string, StreamingEntry> = {};
const groups = new Map<string, Title[]>();
for (const title of titles) {
  const key = streamingKey(title);
  groups.set(key, [...(groups.get(key) || []), title]);
}
const errors: string[] = [];
let requests = 0,
  completed = 0;
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function page(url: string) {
  await pause(350);
  requests++;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: {
      "User-Agent":
        "MarvelWatchverse/1.0 (public availability index; low-rate daily refresh)",
      "Accept-Language": "it-IT,it;q=0.9",
    },
  });
  if (!response.ok) throw new Error(`JustWatch HTTP ${response.status}`);
  const html = await response.text();
  if (html.length > 25000000) throw new Error("Public page too large");
  return publicEntities(html);
}
async function sync(key: string, seasons: Title[]) {
  const title = [...seasons].sort((a, b) => a.year - b.year)[0];
  const scope = title.type === "series" ? "show" : "movie";
  const name = title.title.replace(/\s*—\s*Stagione\s+\d+$/i, "");
  const source = streamingSearch(name);
  if (seasons.every((t) => t.status === "upcoming")) {
    entries[key] = {
      status: "upcoming",
      checkedAt: null,
      source,
      scope,
      offers: [],
    };
    return;
  }
  try {
    let matched: any,
      entities: any[] = [];
    const names = [...new Set([name, title.originalTitle])];
    const expected = new Set(names.map(normalizeTitle));
    for (const query of names) {
      entities = await page(streamingSearch(query));
      const candidates = entities.filter(
        (e) =>
          e.__typename === (scope === "show" ? "Show" : "Movie") &&
          contentOf(e)?.originalReleaseYear ===
            (overrides[key]?.year ?? title.year),
      );
      matched = candidates.find((e) =>
        expected.has(normalizeTitle(contentOf(e)?.title || "")),
      );
      if (matched) break;
      // Translated titles are verified against the original title on the public detail page.
      for (const candidate of candidates.slice(0, 3)) {
        const path = contentOf(candidate)?.fullPath;
        if (typeof path !== "string" || !path.startsWith("/it/")) continue;
        const detail = await page(`https://www.justwatch.com${path}`);
        const exact = detail.find(
          (e) =>
            e.__typename === candidate.__typename &&
            e.id === candidate.id &&
            expected.has(normalizeTitle(contentOf(e)?.originalTitle || "")),
        );
        if (exact) {
          matched = exact;
          entities = detail;
          break;
        }
      }
      if (matched) break;
    }
    if (!matched)
      entries[key] = {
        status: "not_found",
        checkedAt: new Date().toISOString(),
        source,
        scope,
        offers: [],
      };
    else {
      const offers = offersOf(matched, entities);
      if (offers === null)
        throw new Error("Offer field missing; preserving previous data");
      const path = contentOf(matched)?.fullPath;
      entries[key] = {
        status: offers.length ? "available" : "no_offers",
        checkedAt: new Date().toISOString(),
        source:
          typeof path === "string" && path.startsWith("/it/")
            ? `https://www.justwatch.com${path}`
            : source,
        scope,
        offers,
      };
    }
  } catch (error) {
    errors.push(`${title.title}: ${String(error)}`);
    entries[key] = previous?.entries[key] || {
      status: "not_found",
      checkedAt: null,
      source,
      scope,
      offers: [],
    };
  }
  completed++;
  console.log(
    `${completed}/${groups.size} ${title.title}: ${entries[key].status} (${entries[key].offers.length})`,
  );
}
// Sequential access avoids flooding the public website. No private API or credentials.
for (const [key, group] of groups) {
  if (
    process.argv.includes("--retry-unresolved") &&
    previous?.entries[key] &&
    previous.entries[key].status !== "not_found"
  )
    entries[key] = previous.entries[key];
  else await sync(key, group);
}
const available = Object.values(entries).filter(
  (e) => e.status === "available",
).length;
if (errors.length > groups.size / 3)
  throw new Error(
    `Refresh rejected: ${errors.length} errors; existing dataset untouched`,
  );
await mkdir("public/data", { recursive: true });
await writeFile(
  output,
  JSON.stringify(
    {
      country: "IT",
      generatedAt: new Date().toISOString(),
      entries,
    } satisfies StreamingDataset,
    null,
    2,
  ) + "\n",
);
await mkdir("reports", { recursive: true });
await writeFile(
  "reports/streaming-coverage.json",
  JSON.stringify(
    {
      productions: groups.size,
      titles: titles.length,
      available,
      requests,
      errors,
      unresolved: [...groups]
        .filter(([key]) => entries[key].status === "not_found")
        .map(([key, group]) => ({
          key,
          title: group[0].title,
          source: entries[key].source,
        })),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Saved ${available}/${groups.size} available productions; ${errors.length} errors.`,
);
