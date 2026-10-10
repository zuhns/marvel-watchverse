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
import { LoginDialog } from "./components/LoginDialog";
import { Social } from "./pages/Social";
import type { Marathon } from "./lib/social";
import { readProfile } from "./lib/profile";
import { titles, stats, nextTitle, defaults, pathTitles } from "./lib/catalog";
import { download, exportExcel, importExcel } from "./lib/export";
import { makeBackup, parseBackup, mergeWatched } from "./lib/storage";
import { useTracker } from "./hooks/useTracker";
import type { Title } from "./types";
import { earthMode } from "./lib/multiverse";
import { usePremiumMotion } from "./hooks/usePremiumMotion";
import {
  InfinityProvider,
  Gem,
  GauntletDiscovery,
} from "./components/InfinityQuest";
import { MarvelOpening } from "./components/MarvelOpening";
const pageFromHash = () =>
  location.hash === "#orders"
    ? "archive"
    : ["home", "archive", "universes", "progress", "friends"].includes(
          location.hash.slice(1),
        )
      ? location.hash.slice(1)
      : "home";
type Tracker = ReturnType<typeof useTracker>;
function readMarathon(): Marathon | null {
  try {
    const username = readProfile(localStorage);
    const raw = username
      ? localStorage.getItem(`marvel-watchverse.active.${username}`)
      : null;
    const value = raw ? JSON.parse(raw) : null;
    return value &&
      typeof value.id === "string" &&
      typeof value.name === "string" &&
      value.status === "accepted"
      ? value
      : null;
  } catch {
    return null;
  }
}
export default function App() {
  const personal = useTracker();
  const [marathon, setMarathon] = useState<Marathon | null>(readMarathon);
  const select = (m: Marathon | null) => {
    setMarathon(m);
    if (personal.username) {
      try {
        localStorage.setItem(
          `marvel-watchverse.active.${personal.username}`,
          JSON.stringify(m),
        );
      } catch {
        /* Progressi e backup restano disponibili. */
      }
    }
  };
  return (
    <InfinityProvider>
      <MarvelOpening />
      {marathon && personal.username ? (
        <MarathonFrame
          key={marathon.id}
          personal={personal}
          marathon={marathon}
          selectMarathon={select}
        />
      ) : (
        <Watchverse
          tracker={personal}
          personal={personal}
          marathon={null}
          selectMarathon={select}
        />
      )}
    </InfinityProvider>
  );
}
function MarathonFrame({
  personal,
  marathon,
  selectMarathon,
}: {
  personal: Tracker;
  marathon: Marathon;
  selectMarathon: (m: Marathon | null) => void;
}) {
  const shared = useTracker({
    marathonId: marathon.id,
    username: personal.username,
  });
  const tracker: Tracker = {
    ...shared,
    preferences: personal.preferences,
    setPreferences: personal.setPreferences,
    restore: (b) => {
      shared.setWatched((w) => mergeWatched(w, b.watched));
      personal.setPreferences(b.preferences);
    },
  };
  return (
    <Watchverse
      tracker={tracker}
      personal={personal}
      marathon={marathon}
      selectMarathon={selectMarathon}
    />
  );
}
function Watchverse({
  tracker,
  personal,
  marathon,
  selectMarathon,
}: {
  tracker: Tracker;
  personal: Tracker;
  marathon: Marathon | null;
  selectMarathon: (m: Marathon | null) => void;
}) {
  const [page, setPage] = useState(pageFromHash);
  usePremiumMotion(page);
  const [selected, setSelected] = useState<Title | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [login, setLogin] = useState(false);
  const { watched, preferences: p, setPreferences: change, toggle } = tracker;
  const activeTitles = pathTitles(titles, p);
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
      marathon
        ? `marvel-watchverse-marathon-${marathon.id}-backup.json`
        : "marvel-watchverse-backup.json",
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
      <Header
        page={page}
        percent={s.percent}
        onExport={json}
        username={personal.username}
        onLogin={() => setLogin(true)}
      />
      {marathon && (
        <div
          className="marathon-banner"
          role="region"
          aria-label="Maratona attiva"
        >
          <div>
            <span className="eyebrow">MARATONA CONDIVISA</span>
            <strong>{marathon.name}</strong>
            <span>
              {tracker.syncStatus === "synced"
                ? "Progressi sincronizzati"
                : tracker.syncStatus === "syncing"
                  ? "Sincronizzazione…"
                  : "Progressi conservati sul dispositivo"}
              {tracker.pendingCount
                ? ` · ${tracker.pendingCount} modifiche in attesa`
                : ""}
            </span>
            {tracker.syncError && (
              <span className="profile-error">{tracker.syncError}</span>
            )}
          </div>
          <button
            className="button secondary"
            onClick={() => selectMarathon(null)}
          >
            Torna al mio profilo
          </button>
        </div>
      )}
      <main id="main-content" tabIndex={-1}>
        <motion.div
          key={page}
          className="page-transition"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
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
                    Il tuo profilo, su ogni dispositivo.
                  </span>
                  <span>
                    <Compass size={17} />
                    Tre modi di vivere la saga.
                  </span>
                  <span className="cutoff">CATALOGO · 08 OTTOBRE 2026</span>
                </div>
                <Archive {...props} compact />
                <div className="discover-banner">
                  <div className="discover-portal" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div>
                    <div className="eyebrow">TVA / ACCESSO MULTIVERSALE</div>
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
          ) : page === "universes" ? (
            <Universes
              watched={watched}
              open={setSelected}
              toggle={toggle}
              explore={(earth) => {
                change({
                  ...defaults,
                  order: p.order,
                  universes: [...new Set(earth.titles.map((t) => t.universe))],
                  ...earthMode(earth),
                  earthId: earth.id,
                  formats: [],
                });
                location.hash = "archive";
              }}
            />
          ) : page === "friends" ? (
            <Social
              username={personal.username}
              onLogin={() => setLogin(true)}
              openMarathon={(m) => {
                selectMarathon(m);
                location.hash = "archive";
              }}
            />
          ) : (
            <>
              <div className="profile-container">
                <ProfilePanel
                  username={personal.username}
                  status={personal.syncStatus}
                  pending={personal.pendingCount}
                  error={personal.syncError}
                  onSave={personal.saveUsername}
                  onRetry={() => void personal.sync()}
                />
              </div>
              <Progress
                watched={watched}
                order={p.order}
                nerdMode={p.nerdMode}
                advancedNerdMode={p.advancedNerdMode}
                formats={p.formats}
                marathonName={marathon?.name}
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
        <p className="veronica-dedication">
          <strong>Per Veronica, il mio universo preferito.</strong>
          <br />
          Questo sito è per noi, per tutte le storie da guardare insieme.
          <br />
          Ti amo tanto. In ogni universo, sceglierei sempre te.
          <Gem id="soul" className="gem-dedication" />
        </p>
        <div className="footer-links">
          <GauntletDiscovery />
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
      {login && (
        <LoginDialog
          close={() => setLogin(false)}
          onSave={personal.saveUsername}
        />
      )}
    </MotionConfig>
  );
}
