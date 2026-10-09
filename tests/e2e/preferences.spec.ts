import { test, expect } from "@playwright/test";
test("filtri multipli, modalità Nerd e migrazione delle preferenze persistenti", async ({
  page,
}) => {
  await page.goto("#archive");
  await expect(
    page.getByRole("button", { name: "Percorso consigliato", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByLabel("Modalità Nerd: Disattivata", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ordine di uscita", exact: true })
    .click();
  await expect(page.locator(".movie-card").first()).not.toContainText("1967");
  await page.getByLabel("Modalità Nerd: Disattivata", { exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Nerd — Serie extra", exact: true })
    .check();
  await expect(page.locator(".movie-card").first()).not.toContainText("1967");
  await page
    .getByRole("checkbox", {
      name: "Nerd Multiverso — Animazione & Legacy",
      exact: true,
    })
    .check();
  await expect(page.locator(".movie-card").first()).toContainText("1967");
  await page
    .getByRole("checkbox", {
      name: "Disattiva tutte le modalità Nerd",
      exact: true,
    })
    .check();
  await page.keyboard.press("Escape");
  await page.getByLabel("Formati: 2 selezionati", { exact: true }).click();
  await page.getByRole("checkbox", { name: "Film", exact: true }).check();
  await page.getByRole("checkbox", { name: "Serie", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "Speciale", exact: true }).check();
  await page.keyboard.press("Escape");
  await page.getByLabel("Universi: Tutti", { exact: true }).click();
  await page.getByRole("checkbox", { name: "MCU", exact: true }).check();
  await page
    .getByRole("checkbox", { name: "X-Men / Fox", exact: true })
    .check();
  await page.keyboard.press("Escape");
  await expect(
    page.getByLabel("Formati: 2 selezionati", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Universi: 2 selezionati", { exact: true }),
  ).toBeVisible();
  const cards = page.locator(".movie-card");
  expect(await cards.count()).toBeGreaterThan(10);
  const captions = await cards.locator(".card-meta").allTextContents();
  expect(captions.every((c) => /MCU|X-Men \/ Fox/.test(c))).toBe(true);
  expect(
    (await cards.locator(".card-type").allTextContents()).every((c) =>
      ["Film", "Speciale"].includes(c),
    ),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByLabel("Formati: 2 selezionati", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Universi: 2 selezionati", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Azzera filtri" }).click();
  await expect(
    page.getByLabel("Formati: 2 selezionati", { exact: true }),
  ).toBeVisible();
  const chips = page.locator(".category-tabs");
  await chips.getByRole("button", { name: "MCU", exact: true }).click();
  await chips.getByRole("button", { name: "X-Men", exact: true }).click();
  await expect(
    chips.getByRole("button", { name: "MCU", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    chips.getByRole("button", { name: "X-Men", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("il nome utente resta associato dopo refresh senza perdere progressi", async ({
  page,
}) => {
  await page.goto("#archive");
  await page.getByRole("textbox", { name: "Cerca titoli" }).fill("Iron Man");
  await page
    .getByRole("button", { name: "Segna come visto: Iron Man", exact: true })
    .click();
  await page.goto("#progress");
  await page
    .getByRole("textbox", { name: "Nome utente" })
    .fill(`qa-${Date.now()}`);
  await page.getByRole("button", { name: "Salva il mio nome" }).click();
  await expect(page.getByRole("heading", { name: /Ciao, qa-/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /Ciao, qa-/ })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Nome utente" })).toHaveCount(
    0,
  );
  await page.goto("#archive");
  await expect(
    page.getByRole("button", {
      name: "Segna da vedere: Iron Man",
      exact: true,
    }),
  ).toBeVisible();
});
