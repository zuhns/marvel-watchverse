import { useEffect, useRef, useState } from "react";
import { cinematicAudioActive } from "../lib/cinematicAudio";
export function useTvaAmbience(paused: boolean) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(true),
    [volume, setVolume] = useState(10),
    [error, setError] = useState(""),
    [waiting, setWaiting] = useState(false);
  useEffect(() => {
    const player = (audio.current ||= new Audio(
      `${import.meta.env.BASE_URL}assets/temporal-score.m4a`,
    ));
    player.loop = true;
    player.preload = "none";
    player.volume = volume / 100;
    let cancelled = false;
    const apply = () => {
      if (!enabled || paused || document.hidden || cinematicAudioActive()) {
        player.pause();
        return;
      }
      if (!player.paused) return;
      void player
        .play()
        .then(() => {
          if (!cancelled) {
            setWaiting(false);
            setError("");
          }
        })
        .catch((reason) => {
          if (cancelled) return;
          if (reason?.name === "NotAllowedError") setWaiting(true);
          else if (reason?.name !== "AbortError")
            setError("Audio non disponibile. Tocca Audio per riprovare.");
        });
    };
    apply();
    document.addEventListener("pointerdown", apply);
    document.addEventListener("keydown", apply);
    document.addEventListener("visibilitychange", apply);
    window.addEventListener("watchverse:cinematic-audio", apply);
    return () => {
      cancelled = true;
      document.removeEventListener("pointerdown", apply);
      document.removeEventListener("keydown", apply);
      document.removeEventListener("visibilitychange", apply);
      window.removeEventListener("watchverse:cinematic-audio", apply);
    };
  }, [enabled, volume, paused]);
  useEffect(
    () => () => {
      const player = audio.current;
      if (player) {
        player.pause();
        player.removeAttribute("src");
        player.load();
        audio.current = null;
      }
    },
    [],
  );
  return {
    enabled,
    volume,
    setVolume,
    toggle: () => {
      setEnabled((value) => !value);
      setError("");
    },
    error,
    loading: false,
    waiting,
  };
}
