import { useState } from "react";
import { Film } from "lucide-react";
import { posters } from "../lib/catalog";
import type { Title } from "../types";
export function PosterImage({
  title,
  priority = false,
}: {
  title: Title;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const poster = posters[title.id];
  const url = poster?.localPath
    ? `${import.meta.env.BASE_URL}${poster.localPath.replace(/^\//, "")}`
    : poster?.url;
  return (
    <div
      className={`poster-image ${loaded ? "loaded" : ""}`}
      data-poster-id={title.id}
    >
      {url && !failed ? (
        <img
          src={url}
          alt={`Locandina di ${title.title}`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="poster-fallback">
          <Film size={36} />
          <small>{title.franchise}</small>
          <strong>{title.title}</strong>
          <span>Locandina non disponibile</span>
        </div>
      )}
    </div>
  );
}
