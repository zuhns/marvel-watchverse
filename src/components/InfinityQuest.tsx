import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { X, RotateCcw, Volume2, VolumeX } from "lucide-react";
import {
  gems,
  infinityStorageKey,
  readInfinity,
  snapTargets,
  type GemId,
} from "../lib/infinity";
import { titles } from "../lib/catalog";
import { setCinematicAudio } from "../lib/cinematicAudio";
import { Stardust } from "./Stardust";
import { GemShape, GauntletArt } from "./InfinityArt";
type Phase = "idle" | "dusting" | "snapped";
type Quest = {
  collected: GemId[];
  inserted: GemId[];
  phase: Phase;
  targets: Set<string>;
  collect: (id: GemId) => void;
  open: () => void;
};
const fallback: Quest = {
  collected: [],
  inserted: [],
  phase: "idle",
  targets: new Set(),
  collect: () => {},
  open: () => {},
};
const Context = createContext<Quest>(fallback);
export const useInfinity = () => useContext(Context);
export function Gem({ id, className = "" }: { id: GemId; className?: string }) {
  const quest = useInfinity(),
    gem = gems.find((g) => g.id === id)!;
  if (quest.collected.includes(id)) return null;
  return (
    <button
      className={`hidden-gem ${className}`}
      style={{ "--gem": gem.color } as CSSProperties}
      onClick={() => quest.collect(id)}
      aria-label={`Raccogli la Gemma ${gem.name}`}
      title="Una luce insolita…"
    >
      <GemShape id={id} />
      <span className="gem-spark" />
    </button>
  );
}
export function InfinityProvider({ children }: { children: ReactNode }) {
  const [found, setFound] = useState(() => {
    try {
      return readInfinity(localStorage.getItem(infinityStorageKey));
    } catch {
      return readInfinity(null);
    }
  });
  const [phase, setPhase] = useState<Phase>("idle"),
    [targets, setTargets] = useState(new Set<string>()),
    [opened, setOpened] = useState(false),
    [notice, setNotice] = useState("");
  const [muted, setMuted] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    snapAudio = useRef<HTMLAudioElement | null>(null),
    finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ready = found.inserted.length === 6;
  useEffect(() => {
    try {
      localStorage.setItem(infinityStorageKey, JSON.stringify(found));
    } catch {
      /* Quest remains available in memory. */
    }
  }, [found]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4300);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!opened) return;
    const element = dialog.current!,
      focused = document.activeElement as HTMLElement;
    element.showModal();
    if (!snapAudio.current) {
      const player = new Audio(
        `${import.meta.env.BASE_URL}assets/infinity-snap.m4a`,
      );
      player.preload = "auto";
      player.load();
      snapAudio.current = player;
    }
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const buttons = [
          ...element.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ),
        ],
        first = buttons[0],
        last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    element.addEventListener("keydown", trap);
    return () => {
      element.removeEventListener("keydown", trap);
      element.close();
      focused?.focus();
    };
  }, [opened]);
  useEffect(
    () => () => {
      if (finishTimer.current) clearTimeout(finishTimer.current);
      snapAudio.current?.pause();
      setCinematicAudio(false);
    },
    [],
  );
  const collect = (id: GemId) => {
    setFound((current) =>
      current.collected.includes(id)
        ? current
        : { ...current, collected: [...current.collected, id] },
    );
    setNotice(
      `Gemma ${gems.find((g) => g.id === id)!.name} trovata. Il Guanto ti aspetta.`,
    );
  };
  const restore = () => {
    if (finishTimer.current) clearTimeout(finishTimer.current);
    snapAudio.current?.pause();
    setCinematicAudio(false);
    setTargets(new Set());
    setPhase("idle");
    setNotice("Tutte le storie sono tornate nel nostro universo.");
  };
  const snap = () => {
    if (!ready || phase !== "idle") return;
    setOpened(false);
    const movieIds = titles.filter((t) => t.type === "movie").map((t) => t.id);
    const visibleMovies = () =>
      [...document.querySelectorAll<HTMLElement>("[data-infinity-title]")]
        .filter((node) => {
          const box = node.getBoundingClientRect();
          return box.top < innerHeight && box.bottom > 0 && box.width > 0;
        })
        .map((node) => node.dataset.infinityTitle!)
        .filter((id) => movieIds.includes(id));
    setPhase("dusting");
    window.dispatchEvent(new Event("watchverse:stop-opening"));
    const player = snapAudio.current;
    if (player && !muted) {
      player.currentTime = 0;
      player.volume = 0.5;
      setCinematicAudio(true);
      player.onended = () => setCinematicAudio(false);
      void player.play().catch(() => setCinematicAudio(false));
    }
    const dissolve = () => {
      setTargets(snapTargets(movieIds, visibleMovies()));
      finishTimer.current = setTimeout(() => {
        setPhase("snapped");
        setNotice(
          "L’equilibrio è compiuto. Puoi riportare indietro tutte le storie.",
        );
      }, 5400);
    };
    if (visibleMovies().length) dissolve();
    else {
      location.hash = "archive";
      finishTimer.current = setTimeout(() => {
        const grid = document.querySelector(".movie-grid");
        if (grid)
          window.scrollTo({
            top: window.scrollY + grid.getBoundingClientRect().top - 110,
            behavior: "instant",
          });
        if (visibleMovies().length)
          finishTimer.current = setTimeout(dissolve, 150);
        else {
          // A series-only filter or an empty search can leave the archive without
          // films. The home collage guarantees a scene without changing filters.
          location.hash = "home";
          finishTimer.current = setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "instant" });
            dissolve();
          }, 700);
        }
      }, 700);
    }
  };
  const value: Quest = {
    ...found,
    phase,
    targets,
    collect,
    open: () => setOpened(true),
  };
  return (
    <Context.Provider value={value}>
      {children}
      {found.collected.length > 0 && (
        <button
          className="infinity-pocket"
          onClick={() => setOpened(true)}
          aria-label={`Apri il Guanto dell’Infinito: ${found.collected.length} di 6 Gemme`}
        >
          <GauntletArt inserted={found.inserted} small />
          <span>
            {phase === "snapped"
              ? "L’universo attende"
              : `${found.collected.length} / 6`}
          </span>
        </button>
      )}
      {notice && (
        <div className="infinity-notice" role="status">
          {notice}
        </div>
      )}
      {phase === "dusting" && targets.size > 0 && (
        <Stardust targets={targets} />
      )}
      {opened && (
        <dialog
          ref={dialog}
          className="infinity-dialog"
          aria-labelledby="infinity-heading"
          onCancel={(event) => {
            event.preventDefault();
            setOpened(false);
          }}
          onClick={(event) => {
            if (event.target === dialog.current) setOpened(false);
          }}
        >
          <button
            className="infinity-close icon-button"
            aria-label="Chiudi il Guanto"
            onClick={() => setOpened(false)}
          >
            <X />
          </button>
          <div className="eyebrow">UN POTERE SENZA LIMITI</div>
          <h2 id="infinity-heading">
            IL GUANTO
            <br />
            <span>DELL’INFINITO.</span>
          </h2>
          <p>
            {phase === "snapped"
              ? "Metà delle storie è diventata polvere. Ogni universo merita una seconda possibilità."
              : ready
                ? "Sei Gemme. Un solo gesto. L’universo è nelle tue mani."
                : "Sei luci si nascondono nel nostro universo. Trovale, poi incastonale nel Guanto."}
          </p>
          <button
            className={`gauntlet-relic ${ready ? "charged" : ""}`}
            onClick={snap}
            disabled={!ready || phase !== "idle"}
            aria-label={
              ready
                ? "Schiocca il Guanto dell’Infinito"
                : "Il Guanto attende le sei Gemme"
            }
          >
            <GauntletArt inserted={found.inserted} />
          </button>
          <div className="gem-inventory" aria-label="Le sei Gemme">
            {gems.map((g) => (
              <button
                key={g.id}
                style={{ "--gem": g.color } as CSSProperties}
                className={
                  found.inserted.includes(g.id)
                    ? "inserted"
                    : found.collected.includes(g.id)
                      ? "found"
                      : "missing"
                }
                disabled={
                  !found.collected.includes(g.id) ||
                  found.inserted.includes(g.id)
                }
                onClick={() =>
                  setFound((current) => ({
                    ...current,
                    inserted: [...new Set([...current.inserted, g.id])],
                  }))
                }
                aria-label={`${found.inserted.includes(g.id) ? "Incastonata" : "Incastona"} Gemma ${g.name}`}
              >
                <GemShape id={g.id} />
                <span>{g.name}</span>
              </button>
            ))}
          </div>
          <div className="infinity-controls">
            <span>
              {found.collected.length} trovate · {found.inserted.length}{" "}
              incastonate
            </span>
            <button
              className="icon-button"
              onClick={() => {
                setMuted(!muted);
                if (!muted) {
                  snapAudio.current?.pause();
                  setCinematicAudio(false);
                }
              }}
              aria-label={
                muted
                  ? "Attiva audio dello schiocco"
                  : "Silenzia audio dello schiocco"
              }
            >
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
          </div>
          {phase !== "idle" ? (
            <button
              className="button secondary infinity-restore"
              onClick={restore}
            >
              <RotateCcw size={16} /> Riporta indietro le storie
            </button>
          ) : (
            <small className="infinity-instruction">
              {ready
                ? "Tocca il Guanto per schioccare."
                : "Tocca le Gemme trovate per incastonarle."}
            </small>
          )}
        </dialog>
      )}
    </Context.Provider>
  );
}
export function GauntletDiscovery() {
  const quest = useInfinity();
  return (
    <button
      className="gauntlet-discovery"
      onClick={quest.open}
      aria-label="Esamina l’artefatto dorato"
      title="Un artefatto insolito…"
    >
      <GauntletArt inserted={quest.inserted} small />
    </button>
  );
}
