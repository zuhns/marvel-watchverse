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
type Poster = {
  node: HTMLElement;
  image: HTMLImageElement;
  cx: number;
  cy: number;
  w: number;
  h: number;
  angle: number;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  fragments: Fragment[];
};
/** Display-only canvas: draw the existing posters directly, without pixel readback. */
export function Stardust({ targets }: { targets: Set<string> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current!,
      ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(devicePixelRatio, 1.5);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    let seed = 67;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const posters: Poster[] = [];
    document
      .querySelectorAll<HTMLElement>("[data-infinity-title]")
      .forEach((node) => {
        if (!targets.has(node.dataset.infinityTitle!)) return;
        const image = node.querySelector<HTMLImageElement>(".poster-image img");
        if (!image?.complete || !image.naturalWidth) return;
        const box = image.getBoundingClientRect();
        if (
          box.top >= innerHeight ||
          box.bottom <= 0 ||
          box.left >= innerWidth ||
          box.right <= 0 ||
          !box.width
        )
          return;
        let angle = 0;
        for (
          let ancestor: HTMLElement | null = image;
          ancestor;
          ancestor = ancestor.parentElement
        ) {
          const transform = getComputedStyle(ancestor).transform;
          if (transform !== "none") {
            const matrix = new DOMMatrixReadOnly(transform);
            angle += Math.atan2(matrix.b, matrix.a);
          }
        }
        const scale =
          box.width /
          (Math.abs(Math.cos(angle)) * image.clientWidth +
            Math.abs(Math.sin(angle)) * image.clientHeight);
        const w = image.clientWidth * scale,
          h = image.clientHeight * scale;
        const fit = Math.max(w / image.naturalWidth, h / image.naturalHeight),
          sw = w / fit,
          sh = h / fit;
        const poster: Poster = {
          node,
          image,
          cx: box.left + box.width / 2,
          cy: box.top + box.height / 2,
          w,
          h,
          angle,
          sx: (image.naturalWidth - sw) / 2,
          sy: (image.naturalHeight - sh) / 2,
          sw,
          sh,
          fragments: [],
        };
        // A jagged front releases the actual colored cover pieces into the wind.
        const step = Math.max(4, Math.sqrt((w * h) / 1700));
        for (let y = 0; y < h; y += step)
          for (let x = 0; x < w; x += step) {
            const noise =
              0.15 * Math.sin(y * 0.06) +
              0.12 * Math.sin(x * 0.11 + y * 0.08) +
              random() * 0.38;
            poster.fragments.push({
              x,
              y,
              w: Math.min(step, w - x),
              h: Math.min(step, h - y),
              delay: 0.25 + (x / w) * 2.4 + noise,
              vx: 28 + random() * 110,
              vy: -24 - random() * 100,
              turn: random() * Math.PI * 2,
              life: 1.5 + random() * 0.65,
            });
          }
        posters.push(poster);
      });
    canvas.dataset.fragments = String(
      posters.reduce((count, poster) => count + poster.fragments.length, 0),
    );
    const started = performance.now();
    let frame = 0,
      lastFrame = -100;
    const render = (now: number) => {
      if (now - lastFrame < 25) {
        frame = requestAnimationFrame(render);
        return;
      }
      lastFrame = now;
      const t = (now - started) / 1000;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      let airborne = 0,
        dissolved = 0;
      for (const p of posters) {
        const ox = -p.w / 2,
          oy = -p.h / 2;
        ctx.save();
        ctx.translate(p.cx, p.cy);
        ctx.rotate(p.angle);
        ctx.beginPath();
        ctx.roundRect(ox, oy, p.w, p.h, 8);
        ctx.clip();
        ctx.beginPath();
        for (const f of p.fragments)
          if (t < f.delay) ctx.rect(ox + f.x, oy + f.y, f.w + 0.4, f.h + 0.4);
        ctx.clip();
        ctx.globalAlpha = 1;
        ctx.drawImage(p.image, p.sx, p.sy, p.sw, p.sh, ox, oy, p.w, p.h);
        ctx.restore();
        for (const f of p.fragments) {
          const age = t - f.delay;
          if (age < 0) continue;
          dissolved++;
          if (age > f.life) continue;
          airborne++;
          const progress = age / f.life;
          const px = ox + f.x,
            py = oy + f.y;
          const x =
            p.cx +
            px * Math.cos(p.angle) -
            py * Math.sin(p.angle) +
            f.vx * age +
            Math.sin(age * 5 + f.turn) * age * 17;
          const y =
            p.cy +
            px * Math.sin(p.angle) +
            py * Math.cos(p.angle) +
            f.vy * age +
            Math.cos(age * 4 + f.turn) * age * 12;
          const size = 1 - progress * 0.83;
          ctx.globalAlpha = (1 - progress) ** 1.2;
          ctx.drawImage(
            p.image,
            p.sx + (f.x / p.w) * p.sw,
            p.sy + (f.y / p.h) * p.sh,
            (f.w / p.w) * p.sw,
            (f.h / p.h) * p.sh,
            x,
            y,
            f.w * size,
            f.h * size,
          );
        }
        p.node.dataset.dustReady = "true";
      }
      canvas.dataset.airborne = String(airborne);
      canvas.dataset.dissolved = String(dissolved);
      if (t < 5.4) frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      posters.forEach((p) => delete p.node.dataset.dustReady);
    };
  }, [targets]);
  return (
    <div className="snap-atmosphere" aria-hidden="true">
      <div className="snap-flash" />
      <canvas ref={ref} className="stardust-canvas" />
    </div>
  );
}
