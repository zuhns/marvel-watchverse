import { useEffect, useRef, useState } from "react";
import { VolumeX } from "lucide-react";
import { setCinematicAudio } from "../lib/cinematicAudio";
export const openingStorageKey = "marvel-watchverse.opening-audio.v2";
/** A standalone audio recording is required; never embed a hidden video player. */
export function MarvelOpening() {
  const [source, setSource] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    let cancelled = false;
    void fetch(`${import.meta.env.BASE_URL}data/opening-audio.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((settings) => {
        if (
          !cancelled &&
          typeof settings?.src === "string" &&
          /^assets\/[A-Za-z0-9/_-]+\.(mp3|m4a|ogg|wav)$/.test(settings.src)
        )
          setSource(`${import.meta.env.BASE_URL}${settings.src}`);
      })
      .catch(() => {
        /* No audio is requested without a configured recording. */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!source) return;
    try {
      if (localStorage.getItem(openingStorageKey) === "seen") return;
    } catch {
      /* Use session state. */
    }
    const player = new Audio(source);
    audio.current = player;
    player.volume = 0.35;
    player.preload = "auto";
    let cancelled = false,
      started = false,
      attempting = false,
      stopped = false;
    const release = () => {
      setCinematicAudio(false, "opening");
      if (!cancelled) setPlaying(false);
    };
    const start = () => {
      if (started || attempting || stopped || document.hidden) return;
      attempting = true;
      void player
        .play()
        .then(() => {
          if (cancelled || stopped) {
            player.pause();
            return;
          }
          started = true;
          setPlaying(true);
          setCinematicAudio(true, "opening");
          try {
            localStorage.setItem(openingStorageKey, "seen");
          } catch {
            /* Only this session. */
          }
        })
        .catch(() => {
          /* Autoplay denial retries on the first trusted gesture. */
        })
        .finally(() => {
          attempting = false;
        });
    };
    const stop = () => {
      stopped = true;
      player.pause();
      release();
    };
    const visibility = () => {
      if (document.hidden) stop();
    };
    player.onended = release;
    player.onerror = stop;
    document.addEventListener("pointerdown", start);
    document.addEventListener("keydown", start);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("watchverse:stop-opening", stop);
    start();
    return () => {
      cancelled = true;
      document.removeEventListener("pointerdown", start);
      document.removeEventListener("keydown", start);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("watchverse:stop-opening", stop);
      player.pause();
      player.removeAttribute("src");
      player.load();
      audio.current = null;
      release();
    };
  }, [source]);
  if (!playing) return null;
  return (
    <button
      className="opening-audio-toggle"
      aria-label="Silenzia sigla Marvel"
      title="Silenzia sigla"
      onClick={() => {
        audio.current?.pause();
        setPlaying(false);
        setCinematicAudio(false, "opening");
      }}
    >
      <VolumeX size={16} />
    </button>
  );
}
