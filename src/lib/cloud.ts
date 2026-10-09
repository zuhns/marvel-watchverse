import type { Watched } from "../types";
export interface ProgressChange {
  id: string;
  watchedAt: string | null;
  changedAt: string;
}
export interface CloudRow {
  title_id: string;
  watched_at: string | null;
  updated_at: string;
}
export const syncURL = import.meta.env.VITE_SYNC_URL as string | undefined;
export const cloudConfigured = Boolean(syncURL);
export async function syncProgress(
  username: string,
  changes: ProgressChange[] = [],
  url = syncURL,
): Promise<CloudRow[]> {
  if (!url)
    throw Error("La sincronizzazione cloud deve ancora essere attivata.");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, changes }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw Error(
      response.status === 429
        ? "Troppi tentativi. Riprova tra poco."
        : "Sincronizzazione non riuscita. I progressi restano salvati sul dispositivo.",
    );
  const body = await response.json();
  if (
    !Array.isArray(body.progress) ||
    body.progress.some(
      (r: CloudRow) =>
        typeof r.title_id !== "string" ||
        !Number.isFinite(Date.parse(r.updated_at)) ||
        (r.watched_at !== null && !Number.isFinite(Date.parse(r.watched_at))),
    )
  )
    throw Error(
      "Risposta cloud non valida. I tuoi dati locali sono conservati.",
    );
  return body.progress;
}
export function watchedFromRows(rows: CloudRow[]): Watched {
  return Object.fromEntries(
    rows
      .filter((r) => r.watched_at !== null)
      .map((r) => [r.title_id, { watchedAt: r.watched_at! }]),
  );
}
export function reconcileCloud(
  rows: CloudRow[],
  pending: Record<string, ProgressChange>,
): Watched {
  const result = watchedFromRows(rows);
  for (const change of Object.values(pending)) {
    if (change.watchedAt === null) delete result[change.id];
    else result[change.id] = { watchedAt: change.watchedAt };
  }
  return result;
}
export function ackPending(
  pending: Record<string, ProgressChange>,
  sent: ProgressChange[],
) {
  const result = { ...pending };
  for (const change of sent)
    if (
      result[change.id]?.changedAt === change.changedAt &&
      result[change.id]?.watchedAt === change.watchedAt
    )
      delete result[change.id];
  return result;
}
