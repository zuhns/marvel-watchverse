import { useState } from "react";
import {
  UserRound,
  Cloud,
  CloudOff,
  RefreshCw,
  LockKeyhole,
} from "lucide-react";
export type SyncStatus =
  | "unconfigured"
  | "local"
  | "syncing"
  | "synced"
  | "offline"
  | "error";
export function ProfilePanel({
  username,
  status,
  pending,
  error,
  onSave,
  onRetry,
}: {
  username: string | null;
  status: SyncStatus;
  pending: number;
  error: string;
  onSave: (name: string) => void;
  onRetry: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [validation, setValidation] = useState("");
  return (
    <section className="profile-panel" aria-labelledby="profile-heading">
      <div className="eyebrow">
        <UserRound size={16} />
        IL TUO PROFILO
      </div>
      <h2 id="profile-heading">
        {username ? `Ciao, ${username}.` : "Un nome. Tutti i tuoi dispositivi."}
      </h2>
      {username ? (
        <>
          <p>
            <LockKeyhole size={14} />
            Questo dispositivo ricorda il tuo nome utente. Su un altro
            dispositivo inserisci lo stesso nome.
          </p>
          <div className={`sync-status sync-${status}`} role="status">
            {status === "synced" ? (
              <Cloud size={16} />
            ) : status === "syncing" ? (
              <RefreshCw size={16} />
            ) : (
              <CloudOff size={16} />
            )}
            <span>
              {status === "synced"
                ? "Progressi sincronizzati"
                : status === "syncing"
                  ? "Sincronizzazione in corso…"
                  : status === "unconfigured"
                    ? "Profilo salvato sul dispositivo · cloud da attivare"
                    : status === "offline"
                      ? "Sei offline · i cambiamenti saranno sincronizzati al ritorno della connessione"
                      : status === "error"
                        ? "Progressi locali conservati · sincronizzazione da riprovare"
                        : "Progressi salvati sul dispositivo"}
              {pending > 0 && ` · modifiche in attesa: ${pending}`}
            </span>
            {status !== "unconfigured" && (
              <button
                onClick={onRetry}
                disabled={status === "syncing"}
                aria-label="Sincronizza ora"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
          {error && <p className="profile-error">{error}</p>}
        </>
      ) : (
        <>
          <p>
            Inserisci il nome che userai sempre. Viene ricordato qui; non
            servono email né password. Chi conosce il nome può accedere allo
            stesso profilo.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                onSave(draft);
                setValidation("");
              } catch (e) {
                setValidation(
                  e instanceof Error ? e.message : "Nome non valido.",
                );
              }
            }}
          >
            <label>
              <span className="sr-only">Nome utente</span>
              <input
                aria-label="Nome utente"
                autoComplete="username"
                minLength={3}
                maxLength={32}
                required
                placeholder="Il tuo nome utente"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
            <button className="button primary" type="submit">
              Salva il mio nome
            </button>
          </form>
          {validation && (
            <p className="profile-error" role="alert">
              {validation}
            </p>
          )}
          <small>
            Il nome resta associato a questo browser. I tuoi progressi già
            presenti vengono conservati.
          </small>
        </>
      )}
    </section>
  );
}
