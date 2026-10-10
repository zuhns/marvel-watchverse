import { useEffect, useRef } from "react";
/** Poster fragments are drawn directly: no pixel readback or CORS bypass. */
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
    const particles: {
      x: number;
      y: number;
      sx: number;
      sy: number;
      size: number;
      delay: number;
      vx: number;
      vy: number;
      turn: number;
      image: HTMLImageElement | null;
    }[] = [];
    document
      .querySelectorAll<HTMLElement>("[data-infinity-title]")
      .forEach((node) => {
        if (!targets.has(node.dataset.infinityTitle!)) return;
        const image = node.querySelector<HTMLImageElement>(".poster-image img"),
          box = (image || node).getBoundingClientRect();
        if (box.top >= innerHeight || box.bottom <= 0 || !box.width) return;
        const count = Math.min(260, Math.floor((box.width * box.height) / 280));
        for (let i = 0; i < count && particles.length < 2200; i++) {
          const rx = random(),
            ry = random();
          particles.push({
            x: box.left + rx * box.width,
            y: box.top + ry * box.height,
            sx: rx * (image?.naturalWidth || 1),
            sy: ry * (image?.naturalHeight || 1),
            size: 1 + random() * 3.1,
            delay: 0.15 + rx * 1.05 + random() * 0.3,
            vx: 25 + random() * 95,
            vy: -22 - random() * 65,
            turn: random() * Math.PI * 2,
            image: image?.complete && image.naturalWidth ? image : null,
          });
        }
      });
    let frame = 0;
    const started = performance.now();
    const render = (now: number) => {
      const t = (now - started) / 1000;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of particles) {
        const age = t - p.delay;
        if (age < 0 || age > 1.65) continue;
        const progress = age / 1.65;
        const x = p.x + p.vx * age + Math.sin(age * 4 + p.turn) * age * 13,
          y = p.y + p.vy * age + Math.cos(age * 3 + p.turn) * age * 12;
        ctx.globalAlpha = Math.min(1, age * 12) * (1 - progress) ** 1.4;
        const size = p.size * (1 - progress * 0.6);
        if (p.image) ctx.drawImage(p.image, p.sx, p.sy, 3, 3, x, y, size, size);
        else {
          ctx.fillStyle = "#bca990";
          ctx.fillRect(x, y, size, size);
        }
      }
      if (t < 3.3) frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [targets]);
  return (
    <div className="snap-atmosphere" aria-hidden="true">
      <div className="snap-flash" />
      <canvas ref={ref} className="stardust-canvas" />
    </div>
  );
}
