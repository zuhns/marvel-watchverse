import { test, expect, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
test("cloud reale: due dispositivi, amici e maratona separata dai profili", async ({
  browser,
}, testInfo) => {
  test.skip(
    process.env.WATCHVERSE_LIVE_TEST !== "1" ||
      testInfo.project.name !== "chromium",
    "Usa solo profili QA temporanei nel backend configurato.",
  );
  test.setTimeout(150000);
  const suffix = Date.now().toString(36),
    a = `qa-${suffix}-one`,
    b = `qa-${suffix}-two`;
  writeFileSync(
    "reports/live-test-profiles.json",
    JSON.stringify({ profiles: [a, b] }),
  );
  const contexts = await Promise.all([
    browser.newContext({ viewport: { width: 1366, height: 900 } }),
    browser.newContext({ viewport: { width: 390, height: 844 } }),
    browser.newContext(),
  ]);
  const [one, two, again] = await Promise.all(contexts.map((c) => c.newPage()));
  const errors: string[] = [];
  for (const page of [one, two, again])
    page.on("pageerror", (e) => errors.push(e.message));
  async function login(page: Page, name: string) {
    await page.goto("#archive");
    await page
      .getByRole("button", { name: "Accedi con nome utente", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("textbox", { name: "Nome utente" })
      .fill(name);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Salva il mio nome" })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.goto("#progress");
    await expect(
      page.locator(".profile-panel").getByRole("status"),
    ).toContainText("Progressi sincronizzati");
  }
  async function iron(page: Page) {
    await page.goto("#archive");
    await page.getByRole("textbox", { name: "Cerca titoli" }).fill("Iron Man");
  }
  async function syncPersonal(page: Page) {
    await page.goto("#progress");
    await expect(
      page.locator(".profile-panel").getByRole("status"),
    ).toContainText("Progressi sincronizzati");
    await page.getByRole("button", { name: "Sincronizza ora" }).click();
    await expect(
      page.locator(".profile-panel").getByRole("status"),
    ).toContainText("Progressi sincronizzati");
  }
  try {
    await login(one, a);
    await login(two, b);
    await iron(one);
    await one
      .getByRole("button", { name: "Segna come visto: Iron Man", exact: true })
      .click();
    await syncPersonal(one);
    await login(again, a);
    await iron(again);
    await expect(
      again.getByRole("button", {
        name: "Segna da vedere: Iron Man",
        exact: true,
      }),
    ).toBeVisible();
    await one.goto("#friends");
    await one.getByRole("textbox", { name: "Nome utente amico" }).fill(b);
    await one.getByRole("button", { name: "Aggiungi amico" }).click();
    await expect(
      one.getByRole("button", { name: `Vedi progressi di ${b}` }),
    ).toBeVisible();
    await one.getByRole("button", { name: `Vedi progressi di ${b}` }).click();
    await expect(
      one.getByRole("heading", { name: `Il Watchverse di ${b}.` }),
    ).toBeVisible();
    await two.goto("#friends");
    await two.getByRole("textbox", { name: "Nome utente amico" }).fill(a);
    await two.getByRole("button", { name: "Aggiungi amico" }).click();
    await two.getByRole("button", { name: `Vedi progressi di ${a}` }).click();
    await expect(
      two.locator(".friend-title").filter({ hasText: "Iron Man" }),
    ).toHaveCount(1);
    await expect(
      two.locator(".friend-progress").getByRole("button", { name: /Segna/ }),
    ).toHaveCount(0);
    await one
      .getByRole("textbox", { name: "Nome della maratona" })
      .fill("La nostra saga QA");
    await one.getByLabel("Nome utente da invitare", { exact: true }).fill(b);
    await one.getByRole("button", { name: "Crea e invia invito" }).click();
    await expect(
      one.getByRole("heading", { name: "La nostra saga QA" }),
    ).toBeVisible();
    await two.getByRole("button", { name: "Aggiorna amici e inviti" }).click();
    await expect(
      two.getByRole("button", { name: "Accetta invito" }),
    ).toBeVisible();
    await two.getByRole("button", { name: "Accetta invito" }).click();
    await expect(
      two.getByRole("button", { name: "Apri maratona" }),
    ).toBeVisible();
    await one.getByRole("button", { name: "Apri maratona" }).click();
    await expect(
      one.getByRole("region", { name: "Maratona attiva" }),
    ).toContainText("Progressi sincronizzati");
    await iron(one);
    await expect(
      one.getByRole("button", {
        name: "Segna come visto: Iron Man",
        exact: true,
      }),
    ).toBeVisible();
    await one
      .getByRole("button", { name: "Segna come visto: Iron Man", exact: true })
      .click();
    await expect(
      one.getByRole("region", { name: "Maratona attiva" }),
    ).toContainText("Progressi sincronizzati");
    await expect(
      one.getByRole("region", { name: "Maratona attiva" }),
    ).not.toContainText("modifiche in attesa");
    await two.getByRole("button", { name: "Apri maratona" }).click();
    await expect(
      two.getByRole("region", { name: "Maratona attiva" }),
    ).toContainText("Progressi sincronizzati");
    await iron(two);
    await expect(
      two.getByRole("button", {
        name: "Segna da vedere: Iron Man",
        exact: true,
      }),
    ).toBeVisible();
    await two.reload();
    await expect(
      two.getByRole("region", { name: "Maratona attiva" }),
    ).toBeVisible();
    await expect(
      two.getByRole("button", {
        name: "Segna da vedere: Iron Man",
        exact: true,
      }),
    ).toBeVisible();
    await two.getByRole("button", { name: "Torna al mio profilo" }).click();
    await iron(two);
    await expect(
      two.getByRole("button", {
        name: "Segna come visto: Iron Man",
        exact: true,
      }),
    ).toBeVisible();
    await one.getByRole("button", { name: "Torna al mio profilo" }).click();
    await iron(one);
    await expect(
      one.getByRole("button", {
        name: "Segna da vedere: Iron Man",
        exact: true,
      }),
    ).toBeVisible();
    await two.goto("#friends");
    expect(
      await two.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await two.screenshot({
      path: "reports/social-live-mobile.png",
      fullPage: true,
    });
    expect(errors).toEqual([]);
  } finally {
    for (const context of contexts) await context.close().catch(() => {});
  }
});
