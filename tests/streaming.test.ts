import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  contentOf,
  offersOf,
  publicEntities,
  normalizeTitle,
} from "../scripts/lib/justwatch";
import {
  safeWebUrl,
  streamingKey,
  platformDestination,
} from "../src/lib/streaming";
describe("public streaming data", () => {
  it("falls back to the title source when a provider only exposes its homepage", () => {
    const source = "https://www.justwatch.com/it/film/iron-man";
    expect(platformDestination("https://skygo.sky.it/", source)).toBe(source);
    expect(
      platformDestination("https://www.netflix.com/title/123", source),
    ).toBe("https://www.netflix.com/title/123");
  });
  it("decodes data without executing page scripts", () => {
    const payload = [{ __typename: 1, id: 2 }, "Movie", "tm123"];
    expect(
      publicEntities(
        `<script id="__NUXT_DATA__">${JSON.stringify(payload)}</script>`,
      )[0],
    ).toMatchObject({ id: "tm123", __typename: "Movie" });
    expect(() => publicEntities("<script>alert('x')</script>")).toThrow();
  });
  it("uses Italian metadata rather than an English trailer fragment", () => {
    const entity = {
      'content({"country":"IT","language":"en"})': { clips: [] },
      'content({"country":"IT","language":"it"})': {
        title: "Thor",
        originalTitle: "Thor",
      },
    };
    expect(contentOf(entity)?.title).toBe("Thor");
    expect(normalizeTitle("L’incredibile Hulk")).toBe(
      normalizeTitle("L'incredibile Hulk"),
    );
  });
  it("keeps Italian digital offers, separates rental/purchase and deduplicates quality", () => {
    const provider = {
      __typename: "Package",
      id: "p",
      packageId: 337,
      clearName: "Disney Plus",
      icon: "/icon/1/{profile}/disneyplus.{format}",
    };
    const offer = {
      __typename: "Offer",
      type: "AGGREGATED",
      country: "IT",
      monetizationType: "FLATRATE",
      presentationType: "HD",
      standardWebURL: "https://www.disneyplus.com/browse/entity-example",
      package: { __ref: "Package:p" },
    };
    const all = [
      provider,
      { ...offer, id: "hd" },
      { ...offer, id: "4k", presentationType: "_4K" },
      { ...offer, id: "us", country: "US" },
      { ...offer, id: "dvd", presentationType: "DVD" },
      { ...offer, id: "bad", standardWebURL: "javascript:alert(1)" },
    ];
    const node = {
      'offers({"country":"IT","filter":{"preAffiliate":true},"platform":"WEB"})':
        all.slice(1).map((o) => ({ __ref: `Offer:${o.id}` })),
    };
    expect(offersOf(node, all)).toEqual([
      expect.objectContaining({
        provider: "Disney Plus",
        kind: "FLATRATE",
        qualities: ["HD", "4K"],
      }),
    ]);
    expect(offersOf({}, all)).toBeNull();
  });
  it("covers every catalog production with safe source and provider links", () => {
    const titles = JSON.parse(readFileSync("src/data/titles.json", "utf8"));
    const data = JSON.parse(
      readFileSync("public/data/streaming-it.json", "utf8"),
    );
    expect(data.country).toBe("IT");
    for (const title of titles) {
      const entry = data.entries[streamingKey(title)];
      expect(entry, title.title).toBeTruthy();
      expect(safeWebUrl(entry.source)).toBeTruthy();
      for (const offer of entry.offers) {
        expect(safeWebUrl(offer.url)).toBeTruthy();
        expect(offer.provider).toBeTruthy();
      }
    }
  });
});
