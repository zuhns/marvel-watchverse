import { SacredTimeline } from "../components/SacredTimeline";
import { earths, type Earth } from "../lib/multiverse";
import type { Title, Watched } from "../types";
export function Universes({
  watched,
  open,
  toggle,
  explore,
}: {
  watched: Watched;
  open: (t: Title) => void;
  toggle: (id: string) => void;
  explore: (earth: Earth) => void;
}) {
  return (
    <section className="page-section multiverse-page">
      <div className="multiverse-page-heading">
        <div>
          <div className="eyebrow">OLTRE LA SACRA LINEA TEMPORALE</div>
          <h1 className="page-title">
            OGNI TERRA.
            <br />
            <span>UNA NUOVA STORIA.</span>
          </h1>
        </div>
        <div className="multiverse-head-count">
          <strong>{earths.length}</strong>
          <span>
            REALTÀ & DOSSIER
            <br />
            UN SOLO MULTIVERSO
          </span>
        </div>
      </div>
      <p className="page-intro">
        Segui il filo. Esplora le ramificazioni. Seleziona una Terra per
        scoprire i film, le serie e le connessioni che le appartengono.
      </p>
      <SacredTimeline
        watched={watched}
        open={open}
        toggle={toggle}
        explore={explore}
      />
      <p className="multiverse-editorial-note">
        Atlante narrativo fan-made ispirato a Loki. Le ramificazioni
        visualizzano percorsi da esplorare, non origini canoniche condivise.
        Ogni dossier distingue i numeri mostrati nei film dalle designazioni di
        repertorio e dalle realtà non confermate.
      </p>
    </section>
  );
}
