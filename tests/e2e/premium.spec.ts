import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("marvel-watchverse.opening.v1", "seen"),
  );
});

test("le animazioni restano attive con gli effetti Windows disattivati", async ({
  page,
}) => {
  await page.goto("#archive");
  const first = page.locator(".movie-card").first();
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveAttribute("data-reveal", "visible");
  await expect(first).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: /Carica altre storie/ }).click();
  const added = page.locator(".movie-card").nth(35);
  await added.scrollIntoViewIfNeeded();
  await expect(added).toHaveAttribute("data-reveal", "visible");
  await expect(added).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(first).toHaveCSS("transition-duration", "0.65s, 0.7s");
  await page.getByLabel("Cerca titoli").fill("Spider-Man");
  await expect(page.locator(".movie-card").first()).toContainText("Spider-Man");
  await expect(page.locator(".movie-card").first()).toHaveCSS("opacity", "1");
  await page.goto("#universes");
  await page.locator(".temporal-viewport").scrollIntoViewIfNeeded();
  await expect(page.locator(".temporal-canvas")).toHaveAttribute(
    "data-activity",
    "running",
  );
  await expect(page.locator(".temporal-canvas")).toHaveAttribute(
    "data-motion",
    "flowing",
  );
  const time = Number(
    await page.locator(".temporal-canvas").getAttribute("data-time"),
  );
  await expect
    .poll(async () =>
      Number(await page.locator(".temporal-canvas").getAttribute("data-time")),
    )
    .toBeGreaterThan(time + 0.2);
  await expect(page.locator(".hardware-meter i").first()).toHaveCSS(
    "animation-name",
    "instrument-level",
  );
  await expect(page.locator(".crt-carry-handle")).toBeVisible();
  await expect(page.locator(".tva-crt")).toBeVisible();
});
