export const PROFILE_KEY = "marvel-watchverse.profile.v1";
export const normalizeUsername = (name: string) => name.trim().toLowerCase();
export function validateUsername(name: string) {
  const username = normalizeUsername(name);
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username))
    throw Error("Usa 3–32 lettere, numeri, punti o trattini, senza spazi.");
  return username;
}
export function readProfile(storage: Pick<Storage, "getItem">): string | null {
  try {
    const name = storage.getItem(PROFILE_KEY);
    return name ? validateUsername(name) : null;
  } catch {
    return null;
  }
}
export function rememberProfile(
  storage: Pick<Storage, "getItem" | "setItem">,
  name: string,
) {
  const username = validateUsername(name);
  const existing = readProfile(storage);
  if (existing && existing !== username)
    throw Error("Questo dispositivo è già associato al tuo nome utente.");
  storage.setItem(PROFILE_KEY, username);
  return username;
}
