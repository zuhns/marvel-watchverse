import { test, expect, type BrowserContext, type Page } from "@playwright/test";

test("due dispositivi condividono progressi, rimozioni e coda dopo refresh", async ({
  browser,
}, testInfo) => {
  test.skip(
    process.env.WATCHVERSE_SYNC_TEST !== "1" ||
      testInfo.project.name !== "chromium",
    "Richiede build con endpoint di test; nessun profilo reale viene creato.",
  );
  const endpoint = "https://sync.watchverse.test/progress";
  const rows = new Map<
    string,
    { title_id: string; watched_at: string | null; updated_at: string }
  >();
  const contexts: BrowserContext[] = [];
  let failFirst = false;
  async function device(first: boolean) {
    const context = await browser.newContext();
    contexts.push(context);
    await context.route(endpoint, async (route) => {
      if (first && failFirst) {
        await route.abort("failed");
        return;
      }
      const request = route.request().postDataJSON();
      for (const c of request.changes) {
        const key = `${request.username}/${c.id}`;
        if (!rows.has(key) || rows.get(key)!.updated_at < c.changedAt)
          rows.set(key, {
            title_id: c.id,
            watched_at: c.watchedAt,
            updated_at: c.changedAt,
          });
      }
      await route.fulfill({
        json: {
          progress: [...rows.entries()]
            .filter(([key]) => key.startsWith(`${request.username}/`))
            .map(([, value]) => value),
        },
      });
    });
    return context.newPage();
  }
  async function connect(page: Page) {
    await page.goto("#progress");
    await page
      .getByRole("textbox", { name: "Nome utente" })
      .fill("qa-cross-device");
    await page.getByRole("button", { name: "Salva il mio nome" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Progressi sincronizzati",
    );
  }
  async function refreshCloud(page: Page) {
    await page.goto("#progress");
    const response = page.waitForResponse(endpoint);
    await page.getByRole("button", { name: "Sincronizza ora" }).click();
    await response;
    await expect(page.getByRole("status")).toContainText(
      "Progressi sincronizzati",
    );
    await page.goto("#archive");
    await page.getByRole("textbox", { name: "Cerca titoli" }).fill("Iron Man");
  }
  try {
    const one = await device(true),
      two = await device(false);
    // Progressi precedenti alla creazione del profilo vengono migrati.
    await one.goto("#archive");
    await one.getByRole("textbox", { name: "Cerca titoli" }).fill("Iron Man");
    await one
      .getByRole("button", { name: "Segna come visto: Iron Man", exact: true })
      .click();
    await connect(one);
    await connect(two);
    await refreshCloud(two);
    await expect(
      two.getByRole("button", {
        name: "Segna da vedere: Iron Man",
        exact: true,
      }),
    ).toBeVisible();
    await two
      .getByRole("button", { name: "Segna da vedere: Iron Man", exact: true })
      .click();
    await refreshCloud(two);
    await refreshCloud(one);
    await expect(
      one.getByRole("button", {
        name: "Segna come visto: Iron Man",
        exact: true,
      }),
    ).toBeVisible();
    failFirst = true;
    await one
      .getByRole("button", { name: "Segna come visto: Iron Man", exact: true })
      .click();
    await one.goto("#progress");
    await expect(one.getByRole("status")).toContainText(
      "modifiche in attesa: 1",
    );
    await one.reload();
    await expect(one.getByRole("status")).toContainText(
      "sincronizzazione da riprovare",
    );
    await one.goto("#archive");
    await expect(
      one.getByRole("button", {
        name: "Segna da vedere: Iron Man",
        exact: true,
      }),
    ).toBeVisible();
    failFirst = false;
    await refreshCloud(one);
    await refreshCloud(two);
    await expect(
      two.getByRole("button", {
        name: "Segna da vedere: Iron Man",
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    for (const context of contexts) await context.close();
  }
});
