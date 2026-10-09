import { describe, it, expect } from "vitest";
import { earths, earthById, earthMode } from "../src/lib/multiverse";
import {
  titles,
  modeTitles,
  contentTier,
  sideUniverses,
  defaults,
} from "../src/lib/catalog";
import { makeBackup, parseBackup } from "../src/lib/storage";
describe("atlante e percorsi", () => {
  it("copre ogni titolo senza assegnare un numero inventato alle raccolte", () => {
    expect(new Set(earths.map((e) => e.id)).size).toBe(earths.length);
    const covered = new Set(earths.flatMap((e) => e.titles.map((t) => t.id)));
    expect([...covered].sort()).toEqual(titles.map((t) => t.id).sort());
    for (const earth of earths) {
      expect(earth.titles.length, earth.name).toBeGreaterThan(0);
      expect(new Set(earth.titles.map((t) => t.id)).size).toBe(
        earth.titles.length,
      );
      if (["screen", "reference"].includes(earth.kind))
        expect(earth.source?.url).toMatch(/^https:\/\//);
      if (["multiple", "unknown"].includes(earth.kind))
        expect(earth.designation).not.toMatch(/Terra-\d/);
    }
  });
  it("distingue First Steps, Illuminati, MCU e i ritorni dei due Spider-Man", () => {
    expect(earthById("828").titles.map((t) => t.originalTitle)).toEqual([
      "The Fantastic Four: First Steps",
    ]);
    expect(
      earthById("616").titles.some((t) => t.universe.includes("828")),
    ).toBe(false);
    expect(earthById("838").titles.map((t) => t.originalTitle)).toEqual([
      "Doctor Strange in the Multiverse of Madness",
    ]);
    for (const id of ["96283", "120703"]) {
      expect(
        earthById(id).titles.some(
          (t) => t.originalTitle === "Spider-Man: No Way Home",
        ),
      ).toBe(false);
      expect(
        earthById(id).crossovers.some(
          (t) => t.originalTitle === "Spider-Man: No Way Home",
        ),
      ).toBe(true);
    }
    expect(
      earthById("688").titles.some((t) => t.originalTitle === "Madame Web"),
    ).toBe(false);
  });
  it("Nerd disattivata rimuove tutte le stagioni delle serie laterali e storiche", () => {
    const core = modeTitles(titles, false, false);
    expect(core.every((t) => !sideUniverses.includes(t.universe))).toBe(true);
    expect(core.some((t) => t.universe === "Spider-Man animato 1994")).toBe(
      false,
    );
    const lastSeason = {
      ...titles.find((t) => t.universe === "Spider-Man animato 1994")!,
      year: 2026,
    };
    expect(contentTier(lastSeason)).toBe("multiverse");
    expect(modeTitles([lastSeason], true, false)).toEqual([]);
    expect(modeTitles([lastSeason], false, true)).toEqual([lastSeason]);
    expect(core.some((t) => t.category === "Defenders")).toBe(true);
    expect(core.some((t) => t.universe === "MCU — Multiverso animato")).toBe(
      true,
    );
  });
  it("aprendo un dossier nell’archivio abilita i percorsi necessari e conserva il filtro nel backup", () => {
    for (const earth of earths)
      expect(
        modeTitles(
          earth.titles,
          earthMode(earth).nerdMode,
          earthMode(earth).advancedNerdMode,
        ),
      ).toEqual(earth.titles);
    const p = { ...defaults, earthId: "8096", ...earthMode(earthById("8096")) };
    expect(parseBackup(makeBackup({}, p)).preferences.earthId).toBe("8096");
  });
});
