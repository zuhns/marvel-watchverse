import { test, expect } from "@playwright/test";
import { Buffer } from "node:buffer";
test.beforeEach(async ({ page }, info) => {
  if (!info.title.includes("opening"))
    await page.addInitScript(() =>
      localStorage.setItem("marvel-watchverse.opening-audio.v2", "seen"),
    );
});

test("opening solo audio in background, primo gesto e sola prima visita", async ({
  page,
}) => {
  const rate = 16000,
    samples = rate * 3,
    wav = Buffer.alloc(44 + samples * 2);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    wav.writeInt16LE(
      Math.round(Math.sin((i * Math.PI * 440) / rate) * 3000),
      44 + i * 2,
    );
  await page.route("**/data/opening-audio.json", (route) =>
    route.fulfill({ json: { src: "assets/opening-fixture.wav" } }),
  );
  await page.route("**/assets/opening-fixture.wav", (route) =>
    route.fulfill({ contentType: "audio/wav", body: wav }),
  );
  await page.addInitScript(() => {
    const scope = window as any,
      NativeAudio = window.Audio;
    scope.openingPlayers = [];
    scope.Audio = function (src: string) {
      const player = new NativeAudio(src),
        original = player.play.bind(player);
      let attempts = 0;
      player.play = () =>
        ++attempts === 1
          ? Promise.reject(
              new DOMException("Gesture required", "NotAllowedError"),
            )
          : original();
      scope.openingPlayers.push(player);
      return player;
    };
  });
  const youtube: string[] = [];
  page.on("request", (request) => {
    if (/youtube/.test(request.url())) youtube.push(request.url());
  });
  await page.goto("");
  await expect
    .poll(() => page.evaluate(() => (window as any).openingPlayers.length))
    .toBe(1);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("marvel-watchverse.opening-audio.v2"),
    ),
  ).toBeNull();
  await page.locator("header .brand").click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage.getItem("marvel-watchverse.opening-audio.v2"),
      ),
    )
    .toBe("seen");
  await expect(
    page.getByRole("button", { name: "Silenzia sigla Marvel" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).openingPlayers[0].currentTime),
    )
    .toBeGreaterThan(0);
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(youtube).toEqual([]);
  await expect(
    page.getByRole("button", { name: "Silenzia sigla Marvel" }),
  ).toHaveCount(0, { timeout: 6000 });
  await page.reload();
  await expect.poll(() => page.locator(".hero").count()).toBe(1);
  expect(await page.evaluate(() => (window as any).openingPlayers.length)).toBe(
    0,
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
  const positions = await page.locator(".movie-card").evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return {
        id: (node as HTMLElement).dataset.infinityTitle,
        x: box.x,
        // Layout coordinates exclude the independent scroll-reveal translation.
        y: (node as HTMLElement).offsetTop,
        width: box.width,
        height: box.height,
      };
    }),
  );
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
  await expect(page.locator(".gauntlet-relic .gauntlet-stone")).toHaveCount(6);
  await expect(page.locator(".gauntlet-relic .stone-soul")).toHaveCSS(
    "opacity",
    "1",
  );
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
  await expect
    .poll(() =>
      page
        .locator(".stardust-session")
        .getAttribute("data-fragments")
        .then((value) => Number(value)),
    )
    .toBeGreaterThan(200);
  await expect
    .poll(() =>
      page
        .locator(".stardust-session")
        .getAttribute("data-airborne")
        .then((value) => Number(value)),
    )
    .toBeGreaterThan(100);
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: `reports/infinity-dust-${test.info().project.name}.png`,
  });
  await expect
    .poll(() => page.locator(".movie-card:not(.infinity-vacant)").count(), {
      timeout: 8000,
    })
    .toBeLessThan(before);
  await expect(page.locator(".movie-card")).toHaveCount(before);
  expect(
    await page.locator(".movie-card").evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return {
          id: (node as HTMLElement).dataset.infinityTitle,
          x: box.x,
          y: (node as HTMLElement).offsetTop,
          width: box.width,
          height: box.height,
        };
      }),
    ),
  ).toEqual(positions);
  await expect(page.locator(".infinity-vacant").first()).toBeHidden();
  await expect(page.locator(".infinity-vacant").first()).toHaveAttribute(
    "inert",
    "",
  );
  await page.screenshot({
    path: `reports/infinity-gaps-${test.info().project.name}.png`,
  });
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

test("schiocco con polvere anche quando Windows disattiva le animazioni", async ({
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
  await expect(page.locator(".poster-dust-canvas").first()).toBeVisible();
  await expect
    .poll(async () =>
      Number(
        await page.locator(".stardust-session").getAttribute("data-fragments"),
      ),
    )
    .toBeGreaterThan(200);
  await expect
    .poll(async () =>
      Number(
        await page.locator(".stardust-session").getAttribute("data-airborne"),
      ),
    )
    .toBeGreaterThan(100);
  await expect
    .poll(() => page.locator(".movie-card:not(.infinity-vacant)").count(), {
      timeout: 8000,
    })
    .toBeLessThan(30);
  await expect(page.locator(".movie-card")).toHaveCount(30);
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
