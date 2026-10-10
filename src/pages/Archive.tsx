import { useEffect, useState } from "react";
import { ArrowUpRight, Film } from "lucide-react";
import {
  titles,
  sortTitles,
  filterTitles,
  orderLabels,
  pathTitles,
  defaults,
} from "../lib/catalog";
import { OrderSelector } from "../components/OrderSelector";
import { FilterBar } from "../components/FilterBar";
import { MovieCard } from "../components/MovieCard";
import type { Preferences, Watched, Title } from "../types";
import { earths } from "../lib/multiverse";
import { Gem, useInfinity } from "../components/InfinityQuest";
export function Archive({
  p,
  change,
  watched,
  toggle,
  open,
  compact = false,
}: {
  p: Preferences;
  change: (p: Preferences) => void;
  watched: Watched;
  toggle: (id: string) => void;
  open: (t: Title) => void;
  compact?: boolean;
}) {
  const infinity = useInfinity();
  const [limit, setLimit] = useState(compact ? 12 : 30);
  useEffect(() => setLimit(compact ? 12 : 30), [p, compact]);
  const earth = earths.find((e) => e.id === p.earthId);
  const sorted = sortTitles(pathTitles(earth?.titles ?? titles, p), p.order);
  const filtered = filterTitles(sorted, p, watched);
  const positions = new Map(sorted.map((t, i) => [t.id, i + 1]));
  const remaining = filtered.filter(
    (t) => infinity.phase !== "snapped" || !infinity.targets.has(t.id),
  );
  const show = filtered
    .slice(0, limit)
    .filter((t) => infinity.phase !== "snapped" || !infinity.targets.has(t.id));
  const groups =
    p.order === "chronology"
      ? [...new Set(show.map((t) => t.timelineGroup))].map((name) => ({
          name,
          list: show.filter((t) => t.timelineGroup === name),
        }))
      : [{ name: "", list: show }];
  return (
    <section className="archive-section">
      <div className="section-heading">
        <Gem id="reality" className="gem-archive" />
        <div>
          <div className="eyebrow">
            {compact ? "IL PROSSIMO CAPITOLO" : "L’ARCHIVIO COMPLETO"}
          </div>
          <h2>
            {compact
              ? "Il tuo viaggio comincia qui."
              : "Tutte le storie. A modo tuo."}
          </h2>
        </div>
        {compact && (
          <a href="#archive" className="text-link">
            Tutto il catalogo <ArrowUpRight size={17} />
          </a>
        )}
      </div>
      <OrderSelector
        value={p.order}
        onChange={(order) => change({ ...p, order })}
      />
      <p className="order-note">
        {p.order === "chronology"
          ? "Timeline separate per universo. Le posizioni approssimative e le ramificazioni sono spiegate nei dettagli."
          : p.order === "recommended"
            ? "Un percorso editoriale fan-made: connessioni e crossover, senza una falsa cronologia globale."
            : "Prima pubblicazione internazionale, in ordine globale tra tutti i franchise."}
      </p>
      <FilterBar p={p} change={change} />
      {earth && (
        <div className="archive-earth-context">
          <span>
            Dossier{" "}
            <b>
              {earth.designation} · {earth.name}
            </b>
          </span>
          <button
            className="text-link"
            onClick={() =>
              change({
                ...defaults,
                order: p.order,
                nerdMode: p.nerdMode,
                advancedNerdMode: p.advancedNerdMode,
              })
            }
          >
            Torna a tutto l’archivio
          </button>
        </div>
      )}
      <div className="results-info">
        <span>
          <b>{remaining.length}</b> storie nel tuo percorso
        </span>
        <span>{orderLabels[p.order]}</span>
      </div>
      {show.length ? (
        <div className="archive-groups">
          {groups.map(({ name, list }, groupIndex) => (
            <section
              className="chronology-group"
              key={name || "catalog"}
              aria-label={name || "Catalogo"}
            >
              {name && (
                <header className="chronology-heading">
                  <span className="chronology-index">
                    {String(groupIndex + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <span className="eyebrow">LINEA TEMPORALE</span>
                    <h3>{name}</h3>
                  </div>
                  <span className="chronology-count">
                    {remaining.filter((t) => t.timelineGroup === name).length}{" "}
                    storie
                  </span>
                </header>
              )}
              <div className="movie-grid">
                {list.map((t) => (
                  <MovieCard
                    key={t.id}
                    title={t}
                    index={positions.get(t.id)!}
                    seen={!!watched[t.id]}
                    onOpen={() => open(t)}
                    onToggle={() => toggle(t.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Film />
          <h3>Nessuna storia trovata</h3>
          <p>Prova un altro titolo o azzera i filtri.</p>
        </div>
      )}
      {filtered.length > limit && (
        <div className="load-more">
          <button
            className="button secondary"
            onClick={() => setLimit((n) => n + 30)}
          >
            Carica altre storie <span>{filtered.length - limit} rimanenti</span>
          </button>
        </div>
      )}
    </section>
  );
}
