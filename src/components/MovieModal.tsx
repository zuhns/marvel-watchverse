import { useEffect, useRef } from "react";
import {
  X,
  Check,
  Plus,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { PosterImage } from "./PosterImage";
import { titles, labels } from "../lib/catalog";
import type { Title } from "../types";
export function MovieModal({
  title,
  seen,
  toggle,
  close,
  open,
}: {
  title: Title;
  seen: boolean;
  toggle: () => void;
  close: () => void;
  open: (t: Title) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const saga = titles
    .filter((t) => t.franchise === title.franchise)
    .sort((a, b) => a.releaseOrder - b.releaseOrder);
  const n = saga.findIndex((t) => t.id === title.id);
  useEffect(() => {
    const dialog = ref.current!;
    const focused = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const nodes = [
          ...dialog.querySelectorAll<HTMLElement>(
            "button:not(:disabled),a[href]",
          ),
        ];
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    dialog.addEventListener("keydown", handle);
    document.body.style.overflow = "hidden";
    return () => {
      dialog.removeEventListener("keydown", handle);
      dialog.close();
      document.body.style.overflow = "";
      focused?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="movie-modal"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      aria-labelledby="modal-title"
    >
      <button
        className="modal-close icon-button"
        onClick={close}
        aria-label="Chiudi dettagli"
      >
        <X />
      </button>
      <div className="modal-content">
        <PosterImage key={title.id} title={title} priority />
        <div className="modal-copy">
          <div className="eyebrow">
            {title.universe} / {labels[title.type]}
          </div>
          <h2 id="modal-title">{title.title}</h2>
          <p className="original-title">
            {title.originalTitle}
            {title.season ? ` · Stagione ${title.season}` : ""}
          </p>
          <div className="detail-tags">
            <span>{title.year}</span>
            <span>
              {new Date(`${title.releaseDate}T12:00:00`).toLocaleDateString(
                "it-IT",
              )}
            </span>
            {title.runtime && <span>{title.runtime} min</span>}
            <span>
              {title.status === "upcoming" ? "In arrivo" : "Pubblicato"}
            </span>
          </div>
          <p>
            {title.synopsis ||
              "Consulta la fonte collegata per la sinossi e i dettagli di questa produzione."}
          </p>
          <dl>
            <div>
              <dt>Franchise</dt>
              <dd>{title.franchise}</dd>
            </div>
            <div>
              <dt>Continuità</dt>
              <dd>{title.continuity}</dd>
            </div>
            <div>
              <dt>Timeline</dt>
              <dd>{title.timelineGroup}</dd>
            </div>
          </dl>
          <p className="continuity-note">
            {title.chronologyNotes ||
              "Ordine interno editoriale; non indica una cronologia canonica globale."}
          </p>
          {title.notes && <p className="continuity-note">{title.notes}</p>}
          <div className="positions">
            <span>
              Uscita <b>#{title.releaseOrder}</b>
            </span>
            <span>
              Cronologia{" "}
              <b>
                {title.chronologicalOrder
                  ? `#${title.chronologicalOrder}`
                  : "Incerta"}
              </b>
            </span>
            <span>
              Consigliato <b>#{title.recommendedOrder}</b>
            </span>
          </div>
          <button
            className="button primary"
            disabled={title.status === "upcoming"}
            onClick={toggle}
          >
            {seen ? <Check size={17} /> : <Plus size={17} />}{" "}
            {seen ? "Visto · Segna da vedere" : "Segna come visto"}
          </button>
          <a
            className="source-link"
            href={title.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Fonte dei metadati <ExternalLink size={13} />
          </a>
          <div className="saga-navigation">
            {saga[n - 1] && (
              <button onClick={() => open(saga[n - 1])}>
                <ArrowLeft size={16} />
                <span>
                  <small>Precedente nella saga</small>
                  {saga[n - 1].title}
                </span>
              </button>
            )}
            {saga[n + 1] && (
              <button onClick={() => open(saga[n + 1])}>
                <span>
                  <small>Successivo nella saga</small>
                  {saga[n + 1].title}
                </span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
