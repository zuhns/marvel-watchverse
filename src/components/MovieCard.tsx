import { Check, Plus, ArrowUpRight } from "lucide-react";
import { PosterImage } from "./PosterImage";
import { labels } from "../lib/catalog";
import type { Title } from "../types";
import { useInfinity } from "./InfinityQuest";
export function MovieCard({
  title,
  index,
  seen,
  onOpen,
  onToggle,
}: {
  title: Title;
  index: number;
  seen: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const infinity = useInfinity();
  const affected = infinity.targets.has(title.id);
  const vacant = infinity.phase === "snapped" && affected;
  const dusting = infinity.phase === "dusting" && affected;
  return (
    <article
      data-infinity-title={title.id}
      inert={vacant || dusting}
      aria-hidden={vacant || undefined}
      className={`movie-card ${seen ? "seen" : ""} ${dusting ? "infinity-dusting" : ""} ${vacant ? "infinity-vacant" : ""}`}
    >
      <button
        className="poster-button"
        onClick={onOpen}
        aria-label={`Dettagli: ${title.title}`}
      >
        <PosterImage title={title} />
        <span className="card-number">{String(index).padStart(2, "0")}</span>
        <span className="card-type">{labels[title.type]}</span>
        {seen && (
          <span className="seen-badge">
            <Check size={14} /> Visto
          </span>
        )}
        <span className="poster-open">
          <ArrowUpRight /> Scopri la storia
        </span>
      </button>
      <div className="card-caption">
        <div className="card-meta">
          <span>{title.year}</span>
          <span>{title.universe}</span>
        </div>
        <h3>
          <button onClick={onOpen}>{title.title}</button>
        </h3>
        <button
          className={`watch-button ${seen ? "active" : ""}`}
          onClick={onToggle}
          disabled={title.status === "upcoming"}
          aria-label={`${seen ? "Segna da vedere" : "Segna come visto"}: ${title.title}`}
        >
          {seen ? <Check size={15} /> : <Plus size={15} />}{" "}
          {title.status === "upcoming"
            ? "In arrivo"
            : seen
              ? "Visto"
              : "Segna come visto"}
        </button>
      </div>
    </article>
  );
}
