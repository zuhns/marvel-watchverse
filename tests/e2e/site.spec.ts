import { test, expect } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
const catalog = JSON.parse(readFileSync("src/data/titles.json", "utf8")) as {
  id: string;
  originalTitle: string;
  year: number;
}[];
const posters = JSON.parse(
  readFileSync("src/data/posters.json", "utf8"),
) as Record<string, { url: string | null }>;
test("ricerca, ordini, tracker, persistenza, dettagli e backup", async ({
  page,
}) => {
  await page.goto("#archive");
  const search = page.getByRole("textbox", { name: "Cerca titoli" });
  await search.fill("Iron Man");
  await page
    .getByRole("button", { name: "Segna come visto: Iron Man", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Segna da vedere: Iron Man",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ordine di uscita", exact: true })
    .click();
  await expect(search).toHaveValue("Iron Man");
  await page
    .getByRole("button", { name: "Dettagli: Iron Man", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("#progress");
  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Esporta JSON", exact: true }).click();
  const json = await jsonDownload;
  await page.getByLabel("Importa backup").setInputFiles((await json.path())!);
  await expect(page.getByRole("status")).toContainText("Backup importato");
  const excelDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Esporta Excel" }).click();
  const excel = await excelDownload;
  expect(excel.suggestedFilename()).toBe("marvel-watchverse.xlsx");
  await page.getByLabel("Importa backup").setInputFiles({
    name: excel.suggestedFilename(),
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: readFileSync((await excel.path())!),
  });
  await expect(page.getByRole("status")).toContainText(
    "Progressi Excel importati",
  );
  await page.getByLabel("Importa backup").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.getByRole("status")).toContainText("non supportato");
  await page.goto("#archive");
  await search.fill("Iron Man");
  await expect(
    page.getByRole("button", {
      name: "Segna da vedere: Iron Man",
      exact: true,
    }),
  ).toBeVisible();
});
test("le undici locandine obbligatorie sono immagini reali decodificate", async ({
  page,
}) => {
  await page.goto("#archive");
  for (const name of [
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
    "Daredevil",
  ]) {
    let title = catalog.find(
      (t) =>
        t.originalTitle === name &&
        (name !== "Fantastic Four" || t.year === 2005) &&
        (name !== "Iron Man" || t.year === 2008) &&
        (name !== "X-Men" || t.year === 2000),
    );
    if (name === "Daredevil")
      title = catalog.find(
        (t) => /Daredevil/.test(t.originalTitle) && t.year === 2015,
      );
    expect(title, `Catalogo: ${name}`).toBeTruthy();
    await page
      .getByRole("textbox", { name: "Cerca titoli" })
      .fill(name === "Daredevil" ? "Daredevil" : name);
    const image = page.locator(`[data-poster-id="${title!.id}"] img`);
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect
      .poll(
        () =>
          image.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
        {
          timeout: 30000,
          message: `Locandina realmente visualizzata: ${name}`,
        },
      )
      .toBe(true);
  }
});
test("layout senza overflow e navigazione mobile", async ({
  page,
}, testInfo) => {
  for (const width of testInfo.project.name === "mobile"
    ? [320, 390, 768]
    : [1366, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "OGNI STORIA.",
    );
    for (const image of await page.locator(".hero-collage img").all()) {
      await expect
        .poll(
          () =>
            image.evaluate(
              (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
            ),
          { timeout: 30000 },
        )
        .toBe(true);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `reports/home-${width}.png`,
      fullPage: true,
    });
    await page.goto("#universes");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  if (testInfo.project.name === "mobile") {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("");
    await page.getByRole("button", { name: "Apri menu" }).click();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "I miei progressi" })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "WATCHVERSE.",
    );
  }
});
test("manifest completo: tutte le 255 immagini decodificate nel browser", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "Audit completo eseguito su desktop; le 11 prioritarie sono testate anche su mobile.",
  );
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("");
  const entries = catalog.map((t) => ({
    id: t.id,
    title: t.originalTitle,
    year: t.year,
    url: posters[t.id]?.url,
  }));
  const results = await page.evaluate(async (entries) => {
    const sheet = document.createElement("div");
    sheet.id = "poster-audit";
    sheet.style.cssText =
      "position:absolute;inset:0 auto auto 0;z-index:1000;background:#08090d;width:1920px;padding:25px;display:grid;grid-template-columns:repeat(15,1fr);gap:15px;color:white;font:10px Arial";
    document.body.append(sheet);
    const queue = [...entries];
    const results: {
      id: string;
      loaded: boolean;
      width: number;
      height: number;
    }[] = [];
    await Promise.all(
      Array.from({ length: 8 }, async () => {
        while (queue.length) {
          const t = queue.shift()!;
          const figure = document.createElement("figure");
          figure.style.margin = "0";
          const img = new Image();
          img.style.cssText = "width:100%;aspect-ratio:2/3;object-fit:cover";
          img.alt = t.title;
          img.src = t.url ?? "";
          figure.append(img);
          const caption = document.createElement("figcaption");
          caption.textContent = `${t.title} (${t.year})`;
          caption.style.cssText = "height:40px;padding:5px 0";
          figure.append(caption);
          sheet.append(figure);
          try {
            await img.decode();
            results.push({
              id: t.id,
              loaded: img.naturalWidth > 0,
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
          } catch {
            results.push({ id: t.id, loaded: false, width: 0, height: 0 });
          }
        }
      }),
    );
    return results;
  }, entries);
  writeFileSync(
    "reports/posters-browser.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        total: results.length,
        loaded: results.filter((x) => x.loaded).length,
        missing: results.filter((x) => !x.loaded),
        results,
      },
      null,
      2,
    ),
  );
  expect(results.filter((x) => !x.loaded)).toEqual([]);
  await page
    .locator("#poster-audit")
    .screenshot({ path: "reports/poster-contact-sheet.png" });
});
