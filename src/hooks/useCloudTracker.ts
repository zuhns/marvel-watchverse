import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import {
  loadState,
  saveState,
  mergeWatched,
  STORAGE_KEY,
} from "../lib/storage";
import { readProfile, rememberProfile } from "../lib/profile";
import {
  syncProgress,
  reconcileCloud,
  ackPending,
  cloudConfigured,
  type ProgressChange,
} from "../lib/cloud";
import type { Preferences, Watched, Backup } from "../types";
import type { SyncStatus } from "../components/ProfilePanel";
const pendingKey = (username: string) =>
  `marvel-watchverse.pending.${username}`;
const linkedKey = (username: string) => `marvel-watchverse.linked.${username}`;
function loadPending(username: string | null): Record<string, ProgressChange> {
  try {
    const raw = username ? localStorage.getItem(pendingKey(username)) : null;
    const changes = raw ? JSON.parse(raw) : {};
    if (!changes || typeof changes !== "object" || Array.isArray(changes))
      return {};
    for (const c of Object.values(changes) as ProgressChange[])
      if (
        !c ||
        typeof c.id !== "string" ||
        !Number.isFinite(Date.parse(c.changedAt)) ||
        (c.watchedAt !== null && !Number.isFinite(Date.parse(c.watchedAt)))
      )
        return {};
    return changes;
  } catch {
    return {};
  }
}
export function useTracker(
  scope: { marathonId?: string; username?: string | null } = {},
) {
  const scopeSuffix = scope.marathonId ? `.marathon.${scope.marathonId}` : "";
  const storage = {
    getItem: (key: string) =>
      localStorage.getItem(key === STORAGE_KEY ? key + scopeSuffix : key),
    setItem: (key: string, value: string) =>
      localStorage.setItem(
        key === STORAGE_KEY ? key + scopeSuffix : key,
        value,
      ),
  };
  const [initial] = useState(() => loadState(storage));
  const [username, setUsername] = useState(
    () => scope.username ?? readProfile(localStorage),
  );
  const profileKey = username ? username + scopeSuffix : null;
  const [watched, setWatchedState] = useState<Watched>(initial.watched);
  const watchedRef = useRef(watched);
  const pendingRef = useRef(loadPending(profileKey));
  const [pendingCount, setPendingCount] = useState(
    Object.keys(pendingRef.current).length,
  );
  const [preferences, setPreferences] = useState<Preferences>(
    initial.preferences,
  );
  const [storageError, setStorageError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    cloudConfigured ? "local" : "unconfigured",
  );
  const [changes, setChanges] = useState(0);
  const inFlight = useRef(false);
  const retryNeeded = useRef(false);
  const lastChange = useRef(0);
  const persistPending = useCallback(() => {
    setPendingCount(Object.keys(pendingRef.current).length);
    if (username) {
      try {
        localStorage.setItem(
          pendingKey(profileKey!),
          JSON.stringify(pendingRef.current),
        );
      } catch {
        setStorageError(
          "Il browser non consente il salvataggio. Esporta un backup per conservare i progressi.",
        );
      }
    }
  }, [username, profileKey]);
  useEffect(() => {
    try {
      saveState(storage, watched, preferences);
      setStorageError("");
    } catch {
      setStorageError(
        "Il browser non consente il salvataggio. Esporta un backup per conservare i progressi.",
      );
    }
  }, [watched, preferences]);
  const sync = useCallback(async () => {
    if (!username || !cloudConfigured) return;
    if (inFlight.current) {
      retryNeeded.current = true;
      return;
    }
    inFlight.current = true;
    setSyncStatus("syncing");
    setSyncError("");
    let success = false;
    try {
      let rows;
      const linked = localStorage.getItem(linkedKey(profileKey!)) === "true";
      if (!linked) {
        rows = await syncProgress(username, [], undefined, scope.marathonId);
        const existing = new Set(rows.map((r) => r.title_id));
        for (const [id, v] of Object.entries(watchedRef.current))
          if (!scope.marathonId && !existing.has(id) && !pendingRef.current[id])
            pendingRef.current[id] = {
              id,
              watchedAt: v.watchedAt,
              changedAt: new Date().toISOString(),
            };
        persistPending();
        lastChange.current = Math.max(
          lastChange.current,
          ...Object.values(pendingRef.current).map((c) =>
            Date.parse(c.changedAt),
          ),
        );
      }
      const sent = Object.values(pendingRef.current);
      if (linked || sent.length)
        rows = await syncProgress(username, sent, undefined, scope.marathonId);
      pendingRef.current = ackPending(pendingRef.current, sent);
      const next = reconcileCloud(rows ?? [], pendingRef.current);
      watchedRef.current = next;
      setWatchedState(next);
      persistPending();
      localStorage.setItem(linkedKey(profileKey!), "true");
      setSyncStatus(
        Object.keys(pendingRef.current).length ? "syncing" : "synced",
      );
      success = true;
    } catch (e) {
      setSyncStatus(navigator.onLine ? "error" : "offline");
      setSyncError(
        e instanceof Error ? e.message : "Sincronizzazione non riuscita.",
      );
    } finally {
      inFlight.current = false;
      if (
        success &&
        (retryNeeded.current || Object.keys(pendingRef.current).length)
      ) {
        retryNeeded.current = false;
        setChanges((n) => n + 1);
      }
    }
  }, [username, persistPending, profileKey, scope.marathonId]);
  const setWatched = useCallback(
    (action: SetStateAction<Watched>) => {
      const current = watchedRef.current;
      const next = typeof action === "function" ? action(current) : action;
      const changedAt = new Date(
        Math.max(Date.now(), lastChange.current + 1),
      ).toISOString();
      lastChange.current = Date.parse(changedAt);
      if (username)
        for (const id of new Set([
          ...Object.keys(current),
          ...Object.keys(next),
        ]))
          if (current[id]?.watchedAt !== next[id]?.watchedAt)
            pendingRef.current[id] = {
              id,
              watchedAt: next[id]?.watchedAt ?? null,
              changedAt,
            };
      watchedRef.current = next;
      setWatchedState(next);
      persistPending();
      setChanges((n) => n + 1);
    },
    [username, persistPending],
  );
  useEffect(() => {
    if (username && cloudConfigured) {
      const timer = setTimeout(() => void sync(), 500);
      return () => clearTimeout(timer);
    }
  }, [changes, username, sync]);
  useEffect(() => {
    if (!username || !cloudConfigured) return;
    const visible = () => {
      if (document.visibilityState === "visible" && navigator.onLine)
        void sync();
    };
    const online = () => void sync();
    window.addEventListener("online", online);
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    const timer = setInterval(visible, 15000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", online);
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [username, sync]);
  const saveUsername = (name: string) => {
    const saved = rememberProfile(localStorage, name);
    if (!username) {
      pendingRef.current = loadPending(saved);
      setUsername(saved);
      setPendingCount(Object.keys(pendingRef.current).length);
    }
  };
  const toggle = (id: string) =>
    setWatched((w) =>
      w[id]
        ? Object.fromEntries(Object.entries(w).filter(([k]) => k !== id))
        : { ...w, [id]: { watchedAt: new Date().toISOString() } },
    );
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
    username,
    saveUsername,
    syncStatus,
    syncError,
    pendingCount,
    sync,
  };
}
