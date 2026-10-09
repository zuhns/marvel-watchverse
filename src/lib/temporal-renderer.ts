export type Point = { x: number; y: number };
export type TemporalAnchor = Point & { id: string };
export type TemporalControls = {
  paused: boolean;
  selected: string;
  hovered: string | null;
};

function random(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
const trunkY = (x: number) =>
  0.64 + Math.sin(x * 11 + 0.8) * 0.046 + Math.cos(x * 5) * 0.025;
function fracture(
  a: Point,
  b: Point,
  depth: number,
  rand: () => number,
): Point[] {
  if (!depth) return [a, b];
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const middle = {
    x: (a.x + b.x) / 2 + (rand() - 0.5) * length * 0.14,
    y: (a.y + b.y) / 2 + (rand() - 0.5) * length * 0.23,
  };
  const left = fracture(a, middle, depth - 1, rand);
  return [...left.slice(0, -1), ...fracture(middle, b, depth - 1, rand)];
}
function trace(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  w: number,
  h: number,
) {
  ctx.beginPath();
  points.forEach((p, i) =>
    i ? ctx.lineTo(p.x * w, p.y * h) : ctx.moveTo(p.x * w, p.y * h),
  );
}
export function createTemporalRenderer(
  canvas: HTMLCanvasElement,
  imageUrl: string,
  anchors: TemporalAnchor[],
  controls: () => TemporalControls,
) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return () => {};
  const image = new Image();
  image.src = imageUrl;
  let dirty = true;
  let lastControlKey = "";
  image.onload = () => {
    dirty = true;
  };
  let disposed = false,
    frame = 0,
    elapsed = 0,
    last = 0,
    lastDraw = 0,
    w = 1200,
    h = 500;
  const layer = document.createElement("canvas");
  const rand = random(78121);
  const routes = anchors
    .filter((a) => a.id !== "616")
    .map((a) => {
      const start = { x: Math.max(0.02, a.x - 0.08), y: trunkY(a.x - 0.08) };
      return { id: a.id, path: fracture(start, a, 5, rand) };
    });
  const twigs: Point[][] = [];
  const fork = (a: Point, b: Point, depth: number) => {
    const path = fracture(a, b, 4, rand);
    twigs.push(path);
    if (!depth) return;
    for (const p of [0.43, 0.7]) {
      const origin = path[Math.floor(path.length * p)];
      const sign = b.y < a.y ? -1 : 1;
      const end = {
        x: origin.x + ((rand() - 0.25) * 0.12 * depth) / 3,
        y: origin.y + (sign * (0.05 + rand() * 0.07) * depth) / 3,
      };
      fork(origin, end, depth - 1);
    }
  };
  routes.forEach((route) => {
    for (const p of [0.28, 0.48, 0.7]) {
      const origin = route.path[Math.floor(route.path.length * p)];
      const upward = route.path.at(-1)!.y < route.path[0].y;
      fork(
        origin,
        {
          x: origin.x + (rand() - 0.35) * 0.11,
          y: origin.y + (upward ? -1 : 1) * (0.08 + rand() * 0.1),
        },
        2,
      );
    }
  });
  const resize = () => {
    dirty = true;
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    const ratio = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    layer.width = canvas.width;
    layer.height = canvas.height;
    const pen = layer.getContext("2d")!;
    pen.setTransform(ratio, 0, 0, ratio, 0, 0);
    pen.clearRect(0, 0, w, h);
    pen.globalCompositeOperation = "screen";
    [...twigs, ...routes.map((r) => r.path)].forEach((path, i) => {
      trace(pen, path, w, h);
      pen.strokeStyle = i % 3 ? "#8abdec" : "#be9cde";
      pen.lineWidth = i < twigs.length ? 0.45 : 0.8;
      pen.shadowBlur = 7;
      pen.shadowColor = "#7cabed";
      pen.globalAlpha = i < twigs.length ? 0.14 : 0.25;
      pen.stroke();
    });
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  const draw = (timestamp: number) => {
    if (disposed) return;
    const state = controls();
    const running = !state.paused && !document.hidden;
    const controlKey = `${state.paused}/${state.selected}/${state.hovered}`;
    if (controlKey !== lastControlKey) dirty = true;
    lastControlKey = controlKey;
    if (last && running) elapsed += Math.min(timestamp - last, 100) / 1000;
    last = timestamp;
    if ((running && timestamp - lastDraw >= 1000 / 30) || dirty) {
      dirty = false;
      lastDraw = timestamp;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#021126";
      ctx.fillRect(0, 0, w, h);
      if (image.complete && image.naturalWidth) {
        // The supplied reference is the actual screen texture, slowly travelling
        // through the monitor. A static exposure softens the wrap at the edges.
        ctx.globalAlpha = 0.5;
        ctx.drawImage(image, 0, 0, w, h);
        const shift = (elapsed * 7) % w;
        ctx.globalAlpha = 0.65;
        ctx.drawImage(image, -shift, 0, w, h);
        ctx.drawImage(image, w - shift, 0, w, h);
        canvas.dataset.rendered = "ready";
      }
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.6 + Math.sin(elapsed * 0.35) * 0.12;
      ctx.drawImage(layer, 0, 0, w, h);
      routes.forEach((route, i) => {
        const active =
          route.id === state.hovered || route.id === state.selected;
        if (active) {
          trace(ctx, route.path, w, h);
          ctx.globalAlpha = 0.32;
          ctx.strokeStyle = "#e1dcff";
          ctx.lineWidth = 1;
          ctx.shadowBlur = 13;
          ctx.shadowColor = "#a6b9ff";
          ctx.stroke();
        }
        for (let n = 0; n < 5; n++) {
          const p =
            ((elapsed * 0.043 + i * 0.107 + n * 0.196) % 1) *
            (route.path.length - 1);
          const index = Math.floor(p),
            a = route.path[index],
            b = route.path[Math.min(index + 1, route.path.length - 1)],
            t = p - index;
          const x = (a.x + (b.x - a.x) * t) * w,
            y = (a.y + (b.y - a.y) * t) * h;
          ctx.globalAlpha = active ? 0.8 : 0.45;
          ctx.fillStyle = n % 2 ? "#b6d6ff" : "#efdaff";
          ctx.shadowBlur = 9;
          ctx.shadowColor = "#addaff";
          ctx.beginPath();
          ctx.arc(x, y, n % 2 ? 0.8 : 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      // Moving light on the main flow keeps the sense of time advancing.
      for (let i = 0; i < 34; i++) {
        const x = (((i / 34 - elapsed * 0.026) % 1) + 1) % 1,
          y = trunkY(x) + Math.sin(elapsed * 0.35 + i) * 0.012;
        const glow = ctx.createRadialGradient(
          x * w,
          y * h,
          0,
          x * w,
          y * h,
          20,
        );
        glow.addColorStop(0, "#dff2ff60");
        glow.addColorStop(1, "#b5b6ff00");
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = glow;
        ctx.fillRect(x * w - 20, y * h - 20, 40, 40);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      const vignette = ctx.createRadialGradient(
        w * 0.5,
        h * 0.5,
        h * 0.15,
        w * 0.5,
        h * 0.5,
        w * 0.65,
      );
      vignette.addColorStop(0, "#00101e00");
      vignette.addColorStop(1, "#00040d9a");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
      canvas.dataset.motion = state.paused ? "still" : "flowing";
      canvas.dataset.time = elapsed.toFixed(3);
    }
    frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    image.onload = null;
  };
}
