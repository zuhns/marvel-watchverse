import { test, expect } from "@playwright/test";
test("Terre interattive, crossover, dossier esatto e animazioni accessibili", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("#universes");
  const selector = page.getByLabel("Seleziona una Terra", { exact: true });
  await expect(
    page.getByRole("heading", { name: "Terra-616", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pausa animazioni" }).click();
  await expect(page.locator(".tva-observatory")).toHaveAttribute(
    "data-paused",
    "true",
  );
  const raimi = page.getByRole("button", {
    name: "Esplora Terra-96283: Spider-Man · Raimi",
    exact: true,
  });
  await raimi.scrollIntoViewIfNeeded();
  await raimi.click();
  const dossier = page.locator("#earth-dossier");
  await expect(
    dossier.getByRole("heading", { name: "Terra-96283", exact: true }),
  ).toBeVisible();
  await expect(dossier.locator(".movie-card")).toHaveCount(3);
  await expect(dossier.locator(".earth-crossovers")).toContainText(
    "Spider-Man: No Way Home",
  );
  await dossier
    .getByRole("button", { name: "Segna come visto: Spider-Man", exact: true })
    .click();
  await expect(dossier.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "33",
  );
  await selector.selectOption("838");
  await expect(dossier.locator(".movie-card")).toHaveCount(1);
  await expect(dossier).toContainText("Doctor Strange");
  await selector.selectOption("8096");
  await expect(
    dossier.getByRole("heading", { name: "Terra-8096", exact: true }),
  ).toBeVisible();
  await dossier
    .getByRole("button", { name: "Tutte le storie", exact: true })
    .click();
  const count = await dossier.locator(".movie-card").count();
  await dossier.getByRole("button", { name: "Ordina nell’archivio" }).click();
  await expect(page.locator(".archive-earth-context")).toContainText(
    "Terra-8096",
  );
  await expect(page.locator(".movie-card")).toHaveCount(count);
  await page.reload();
  await expect(page.locator(".archive-earth-context")).toContainText(
    "Terra-8096",
  );
  await page.getByRole("button", { name: "Torna a tutto l’archivio" }).click();
  await page.goto("#universes");
  await selector.selectOption("96283");
  await expect(
    page.getByRole("button", {
      name: "Segna da vedere: Spider-Man",
      exact: true,
    }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".temporal-canvas")).toHaveAttribute(
    "data-motion",
    "still",
  );
  for (const width of info.project.name === "mobile"
    ? [320, 390, 768]
    : [1024, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("cronologia allineata e Archivio unico anche con il vecchio collegamento", async ({
  page,
}) => {
  await page.goto("#orders");
  await expect(
    page.getByRole("button", { name: "Percorso consigliato", exact: true }),
  ).toBeVisible();
  await expect(page.locator('nav a[href="#orders"]')).toHaveCount(0);
  await page
    .getByRole("button", { name: "Cronologia interna", exact: true })
    .click();
  const groups = page.locator(".chronology-group");
  expect(await groups.count()).toBeGreaterThan(1);
  for (const group of await groups.all()) {
    const heading = await group.locator(".chronology-heading").boundingBox();
    const grid = await group.locator(".movie-grid").boundingBox();
    expect(Math.abs(heading!.width - grid!.width)).toBeLessThan(1);
    const posters = await group
      .locator(".poster-button")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
    const columns = await group
      .locator(".movie-grid")
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
      );
    expect(
      new Set(posters.slice(0, columns).map((y) => Math.round(y))).size,
    ).toBe(1);
  }
  await page.getByLabel("Modalità Nerd: Disattivata", { exact: true }).click();
  await page
    .getByRole("checkbox", {
      name: "Nerd Multiverso — Animazione & Legacy",
      exact: true,
    })
    .check();
  await page.keyboard.press("Escape");
  const search = page.getByLabel("Cerca titoli");
  await search.fill("Spider-Man animato 1994");
  expect(await page.locator(".movie-card").count()).toBeGreaterThan(0);
  await page.getByLabel(/Modalità Nerd:/).click();
  await page
    .getByRole("checkbox", {
      name: "Disattiva tutte le modalità Nerd",
      exact: true,
    })
    .check();
  await page.keyboard.press("Escape");
  await expect(page.locator(".movie-card")).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.getByLabel("Modalità Nerd: Disattivata", { exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
});
