import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }, info) => {
  if (!info.title.includes("opening"))
    await page.addInitScript(() =>
      localStorage.setItem("marvel-watchverse.opening.v1", "seen"),
    );
});
test("sei Gemme, incastonatura, schiocco e ripristino senza perdere progressi", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const scope = window as any,
      NativeAudio = window.Audio;
    scope.questAudio = [];
    scope.Audio = function (src: string) {
      const audio = new NativeAudio(src);
      scope.questAudio.push(audio);
      return audio;
    };
  });
  await page.goto("");
  await expect(page.locator("footer")).toContainText(
    "Per Veronica, il mio universo preferito.",
  );
  await expect(page.locator("footer")).toContainText("Ti amo tanto.");
  for (const [route, gem] of [
    ["home", "Spazio"],
    ["archive", "Realtà"],
    ["universes", "Potere"],
    ["progress", "Mente"],
    ["friends", "Tempo"],
    ["home", "Anima"],
  ]) {
    await page.goto(`#${route}`);
    await page
      .getByRole("button", { name: `Raccogli la Gemma ${gem}`, exact: true })
      .click();
  }
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Apri il Guanto dell’Infinito: 6 di 6 Gemme",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("#archive");
  await page
    .getByRole("button", { name: "Segna come visto: Iron Man", exact: true })
    .click();
  await page.locator(".movie-grid").first().scrollIntoViewIfNeeded();
  const before = await page.locator(".movie-card").count();
  const progressBefore = await page.evaluate(() =>
    Object.entries(localStorage).filter(
      ([key]) => !key.includes("infinity") && !key.includes("opening"),
    ),
  );
  await page
    .getByRole("button", {
      name: "Apri il Guanto dell’Infinito: 6 di 6 Gemme",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Il Guanto attende le sei Gemme" }),
  ).toBeDisabled();
  for (const gem of ["Spazio", "Realtà", "Potere", "Mente", "Tempo", "Anima"])
    await page
      .getByRole("button", { name: `Incastona Gemma ${gem}`, exact: true })
      .click();
  await page.screenshot({
    path: `reports/infinity-gauntlet-${test.info().project.name}.png`,
  });
  await page
    .getByRole("button", {
      name: "Schiocca il Guanto dell’Infinito",
      exact: true,
    })
    .click();
  await expect(page.locator(".infinity-dusting").first()).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).questAudio.find((audio: HTMLAudioElement) =>
            audio.src.includes("infinity-snap"),
          )?.currentTime || 0,
      ),
    )
    .toBeGreaterThan(0);
  await page.waitForTimeout(650);
  await page.screenshot({
    path: `reports/infinity-dust-${test.info().project.name}.png`,
  });
  await expect
    .poll(() => page.locator(".movie-card").count())
    .toBeLessThan(before);
  const progressAfter = await page.evaluate(() =>
    Object.entries(localStorage).filter(
      ([key]) => !key.includes("infinity") && !key.includes("opening"),
    ),
  );
  expect(progressAfter).toEqual(progressBefore);
  await page
    .getByRole("button", {
      name: "Apri il Guanto dell’Infinito: 6 di 6 Gemme",
      exact: true,
    })
    .click();
  expect(
    await page.evaluate(
      () =>
        (window as any).questAudio.find((audio: HTMLAudioElement) =>
          audio.src.includes("infinity-snap"),
        )?.paused,
    ),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Riporta indietro le storie", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Chiudi il Guanto", exact: true })
    .click();
  await expect(page.locator(".movie-card")).toHaveCount(before);
  await expect(
    page.getByRole("button", {
      name: "Segna da vedere: Iron Man",
      exact: true,
    }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
});

test("schiocco dal footer esplorabile anche con movimento ridotto", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const gems = ["space", "reality", "power", "mind", "time", "soul"];
    localStorage.setItem(
      "marvel-watchverse.infinity.v1",
      JSON.stringify({ collected: gems, inserted: gems }),
    );
  });
  await page.goto("#friends");
  await page.locator("footer").scrollIntoViewIfNeeded();
  await page
    .getByRole("button", { name: "Esamina l’artefatto dorato" })
    .click();
  await page
    .getByRole("button", {
      name: "Schiocca il Guanto dell’Infinito",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/#archive$/);
  await expect(page.locator(".infinity-dusting").first()).toBeVisible();
  await expect(page.locator(".stardust-canvas")).toBeHidden();
  await expect.poll(() => page.locator(".movie-card").count()).toBeLessThan(30);
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
  await expect(page.locator(".movie-card")).toHaveCount(30);
});
test("atmosfera TVA attiva al 10 percento, pausa e uscita dalla pagina", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const scope = window as any,
      NativeAudio = window.Audio;
    scope.questAudio = [];
    scope.Audio = function (src: string) {
      const audio = new NativeAudio(src);
      scope.questAudio.push(audio);
      return audio;
    };
  });
  await page.goto("#universes");
  await expect(
    page.getByRole("slider", { name: "Volume atmosfera" }),
  ).toHaveValue("10");
  await expect(
    page.getByRole("button", { name: "Disattiva atmosfera sonora" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.locator(".tva-official-logo").click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).questAudio.at(-1).currentTime),
    )
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(() => (window as any).questAudio.at(-1).volume),
  ).toBe(0.1);
  await page.getByRole("button", { name: "Pausa animazioni" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).questAudio.at(-1).paused))
    .toBe(true);
  await page.goto("#home");
  expect(
    await page.evaluate(() =>
      (window as any).questAudio.every(
        (audio: HTMLAudioElement) => audio.paused,
      ),
    ),
  ).toBe(true);
});
test("opening solo alla prima visita e avvio al primo gesto se autoplay bloccato", async ({
  page,
}) => {
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<p>Opening player fixture</p>",
    }),
  );
  await page.addInitScript(() => {
    const scope = window as any;
    scope.YT = {
      Player: class {
        attempts = 0;
        constructor(
          _element: HTMLElement,
          private options: any,
        ) {
          setTimeout(() => options.events.onReady({ target: this }), 10);
        }
        setVolume() {}
        playVideo() {
          if (++this.attempts > 1)
            this.options.events.onStateChange({ data: 1, target: this });
        }
        pauseVideo() {}
        destroy() {}
      },
    };
  });
  await page.goto("");
  await expect(
    page.getByRole("complementary", { name: "Opening Marvel · Prima visita" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("marvel-watchverse.opening.v1"),
    ),
  ).toBeNull();
  await page
    .getByRole("button", { name: "Tocca per avviare la musica", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("marvel-watchverse.opening.v1")),
    )
    .toBe("seen");
  await page.reload();
  await expect(
    page.getByRole("complementary", { name: "Opening Marvel · Prima visita" }),
  ).toHaveCount(0);
});
