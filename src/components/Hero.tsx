import { ArrowRight, Play, ArrowDown } from "lucide-react";
import { PosterImage } from "./PosterImage";
import { titles } from "../lib/catalog";
import type { Title } from "../types";
import { Gem, useInfinity } from "./InfinityQuest";
export function Hero({
  next,
  onOpen,
}: {
  next?: Title;
  onOpen: (t: Title) => void;
}) {
  const infinity = useInfinity();
  const selections = [
    "Avengers: Endgame",
    "Spider-Man: No Way Home",
    "Deadpool & Wolverine",
    "Iron Man",
    "X-Men: Days of Future Past",
  ]
    .map((s) => titles.find((t) => t.originalTitle === s && t.type === "movie"))
    .filter(Boolean) as Title[];
  return (
    <section className="hero">
      <div className="hero-orbit" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="hero-grain" />
      <div className="hero-copy">
        <div className="eyebrow">
          <span />
          IL TUO PASSAPORTO PER IL MULTIVERSO
        </div>
        <h1>
          OGNI STORIA.
          <br />
          <span>OGNI UNIVERSO.</span>
        </h1>
        <p>
          Dagli Avengers agli X-Men, dagli Spider-Man al multiverso.
          <br className="desktop-break" /> Tutte le storie Marvel, nell’ordine
          che scegli tu.
        </p>
        <div className="hero-actions">
          <a href="#orders" className="button primary">
            <Play size={16} fill="currentColor" />
            Inizia la maratona
            <ArrowRight size={17} />
          </a>
          <a href="#archive" className="button secondary">
            Esplora il catalogo
          </a>
        </div>
        {next && (
          <button className="resume-link" onClick={() => onOpen(next)}>
            <span className="resume-circle">
              <Play size={10} fill="currentColor" />
            </span>
            Continua da dove eri rimasto <ArrowRight size={14} />
          </button>
        )}
        <Gem id="space" className="gem-home" />
        <div className="hero-footnote">
          <span>UN ARCHIVIO. INFINITE CONNESSIONI.</span>
          <a href="#archive" aria-label="Vai all’archivio">
            <ArrowDown size={17} />
          </a>
        </div>
      </div>
      <div className="hero-collage" aria-label="Le storie del multiverso">
        {selections.map((t, i) =>
          infinity.phase === "snapped" && infinity.targets.has(t.id) ? null : (
            <button
              key={t.id}
              data-infinity-title={t.id}
              className={`hero-poster hero-poster-${i} ${infinity.phase === "dusting" && infinity.targets.has(t.id) ? "infinity-dusting" : ""}`}
              onClick={() => onOpen(t)}
              aria-label={`Dettagli: ${t.title}`}
            >
              <PosterImage title={t} priority />
            </button>
          ),
        )}
        <div className="collage-caption">
          <span className="live-dot" /> IL MULTIVERSO TI ASPETTA
        </div>
      </div>
    </section>
  );
}
