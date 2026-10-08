import { useEffect, useState } from "react";
import { loadState, saveState, mergeWatched } from "../lib/storage";
import type { Preferences, Watched, Backup } from "../types";
export function useTracker() {
  const [initial] = useState(() => loadState(localStorage));
  const [watched, setWatched] = useState<Watched>(initial.watched);
  const [preferences, setPreferences] = useState<Preferences>(
    initial.preferences,
  );
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    try {
      saveState(localStorage, watched, preferences);
      setStorageError("");
    } catch {
      setStorageError(
        "Il browser non consente il salvataggio. Esporta un backup per conservare i progressi.",
      );
    }
  }, [watched, preferences]);
  const toggle = (id: string) =>
    setWatched((w) => {
      if (w[id])
        return Object.fromEntries(Object.entries(w).filter(([k]) => k !== id));
      return { ...w, [id]: { watchedAt: new Date().toISOString() } };
    });
  const restore = (b: Backup) => {
    setWatched((w) => mergeWatched(w, b.watched));
    setPreferences(b.preferences);
  };
  return {
    watched,
    preferences,
    setPreferences,
    toggle,
    restore,
    setWatched,
    storageError,
  };
}
