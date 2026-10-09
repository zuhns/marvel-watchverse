// Original 96-second composition. Render in Chromium, then encode with FFmpeg.
// No soundtrack samples or melodies from Loki are used.
import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const result = await page.evaluate(async () => {
  const duration = 96,
    rate = 44100;
  const ctx = new OfflineAudioContext(2, rate * duration, rate);
  const dry = ctx.createGain();
  dry.gain.value = 0.72;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 4200;
  const master = ctx.createGain();
  master.gain.value = 0.8;
  dry.connect(filter).connect(master).connect(ctx.destination);
  const reverb = ctx.createConvolver(),
    ir = ctx.createBuffer(2, rate * 6, rate);
  let seed = 41;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let c = 0; c < 2; c++) {
    const data = ir.getChannelData(c);
    for (let i = 0; i < data.length; i++)
      data[i] = (rand() * 2 - 1) * Math.pow(1 - i / data.length, 3.8);
  }
  reverb.buffer = ir;
  const wet = ctx.createGain();
  wet.gain.value = 0.65;
  dry.connect(reverb).connect(wet).connect(master);
  const delay = ctx.createDelay(3);
  delay.delayTime.value = 0.75;
  const echo = ctx.createGain();
  echo.gain.value = 0.28;
  dry.connect(delay).connect(echo).connect(dry);
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
  function voice(midi, time, length, level, pan, kind = "choir") {
    if (time >= duration) return;
    const gain = ctx.createGain(),
      panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    gain.connect(panner).connect(dry);
    const end = Math.min(duration, time + length);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(
      level,
      time + Math.min(kind === "bell" ? 0.018 : 3, length * 0.22),
    );
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.00002, level * 0.64),
      Math.max(time + 0.05, end - 2),
    );
    gain.gain.linearRampToValueAtTime(0, end);
    const f = hz(midi);
    for (const detune of kind === "choir" ? [-5, 5] : [0]) {
      const osc = ctx.createOscillator();
      osc.frequency.value = f;
      osc.detune.value = detune;
      if (kind === "choir") {
        const real = new Float32Array(25),
          imag = new Float32Array(25);
        for (let h = 1; h < 25; h++)
          imag[h] =
            0.28 / Math.pow(h, 1.6) +
            (0.7 * Math.exp(-Math.pow((h * f - 650) / 190, 2)) +
              0.45 * Math.exp(-Math.pow((h * f - 1150) / 280, 2))) /
              h;
        osc.setPeriodicWave(ctx.createPeriodicWave(real, imag));
        const vibrato = ctx.createOscillator(),
          depth = ctx.createGain();
        vibrato.frequency.value = 4.1 + rand() * 0.7;
        depth.gain.value = 4.5;
        vibrato.connect(depth).connect(osc.detune);
        vibrato.start(time);
        vibrato.stop(end);
      } else if (kind === "bell") {
        const real = new Float32Array(10),
          imag = new Float32Array(10);
        imag[1] = 1;
        imag[3] = 0.22;
        imag[7] = 0.07;
        osc.setPeriodicWave(ctx.createPeriodicWave(real, imag));
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(f * 0.97, time);
        osc.frequency.exponentialRampToValueAtTime(f, time + 0.22);
      }
      osc.connect(gain);
      osc.start(time);
      osc.stop(end);
    }
  }
  // Slow harmonic movement: D minor(add9), Bb major7, F(add9)/A, C sus4.
  const chords = [
    [50, 57, 62, 65, 69, 76],
    [46, 53, 58, 62, 65, 69],
    [45, 53, 60, 65, 67, 72],
    [48, 55, 60, 65, 67, 74],
  ];
  for (let section = 0; section < 8; section++) {
    const chord = chords[section % 4],
      t = section * 12;
    chord.forEach((n, i) =>
      voice(
        n,
        t,
        18,
        [0.033, 0.03, 0.032, 0.026, 0.018, 0.012][i],
        (i % 2 ? 1 : -1) * (0.2 + i * 0.07),
      ),
    );
  }
  // A measured pulse and changing high notes make the passing of time audible.
  for (let t = 0; t < duration; t += 1.5) {
    const section = Math.floor(t / 12) % 4,
      step = Math.floor(t / 1.5) % 8;
    const theme = [0, 4, 2, 5, 1, 4, 3, 2];
    voice(
      chords[section][theme[step]] + 12,
      t,
      4.5,
      0.017 + Math.sin(t * 0.13) * 0.003,
      Math.sin(t * 0.09) * 0.55,
      "bell",
    );
  }
  // Long, theremin-like calls drifting over the choir. An original melody.
  [74, 69, 77, 76, 72, 67, 74, 69].forEach((n, i) =>
    voice(n, i * 12 + 4, 10, 0.013, Math.sin(i * 1.2) * 0.55, "call"),
  );
  // Very soft heartbeats are felt beneath the music rather than an electrical hum.
  for (let t = 0; t < duration; t += 3) voice(38, t, 0.8, 0.022, 0, "call");
  master.gain.setValueAtTime(0, 0);
  master.gain.linearRampToValueAtTime(0.8, 3);
  master.gain.setValueAtTime(0.8, duration - 4);
  master.gain.linearRampToValueAtTime(0, duration);
  const audio = await ctx.startRendering();
  const left = audio.getChannelData(0),
    right = audio.getChannelData(1);
  let peak = 0;
  for (let i = 0; i < left.length; i++)
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  const scale = 0.82 / peak;
  const bytes = new Uint8Array(44 + left.length * 4),
    v = new DataView(bytes.buffer);
  const text = (p, s) => {
    for (let i = 0; i < s.length; i++) bytes[p + i] = s.charCodeAt(i);
  };
  text(0, "RIFF");
  v.setUint32(4, bytes.length - 8, true);
  text(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 2, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 4, true);
  v.setUint16(32, 4, true);
  v.setUint16(34, 16, true);
  text(36, "data");
  v.setUint32(40, left.length * 4, true);
  for (let i = 0; i < left.length; i++) {
    v.setInt16(
      44 + i * 4,
      Math.max(-32767, Math.min(32767, left[i] * scale * 32767)),
      true,
    );
    v.setInt16(
      46 + i * 4,
      Math.max(-32767, Math.min(32767, right[i] * scale * 32767)),
      true,
    );
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16384)
    binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  const windows = [];
  for (let s = 0; s < duration; s += 6) {
    let sum = 0;
    for (let i = s * rate; i < (s + 6) * rate; i++)
      sum += left[i] * left[i] * scale * scale;
    windows.push(Math.sqrt(sum / (rate * 6)));
  }
  return {
    base64: btoa(binary),
    duration,
    rate,
    peak: peak * scale,
    rmsWindows: windows,
  };
});
await browser.close();
const wav = process.argv[2] ?? "../../work/temporal-score.wav";
await writeFile(wav, Buffer.from(result.base64, "base64"));
const encoded = spawnSync(
  process.env.WATCHVERSE_FFMPEG ?? "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    wav,
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-movflags",
    "+faststart",
    "public/assets/temporal-score.m4a",
  ],
  { encoding: "utf8" },
);
if (encoded.status !== 0)
  throw Error(encoded.stderr || "Audio encoding failed");
delete result.base64;
await writeFile(
  "reports/temporal-score-analysis.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(result));
