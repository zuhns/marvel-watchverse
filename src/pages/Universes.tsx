import { SacredTimeline } from "../components/SacredTimeline";
import { confirmedEarths, type Earth } from "../lib/multiverse";
import type { Title, Watched } from "../types";
import "../styles/tva.css";
import { Gem } from "../components/InfinityQuest";
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
    <section className="tva-page">
      <div className="tva-page-inner">
        <header className="tva-page-heading">
          <div className="tva-wordmark" aria-label="Time Variance Authority">
            <img
              className="tva-official-logo"
              src={`${import.meta.env.BASE_URL}assets/tva-logo.svg`}
              alt="TVA"
            />
            <span>
              TIME VARIANCE
              <br />
              AUTHORITY
            </span>
          </div>
          <div className="tva-file-stamp">
            <Gem id="power" className="gem-tva" />
            <span>DIVISIONE OSSERVAZIONE</span>
            <b>TERMINALE 07</b>
            <small>{confirmedEarths.length} TERRE IDENTIFICATE</small>
          </div>
        </header>
        <div className="tva-page-intro">
          <div>
            <span className="tva-kicker">
              ARCHIVIO DELLE REALTÀ / ACCESSO AUTORIZZATO
            </span>
            <h1>
              FOR ALL TIME.
              <br />
              <em>ALWAYS.</em>
            </h1>
          </div>
          <p>
            Il tempo scorre. Le realtà si ramificano.
            <br />
            Esplora il flusso, sfiora un segnale e scopri la sua Terra.
          </p>
        </div>
        <SacredTimeline
          watched={watched}
          open={open}
          toggle={toggle}
          explore={explore}
        />
        <div className="tva-closing-strip">
          <span>PER OGNI TEMPO. SEMPRE.</span>
          <p>
            Interfaccia fan-made ispirata alla TVA. Solo Terre numerate con una
            fonte; i dossier distinguono identificazioni sullo schermo e numeri
            di repertorio. Il flusso visualizza connessioni narrative.
          </p>
          <b>TVA / WV—07</b>
        </div>
      </div>
    </section>
  );
}
