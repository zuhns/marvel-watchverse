import {
  Download,
  Upload,
  FileSpreadsheet,
  Play,
  ArrowRight,
  Check,
} from "lucide-react";
import { titles, stats, nextTitle, labels } from "../lib/catalog";
import { StatsPanel, ProgressBar } from "../components/StatsPanel";
import { PosterImage } from "../components/PosterImage";
import type { Watched, Order, Title } from "../types";
export function Progress({
  watched,
  order,
  open,
  exportJSON,
  exportXLSX,
  importFile,
  busy,
}: {
  watched: Watched;
  order: Order;
  open: (t: Title) => void;
  exportJSON: () => void;
  exportXLSX: () => void;
  importFile: (f: File) => void;
  busy: boolean;
}) {
  const next = nextTitle(titles, order, watched);
  const recent = titles
    .filter((t) => watched[t.id])
    .sort((a, b) =>
      watched[b.id].watchedAt.localeCompare(watched[a.id].watchedAt),
    )
    .slice(0, 8);
  return (
    <section className="page-section">
      <div className="eyebrow">OGNI STORIA CONTA</div>
      <h1 className="page-title">
        IL TUO
        <br />
        <span>WATCHVERSE.</span>
      </h1>
      <p className="page-intro">
        La tua maratona, un capitolo alla volta. I progressi restano su questo
        browser.
      </p>
      <StatsPanel titles={titles} watched={watched} />
      <div className="progress-layout">
        <div>
          {next && (
            <div className="continue-card">
              <PosterImage title={next} />
              <div>
                <div className="eyebrow">CONTINUA LA MARATONA</div>
                <h2>{next.title}</h2>
                <p>
                  {next.year} · {labels[next.type]} · {next.universe}
                </p>
                <button className="button primary" onClick={() => open(next)}>
                  <Play size={15} />
                  Prossimo capitolo
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
          <h2 className="subheading">Il viaggio per universo</h2>
          <div className="progress-universes">
            {[...new Set(titles.map((t) => t.universe))].map((u) => {
              const s = stats(
                titles.filter((t) => t.universe === u),
                watched,
              );
              return (
                <div key={u}>
                  <div className="progress-label">
                    <strong>{u}</strong>
                    <span>
                      {s.seen}/{s.total} · {s.percent}%
                    </span>
                  </div>
                  <ProgressBar percent={s.percent} />
                </div>
              );
            })}
          </div>
        </div>
        <aside>
          <div className="backup-panel">
            <div className="eyebrow">PORTA CON TE LE TUE STORIE</div>
            <h2>Il tuo backup.</h2>
            <p>
              Esporta progressi e preferenze. L’importazione unisce i titoli
              visti senza cancellare quelli già salvati.
            </p>
            <button className="button secondary" onClick={exportJSON}>
              <Download size={17} />
              Esporta JSON
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={exportXLSX}
            >
              <FileSpreadsheet size={17} />
              {busy ? "Preparazione…" : "Esporta Excel · 3 ordini"}
            </button>
            <label className="button secondary import-button">
              <Upload size={17} />
              Importa JSON o Excel
              <input
                type="file"
                accept=".json,.xlsx"
                aria-label="Importa backup"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importFile(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="format-stats">
            {Object.entries(labels).map(([f, label]) => {
              const s = stats(
                titles.filter((t) => t.type === f),
                watched,
              );
              return (
                <div key={f}>
                  <span>{label} completati</span>
                  <b>
                    {s.seen} / {s.total}
                  </b>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
      <details className="franchise-progress">
        <summary>Il viaggio per franchise</summary>
        <div className="progress-universes">
          {[...new Set(titles.map((t) => t.franchise))]
            .sort()
            .map((franchise) => {
              const s = stats(
                titles.filter((t) => t.franchise === franchise),
                watched,
              );
              return (
                <div key={franchise}>
                  <div className="progress-label">
                    <strong>{franchise}</strong>
                    <span>
                      {s.seen}/{s.total} · {s.percent}%
                    </span>
                  </div>
                  <ProgressBar percent={s.percent} />
                </div>
              );
            })}
        </div>
      </details>
      <h2 className="subheading">Ultime storie viste</h2>
      {recent.length ? (
        <div className="recent-grid">
          {recent.map((t) => (
            <button key={t.id} onClick={() => open(t)}>
              <Check size={16} />
              <div>
                <strong>{t.title}</strong>
                <small>
                  {new Date(watched[t.id].watchedAt).toLocaleDateString(
                    "it-IT",
                  )}
                </small>
              </div>
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
      ) : (
        <p className="muted">
          Il tuo primo capitolo ti aspetta. Segna un titolo come visto
          nell’archivio.
        </p>
      )}
    </section>
  );
}
