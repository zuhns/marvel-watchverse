import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useId,
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
      <GemShape />
      <span className="gem-spark" />
    </button>
  );
}
function GemShape() {
  return (
    <svg viewBox="0 0 32 38" aria-hidden="true">
      <path d="M16 1 28 9 31 22 16 37 1 22 4 9Z" fill="currentColor" />
      <path d="m16 1 7 12-7 24-7-24Z" fill="#fff" opacity=".2" />
      <path d="M4 9h24L16 37Z" fill="#fff" opacity=".12" />
      <path d="m4 9 12-8 12 8-12 4Z" fill="#fff" opacity=".45" />
      <path d="m1 22 8-9 7 24Z" fill="#050310" opacity=".25" />
    </svg>
  );
}
const sockets: Record<GemId, [number, number]> = {
  soul: [25, 19],
  reality: [40, 13],
  power: [54, 13],
  space: [68, 19],
  time: [84, 52],
  mind: [48, 59],
};
export function GauntletArt({
  inserted = [],
  small = false,
}: {
  inserted?: GemId[];
  small?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg className="gauntlet-art" viewBox="0 0 240 280" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}gold`} x1="0" y1="0" x2="1" y2=".6">
          <stop stopColor="#423018" />
          <stop offset=".25" stopColor="#b59142" />
          <stop offset=".43" stopColor="#f7d57e" />
          <stop offset=".58" stopColor="#6c491d" />
          <stop offset=".8" stopColor="#d5aa4f" />
          <stop offset="1" stopColor="#43311b" />
        </linearGradient>
        <linearGradient id={`${uid}plate`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e4be6a" />
          <stop offset=".5" stopColor="#8a6029" />
          <stop offset="1" stopColor="#392716" />
        </linearGradient>
        <filter id={`${uid}glow`}>
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <g
        fill={`url(#${uid}gold)`}
        stroke="#d7ae58"
        strokeWidth="1.1"
        strokeLinejoin="round"
      >
        <path d="m55 240-14-58-5-80 5-51q4-10 16-5l9 13 1 45 6-10-3-58q0-12 11-13 13-2 17 12l5 55 5-6-2-54q0-14 13-14t15 14l4 56 7 8 2-43q1-12 13-11t12 13l-1 64 7 38 19-25q7-10 17-2t1 21l-26 49-15 59-11 21Z" />
        <path
          d="m49 111 26-14 18-3 18 5 22-6 34 14 7 37-20 43-57 26-42-23Z"
          fill={`url(#${uid}plate)`}
        />
        <path d="m57 208 97 5 6 30-101 12Z" />
        <path d="m58 254 99-8-1 27H66Z" />
        <path d="m51 128 20-18 23 9-5 34-26 27-7-31Z" />
        <path d="m130 111 25-2 13 35-21 37-19-12Z" />
        <path
          d="m89 118 31-8 21 23-13 48-24 16-27-26Z"
          fill={`url(#${uid}gold)`}
        />
      </g>
      <g fill="none" stroke="#f4d683" strokeWidth="1" opacity=".55">
        <path d="m47 69 17-2m-19 14 20-2m8-32 25-2m-24 15 26-3m9-14 27-1m-27 14 28-1m16 9 20 1m-20 12 20 1M65 218l71 8-55 13m-22-39 20-13m66-7-14 24M66 260l79-3" />
        <path d="m103 113 12 8-9 18m-8 39 8 10 14-14m-57-46 11 4-7 17m86-33-7 16" />
      </g>
      {gems.map((g) => {
        const [x, y] = sockets[g.id];
        const has = inserted.includes(g.id);
        return (
          <g key={g.id} transform={`translate(${x * 2.4} ${y * 2.8})`}>
            <ellipse
              rx={g.id === "mind" ? 16 : 10}
              ry={g.id === "mind" ? 20 : 12}
              fill="#251b14"
              stroke="#e5bf66"
              strokeWidth="3"
            />
            {has && (
              <>
                <ellipse
                  rx="13"
                  ry="16"
                  fill={g.color}
                  opacity=".6"
                  filter={small ? undefined : `url(#${uid}glow)`}
                />
                <path d="m0-10 7 5 2 9-9 8-9-8 2-9Z" fill={g.color} />
                <path d="m0-10 3 7-3 15-3-15Z" fill="#fff" opacity=".5" />
              </>
            )}
          </g>
        );
      })}
    </svg>
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
      }, 3300);
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
                <GemShape />
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
