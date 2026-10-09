import { useState, useEffect, useRef, type CSSProperties } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Radar,
  ArrowDown,
  ArrowUpRight,
  Globe2,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { earths, earthById, type Earth, type Sector } from "../lib/multiverse";
import { stats, labels } from "../lib/catalog";
import { ProgressBar } from "./StatsPanel";
import { MovieCard } from "./MovieCard";
import type { Title, Watched, Format } from "../types";

const sectors: { id: Sector; label: string }[] = [
  { id: "cinema", label: "Cinema & MCU" },
  { id: "animation", label: "Universi animati" },
  { id: "extra", label: "Serie & Legacy" },
];
const kindLabels = {
  screen: "Identificata sullo schermo",
  reference: "Designazione di repertorio",
  multiple: "Dossier di più realtà",
  unknown: "Numero non confermato",
  outside: "Al di fuori delle Terre",
};
const ROOT = "M -40 310 C 180 268 265 362 465 318 S 840 295 1240 310";
function branchPath(x: number, y: number, offset = 0) {
  const start = 35 + x * 0.38;
  return `M ${start} ${310 + offset} C ${start + 120} ${310 + offset}, ${x - 145} ${y + (y < 310 ? 65 : -65)}, ${x} ${y} S ${x + 120} ${y - offset}, 1270 ${y - offset * 2}`;
}
export function SacredTimeline({
  watched,
  open,
  toggle,
  explore,
}: {
  watched: Watched;
  open: (t: Title) => void;
  toggle: (id: string) => void;
  explore: (earth: Earth) => void;
}) {
  const [sector, setSector] = useState<Sector>("cinema");
  const [batch, setBatch] = useState(0);
  const [selectedId, setSelectedId] = useState("616");
  const [paused, setPaused] = useState(false);
  const [format, setFormat] = useState<Format | "all">("movie");
  const [limit, setLimit] = useState(12);
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = viewport.current;
    const center = () => {
      const current = frame?.querySelector<HTMLButtonElement>(
        '.earth-node[aria-pressed="true"]',
      );
      if (frame && current)
        frame.scrollTo({
          left: current.offsetLeft - frame.clientWidth / 2,
          behavior: "instant",
        });
    };
    center();
    const observer = new ResizeObserver(center);
    if (frame) observer.observe(frame);
    return () => observer.disconnect();
  }, [selectedId, sector, batch]);
  const selected = earthById(selectedId);
  const branches = earths.filter((e) => e.sector === sector && e.id !== "616");
  const pages = Math.ceil(branches.length / 10);
  const visible = branches.slice(batch * 10, batch * 10 + 10);
  const points = visible.map((earth, i) => ({
    earth,
    x: 125 + (i % 5) * 237.5,
    y: i < 5 ? 115 : 505,
  }));
  const metrics = stats(selected.titles, watched);
  const filtered = selected.titles.filter(
    (t) => format === "all" || t.type === format,
  );
  const select = (earth: Earth) => {
    setSelectedId(earth.id);
    setFormat(earth.titles.some((t) => t.type === "movie") ? "movie" : "all");
    setLimit(12);
  };
  const locate = (earth: Earth) => {
    setSector(earth.sector);
    const index = earths
      .filter((e) => e.sector === earth.sector && e.id !== "616")
      .findIndex((e) => e.id === earth.id);
    setBatch(Math.max(0, Math.floor(index / 10)));
    select(earth);
  };
  const node = (earth: Earth, x: number, y: number) => (
    <button
      key={earth.id}
      className={`earth-node ${selectedId === earth.id ? "selected" : ""} ${earth.id === "616" ? "prime" : ""}`}
      style={
        {
          left: `${x / 12}%`,
          top: `${y / 6.2}%`,
          "--earth-color": earth.color,
        } as CSSProperties
      }
      aria-label={`Esplora ${earth.designation}: ${earth.name}`}
      aria-pressed={selectedId === earth.id}
      aria-controls="earth-dossier"
      data-earth-id={earth.id}
      onClick={() => select(earth)}
      onKeyDown={(event) => {
        if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        const buttons = Array.from(
          event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>(
            ".earth-node",
          ),
        );
        const index = buttons.indexOf(event.currentTarget);
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? buttons.length - 1
              : (index +
                  (event.key === "ArrowRight" ? 1 : -1) +
                  buttons.length) %
                buttons.length;
        buttons[next].focus({ preventScroll: true });
        buttons[next].scrollIntoView({
          block: "nearest",
          inline: "center",
          behavior: "instant",
        });
      }}
    >
      <span className="earth-orbit" aria-hidden="true">
        <span />
      </span>
      <span className="earth-node-code">{earth.designation}</span>
      <span className="earth-node-name">{earth.name}</span>
      <span className="earth-node-count">
        {earth.titles.length} storie <ArrowUpRight size={10} />
      </span>
    </button>
  );
  return (
    <div className="multiverse-experience">
      <section
        className="tva-observatory"
        aria-label="Mappa interattiva del multiverso"
        data-paused={paused}
      >
        <div className="tva-toolbar">
          <div className="tva-signal">
            <Radar size={19} />
            <span>
              OSSERVATORIO TVA<small>MONITORAGGIO DELLE REALTÀ</small>
            </span>
          </div>
          <button
            className="tva-motion"
            onClick={() => setPaused(!paused)}
            aria-label={paused ? "Riprendi animazioni" : "Pausa animazioni"}
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
            <span>{paused ? "Riprendi" : "Pausa"}</span>
          </button>
        </div>
        <div className="tva-sector-tabs" aria-label="Settori del multiverso">
          {sectors.map((s) => (
            <button
              key={s.id}
              aria-pressed={s.id === sector}
              onClick={() => {
                setSector(s.id);
                setBatch(0);
                select(earths.find((e) => e.sector === s.id)!);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div
          className="timeline-viewport"
          ref={viewport}
          tabIndex={0}
          aria-label="Mappa delle Terre: scorri per esplorare, usa Tab o le frecce tra le Terre"
        >
          <div className="timeline-scene">
            <div className="timeline-nebula" aria-hidden="true" />
            <div className="timeline-coordinate top" aria-hidden="true">
              TEMPO ∞<span>RAMIFICAZIONI ATTIVE</span>
            </div>
            <svg
              className="timeline-art"
              viewBox="0 0 1200 620"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="sacred-color">
                  <stop stopColor="#936439" />
                  <stop offset=".4" stopColor="#ffe9bc" />
                  <stop offset=".75" stopColor="#efc283" />
                  <stop offset="1" stopColor="#72d2a2" />
                </linearGradient>
                <filter
                  id="timeline-glow"
                  x="-30%"
                  y="-100%"
                  width="160%"
                  height="300%"
                >
                  <feGaussianBlur stdDeviation="5" />
                </filter>
              </defs>
              {Array.from({ length: 85 }, (_, i) => (
                <circle
                  key={i}
                  cx={(i * 173 + 53) % 1200}
                  cy={(i * 97 + 21) % 620}
                  r={i % 8 === 0 ? 1.5 : 0.7}
                  fill="#d5bda0"
                  opacity={0.1 + (i % 5) * 0.08}
                />
              ))}
              {Array.from({ length: 17 }, (_, i) => (
                <path
                  key={`filament-${i}`}
                  className="timeline-filament"
                  d={`M -40 ${310 + i * 0.8} C 200 ${250 + i * 6}, 340 ${365 - i * 2}, 620 ${306 + i} S 980 ${280 + i * 3}, 1240 ${310 - i * 0.5}`}
                  stroke="url(#sacred-color)"
                  opacity={0.12 + (i % 3) * 0.08}
                />
              ))}
              <path
                d={ROOT}
                className="sacred-aura"
                stroke="url(#sacred-color)"
                filter="url(#timeline-glow)"
              />
              <path
                d={ROOT}
                className="sacred-thread"
                stroke="url(#sacred-color)"
              />
              <path
                d={ROOT}
                className="timeline-energy sacred-energy"
                stroke="#fff4d9"
              />
              {points.map(({ earth, x, y }, i) => (
                <g
                  key={earth.id}
                  className={`timeline-branch ${selectedId === earth.id ? "active" : ""}`}
                  style={{ "--branch-delay": `${-i * 1.7}s` } as CSSProperties}
                >
                  <path
                    d={branchPath(x, y)}
                    className="branch-aura"
                    stroke={earth.color}
                    filter="url(#timeline-glow)"
                  />
                  {[-5, 0, 5].map((offset) => (
                    <path
                      key={offset}
                      d={branchPath(x, y, offset)}
                      className="branch-strand"
                      stroke={earth.color}
                    />
                  ))}
                  <path
                    d={branchPath(x, y)}
                    className="timeline-energy"
                    stroke={earth.color}
                  />
                  <circle
                    cx={35 + x * 0.38}
                    cy={310}
                    r="3"
                    fill={earth.color}
                  />
                </g>
              ))}
            </svg>
            <span className="sacred-caption" aria-hidden="true">
              LA SACRA LINEA TEMPORALE
            </span>
            {node(earthById("616"), 600, 310)}
            {points.map(({ earth, x, y }) => node(earth, x, y))}
            <div className="timeline-coordinate bottom" aria-hidden="true">
              TVA / WV—01<span>PER OGNI TEMPO. SEMPRE.</span>
            </div>
          </div>
        </div>
        <div className="tva-map-footer">
          <span>
            <Sparkles size={13} /> Seleziona una Terra per aprire il dossier
            <span className="swipe-hint"> · Scorri la mappa ↔</span>
          </span>
          {pages > 1 && (
            <div className="tva-pagination">
              <button
                aria-label="Rami precedenti"
                disabled={!batch}
                onClick={() => setBatch(batch - 1)}
              >
                <ChevronLeft size={17} />
              </button>
              <span>
                {batch + 1} / {pages}
              </span>
              <button
                aria-label="Altri rami"
                disabled={batch === pages - 1}
                onClick={() => setBatch(batch + 1)}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          )}
        </div>
      </section>
      <div className="earth-navigation">
        <label>
          <Globe2 size={17} />
          <span>Raggiungi una realtà</span>
          <select
            aria-label="Seleziona una Terra"
            value={selectedId}
            onChange={(e) => locate(earthById(e.target.value))}
          >
            {sectors.map((s) => (
              <optgroup key={s.id} label={s.label}>
                {earths
                  .filter((e) => e.sector === s.id)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.designation} · {e.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
        <a
          href="#earth-dossier"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("earth-dossier")?.scrollIntoView({
              behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "instant"
                : "smooth",
              block: "start",
            });
          }}
          className="text-link"
        >
          Apri il dossier <ArrowDown size={15} />
        </a>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={selectedId}
          id="earth-dossier"
          className="earth-dossier"
          aria-label={`Dossier ${selected.designation}: ${selected.name}`}
          style={{ "--earth-color": selected.color } as CSSProperties}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="earth-dossier-header">
            <div className="earth-identity">
              <span className="earth-classification">
                {kindLabels[selected.kind]}
              </span>
              <h2>{selected.designation}</h2>
              <h3>{selected.name}</h3>
              <p>{selected.description}</p>
            </div>
            <div className="earth-progress">
              <span className="eyebrow">IL TUO DOSSIER</span>
              <strong>
                {metrics.percent}
                <small>%</small>
              </strong>
              <ProgressBar percent={metrics.percent} />
              <span>
                {metrics.seen} di {metrics.total} storie pubblicate viste
              </span>
            </div>
          </div>
          <div className="earth-canon-note">
            <p>{selected.note}</p>
            {selected.source && (
              <a href={selected.source.url} target="_blank" rel="noreferrer">
                {selected.source.label} <ArrowUpRight size={13} />
              </a>
            )}
          </div>
          <div className="earth-list-toolbar">
            <div className="earth-format-tabs" aria-label="Formati del dossier">
              {(["movie", "series", "short", "special", "all"] as const).map(
                (f) => (
                  <button
                    key={f}
                    disabled={
                      f !== "all" && !selected.titles.some((t) => t.type === f)
                    }
                    aria-pressed={format === f}
                    onClick={() => {
                      setFormat(f);
                      setLimit(12);
                    }}
                  >
                    {f === "all" ? "Tutte le storie" : labels[f]}
                  </button>
                ),
              )}
            </div>
            <button className="text-link" onClick={() => explore(selected)}>
              Ordina nell’archivio <ArrowUpRight size={15} />
            </button>
          </div>
          <p className="earth-result-count" role="status">
            {filtered.length} {format === "movie" ? "film" : "storie"} collegati
            · L’atlante include anche i percorsi Nerd, indipendentemente dai
            filtri dell’archivio.
          </p>
          <div className="movie-grid">
            {filtered.slice(0, limit).map((t, i) => (
              <MovieCard
                key={t.id}
                title={t}
                index={i + 1}
                seen={!!watched[t.id]}
                onOpen={() => open(t)}
                onToggle={() => toggle(t.id)}
              />
            ))}
          </div>
          {filtered.length > limit && (
            <div className="load-more">
              <button
                className="button secondary"
                onClick={() => setLimit(limit + 18)}
              >
                Mostra altre storie{" "}
                <span>{filtered.length - limit} rimanenti</span>
              </button>
            </div>
          )}
          {selected.crossovers.length > 0 && (
            <div className="earth-crossovers">
              <span className="eyebrow">PORTALI VERSO ALTRE REALTÀ</span>
              <h3>I crossover</h3>
              <p>
                Connessioni a questa Terra, ambientate anche in altre realtà.
              </p>
              <div>
                {selected.crossovers.map((t) => (
                  <button key={t.id} onClick={() => open(t)}>
                    {t.title}
                    <ArrowUpRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
