import { useCallback, useEffect, useRef, useState } from "react";
import {
  UsersRound,
  Clapperboard,
  UserPlus,
  RefreshCw,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { cloudConfigured, watchedFromRows } from "../lib/cloud";
import {
  socialRequest,
  type SocialData,
  type Marathon,
  type FriendProgress,
} from "../lib/social";
import { validateUsername } from "../lib/profile";
import { titles, stats, labels, normalize, sortTitles } from "../lib/catalog";
import { StatsPanel, ProgressBar } from "../components/StatsPanel";
import { PosterImage } from "../components/PosterImage";

export function Social({
  username,
  onLogin,
  openMarathon,
}: {
  username: string | null;
  onLogin: () => void;
  openMarathon: (marathon: Marathon) => void;
}) {
  const [data, setData] = useState<SocialData>({ friends: [], marathons: [] });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [friend, setFriend] = useState("");
  const [partner, setPartner] = useState("");
  const [name, setName] = useState("");
  const [view, setView] = useState<FriendProgress | null>(null);
  const [search, setSearch] = useState("");
  const [state, setState] = useState("seen");
  const [limit, setLimit] = useState(30);
  const viewSequence = useRef(0);
  const refresh = useCallback(async () => {
    if (!username || !cloudConfigured) return;
    try {
      setData(await socialRequest(username));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Servizio non disponibile.");
    }
  }, [username]);
  useEffect(() => {
    void refresh();
    const visible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(visible, 15000);
    window.addEventListener("focus", visible);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", visible);
    };
  }, [refresh]);
  async function action(
    action: string,
    values: { friend?: string; name?: string; marathonId?: string },
  ) {
    if (!username) return;
    setBusy(true);
    setError("");
    try {
      setData(await socialRequest(username, action, values));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operazione non riuscita.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function showFriend(friend: string) {
    const sequence = ++viewSequence.current;
    setBusy(true);
    setError("");
    try {
      const result = await socialRequest<FriendProgress>(
        username!,
        "friend_view",
        { friend },
      );
      if (sequence === viewSequence.current) {
        setView(result);
        setSearch("");
        setState("seen");
        setLimit(30);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profilo non disponibile.");
    } finally {
      setBusy(false);
    }
  }
  const watched = view ? watchedFromRows(view.progress) : {};
  const filtered = sortTitles(titles, "release").filter(
    (t) =>
      (state === "all" ||
        (state === "seen" ? !!watched[t.id] : !watched[t.id])) &&
      normalize(`${t.title} ${t.originalTitle} ${t.universe}`).includes(
        normalize(search),
      ),
  );
  return (
    <section className="page-section social-page">
      <div className="eyebrow">LE STORIE SI CONDIVIDONO</div>
      <h1 className="page-title">
        IL TUO <span>TEAM.</span>
      </h1>
      <p className="page-intro">
        Ritrova gli amici per nome e comincia una nuova maratona insieme. Il
        percorso condiviso ha progressi propri, a partire da zero.
      </p>
      {!username ? (
        <div className="social-empty">
          <UsersRound size={30} />
          <h2>Entra nel tuo team.</h2>
          <p>
            Accedi con il tuo nome utente per aggiungere amici e ricevere
            inviti.
          </p>
          <button className="button primary" onClick={onLogin}>
            Accedi con nome utente
          </button>
        </div>
      ) : !cloudConfigured ? (
        <p className="social-empty">
          Il servizio cloud deve ancora essere attivato.
        </p>
      ) : (
        <>
          {error && (
            <p className="social-error" role="alert">
              {error}
            </p>
          )}
          <div className="social-columns">
            <section className="social-panel" aria-labelledby="friends-heading">
              <div className="social-heading">
                <h2 id="friends-heading">
                  <UsersRound size={22} /> Amici
                </h2>
                <button
                  className="icon-button"
                  aria-label="Aggiorna amici e inviti"
                  disabled={busy}
                  onClick={() => void refresh()}
                >
                  <RefreshCw size={17} />
                </button>
              </div>
              <p>
                Inserisci il nome esatto di un profilo già creato. I suoi
                progressi si aprono in sola lettura.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    if (
                      await action("friend_add", {
                        friend: validateUsername(friend),
                      })
                    )
                      setFriend("");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <input
                  aria-label="Nome utente amico"
                  value={friend}
                  onChange={(e) => setFriend(e.target.value)}
                  placeholder="Nome utente dell’amico"
                  minLength={3}
                  maxLength={32}
                  required
                />
                <button className="button primary" disabled={busy}>
                  <UserPlus size={16} /> Aggiungi amico
                </button>
              </form>
              <div className="friend-list">
                {data.friends.length ? (
                  data.friends.map((friend) => (
                    <div className="friend-row" key={friend}>
                      <button
                        className={view?.username === friend ? "active" : ""}
                        disabled={busy}
                        onClick={() => void showFriend(friend)}
                        aria-label={`Vedi progressi di ${friend}`}
                      >
                        <span className="user-avatar">
                          {friend[0].toUpperCase()}
                        </span>
                        <strong>{friend}</strong>
                        <ArrowRight size={17} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Rimuovi amico ${friend}`}
                        disabled={busy}
                        onClick={async () => {
                          if (await action("friend_remove", { friend }))
                            if (view?.username === friend) setView(null);
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="muted">
                    Il tuo primo compagno di viaggio ti aspetta.
                  </p>
                )}
              </div>
            </section>
            <section
              className="social-panel"
              aria-labelledby="marathons-heading"
            >
              <h2 id="marathons-heading">
                <Clapperboard size={23} /> Maratone
              </h2>
              <p>
                Crea un percorso comune e invita una persona. Quando accetta,
                potrete segnare i titoli visti insieme.
              </p>
              <form
                className="marathon-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    if (
                      await action("marathon_create", {
                        friend: validateUsername(partner),
                        name: name.trim(),
                      })
                    ) {
                      setPartner("");
                      setName("");
                    }
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <input
                  aria-label="Nome della maratona"
                  placeholder="La nostra saga"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={3}
                  maxLength={60}
                  required
                />
                <input
                  aria-label="Nome utente da invitare"
                  placeholder="Nome utente da invitare"
                  value={partner}
                  onChange={(e) => setPartner(e.target.value)}
                  minLength={3}
                  maxLength={32}
                  list="friend-names"
                  required
                />
                <datalist id="friend-names">
                  {data.friends.map((friend) => (
                    <option key={friend} value={friend} />
                  ))}
                </datalist>
                <button className="button primary" disabled={busy}>
                  Crea e invia invito <ArrowRight size={16} />
                </button>
              </form>
              <div className="marathon-list">
                {data.marathons.length ? (
                  data.marathons.map((m) => (
                    <article className="marathon-card" key={m.id}>
                      <span className="eyebrow">
                        {m.status === "invited"
                          ? `INVITO DA ${m.owner}`
                          : "PERCORSO CONDIVISO"}
                      </span>
                      <h3>{m.name}</h3>
                      <p>
                        {m.members
                          .map(
                            (member) =>
                              `${member.username}${member.status === "invited" ? " · in attesa" : ""}`,
                          )
                          .join(" + ")}
                      </p>
                      {m.status === "invited" ? (
                        <div className="marathon-actions">
                          <button
                            className="button primary"
                            disabled={busy}
                            onClick={() =>
                              void action("marathon_accept", {
                                marathonId: m.id,
                              })
                            }
                          >
                            <Check size={16} /> Accetta invito
                          </button>
                          <button
                            className="button secondary"
                            disabled={busy}
                            onClick={() =>
                              void action("marathon_decline", {
                                marathonId: m.id,
                              })
                            }
                          >
                            Rifiuta
                          </button>
                        </div>
                      ) : (
                        <>
                          <p>
                            {m.seen}{" "}
                            {m.seen === 1 ? "titolo visto" : "titoli visti"}{" "}
                            insieme
                          </p>
                          <button
                            className="button secondary"
                            onClick={() => openMarathon(m)}
                          >
                            Apri maratona <ArrowRight size={16} />
                          </button>
                        </>
                      )}
                    </article>
                  ))
                ) : (
                  <p className="muted">
                    Nessuna maratona ancora. Il primo capitolo è da scegliere
                    insieme.
                  </p>
                )}
              </div>
            </section>
          </div>
          {view && (
            <section
              className="friend-progress"
              aria-labelledby="friend-progress-heading"
            >
              <div className="eyebrow">PROFILO AMICO · SOLA LETTURA</div>
              <h2 id="friend-progress-heading">
                Il Watchverse di {view.username}.
              </h2>
              <button
                className="text-link"
                disabled={busy}
                onClick={() => void showFriend(view.username)}
              >
                <RefreshCw size={15} /> Aggiorna progressi
              </button>
              <StatsPanel titles={titles} watched={watched} />
              <details>
                <summary>Progressi per universo</summary>
                <div className="progress-universes">
                  {[...new Set(titles.map((t) => t.universe))].map((u) => {
                    const s = stats(
                      titles.filter((t) => t.universe === u),
                      watched,
                    );
                    return (
                      <div key={u}>
                        <div className="progress-label">
                          <strong>{u}</strong>
                          <span>
                            {s.seen}/{s.total} · {s.percent}%
                          </span>
                        </div>
                        <ProgressBar percent={s.percent} />
                      </div>
                    );
                  })}
                </div>
              </details>
              <div className="friend-filters">
                <input
                  aria-label="Cerca nel profilo amico"
                  placeholder="Cerca tra le sue storie…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setLimit(30);
                  }}
                />
                <select
                  aria-label="Stato nel profilo amico"
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    setLimit(30);
                  }}
                >
                  <option value="seen">Visti</option>
                  <option value="unseen">Da vedere</option>
                  <option value="all">Tutti</option>
                </select>
              </div>
              <div className="friend-titles">
                {filtered.slice(0, limit).map((t) => (
                  <article className="friend-title" key={t.id}>
                    <PosterImage title={t} />
                    <div>
                      <h3>{t.title}</h3>
                      <p>
                        {t.year} · {labels[t.type]}
                      </p>
                      <span>
                        {watched[t.id] ? "Visto" : "Da vedere"}
                        {watched[t.id] &&
                          ` · ${new Date(watched[t.id].watchedAt).toLocaleDateString("it-IT")}`}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
              {!filtered.length && (
                <p className="muted">Nessun titolo in questa selezione.</p>
              )}
              {filtered.length > limit && (
                <button
                  className="button secondary"
                  onClick={() => setLimit((n) => n + 30)}
                >
                  Mostra altre storie
                </button>
              )}
            </section>
          )}
        </>
      )}
    </section>
  );
}
