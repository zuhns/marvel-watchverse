import { useEffect, useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import type { Title } from "../types";
import {
  safeWebUrl,
  streamingKey,
  streamingSearch,
  platformDestination,
  type StreamingDataset,
  type StreamingEntry,
  type OfferKind,
} from "../lib/streaming";
let dataset: Promise<StreamingDataset> | undefined;
function loadDataset() {
  return (dataset ||= fetch(
    `${import.meta.env.BASE_URL}data/streaming-it.json`,
    { cache: "no-cache" },
  )
    .then(async (response) => {
      if (!response.ok) throw new Error("Disponibilità non raggiungibili");
      const data = await response.json();
      if (data.country !== "IT" || !data.entries)
        throw new Error("Dati non validi");
      return data as StreamingDataset;
    })
    .catch((error) => {
      dataset = undefined;
      throw error;
    }));
}
const groups: [OfferKind[], string][] = [
  [["FLATRATE"], "In abbonamento"],
  [["FREE", "ADS"], "Gratis / con pubblicità"],
  [["RENT"], "Noleggio"],
  [["BUY"], "Acquisto"],
];
export function WatchAvailability({ title }: { title: Title }) {
  const [entry, setEntry] = useState<StreamingEntry | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    loadDataset()
      .then((data) => {
        if (active) setEntry(data.entries[streamingKey(title)] || null);
      })
      .catch(() => {
        /* Keep a usable JustWatch search when a refresh is unavailable. */
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [title]);
  const checked = entry?.checkedAt ? new Date(entry.checkedAt) : null;
  const stale = checked && Date.now() - checked.getTime() > 3 * 86400000;
  const source =
    safeWebUrl(entry?.source) || streamingSearch(title.originalTitle);
  const offers = entry?.offers.filter((offer) => safeWebUrl(offer.url)) || [];
  return (
    <section
      className="watch-availability"
      aria-labelledby="watch-heading"
      aria-busy={loading}
    >
      <div className="watch-heading">
        <h3 id="watch-heading">
          <Play size={16} /> Dove guardarlo
        </h3>
        <span>ITALIA</span>
      </div>
      {loading ? (
        <p className="watch-message" role="status">
          Verifico le piattaforme…
        </p>
      ) : (
        <>
          {title.status === "upcoming" ? (
            <p className="watch-message">
              Disponibilità streaming da confermare dopo l’uscita.
            </p>
          ) : offers.length ? (
            <>
              {groups.map(([kinds, label]) => {
                const matches = offers.filter((offer) =>
                  kinds.includes(offer.kind),
                );
                return matches.length ? (
                  <div className="watch-group" key={label}>
                    <h4>{label}</h4>
                    <div className="watch-providers">
                      {matches.map((offer) => (
                        <a
                          key={`${offer.providerId}:${offer.kind}`}
                          className="watch-provider"
                          href={platformDestination(offer.url, source)}
                          aria-label={`${offer.provider} · ${label} · Apri ${title.originalTitle}`}
                          title={
                            platformDestination(offer.url, source) === offer.url
                              ? `Apri ${title.originalTitle} su ${offer.provider}`
                              : `Consulta le offerte di ${offer.provider} su JustWatch`
                          }
                        >
                          <span className="provider-icon">
                            {offer.icon && safeWebUrl(offer.icon) ? (
                              <img
                                src={offer.icon}
                                alt=""
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.hidden = true;
                                }}
                              />
                            ) : null}
                            <span aria-hidden="true">
                              {offer.provider.slice(0, 2)}
                            </span>
                          </span>
                          <span className="provider-copy">
                            <b>{offer.provider}</b>
                            <small>
                              {offer.price !== null &&
                              ["RENT", "BUY"].includes(offer.kind)
                                ? `da ${new Intl.NumberFormat("it-IT", { style: "currency", currency: /^[A-Z]{3}$/.test(offer.currency) ? offer.currency : "EUR" }).format(offer.price)}`
                                : offer.kind === "ADS"
                                  ? "Con pubblicità"
                                  : offer.qualities.join(" · ") || "Streaming"}
                            </small>
                          </span>
                          <ExternalLink size={12} />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null;
              })}
              <p className="watch-hint">
                Apri il titolo sulla piattaforma; sui dispositivi compatibili,
                nell’app.
                {entry?.scope === "show"
                  ? " Dati della serie: le singole stagioni possono variare."
                  : ""}
              </p>
            </>
          ) : (
            <p className="watch-message">
              {entry?.status === "no_offers"
                ? "Nessuna offerta streaming segnalata in Italia al momento del controllo."
                : "Disponibilità non confermata: consulta la ricerca su JustWatch."}
            </p>
          )}
        </>
      )}
      <div className="watch-source">
        <a href={source} target="_blank" rel="noreferrer">
          Dati JustWatch <ExternalLink size={12} />
        </a>
        {checked && (
          <span>
            {stale ? "Ultimo controllo" : "Verificato"}{" "}
            {checked.toLocaleDateString("it-IT")}
          </span>
        )}
      </div>
      {stale && (
        <p className="watch-hint">
          Il catalogo potrebbe essere cambiato: verifica le offerte su
          JustWatch.
        </p>
      )}
    </section>
  );
}
