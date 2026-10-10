import { test, expect } from "@playwright/test";

test("polvere ancorata alle schede durante lo scroll, risorse limitate e pulizia dopo tre schiocchi", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const gems = ["space", "reality", "power", "mind", "time", "soul"];
    localStorage.setItem(
      "marvel-watchverse.infinity.v1",
      JSON.stringify({ collected: gems, inserted: gems }),
    );
    localStorage.setItem("marvel-watchverse.opening-audio.v2", "seen");
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("#archive");
  await page.getByRole("button", { name: /Carica altre storie/ }).click();
  const count = await page.locator(".movie-card").count();
  for (let cycle = 0; cycle < 3; cycle++) {
    await page.evaluate(() => {
      const grid = document.querySelector(".movie-grid")!;
      scrollTo({
        top: grid.getBoundingClientRect().top + scrollY - 110,
        behavior: "instant",
      });
    });
    await page
      .getByRole("button", {
        name: "Apri il Guanto dell’Infinito: 6 di 6 Gemme",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name: "Schiocca il Guanto dell’Infinito",
        exact: true,
      })
      .click();
    const session = page.locator(".stardust-session");
    await expect
      .poll(async () => Number(await session.getAttribute("data-active")))
      .toBeGreaterThan(0);
    if (cycle === 0) {
      const canvas = page.locator(".poster-dust-canvas").first();
      const id = await canvas.getAttribute("data-poster-id");
      const local = page.locator(`.poster-dust-canvas[data-poster-id="${id}"]`);
      const position = () =>
        local.evaluate((el) => {
          const a = el.getBoundingClientRect(),
            b = el.parentElement!.getBoundingClientRect();
          return {
            y: a.y,
            offset: a.y - b.y,
            position: getComputedStyle(el).position,
            owner: (el.parentElement as HTMLElement).dataset.infinityTitle,
          };
        });
      const before = await position();
      await page.evaluate(() => scrollBy({ top: 100, behavior: "instant" }));
      const after = await position();
      expect(Math.abs(after.y - before.y + 100)).toBeLessThan(1);
      expect(Math.abs(after.offset - before.offset)).toBeLessThan(1);
      expect(after.position).toBe("absolute");
      expect(after.owner).toBe(id);
      await page.evaluate(() => scrollBy({ top: 900, behavior: "instant" }));
      await expect(local).toHaveCount(0);
      await expect
        .poll(async () => Number(await session.getAttribute("data-active")))
        .toBeGreaterThan(0);
      await page.screenshot({
        path: `reports/dust-scroll-${info.project.name}.png`,
      });
    }
    const budget = Number(await session.getAttribute("data-pixel-budget"));
    const activeLimit = Number(await session.getAttribute("data-max-active"));
    expect(
      Number(await session.getAttribute("data-pixels")),
    ).toBeLessThanOrEqual(budget);
    expect(
      Number(await session.getAttribute("data-active")),
    ).toBeLessThanOrEqual(activeLimit);
    if (info.project.name === "mobile") {
      expect(activeLimit).toBe(3);
      expect(budget).toBe(700_000);
      expect(Number(await session.getAttribute("data-fragments"))).toBeLessThan(
        1400,
      );
    }
    await expect(session).toHaveCount(0, { timeout: 8000 });
    await expect(page.locator(".poster-dust-canvas")).toHaveCount(0);
    await expect(page.locator(".movie-card")).toHaveCount(count);
    await page
      .getByRole("button", {
        name: "Apri il Guanto dell’Infinito: 6 di 6 Gemme",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Riporta indietro le storie", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Chiudi il Guanto", exact: true })
      .click();
    await expect(page.locator("[data-dust-ready]")).toHaveCount(0);
    await expect(page.locator(".infinity-vacant")).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("la TVA non elabora fotogrammi fuori schermo e riparte entrando nella vista", async ({
  page,
}, info) => {
  await page.goto("#universes");
  const canvas = page.locator(".temporal-canvas");
  await page.locator(".temporal-viewport").scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("data-activity", "running");
  if (info.project.name === "mobile")
    expect(
      await canvas.evaluate(
        (el) =>
          (el as HTMLCanvasElement).width * (el as HTMLCanvasElement).height,
      ),
    ).toBeLessThan(422_000);
  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("data-activity", "idle");
  const stopped = await canvas.getAttribute("data-time");
  await page.waitForTimeout(250);
  expect(await canvas.getAttribute("data-time")).toBe(stopped);
  await page.locator(".temporal-viewport").scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("data-activity", "running");
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-time")))
    .toBeGreaterThan(Number(stopped) + 0.2);
});
