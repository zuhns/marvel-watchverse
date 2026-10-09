import { useEffect, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { ArrowUpRight, ShieldCheck, Compass } from "lucide-react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { StatsPanel } from "./components/StatsPanel";
import { MovieModal } from "./components/MovieModal";
import { Archive } from "./pages/Archive";
import { Universes } from "./pages/Universes";
import { Progress } from "./pages/Progress";
import { ProfilePanel } from "./components/ProfilePanel";
import { titles, stats, nextTitle, defaults, modeTitles } from "./lib/catalog";
import { download, exportExcel, importExcel } from "./lib/export";
import { makeBackup, parseBackup, mergeWatched } from "./lib/storage";
import { useTracker } from "./hooks/useTracker";
import type { Title } from "./types";
const pageFromHash = () =>
  ["home", "archive", "orders", "universes", "progress"].includes(
    location.hash.slice(1),
  )
    ? location.hash.slice(1)
    : "home";
export default function App() {
  const [page, setPage] = useState(pageFromHash);
  const [selected, setSelected] = useState<Title | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const tracker = useTracker();
  const { watched, preferences: p, setPreferences: change, toggle } = tracker;
  const activeTitles = modeTitles(titles, p.nerdMode);
  const s = stats(activeTitles, watched);
  useEffect(() => {
    const handle = () => {
      setPage(pageFromHash());
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", handle);
    const search = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      ) {
        e.preventDefault();
        location.hash = "archive";
        setTimeout(
          () =>
            document
              .querySelector<HTMLInputElement>(
                'input[aria-label="Cerca titoli"]',
              )
              ?.focus(),
          50,
        );
      }
    };
    window.addEventListener("keydown", search);
    return () => {
      window.removeEventListener("hashchange", handle);
      window.removeEventListener("keydown", search);
    };
  }, []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 7000);
    return () => clearTimeout(timer);
  }, [message]);
  const json = () =>
    download(
      new Blob([JSON.stringify(makeBackup(watched, p), null, 2)], {
        type: "application/json",
      }),
      "marvel-watchverse-backup.json",
    );
  const excel = async () => {
    setBusy(true);
    try {
      await exportExcel(titles, watched);
      setMessage("Excel esportato: tre fogli con tutti gli ordini.");
    } catch {
      setMessage("Esportazione non riuscita. Riprova.");
    } finally {
      setBusy(false);
    }
  };
  const restore = async (file: File) => {
    try {
      if (file.size > 8_000_000)
        throw Error("Il file supera il limite di 8 MB.");
      if (file.name.toLowerCase().endsWith(".xlsx")) {
        const w = await importExcel(
          await file.arrayBuffer(),
          new Set(titles.map((t) => t.id)),
        );
        tracker.setWatched((current) => mergeWatched(current, w));
        setMessage("Progressi Excel importati e uniti ai dati esistenti.");
      } else {
        const b = parseBackup(JSON.parse(await file.text()));
        tracker.restore(b);
        setMessage("Backup importato. I progressi esistenti sono conservati.");
      }
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "File non valido: i tuoi dati sono conservati.",
      );
    }
  };
  const props = { p, change, watched, toggle, open: setSelected };
  return (
    <MotionConfig reducedMotion="user">
      <Header page={page} percent={s.percent} onExport={json} />
      <main id="main-content" tabIndex={-1}>
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {page === "home" ? (
            <>
              <Hero
                next={nextTitle(activeTitles, p.order, watched)}
                onOpen={setSelected}
              />
              <div className="home-content">
                <StatsPanel titles={activeTitles} watched={watched} />
                <div className="editorial-strip">
                  <span>
                    <ShieldCheck size={17} />
                    Il tuo archivio, senza login.
                  </span>
                  <span>
                    <Compass size={17} />
                    Tre modi di vivere la saga.
                  </span>
                  <span className="cutoff">CATALOGO · 08 OTTOBRE 2026</span>
                </div>
                <Archive {...props} compact />
                <div className="discover-banner">
                  <div>
                    <div className="eyebrow">
                      NON ESISTE UNA SOLA LINEA TEMPORALE
                    </div>
                    <h2>Esci dai confini del tuo universo.</h2>
                  </div>
                  <a className="button secondary" href="#universes">
                    Esplora il multiverso
                    <ArrowUpRight size={17} />
                  </a>
                </div>
              </div>
            </>
          ) : page === "archive" ? (
            <div className="page-section">
              <Archive {...props} />
            </div>
          ) : page === "orders" ? (
            <div className="page-section">
              <div className="eyebrow">SCEGLI LA TUA ROTTA</div>
              <h1 className="page-title">
                LA SAGA.
                <br />
                <span>IL TUO ORDINE.</span>
              </h1>
              <p className="page-intro">
                Uscita globale, cronologie separate o percorso consigliato: i
                titoli visti restano al loro posto nel tuo viaggio.
              </p>
              <Archive {...props} />
            </div>
          ) : page === "universes" ? (
            <Universes
              watched={watched}
              nerdMode={p.nerdMode}
              exploreCategory={(category) => {
                change({
                  ...defaults,
                  order: p.order,
                  categories: [category],
                  nerdMode: p.nerdMode,
                });
                location.hash = "archive";
              }}
              explore={(universe) => {
                change({
                  ...defaults,
                  order: p.order,
                  universes: [universe],
                  nerdMode: p.nerdMode,
                });
                location.hash = "archive";
              }}
            />
          ) : (
            <>
              <div className="profile-container">
                <ProfilePanel
                  username={tracker.username}
                  status={tracker.syncStatus}
                  pending={tracker.pendingCount}
                  error={tracker.syncError}
                  onSave={tracker.saveUsername}
                  onRetry={() => void tracker.sync()}
                />
              </div>
              <Progress
                watched={watched}
                order={p.order}
                nerdMode={p.nerdMode}
                open={setSelected}
                exportJSON={json}
                exportXLSX={excel}
                importFile={restore}
                busy={busy}
              />
            </>
          )}
        </motion.div>
      </main>
      <footer>
        <a className="brand" href="#home">
          <span>MARVEL</span>
          <b>WATCHVERSE</b>
        </a>
        <p>
          Progetto fan-made indipendente. Non affiliato a Marvel, Disney, Sony o
          TMDB.
          <br />
          Locandine e personaggi appartengono ai rispettivi titolari. Metadati e
          immagini:{" "}
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">
            TMDB
          </a>
          . This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
        <div className="footer-links">
          <a href="https://github.com/zuhns/marvel-watchverse">
            GitHub
            <ArrowUpRight size={13} />
          </a>
          <a href="#progress">
            I tuoi progressi
            <ArrowUpRight size={13} />
          </a>
        </div>
      </footer>
      {(message || tracker.storageError) && (
        <div className="toast" role="status">
          {message || tracker.storageError}
          <button aria-label="Chiudi notifica" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
      {selected && (
        <MovieModal
          title={selected}
          seen={!!watched[selected.id]}
          toggle={() => toggle(selected.id)}
          close={() => setSelected(null)}
          open={setSelected}
        />
      )}
    </MotionConfig>
  );
}
