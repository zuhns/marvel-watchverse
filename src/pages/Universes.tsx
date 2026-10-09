import { ArrowUpRight, GitBranch } from "lucide-react";
import { titles as catalog, stats, modeTitles } from "../lib/catalog";
import { ProgressBar } from "../components/StatsPanel";
import type { Watched, Format } from "../types";
const descriptions: Record<string, string> = {
  MCU: "La grande saga condivisa: dagli Avengers alla Saga del Multiverso.",
  "X-Men":
    "Mutanti, futuri riscritti e timeline ramificate. L’universo Fox conserva le sue contraddizioni.",
  "Spider-Man Raimi":
    "Il Peter Parker di Tobey Maguire. Tre storie che portano fino al multiverso.",
  "Spider-Man Webb":
    "Il Peter Parker di Andrew Garfield e una nuova origine per l’Uomo Ragno.",
  "Sony / Venom": "Simbionti, antieroi e storie Sony in continuità distinte.",
  "Spider-Verse": "Miles Morales e una rete di universi animati.",
  Defenders:
    "Gli eroi delle strade di New York. Le stagioni precedono Born Again.",
  Legacy:
    "Le incarnazioni storiche degli eroi Marvel, ciascuna nella propria continuità.",
  "Fantastic Four":
    "La famiglia fantastica, attraverso adattamenti e universi diversi.",
};
export function Universes({
  watched,
  nerdMode,
  advancedNerdMode,
  formats,
  explore,
  exploreCategory,
}: {
  watched: Watched;
  nerdMode: boolean;
  advancedNerdMode: boolean;
  formats: Format[];
  explore: (u: string) => void;
  exploreCategory: (category: string) => void;
}) {
  const titles = modeTitles(catalog, nerdMode, advancedNerdMode).filter(
    (t) => !formats.length || formats.includes(t.type),
  );
  const priority = [
    "MCU",
    "X-Men / Fox",
    "Spider-Man Raimi",
    "Spider-Man Webb",
    "Sony Spider-Man Universe",
    "Spider-Verse",
    "Fantastic Four 2005",
    "Fantastic Four 2015",
    "Marvel Legacy",
  ];
  const universes = [...new Set(titles.map((t) => t.universe))].sort(
    (a, b) =>
      (priority.includes(a) ? priority.indexOf(a) : 100) -
        (priority.includes(b) ? priority.indexOf(b) : 100) ||
      a.localeCompare(b),
  );
  return (
    <section className="page-section">
      <div className="eyebrow">OLTRE LA SACRA LINEA TEMPORALE</div>
      <h1 className="page-title">
        UN MULTIVERSO.
        <br />
        <span>INFINITE STORIE.</span>
      </h1>
      <p className="page-intro">
        Universi distinti, personaggi che ritornano, connessioni da scoprire.
        Scegli dove iniziare.
      </p>
      <div className="universe-map">
        <GitBranch />
        <span>Raimi + Webb</span>
        <b>→ No Way Home → MCU</b>
        <span>Fox + Legacy</span>
        <b>→ Deadpool & Wolverine</b>
        <small>Collegamenti narrativi; non equivalenza tra canoni.</small>
      </div>
      <div className="universe-grid">
        <article className="universe-card accent-0">
          <div className="universe-watermark">DD</div>
          <span className="universe-index">PERCORSO NEL MCU</span>
          <h2>Defenders Saga</h2>
          <p>
            Gli eroi delle strade di New York. Una saga interna al MCU, con
            tutte le singole stagioni prima di Born Again.
          </p>
          <div className="universe-stats">
            <span>
              {titles.filter((t) => t.category === "Defenders").length}{" "}
              produzioni
            </span>
            <b>
              {
                stats(
                  titles.filter((t) => t.category === "Defenders"),
                  watched,
                ).percent
              }
              % completato
            </b>
          </div>
          <ProgressBar
            percent={
              stats(
                titles.filter((t) => t.category === "Defenders"),
                watched,
              ).percent
            }
          />
          <button
            className="text-link"
            onClick={() => exploreCategory("Defenders")}
          >
            Esplora la saga
            <ArrowUpRight size={17} />
          </button>
        </article>
        {universes.map((u, i) => {
          const list = titles.filter((t) => t.universe === u);
          const s = stats(list, watched);
          return (
            <article key={u} className={`universe-card accent-${i % 6}`}>
              <div className="universe-watermark">
                {u.replace(/[^A-Z]/g, "").slice(0, 3) || "MV"}
              </div>
              <span className="universe-index">
                UNIVERSO {String(i + 1).padStart(2, "0")}
              </span>
              <h2>{u}</h2>
              <p>
                {descriptions[u] ||
                  list[0].chronologyNotes ||
                  "Una continuità distinta da esplorare, attraverso le sue produzioni."}
              </p>
              <div className="universe-stats">
                <span>{list.length} produzioni</span>
                <b>{s.percent}% completato</b>
              </div>
              <ProgressBar percent={s.percent} />
              <button className="text-link" onClick={() => explore(u)}>
                Esplora l’universo
                <ArrowUpRight size={17} />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
