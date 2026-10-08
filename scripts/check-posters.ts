import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import type { Poster } from "../src/types";
const posters = JSON.parse(
  readFileSync("src/data/posters.json", "utf8"),
) as Record<string, Poster>;
const queue = Object.entries(posters);
const results: {
  id: string;
  ok: boolean;
  status: number | null;
  url: string | null;
  error?: string;
}[] = [];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const [id, p] = queue.shift()!;
      try {
        if (!p.url) {
          results.push({ id, ok: false, status: null, url: null });
          continue;
        }
        const r = await fetch(p.url, { signal: AbortSignal.timeout(20000) });
        const type = r.headers.get("content-type") ?? "";
        const bytes = await r.arrayBuffer();
        results.push({
          id,
          ok: r.ok && type.startsWith("image/") && bytes.byteLength > 1000,
          status: r.status,
          url: p.url,
        });
      } catch (e) {
        results.push({
          id,
          ok: false,
          status: null,
          url: p.url,
          error: String(e),
        });
      }
    }
  }),
);
mkdirSync("reports", { recursive: true });
writeFileSync(
  "reports/posters-network.json",
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      total: results.length,
      passed: results.filter((r) => r.ok).length,
      missing: results.filter((r) => !r.ok),
      results,
    },
    null,
    2,
  ),
);
console.log(
  `${results.filter((r) => r.ok).length}/${results.length} immagini raggiungibili.`,
);
if (results.some((r) => !r.ok)) process.exitCode = 1;
