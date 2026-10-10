import { useEffect, useRef, useState } from "react";

export function TvaMascot({ paused = false }: { paused?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const element = video.current;
    const apply = () => {
      if (!element) return;
      if (paused || document.hidden) element.pause();
      else void element.play().catch(() => setFallback(true));
    };
    apply();
    document.addEventListener("visibilitychange", apply);
    return () => document.removeEventListener("visibilitychange", apply);
  }, [paused, fallback]);
  return fallback ? (
    <img
      className="miss-minutes"
      src={`${import.meta.env.BASE_URL}assets/${paused ? "miss-minutes-poster.png" : "miss-minutes-original.gif"}`}
      alt="Miss Minutes, guida della TVA"
    />
  ) : (
    <video
      ref={video}
      className="miss-minutes"
      role="img"
      aria-label="Miss Minutes, guida della TVA"
      src={`${import.meta.env.BASE_URL}assets/miss-minutes.webm`}
      poster={`${import.meta.env.BASE_URL}assets/miss-minutes-poster.png`}
      muted
      loop
      playsInline
      preload="auto"
      onError={() => setFallback(true)}
    />
  );
}
