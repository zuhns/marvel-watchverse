import { test, expect } from "@playwright/test";

test("terminale TVA: flusso, suggerimenti, Terre confermate ed esplorazione", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("#universes");
  const canvas = page.locator(".temporal-canvas");
  await expect(canvas).toHaveAttribute("data-rendered", "ready");
  await expect(canvas).toHaveAttribute("data-motion", "flowing");
  const initial = Number(await canvas.getAttribute("data-time"));
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-time")))
    .toBeGreaterThan(initial + 0.2);
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
  const still = await canvas.getAttribute("data-time");
  await page.waitForTimeout(250);
  expect(await canvas.getAttribute("data-time")).toBe(still);
  await page.getByRole("button", { name: "Riprendi animazioni" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveAttribute("data-motion", "still");
  const reduced = await canvas.getAttribute("data-time");
  await page.waitForTimeout(250);
  expect(await canvas.getAttribute("data-time")).toBe(reduced);
  expect(errors).toEqual([]);
});

test("atmosfera audio reale: attivazione, volume, pausa e uscita dal terminale", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    const contexts: AudioContext[] = [];
    const samples: AnalyserNode[] = [];
    Object.assign(window, { tvaAudioTest: { contexts, samples } });
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        contexts.push(this);
      }
      createDynamicsCompressor() {
        const compressor = super.createDynamicsCompressor();
        const analyser = this.createAnalyser();
        analyser.fftSize = 2048;
        compressor.connect(analyser);
        samples.push(analyser);
        return compressor;
      }
    };
  });
  await page.goto("#universes");
  const state = () =>
    page.evaluate(
      () => (window as any).tvaAudioTest.contexts[0]?.state ?? "absent",
    );
  expect(await state()).toBe("absent");
  await page.getByRole("button", { name: "Attiva atmosfera sonora" }).click();
  await expect.poll(state).toBe("running");
  await expect(page.getByLabel("Volume atmosfera")).toHaveValue("35");
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
  await expect.poll(state).toBe("suspended");
  await page.getByRole("button", { name: "Riprendi animazioni" }).click();
  await expect.poll(state).toBe("running");
  await page
    .getByRole("button", { name: "Disattiva atmosfera sonora" })
    .click();
  await expect.poll(state).toBe("suspended");
  await page.goto("#archive");
  await expect.poll(state).toBe("closed");
  await expect(page.locator(".tva-audio-error")).toHaveCount(0);
});
