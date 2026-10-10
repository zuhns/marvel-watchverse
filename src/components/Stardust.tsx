import { useEffect, useRef } from "react";

type Fragment = {
  x: number;
  y: number;
  w: number;
  h: number;
  delay: number;
  vx: number;
  vy: number;
  turn: number;
  life: number;
};
type Row = { y: number; h: number; delay: number };
type Surface = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  bitmap: HTMLCanvasElement;
  w: number;
  h: number;
  step: number;
  rows: Row[];
  fragments: Fragment[];
  pixels: number;
};
type Poster = {
  host: HTMLElement;
  image: HTMLImageElement;
  visible: boolean;
  surface?: Surface;
};
const padding = { left: 8, top: 96, right: 100, bottom: 20 };

/** Each cover owns its canvas. One scheduler draws only visible, bounded surfaces. */
export function Stardust({ targets }: { targets: Set<string> }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const stats = ref.current!;
    const compact = matchMedia("(max-width: 768px), (pointer: coarse)").matches;
    const maxActive = compact ? 3 : 6;
    const maxFragments = compact ? 420 : 900;
    const pixelBudget = compact ? 700_000 : 1_800_000;
    const ratio = compact ? 1 : Math.min(devicePixelRatio, 1.25);
    const interval = 1000 / (compact ? 24 : 30);
    stats.dataset.maxActive = String(maxActive);
    stats.dataset.pixelBudget = String(pixelBudget);
    stats.dataset.quality = compact ? "mobile" : "desktop";
    const started = performance.now();
    let frame = 0,
      lastDraw = -100,
      disposed = false,
      seed = 67;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const posters = new Map<HTMLElement, Poster>();
    let pixels = 0,
      renderedFrames = 0;
    const free = (poster: Poster) => {
      if (!poster.surface) return;
      const s = poster.surface;
      pixels -= s.pixels;
      s.canvas.remove();
      s.canvas.width = s.canvas.height = 0;
      s.bitmap.width = s.bitmap.height = 0;
      poster.surface = undefined;
    };
    const activeCount = () =>
      [...posters.values()].filter((p) => p.surface).length;
    const allocate = (p: Poster) => {
      if (
        p.surface ||
        !p.visible ||
        !p.image.complete ||
        !p.image.naturalWidth ||
        activeCount() >= maxActive
      )
        return;
      const w = p.image.clientWidth,
        h = p.image.clientHeight;
      if (!w || !h) return;
      const canvas = document.createElement("canvas");
      const cw = Math.ceil((w + padding.left + padding.right) * ratio);
      const ch = Math.ceil((h + padding.top + padding.bottom) * ratio);
      const size = cw * ch + Math.ceil(w) * Math.ceil(h);
      if (pixels + size > pixelBudget) return;
      const ctx = canvas.getContext("2d", { alpha: true });
      const bitmap = document.createElement("canvas"),
        imageContext = bitmap.getContext("2d");
      if (!ctx || !imageContext) return;
      canvas.className = "poster-dust-canvas";
      canvas.setAttribute("aria-hidden", "true");
      canvas.dataset.posterId = p.host.dataset.infinityTitle;
      canvas.width = cw;
      canvas.height = ch;
      canvas.style.width = `${w + padding.left + padding.right}px`;
      canvas.style.height = `${h + padding.top + padding.bottom}px`;
      // Offset coordinates are local to the card, so scrolling and transforms are native.
      let left = 0,
        top = 0,
        element: HTMLElement | null = p.image;
      while (element && element !== p.host) {
        left += element.offsetLeft;
        top += element.offsetTop;
        element = element.offsetParent as HTMLElement | null;
      }
      canvas.style.left = `${left - padding.left}px`;
      canvas.style.top = `${top - padding.top}px`;
      ctx.scale(ratio, ratio);
      bitmap.width = Math.ceil(w);
      bitmap.height = Math.ceil(h);
      const fit = Math.max(w / p.image.naturalWidth, h / p.image.naturalHeight);
      const sw = w / fit,
        sh = h / fit;
      imageContext.drawImage(
        p.image,
        (p.image.naturalWidth - sw) / 2,
        (p.image.naturalHeight - sh) / 2,
        sw,
        sh,
        0,
        0,
        bitmap.width,
        bitmap.height,
      );
      const step = Math.sqrt((w * h) / maxFragments),
        rows: Row[] = [],
        fragments: Fragment[] = [];
      for (let y = 0; y < h; y += step) {
        const delay = 0.25 + 0.15 * Math.sin(y * 0.06) + random() * 0.3;
        rows.push({ y, h: Math.min(step, h - y), delay });
        for (let x = 0; x < w; x += step)
          fragments.push({
            x,
            y,
            w: Math.min(step, w - x),
            h: Math.min(step, h - y),
            delay: delay + (x / w) * 2.4,
            vx: 20 + random() * 45,
            vy: -18 - random() * 50,
            turn: random() * Math.PI * 2,
            life: 1.3 + random() * 0.4,
          });
      }
      p.surface = {
        canvas,
        ctx,
        bitmap,
        w,
        h,
        step,
        rows,
        fragments,
        pixels: size,
      };
      pixels += size;
      p.host.append(canvas);
    };
    const wake = () => {
      if (
        !frame &&
        !disposed &&
        !document.hidden &&
        performance.now() - started < 5400
      )
        frame = requestAnimationFrame(render);
    };
    const render = (now: number) => {
      frame = 0;
      if (disposed || document.hidden || now - started >= 5400) return;
      if (now - lastDraw < interval) {
        wake();
        return;
      }
      lastDraw = now;
      const t = (now - started) / 1000;
      let airborne = 0,
        fragments = 0;
      for (const p of posters.values()) {
        if (!p.visible || !p.host.isConnected) {
          free(p);
          continue;
        }
        allocate(p);
        const s = p.surface;
        if (!s) continue;
        const { ctx, w, h, bitmap } = s;
        ctx.clearRect(
          0,
          0,
          w + padding.left + padding.right,
          h + padding.top + padding.bottom,
        );
        ctx.save();
        ctx.translate(padding.left, padding.top);
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, 8);
        ctx.clip();
        ctx.beginPath();
        // One clipped image and one rectangle per row, instead of a path per particle.
        for (const row of s.rows) {
          const edge = Math.max(
            0,
            Math.min(
              w,
              (Math.floor((((t - row.delay) / 2.4) * w) / s.step) + 1) * s.step,
            ),
          );
          if (edge < w) ctx.rect(edge, row.y, w - edge, row.h + 0.3);
        }
        ctx.clip();
        ctx.globalAlpha = 1;
        ctx.drawImage(bitmap, 0, 0, w, h);
        ctx.restore();
        for (const f of s.fragments) {
          const age = t - f.delay;
          if (age < 0 || age > f.life) continue;
          const progress = age / f.life,
            size = 1 - progress * 0.83;
          ctx.globalAlpha = (1 - progress) ** 1.2;
          ctx.drawImage(
            bitmap,
            f.x,
            f.y,
            f.w,
            f.h,
            padding.left +
              f.x +
              f.vx * age +
              Math.sin(age * 5 + f.turn) * age * 9,
            padding.top +
              f.y +
              f.vy * age +
              Math.cos(age * 4 + f.turn) * age * 7,
            f.w * size,
            f.h * size,
          );
          airborne++;
        }
        p.host.dataset.dustReady = "true";
        fragments += s.fragments.length;
      }
      stats.dataset.active = String(activeCount());
      stats.dataset.pixels = String(pixels);
      stats.dataset.fragments = String(fragments);
      stats.dataset.airborne = String(airborne);
      stats.dataset.frames = String(++renderedFrames);
      if (activeCount()) wake();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const p = posters.get(entry.target as HTMLElement);
          if (!p) continue;
          p.visible = entry.isIntersecting;
          if (!p.visible) free(p);
        }
        wake();
      },
      { rootMargin: "32px" },
    );
    const imageLoaded = () => wake();
    document
      .querySelectorAll<HTMLElement>("[data-infinity-title]")
      .forEach((host) => {
        if (!targets.has(host.dataset.infinityTitle!)) return;
        const image = host.querySelector<HTMLImageElement>(".poster-image img");
        if (!image) return;
        posters.set(host, { host, image, visible: false });
        image.addEventListener("load", imageLoaded);
        observer.observe(host);
      });
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else wake();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      for (const p of posters.values()) {
        free(p);
        p.image.removeEventListener("load", imageLoaded);
        delete p.host.dataset.dustReady;
      }
      posters.clear();
    };
  }, [targets]);
  return (
    <span ref={ref} className="stardust-session" hidden aria-hidden="true" />
  );
}
