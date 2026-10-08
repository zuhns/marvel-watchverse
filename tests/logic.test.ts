import { describe, it, expect } from "vitest";
import {
  titles,
  posters,
  defaults,
  sortTitles,
  filterTitles,
  normalize,
  stats,
  nextTitle,
} from "../src/lib/catalog";
import {
  parseBackup,
  makeBackup,
  loadState,
  saveState,
  mergeWatched,
  STORAGE_KEY,
} from "../src/lib/storage";
import { createExcel } from "../src/lib/export";
describe("integrità del catalogo", () => {
  it("copre tutte le famiglie e usa ID unici e date reali", () => {
    expect(titles.length).toBeGreaterThanOrEqual(200);
    expect(new Set(titles.map((t) => t.id)).size).toBe(titles.length);
    for (const t of titles) {
      expect(Number.isFinite(Date.parse(t.releaseDate))).toBe(true);
      if (t.status === "released")
        expect(t.releaseDate <= "2026-10-08").toBe(true);
      expect(posters[t.id]).toBeDefined();
      expect(t.sourceUrl).toMatch(/^https:\/\//);
    }
    for (const s of [
      "Iron Man",
      "Avengers: Endgame",
      "Spider-Man: No Way Home",
      "X-Men",
      "Logan",
      "Deadpool & Wolverine",
      "Venom",
      "Fantastic Four",
      "Blade",
      "WandaVision",
    ])
      expect(titles.some((t) => t.originalTitle === s)).toBe(true);
  });
});
describe("ordini e filtri", () => {
  it("ordina globalmente per data, senza mutare i dati", () => {
    const before = titles.map((t) => t.id);
    const list = sortTitles(titles, "release");
    expect(
      list.every((t, i) => i === 0 || t.releaseDate >= list[i - 1].releaseDate),
    ).toBe(true);
    expect(titles.map((t) => t.id)).toEqual(before);
  });
  it("raggruppa la cronologia per timeline indipendenti", () => {
    const list = sortTitles(titles, "chronology");
    const groups = list
      .map((t) => t.timelineGroup)
      .filter((g, i, a) => !i || g !== a[i - 1]);
    expect(new Set(groups).size).toBe(groups.length);
  });
  it("presenta le connessioni Spider-Man e Wolverine prima dei crossover", () => {
    const list = sortTitles(titles, "recommended");
    const position = (name: string) =>
      list.findIndex((t) => t.originalTitle === name);
    expect(position("Spider-Man")).toBeLessThan(
      position("Spider-Man: No Way Home"),
    );
    expect(position("The Amazing Spider-Man")).toBeLessThan(
      position("Spider-Man: No Way Home"),
    );
    expect(position("Logan")).toBeLessThan(position("Deadpool & Wolverine"));
    expect(position("Deadpool 2")).toBeLessThan(
      position("Deadpool & Wolverine"),
    );
  });
  it("combina filtri, ricerca e stato visto", () => {
    const iron = titles.find(
      (t) => t.originalTitle === "Iron Man" && t.year === 2008,
    )!;
    const watched = { [iron.id]: { watchedAt: new Date().toISOString() } };
    expect(normalize("ÉCHO")).toBe("echo");
    expect(
      filterTitles(
        titles,
        { ...defaults, search: "IRON MAN", format: "movie", state: "seen" },
        watched,
      ).map((t) => t.id),
    ).toEqual([iron.id]);
    expect(
      filterTitles(titles, { ...defaults, availability: "upcoming" }, {}).every(
        (t) => t.status === "upcoming",
      ),
    ).toBe(true);
    expect(stats(titles, watched).seen).toBe(1);
    expect(nextTitle(titles, "release", watched)?.id).not.toBe(iron.id);
  });
});
describe("backup e persistenza", () => {
  it("ricarica gli stessi ID dopo salvataggio e cambio ordine", () => {
    let value = "";
    const storage = {
      getItem: (key: string) => (key === STORAGE_KEY ? value : null),
      setItem: (_key: string, v: string) => {
        value = v;
      },
    };
    const watched = { [titles[0].id]: { watchedAt: "2026-10-08T12:00:00Z" } };
    saveState(storage, watched, { ...defaults, order: "chronology" });
    expect(loadState(storage).watched).toEqual(watched);
    expect(loadState(storage).preferences.order).toBe("chronology");
  });
  it("rifiuta un backup corrotto prima di mutare lo stato", () => {
    const b = makeBackup({}, defaults);
    expect(parseBackup(b).preferences).toEqual(defaults);
    expect(() =>
      parseBackup({ ...b, watched: { abc: { watchedAt: "broken" } } }),
    ).toThrow();
    expect(() =>
      parseBackup({ ...b, preferences: { ...defaults, order: "fake" } }),
    ).toThrow();
    expect(loadState({ getItem: () => "{broken" }).watched).toEqual({});
  });
  it("unisce importazioni senza perdere progressi precedenti", () => {
    expect(
      Object.keys(
        mergeWatched(
          { a: { watchedAt: "2026-01-01" } },
          { b: { watchedAt: "2026-02-01" } },
        ),
      ),
    ).toEqual(["a", "b"]);
  });
});
describe("Excel", () => {
  it("genera tre fogli, autofiltro, ID stabili e ordini corretti", async () => {
    const iron = titles.find(
      (t) => t.originalTitle === "Iron Man" && t.year === 2008,
    )!;
    const book = await createExcel(titles, {
      [iron.id]: { watchedAt: "2026-10-08T12:00:00Z" },
    });
    expect(book.worksheets.map((s) => s.name)).toEqual([
      "Ordine di uscita",
      "Cronologia interna",
      "Percorso consigliato",
    ]);
    for (const sheet of book.worksheets) {
      expect(sheet.rowCount).toBe(titles.length + 1);
      expect(sheet.autoFilter).toBeDefined();
      const row = sheet
        .getRows(2, titles.length)
        ?.find((r) => r.getCell(10).value === iron.id);
      expect(row?.getCell(8).value).toBe("Visto");
    }
    const bytes = await book.xlsx.writeBuffer();
    expect(bytes.byteLength).toBeGreaterThan(1000);
  }, 30000);
});
