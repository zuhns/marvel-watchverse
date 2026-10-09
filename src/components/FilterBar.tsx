import { Search, RotateCcw, SlidersHorizontal, Glasses } from "lucide-react";
import { titles, defaults, labels } from "../lib/catalog";
import type { Preferences } from "../types";
import { MultiSelect } from "./MultiSelect";
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
  const set = (k: "search" | "state" | "availability", v: string) =>
    change({ ...p, [k]: v });
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
          onClick={() =>
            change({ ...defaults, order: p.order, nerdMode: p.nerdMode })
          }
        >
          <RotateCcw size={15} />
          Azzera filtri
        </button>
      </div>
      <div className="category-tabs" aria-label="Franchise">
        {categories.map((c) => (
          <button
            key={c}
            aria-pressed={
              c === "Tutti" ? !p.categories.length : p.categories.includes(c)
            }
            className={
              (c === "Tutti" ? !p.categories.length : p.categories.includes(c))
                ? "active"
                : ""
            }
            onClick={() =>
              change({
                ...p,
                categories:
                  c === "Tutti"
                    ? []
                    : p.categories.includes(c)
                      ? p.categories.filter((v) => v !== c)
                      : [...p.categories, c],
              })
            }
          >
            {c}
          </button>
        ))}
      </div>
      <div className="select-row">
        <SlidersHorizontal size={15} />
        <MultiSelect
          label="Formati"
          values={p.formats}
          options={Object.entries(labels).map(([value, label]) => ({
            value,
            label,
          }))}
          onChange={(formats) =>
            change({ ...p, formats: formats as Preferences["formats"] })
          }
        />
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
        <MultiSelect
          label="Universi"
          values={p.universes}
          options={[...new Set(titles.map((t) => t.universe))]
            .sort()
            .map((value) => ({ value, label: value }))}
          onChange={(universes) => change({ ...p, universes })}
        />
      </div>
      <div className="nerd-control">
        <label>
          <input
            type="checkbox"
            role="switch"
            aria-label="Modalità Nerd"
            checked={p.nerdMode}
            onChange={(e) => change({ ...p, nerdMode: e.target.checked })}
          />
          <Glasses size={17} />
          <strong>Modalità Nerd</strong>
          <span className="nerd-indicator">{p.nerdMode ? "ON" : "OFF"}</span>
        </label>
        <p>
          {p.nerdMode
            ? "Archivio completo: anche gli adattamenti storici dal 1967."
            : "Percorso moderno dal 1998 (Blade). Attiva Nerd per recuperare anche le produzioni più datate."}
        </p>
      </div>
    </div>
  );
}
