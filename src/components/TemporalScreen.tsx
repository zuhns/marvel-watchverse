import { useEffect, useRef, useState } from "react";
import { Minus, Plus, MoveHorizontal, Crosshair } from "lucide-react";

import type { Earth } from "../lib/multiverse";
import {
  createTemporalRenderer,
  type TemporalControls,
} from "../lib/temporal-flow";

const coordinates = [
  [0.2, 0.21],
  [0.37, 0.35],
  [0.54, 0.15],
  [0.73, 0.28],
  [0.88, 0.16],
  [0.23, 0.83],
  [0.41, 0.87],
  [0.59, 0.81],
  [0.77, 0.89],
  [0.91, 0.77],
];
export function TemporalScreen({
  earths,
  root,
  selected,
  paused,
  onSelect,
}: {
  earths: Earth[];
  root: Earth;
  selected: string;
  paused: boolean;
  onSelect: (e: Earth) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const viewport = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef<TemporalControls>({
    paused: paused,
    selected,
    hovered,
  });
  const dragging = useRef<{ x: number; left: number } | null>(null);
  const anchors = earths.map((earth, i) => ({
    earth,
    x: coordinates[i][0],
    y: coordinates[i][1],
  }));
  const nodes = [{ earth: root, x: 0.52, y: 0.62 }, ...anchors];
  const signature = earths.map((e) => e.id).join(",");
  useEffect(() => {
    state.current = { paused: paused, selected, hovered };
    canvas.current?.dispatchEvent(new Event("watchverse:temporal-controls"));
  }, [paused, selected, hovered]);
  useEffect(() => {
    if (!canvas.current) return;
    return createTemporalRenderer(
      canvas.current,
      nodes.map(({ earth, x, y }) => ({ id: earth.id, x, y })),
      () => state.current,
    );
    // Rebuild geometry only when a different set of Earths is shown.
  }, [signature]);
  useEffect(() => {
    const frame = viewport.current;
    const center = () => {
      const node = frame?.querySelector<HTMLElement>(
        `[data-earth-id="${selected}"]`,
      );
      if (frame && node)
        frame.scrollTo({
          left: node.offsetLeft - frame.clientWidth / 2,
          behavior: "instant",
        });
    };
    center();
    const observer = new ResizeObserver(center);
    if (frame) observer.observe(frame);
    return () => observer.disconnect();
  }, [selected, signature, zoom]);
  const preview = nodes.find((n) => n.earth.id === hovered);
  const [previewLeft, setPreviewLeft] = useState<number | null>(null);
  useEffect(() => {
    const frame = viewport.current;
    if (!frame || !preview) {
      setPreviewLeft(null);
      return;
    }
    // Keep the whole dossier preview inside the visible glass, including touch.
    const place = () => {
      const half = 122.5,
        padding = 8;
      const low = frame.scrollLeft + half + padding;
      const high = frame.scrollLeft + frame.clientWidth - half - padding;
      const x = preview.x * frame.firstElementChild!.clientWidth;
      setPreviewLeft(Math.min(Math.max(x, low), Math.max(low, high)));
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(frame);
    frame.addEventListener("scroll", place, { passive: true });
    return () => {
      observer.disconnect();
      frame.removeEventListener("scroll", place);
    };
  }, [hovered, signature, zoom]);
  const pan = (amount: number) =>
    viewport.current?.scrollBy({
      left: amount,
      behavior: "smooth",
    });
  return (
    <div className="tva-crt">
      <div className="crt-carry-handle" aria-hidden="true" />
      <span className="crt-screw top-left" aria-hidden="true" />
      <span className="crt-screw top-right" aria-hidden="true" />
      <span className="crt-screw bottom-left" aria-hidden="true" />
      <span className="crt-screw bottom-right" aria-hidden="true" />
      <div className="crt-bezel-label">
        <span>TVA · CHRONOMONITOR</span>
        <span>R&A / TEMPORAL MODIFICATION 07</span>
      </div>
      <div className="crt-chassis">
        <div className="crt-glass">
          <div
            className="temporal-viewport"
            ref={viewport}
            tabIndex={0}
            aria-label="Esplora la linea temporale: trascina o scorri, usa Tab e le frecce tra le Terre"
            onPointerDown={(e) => {
              if (
                e.pointerType !== "mouse" ||
                (e.target as HTMLElement).closest("button")
              )
                return;
              dragging.current = {
                x: e.clientX,
                left: e.currentTarget.scrollLeft,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
              e.currentTarget.classList.add("dragging");
            }}
            onPointerMove={(e) => {
              if (dragging.current)
                e.currentTarget.scrollLeft =
                  dragging.current.left - (e.clientX - dragging.current.x);
            }}
            onPointerUp={(e) => {
              dragging.current = null;
              e.currentTarget.classList.remove("dragging");
            }}
            onPointerCancel={(e) => {
              dragging.current = null;
              e.currentTarget.classList.remove("dragging");
            }}
          >
            <div
              className="temporal-world"
              style={{ width: `${zoom * 100}%`, minWidth: `${1100 * zoom}px` }}
            >
              <canvas
                ref={canvas}
                className="temporal-canvas"
                aria-hidden="true"
              />
              {nodes.map(({ earth, x, y }) => (
                <button
                  key={earth.id}
                  className={`earth-beacon ${selected === earth.id ? "selected" : ""}`}
                  style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                  aria-label={`Esplora ${earth.designation}: ${earth.name}`}
                  aria-pressed={selected === earth.id}
                  aria-controls="earth-dossier"
                  aria-describedby={
                    hovered === earth.id ? "earth-preview" : undefined
                  }
                  data-earth-id={earth.id}
                  onMouseEnter={() => setHovered(earth.id)}
                  onMouseLeave={() =>
                    setHovered((current) =>
                      current === earth.id ? null : current,
                    )
                  }
                  onFocus={() => setHovered(earth.id)}
                  onBlur={() =>
                    setHovered((current) =>
                      current === earth.id ? null : current,
                    )
                  }
                  onClick={() => onSelect(earth)}
                  onKeyDown={(e) => {
                    if (
                      ![
                        "ArrowRight",
                        "ArrowLeft",
                        "Home",
                        "End",
                        "Escape",
                      ].includes(e.key)
                    )
                      return;
                    e.preventDefault();
                    if (e.key === "Escape") {
                      setHovered(null);
                      return;
                    }
                    const buttons = Array.from(
                      e.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>(
                        ".earth-beacon",
                      ),
                    );
                    const index = buttons.indexOf(e.currentTarget);
                    const next =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? buttons.length - 1
                          : (index +
                              (e.key === "ArrowRight" ? 1 : -1) +
                              buttons.length) %
                            buttons.length;
                    buttons[next].focus({ preventScroll: true });
                    buttons[next].scrollIntoView({
                      block: "nearest",
                      inline: "center",
                      behavior: "instant",
                    });
                  }}
                >
                  <span className="beacon-ring" aria-hidden="true" />
                  <span className="beacon-code">
                    {earth.designation.replace("Terra-", "E—")}
                  </span>
                </button>
              ))}
              {preview && (
                <div
                  id="earth-preview"
                  role="tooltip"
                  className={`earth-preview ${preview.y > 0.5 ? "above" : "below"}`}
                  style={{
                    left: previewLeft ?? `${preview.x * 100}%`,
                    top: `${preview.y * 100}%`,
                  }}
                >
                  <span>SEGNALE IDENTIFICATO</span>
                  <strong>{preview.earth.designation}</strong>
                  <b>{preview.earth.name}</b>
                  <p>{preview.earth.description}</p>
                  <small>
                    {preview.earth.titles.length} storie · Clicca per aprire il
                    dossier
                  </small>
                </div>
              )}
            </div>
          </div>
          <div className="crt-scanlines" aria-hidden="true" />
          <div className="crt-hud" aria-hidden="true">
            <span>
              SCANSIONE MULTIVERSALE<small>LA SACRA LINEA TEMPORALE</small>
            </span>
            <span className="crt-live">
              <i />
              {paused ? "IMMAGINE FERMA" : "FLUSSO TEMPORALE ATTIVO"}
            </span>
          </div>
        </div>
        <aside className="crt-hardware" aria-hidden="true">
          <div className="hardware-plaque">
            <img
              src={`${import.meta.env.BASE_URL}assets/tva-logo.svg`}
              alt=""
            />
            <span>R&A — 07</span>
          </div>
          <div className="hardware-readout">
            <small>TEMPORAL LINK</small>
            <b>{paused ? "HOLD" : "ONLINE"}</b>
            <div className="hardware-meter">
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} style={{ animationDelay: `${i * -0.27}s` }} />
              ))}
            </div>
          </div>
          <div className="hardware-dial">
            <i />
            <span>PHASE</span>
          </div>
          <div className="hardware-dial small">
            <i />
            <span>GAIN</span>
          </div>
          <div className="hardware-vents" />
          <div className="hardware-port">
            <i />
            <span>CH. 616</span>
          </div>
        </aside>
      </div>
      <div className="crt-console">
        <div className="crt-status">
          <span className={`crt-led ${paused ? "paused" : ""}`} />
          <span>{paused ? "HOLD" : "OPERATIVO"}</span>
          <div className="crt-vents" aria-hidden="true" />
        </div>
        <div className="crt-explore-controls">
          <button aria-label="Esplora a sinistra" onClick={() => pan(-270)}>
            ←
          </button>
          <span>
            <MoveHorizontal size={14} /> ESPLORA
          </span>
          <button aria-label="Esplora a destra" onClick={() => pan(270)}>
            →
          </button>
          <i />
          <button
            aria-label="Riduci ingrandimento"
            disabled={zoom <= 1}
            onClick={() => setZoom((v) => Math.max(1, v - 0.25))}
          >
            <Minus size={14} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            aria-label="Aumenta ingrandimento"
            disabled={zoom >= 1.75}
            onClick={() => setZoom((v) => Math.min(1.75, v + 0.25))}
          >
            <Plus size={14} />
          </button>
          <button
            aria-label="Centra la Terra selezionata"
            onClick={() => {
              const node = viewport.current?.querySelector<HTMLElement>(
                `[data-earth-id="${selected}"]`,
              );
              if (node)
                viewport.current!.scrollTo({
                  left: node.offsetLeft - viewport.current!.clientWidth / 2,
                  behavior: "smooth",
                });
            }}
          >
            <Crosshair size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
