import { useEffect, useRef, useState } from "react";
import { X, Play } from "lucide-react";
import { setCinematicAudio } from "../lib/cinematicAudio";
export const openingStorageKey = "marvel-watchverse.opening.v1";
type Player = {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (n: number) => void;
  destroy: () => void;
};
type PlayerEvent = { data: number; target: Player };
type YoutubeApi = {
  Player: new (
    iframe: HTMLIFrameElement,
    options: { events: Record<string, (event: PlayerEvent) => void> },
  ) => Player;
};
declare global {
  interface Window {
    YT?: YoutubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}
let apiPromise: Promise<YoutubeApi> | undefined;
function loadApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return (apiPromise ||= new Promise<YoutubeApi>((resolve, reject) => {
    const timer = setTimeout(() => {
      apiPromise = undefined;
      reject(new Error("Opening unavailable"));
    }, 15000);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer);
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      clearTimeout(timer);
      apiPromise = undefined;
      reject(new Error("Opening unavailable"));
    };
    document.head.append(script);
  }));
}
// Original 2016 opening, published by Entertainment Access. The visible YouTube
// player streams the sequence; no recording is extracted or redistributed.
export function MarvelOpening() {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(openingStorageKey) !== "seen";
    } catch {
      return true;
    }
  });
  const [playing, setPlaying] = useState(false),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null),
    player = useRef<Player | null>(null),
    started = useRef(false);
  const markSeen = () => {
    try {
      localStorage.setItem(openingStorageKey, "seen");
    } catch {
      /* Once within this visit. */
    }
  };
  const dismiss = () => {
    player.current?.pauseVideo?.();
    markSeen();
    setCinematicAudio(false, "opening");
    setVisible(false);
  };
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    void loadApi()
      .then((api) => {
        if (cancelled || !frame.current) return;
        player.current = new api.Player(frame.current, {
          events: {
            onReady: (event) => {
              if (!cancelled) {
                setReady(true);
                event.target.setVolume(35);
                event.target.playVideo();
              }
            },
            onStateChange: (event) => {
              if (cancelled) return;
              if (event.data === 1) {
                started.current = true;
                markSeen();
                setPlaying(true);
                setCinematicAudio(true, "opening");
              } else if (event.data === 0) dismiss();
              else if (event.data === 2) {
                setPlaying(false);
                setCinematicAudio(false, "opening");
              }
            },
            onError: () => {
              if (!cancelled) {
                setFailed(true);
                setCinematicAudio(false, "opening");
              }
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    const start = () => {
      if (!started.current) player.current?.playVideo?.();
    };
    const visibility = () => {
      if (document.hidden) player.current?.pauseVideo?.();
    };
    document.addEventListener("pointerdown", start);
    document.addEventListener("keydown", start);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("watchverse:stop-opening", dismiss);
    return () => {
      cancelled = true;
      document.removeEventListener("pointerdown", start);
      document.removeEventListener("keydown", start);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("watchverse:stop-opening", dismiss);
      player.current?.destroy?.();
      player.current = null;
      setCinematicAudio(false, "opening");
    };
  }, [visible]);
  if (!visible) return null;
  return (
    <aside
      className="marvel-opening"
      aria-label="Opening Marvel · Prima visita"
    >
      <div className="opening-caption">
        <span>Il nostro universo comincia qui.</span>
        <button
          className="icon-button"
          onClick={dismiss}
          aria-label="Chiudi opening Marvel"
        >
          <X size={16} />
        </button>
      </div>
      <iframe
        ref={frame}
        src={`https://www.youtube-nocookie.com/embed/ZPjlwJ0SeOs?autoplay=1&enablejsapi=1&playsinline=1&rel=0&end=35&origin=${encodeURIComponent(location.origin)}`}
        title="Marvel Studios opening originale · Comic-Con 2016"
        allow="autoplay; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <div className="opening-status">
        {failed ? (
          <a
            href="https://www.youtube.com/watch?v=ZPjlwJ0SeOs"
            target="_blank"
            rel="noreferrer"
          >
            Guarda l’opening originale ↗
          </a>
        ) : (
          <button
            disabled={!ready}
            onClick={() => player.current?.playVideo?.()}
          >
            <Play size={11} />
            {!ready
              ? "Preparo l’opening…"
              : playing
                ? "Marvel Studios · Opening theme"
                : "Tocca per avviare la musica"}
          </button>
        )}
      </div>
    </aside>
  );
}
