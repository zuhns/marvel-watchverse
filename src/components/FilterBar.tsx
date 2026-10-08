import { Search, RotateCcw, SlidersHorizontal } from "lucide-react";
import { titles, defaults, labels } from "../lib/catalog";
import type { Preferences } from "../types";
export const categories = [
  "Tutti",
  "MCU",
  "X-Men",
  "Spider-Man",
  "Sony / Venom",
  "Spider-Verse",
  "Fantastic Four",
  "Defenders",
  "Marvel Television",
  "Legacy",
  "Animazione",
];
export function FilterBar({
  p,
  change,
}: {
  p: Preferences;
  change: (p: Preferences) => void;
}) {
  const set = (k: keyof Preferences, v: string) => change({ ...p, [k]: v });
  return (
    <div className="filter-bar">
      <div className="search-row">
        <label className="search-box">
          <Search size={19} />
          <input
            aria-label="Cerca titoli"
            placeholder="Cerca un titolo, un eroe, un universo…"
            value={p.search}
            onChange={(e) => set("search", e.target.value)}
          />
          <kbd>/</kbd>
        </label>
        <button
          className="reset-button"
          onClick={() => change({ ...defaults, order: p.order })}
        >
          <RotateCcw size={15} />
          Azzera filtri
        </button>
      </div>
      <div className="category-tabs" aria-label="Franchise">
        {categories.map((c) => (
          <button
            key={c}
            aria-pressed={p.category === c}
            className={p.category === c ? "active" : ""}
            onClick={() => set("category", c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="select-row">
        <SlidersHorizontal size={15} />
        <label>
          <span className="sr-only">Formato</span>
          <select
            aria-label="Formato"
            value={p.format}
            onChange={(e) => set("format", e.target.value)}
          >
            <option value="all">Tutti i formati</option>
            {Object.entries(labels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Stato visione</span>
          <select
            aria-label="Stato visione"
            value={p.state}
            onChange={(e) => set("state", e.target.value)}
          >
            <option value="all">Visti e da vedere</option>
            <option value="unseen">Solo da vedere</option>
            <option value="seen">Solo visti</option>
          </select>
        </label>
        <select
          aria-label="Disponibilità"
          value={p.availability}
          onChange={(e) => set("availability", e.target.value)}
        >
          <option value="released">Già pubblicati</option>
          <option value="upcoming">In arrivo</option>
          <option value="all">Tutte le uscite</option>
        </select>
        <select
          aria-label="Universo"
          value={p.universe}
          onChange={(e) => set("universe", e.target.value)}
        >
          <option value="Tutti">Tutti gli universi</option>
          {[...new Set(titles.map((t) => t.universe))].sort().map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
