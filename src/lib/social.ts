import { syncURL, type CloudRow } from "./cloud";
export interface Marathon {
  id: string;
  name: string;
  owner: string;
  status: "invited" | "accepted";
  seen: number;
  members: { username: string; status: "invited" | "accepted" }[];
}
export interface SocialData {
  friends: string[];
  marathons: Marathon[];
}
export async function socialRequest<T = SocialData>(
  username: string,
  action = "social",
  values: { friend?: string; name?: string; marathonId?: string } = {},
): Promise<T> {
  if (!syncURL) throw Error("Il servizio cloud deve ancora essere attivato.");
  const response = await fetch(syncURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, action, ...values }),
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json();
  if (!response.ok)
    throw Error(
      body.error === "Sync unavailable"
        ? "Il servizio non risponde. Riprova tra poco."
        : body.error === "Invalid request"
          ? "Controlla il nome e i dati inseriti."
          : (body.error ?? "Richiesta non riuscita."),
    );
  return body as T;
}
export type FriendProgress = { username: string; progress: CloudRow[] };
