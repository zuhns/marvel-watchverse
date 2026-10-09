import { useState } from "react";
import {
  Pause,
  Play,
  ArrowDown,
  ArrowUpRight,
  Globe2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTemporalMotion } from "../hooks/useTemporalMotion";
import {
  confirmedEarths,
  earthById,
  type Earth,
  type Sector,
} from "../lib/multiverse";
import { stats, labels } from "../lib/catalog";
import { useTvaAmbience } from "../hooks/useTvaAmbience";
import { TemporalScreen } from "./TemporalScreen";
import { TvaMascot } from "./TvaMascot";
import { ProgressBar } from "./StatsPanel";
import { MovieCard } from "./MovieCard";
import type { Title, Watched, Format } from "../types";
import type { CSSProperties } from "react";
const sectors: { id: Sector; label: string }[] = [
  { id: "cinema", label: "Cinema & MCU" },
  { id: "animation", label: "Universi animati" },
  { id: "extra", label: "Serie & Legacy" },
];
const kindLabels = {
  screen: "Identificata sullo schermo",
  reference: "Designazione di repertorio",
  multiple: "",
  unknown: "",
  outside: "",
};
export function SacredTimeline({
  watched,
  open,
  toggle,
  explore,
}: {
  watched: Watched;
  open: (t: Title) => void;
  toggle: (id: string) => void;
  explore: (e: Earth) => void;
}) {
  const [sector, setSector] = useState<Sector>("cinema");
  const [batch, setBatch] = useState(0);
  const [selectedId, setSelectedId] = useState("616");
  const [paused, setPaused] = useState(false);
  const [format, setFormat] = useState<Format | "all">("movie");
  const [mapFormat, setMapFormat] = useState<Format | "all">("all");
  const [limit, setLimit] = useState(12);
  const [menuHover, setMenuHover] = useState<number | null>(null);
  const reduced = useTemporalMotion();
  const sound = useTvaAmbience(paused);
  const selected = earthById(selectedId);
  const available = confirmedEarths.filter(
    (e) => mapFormat === "all" || e.titles.some((t) => t.type === mapFormat),
  );
  const branches = available.filter(
    (e) => e.sector === sector && e.id !== "616",
  );
  const pages = Math.max(1, Math.ceil(branches.length / 10));
  const visible = branches.slice(batch * 10, batch * 10 + 10);
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
    const index = available
      .filter((e) => e.sector === earth.sector && e.id !== "616")
      .findIndex((e) => e.id === earth.id);
    setBatch(Math.max(0, Math.floor(index / 10)));
    select(earth);
  };
  const menuPosition = menuHover ?? sectors.findIndex((s) => s.id === sector);
  return (
    <div className="multiverse-experience">
      <section
        className="tva-observatory"
        aria-label="Mappa interattiva del multiverso"
        data-paused={paused}
      >
        <div
          className="tva-route-navigation"
          onMouseLeave={() => setMenuHover(null)}
        >
          <motion.div
            className="tva-menu-mascot"
            initial={false}
            animate={{ left: ((menuPosition + 0.5) / 3) * 100 + "%" }}
            transition={{
              duration: reduced ? 0 : 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <TvaMascot />
          </motion.div>
          <p
            className="minutes-message"
            style={
              menuPosition === 2
                ? { left: 14, right: "auto", textAlign: "left" }
                : undefined
            }
          >
            Scegli una realtà, variante.
          </p>
          <div className="tva-sector-tabs" aria-label="Settori del multiverso">
            {sectors.map((s, i) => (
              <button
                key={s.id}
                aria-label={s.label}
                aria-pressed={s.id === sector}
                disabled={!available.some((e) => e.sector === s.id)}
                onMouseEnter={() => setMenuHover(i)}
                onFocus={() => setMenuHover(i)}
                onBlur={() => setMenuHover(null)}
                onClick={() => {
                  setSector(s.id);
                  setBatch(0);
                  select(available.find((e) => e.sector === s.id)!);
                }}
              >
                <span>0{i + 1}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="tva-instrument-bar">
          <label>
            TRACCE
            <select
              aria-label="Produzioni nella mappa"
              value={mapFormat}
              onChange={(e) => {
                const f = e.target.value as Format | "all";
                setMapFormat(f);
                setBatch(0);
                const next = confirmedEarths.filter(
                  (e) => f === "all" || e.titles.some((t) => t.type === f),
                );
                const first = next.find((e) => e.sector === sector) ?? next[0];
                if (first) {
                  setSector(first.sector);
                  select(first);
                }
              }}
            >
              {(["all", "movie", "series", "short", "special"] as const).map(
                (f) => (
                  <option key={f} value={f}>
                    {f === "all" ? "Tutte le produzioni" : labels[f]}
                  </option>
                ),
              )}
            </select>
          </label>
          <div className="tva-instrument-buttons">
            <button
              className="tva-motion"
              onClick={() => setPaused(!paused)}
              aria-label={paused ? "Riprendi animazioni" : "Pausa animazioni"}
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
              <span>{paused ? "Riprendi il tempo" : "Ferma il tempo"}</span>
            </button>
            <button
              className="tva-sound"
              aria-label={
                sound.enabled
                  ? "Disattiva atmosfera sonora"
                  : "Attiva atmosfera sonora"
              }
              aria-pressed={sound.enabled}
              onClick={() => void sound.toggle()}
            >
              {sound.enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span>{sound.enabled ? "Audio attivo" : "Attiva atmosfera"}</span>
            </button>
            {sound.enabled && (
              <input
                className="tva-volume"
                type="range"
                min="0"
                max="100"
                value={sound.volume}
                aria-label="Volume atmosfera"
                onChange={(e) => sound.setVolume(Number(e.target.value))}
              />
            )}
          </div>
        </div>
        {sound.error && (
          <p className="tva-audio-error" role="status">
            {sound.error}
          </p>
        )}
        <TemporalScreen
          earths={visible}
          root={earthById("616")}
          selected={selectedId}
          paused={paused}
          onSelect={select}
        />
        <div className="tva-map-footer">
          <span className="tva-selected-signal">
            <i /> SEGNALE SELEZIONATO <b>{selected.designation}</b>
            <small>{selected.name}</small>
          </span>
          <div className="tva-pagination">
            <button
              aria-label="Rami precedenti"
              disabled={!batch}
              onClick={() => setBatch(batch - 1)}
            >
              ←
            </button>
            <span>
              SETTORE {batch + 1} / {pages}
            </span>
            <button
              aria-label="Altri rami"
              disabled={batch === pages - 1}
              onClick={() => setBatch(batch + 1)}
            >
              →
            </button>
          </div>
        </div>
      </section>
      <div className="earth-navigation">
        <label>
          <Globe2 size={17} />
          <span>COORDINATE</span>
          <select
            aria-label="Seleziona una Terra"
            value={selectedId}
            onChange={(e) => locate(earthById(e.target.value))}
          >
            {sectors.map((s) => (
              <optgroup key={s.id} label={s.label}>
                {available
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
              behavior: reduced ? "instant" : "smooth",
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
