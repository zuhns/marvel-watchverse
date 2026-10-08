import { useState } from "react";
import { Menu, X, Search, Download } from "lucide-react";
export const navigation = [
  ["home", "Home"],
  ["archive", "Archivio"],
  ["orders", "Ordini di visione"],
  ["universes", "Universi"],
  ["progress", "I miei progressi"],
] as const;
export function Header({
  page,
  percent,
  onExport,
}: {
  page: string;
  percent: number;
  onExport: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <a href="#home" className="brand" aria-label="Marvel Watchverse Home">
        <span>MARVEL</span>
        <b>WATCHVERSE</b>
      </a>
      <nav aria-label="Navigazione principale" className={open ? "open" : ""}>
        {navigation.map(([id, label]) => (
          <a
            href={`#${id}`}
            key={id}
            className={page === id ? "current" : ""}
            onClick={() => setOpen(false)}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="header-tools">
        <a
          href="#archive"
          className="icon-button"
          aria-label="Cerca nel catalogo"
        >
          <Search size={19} />
        </a>
        <a href="#progress" className="completion">
          <span className="completion-dot" />
          {percent}%
        </a>
        <button
          className="icon-button export-top"
          onClick={onExport}
          aria-label="Esporta backup JSON"
        >
          <Download size={19} />
        </button>
        <button
          className="icon-button mobile-menu"
          aria-label={open ? "Chiudi menu" : "Apri menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
