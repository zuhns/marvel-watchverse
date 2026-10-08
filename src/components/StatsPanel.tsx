import { stats } from "../lib/catalog";
import type { Title, Watched } from "../types";
export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label="Completamento"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div style={{ width: `${percent}%` }} />
    </div>
  );
}
export function StatsPanel({
  titles,
  watched,
}: {
  titles: Title[];
  watched: Watched;
}) {
  const s = stats(titles, watched);
  return (
    <div className="stats-panel">
      <div>
        <strong>{titles.length}</strong>
        <span>Titoli in archivio · {s.total} pubblicati</span>
      </div>
      <div>
        <strong>{s.seen.toString().padStart(2, "0")}</strong>
        <span>Storie già vissute</span>
      </div>
      <div>
        <strong>{s.remaining}</strong>
        <span>Ancora da scoprire</span>
      </div>
      <div>
        <strong>
          {s.percent}
          <small>%</small>
        </strong>
        <span>Il tuo Watchverse</span>
        <ProgressBar percent={s.percent} />
      </div>
    </div>
  );
}
