import { useId, type CSSProperties } from "react";
import { gems, type GemId } from "../lib/infinity";

/** Rounded, uneven crystalline stones rather than identical diamond icons. */
export function GemShape({ id = "space" }: { id?: GemId }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gem = gems.find((g) => g.id === id)!;
  const outline =
    id === "mind"
      ? "M20 2C31 2 37 14 37 28S31 54 20 54 3 42 3 28 9 2 20 2Z"
      : "M19 2 29 5 35 15 37 30 33 44 23 54 12 51 5 41 3 27 7 11Z";
  return (
    <svg
      viewBox="0 0 40 56"
      width="100%"
      height="100%"
      className={`infinity-stone stone-${id}`}
      aria-hidden="true"
      style={{ color: gem.color }}
    >
      <defs>
        <radialGradient id={`${uid}body`} cx="38%" cy="30%" r="72%">
          <stop stopColor="#fff" stopOpacity=".98" />
          <stop offset=".15" stopColor="currentColor" />
          <stop offset=".55" stopColor="currentColor" />
          <stop offset="1" stopColor="#080712" />
        </radialGradient>
        <linearGradient id={`${uid}glass`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff" stopOpacity=".7" />
          <stop offset=".45" stopColor="currentColor" stopOpacity=".15" />
          <stop offset="1" stopColor="#000" stopOpacity=".7" />
        </linearGradient>
        <filter
          id={`${uid}light`}
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <clipPath id={`${uid}clip`}>
          <path d={outline} />
        </clipPath>
      </defs>
      <path
        className="stone-halo"
        d={outline}
        fill="currentColor"
        opacity=".55"
        filter={`url(#${uid}light)`}
      />
      <path
        d={outline}
        fill={`url(#${uid}body)`}
        stroke="#0c0a16"
        strokeWidth="1.3"
      />
      <g clipPath={`url(#${uid}clip)`}>
        <path d="m7 11 13-7 8 9-7 15-14-4Z" fill={`url(#${uid}glass)`} />
        <path d="m28 13 10 10-5 19-12-14Z" fill="#040311" opacity=".28" />
        <path
          d="m7 24 14 4 12 14-10 10-10-3Z"
          fill="currentColor"
          opacity=".45"
        />
        <path
          d="m8 39 12 11 11-11M11 12l9-6 8 8M7 23l14 5 8-15"
          fill="none"
          stroke="#fff"
          strokeWidth=".6"
          opacity=".3"
        />
        <ellipse
          className="stone-core"
          cx="17"
          cy="24"
          rx="7"
          ry="12"
          fill="currentColor"
          opacity=".85"
          filter={`url(#${uid}light)`}
        />
        <path
          d="M11 12q4-5 9-5M8 17l-1 5"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".85"
        />
        <ellipse cx="14" cy="14" rx="2" ry="3" fill="#fff" opacity=".9" />
      </g>
    </svg>
  );
}

// Coordinates match the generated front-facing metal asset (1024 × 1536).
// Knuckles from little finger to index: Power, Space, Reality, Soul.
const sockets: Record<
  GemId,
  { x: number; y: number; rx: number; ry: number; angle?: number }
> = {
  power: { x: 273, y: 446, rx: 26, ry: 42, angle: -5 },
  space: { x: 381, y: 407, rx: 29, ry: 43 },
  reality: { x: 520, y: 403, rx: 29, ry: 43 },
  soul: { x: 645, y: 411, rx: 28, ry: 42 },
  time: { x: 866, y: 570, rx: 19, ry: 39, angle: 18 },
  mind: { x: 466, y: 607, rx: 53, ry: 82 },
};
export function GauntletArt({
  inserted = [],
  small = false,
}: {
  inserted?: GemId[];
  small?: boolean;
}) {
  return (
    <svg
      className={`gauntlet-art ${small ? "gauntlet-mini" : ""}`}
      viewBox="0 0 1024 1536"
      aria-hidden="true"
    >
      <image
        href={`${import.meta.env.BASE_URL}assets/infinity-gauntlet-v2.webp`}
        width="1024"
        height="1536"
      />
      {gems
        .filter((gem) => inserted.includes(gem.id))
        .map((gem) => {
          const s = sockets[gem.id];
          return (
            <g
              key={gem.id}
              className="gauntlet-stone"
              data-stone={gem.id}
              style={{ "--gem": gem.color } as CSSProperties}
              transform={`translate(${s.x} ${s.y}) rotate(${s.angle || 0})`}
            >
              <ellipse
                className="socket-radiance"
                rx={s.rx * 1.4}
                ry={s.ry * 1.25}
                fill={gem.color}
                opacity=".23"
              />
              <svg
                x={-s.rx}
                y={-s.ry}
                width={s.rx * 2}
                height={s.ry * 2}
                viewBox="0 0 40 56"
                overflow="visible"
              >
                <GemShape id={gem.id} />
              </svg>
            </g>
          );
        })}
    </svg>
  );
}
