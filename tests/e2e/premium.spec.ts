import { test, expect } from "@playwright/test";

test("le animazioni conservano visibili i nuovi contenuti e rispettano il movimento ridotto", async ({
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
  await expect(page.locator('[data-reveal="pending"]')).toHaveCount(0);
  await page.getByLabel("Cerca titoli").fill("Spider-Man");
  await expect(page.locator(".movie-card").first()).toContainText("Spider-Man");
  await expect(page.locator(".movie-card").first()).toHaveCSS("opacity", "1");
  await page.goto("#universes");
  await expect(page.locator(".temporal-canvas")).toHaveAttribute(
    "data-motion",
    "still",
  );
  await expect(page.locator(".crt-carry-handle")).toBeVisible();
  await expect(page.locator(".tva-crt")).toBeVisible();
});
