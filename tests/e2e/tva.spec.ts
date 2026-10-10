import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("marvel-watchverse.opening.v1", "seen"),
  );
});

test("terminale TVA: flusso, suggerimenti, Terre confermate ed esplorazione", async ({
  page,
}, info) => {
  const errors: string[] = [];
  const textures: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().includes("tva-timeline.png")) textures.push(r.url());
  });
  await page.goto("#universes");
  const canvas = page.locator(".temporal-canvas");
  await expect(canvas).toHaveAttribute("data-rendered", "ready");
  await expect(canvas).toHaveAttribute("data-motion", "flowing");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl-procedural");
  const pixels = () =>
    canvas.evaluate((element: HTMLCanvasElement) => {
      const sample = document.createElement("canvas");
      sample.width = 160;
      sample.height = 70;
      const ctx = sample.getContext("2d")!;
      ctx.drawImage(element, 0, 0, 160, 70);
      return Array.from(ctx.getImageData(0, 0, 160, 70).data);
    });
  const before = await pixels();
  const initial = Number(await canvas.getAttribute("data-time"));
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-time")))
    .toBeGreaterThan(initial + 0.2);
  await expect
    .poll(async () => {
      const after = await pixels();
      return (
        after.reduce((sum, n, i) => sum + Math.abs(n - before[i]), 0) /
        after.length
      );
    })
    .toBeGreaterThan(0.5);
  expect(textures).toEqual([]);
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() => document.fonts.check('700 24px "TVA Display"')),
  ).toBe(true);
  await expect(page.locator(".tva-official-logo")).toBeVisible();
  const minutes = page.locator("video.miss-minutes");
  await expect
    .poll(() => minutes.evaluate((el: HTMLVideoElement) => el.currentTime))
    .toBeGreaterThan(0.1);
  const options = await page
    .getByLabel("Seleziona una Terra", { exact: true })
    .locator("option")
    .allTextContents();
  expect(options.length).toBeGreaterThan(20);
  expect(options.every((text) => /^Terra-\d+ · /.test(text))).toBe(true);
  expect(options.join(" ")).not.toMatch(
    /non confermata|Più Terre|Fuori dal tempo/,
  );
  const root = page.getByRole("button", {
    name: "Esplora Terra-616: Marvel Cinematic Universe",
    exact: true,
  });
  if (info.project.name === "mobile") await root.focus();
  else await root.hover();
  await expect(page.getByRole("tooltip")).toContainText("Terra-616");
  await expect(page.getByRole("tooltip")).toContainText(
    "Marvel Cinematic Universe",
  );
  const glass = await page.locator(".temporal-viewport").boundingBox();
  const tooltip = await page.getByRole("tooltip").boundingBox();
  expect(tooltip!.x).toBeGreaterThanOrEqual(glass!.x);
  expect(tooltip!.x + tooltip!.width).toBeLessThanOrEqual(
    glass!.x + glass!.width,
  );
  expect(tooltip!.y + tooltip!.height).toBeLessThanOrEqual(
    glass!.y + glass!.height,
  );
  await root.press("ArrowRight");
  await expect(page.getByRole("tooltip")).toContainText("Terra-10005");
  await page.getByRole("button", { name: "Aumenta ingrandimento" }).click();
  const viewport = page.locator(".temporal-viewport");
  expect(await viewport.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Esplora a sinistra" }).click();
  await expect
    .poll(() => viewport.evaluate((el) => el.scrollLeft))
    .toBeLessThan(500);
  const left = await viewport.evaluate((el) => el.scrollLeft);
  await page.getByRole("button", { name: "Esplora a destra" }).click();
  await expect
    .poll(() => viewport.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(left + 100);
  await page.getByLabel("Produzioni nella mappa").selectOption("series");
  await expect(
    page
      .getByLabel("Seleziona una Terra", { exact: true })
      .locator('option[value="96283"]'),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Universi animati", exact: true })
    .click();
  await expect(page.locator(".tva-menu-mascot")).toHaveCSS("left", /.+/);
  await expect(
    page.getByRole("img", { name: "Miss Minutes, guida della TVA" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pausa animazioni" }).click();
  await expect(canvas).toHaveAttribute("data-motion", "still");
  await expect
    .poll(() => minutes.evaluate((el: HTMLVideoElement) => el.paused))
    .toBe(true);
  const still = await canvas.getAttribute("data-time");
  await page.waitForTimeout(250);
  expect(await canvas.getAttribute("data-time")).toBe(still);
  await page.getByRole("button", { name: "Riprendi animazioni" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveAttribute("data-motion", "flowing");
  const reduced = Number(await canvas.getAttribute("data-time"));
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-time")))
    .toBeGreaterThan(reduced + 0.2);
  await expect
    .poll(() => minutes.evaluate((el: HTMLVideoElement) => el.paused))
    .toBe(false);
  expect(errors).toEqual([]);
});

test("il flusso rimane animato anche senza WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: any,
      ...args: any[]
    ) {
      if (type === "webgl" || type === "webgl2") return null;
      return original.call(this, type, ...args);
    } as typeof original;
  });
  await page.goto("#universes");
  const canvas = page.locator(".temporal-canvas");
  await expect(canvas).toHaveAttribute("data-renderer", "canvas-procedural");
  await expect(canvas).toHaveAttribute("data-rendered", "ready");
  const first = Number(await canvas.getAttribute("data-time"));
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-time")))
    .toBeGreaterThan(first + 0.3);
  await page.getByRole("button", { name: "Pausa animazioni" }).click();
  await expect(canvas).toHaveAttribute("data-motion", "still");
});

test("atmosfera audio reale: attivazione, volume, pausa e uscita dal terminale", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Original = window.Audio;
    const players: HTMLAudioElement[] = [];
    const samples: AnalyserNode[] = [];
    Object.assign(window, { tvaAudioTest: { players, samples } });
    (window as any).Audio = function (src: string) {
      const player = new Original(src),
        context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      context.createMediaElementSource(player).connect(analyser);
      analyser.connect(context.destination);
      document.addEventListener("pointerdown", () => void context.resume());
      players.push(player);
      samples.push(analyser);
      return player;
    };
  });
  await page.goto("#universes");
  const state = () =>
    page.evaluate(
      () => (window as any).tvaAudioTest.players[0]?.paused ?? true,
    );
  await expect(page.getByLabel("Volume atmosfera")).toHaveValue("10");
  await page.locator(".tva-official-logo").click();
  await expect.poll(state).toBe(false);
  const rms = () =>
    page.evaluate(() => {
      const analyser = (window as any).tvaAudioTest.samples[0] as AnalyserNode;
      const data = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(data);
      return Math.sqrt(data.reduce((sum, x) => sum + x * x, 0) / data.length);
    });
  await expect.poll(rms).toBeGreaterThan(0.0001);
  await page.getByLabel("Volume atmosfera").fill("0");
  await expect.poll(rms).toBeLessThan(0.0001);
  await page.getByLabel("Volume atmosfera").fill("50");
  await expect.poll(rms).toBeGreaterThan(0.0001);
  await page.getByRole("button", { name: "Pausa animazioni" }).click();
  await expect.poll(state).toBe(true);
  await page.getByRole("button", { name: "Riprendi animazioni" }).click();
  await expect.poll(state).toBe(false);
  await page
    .getByRole("button", { name: "Disattiva atmosfera sonora" })
    .click();
  await expect.poll(state).toBe(true);
  await page.goto("#archive");
  await expect.poll(state).toBe(true);
  expect(
    await page.evaluate(() =>
      (window as any).tvaAudioTest.players[0].getAttribute("src"),
    ),
  ).toBeNull();
  await expect(page.locator(".tva-audio-error")).toHaveCount(0);
});
