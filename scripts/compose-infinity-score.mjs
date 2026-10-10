import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const browser = await chromium.launch();
const page = await browser.newPage();
const result = await page.evaluate(async () => {
  const rate = 44100, duration = 14, context = new OfflineAudioContext(2, rate * duration, rate);
  const master = context.createGain(); master.gain.value = .55; master.connect(context.destination);
  const reverb = context.createConvolver(), impulse = context.createBuffer(2, rate * 4, rate);
  let seed = 193; const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let c = 0; c < 2; c++) { const data = impulse.getChannelData(c); for (let i = 0; i < data.length; i++) data[i] = (random() * 2 - 1) * (1 - i / data.length) ** 4; }
  reverb.buffer = impulse; const wet = context.createGain(); wet.gain.value = .6; reverb.connect(wet).connect(master);
  const note = (midi, time, length, level, type = "sine") => {
    const gain = context.createGain(); gain.connect(master); gain.connect(reverb);
    gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(level, time + .7); gain.gain.exponentialRampToValueAtTime(.00001, Math.min(duration, time + length));
    for (const detune of [-4, 4]) { const osc = context.createOscillator(); osc.frequency.value = 440 * 2 ** ((midi - 69) / 12); osc.detune.value = detune;
      if (type === "choir") { const imag = new Float32Array(24), real = new Float32Array(24); for (let n = 1; n < 24; n++) imag[n] = .4 / n ** 1.5 + .3 * Math.exp(-Math.pow((n * osc.frequency.value - 750) / 240, 2)) / n; osc.setPeriodicWave(context.createPeriodicWave(real, imag)); }
      else osc.type = type;
      osc.connect(gain); osc.start(time); osc.stop(Math.min(duration, time + length));
    }
  };
  // Dark original cue: sub-bass, unresolved choir and a falling bell motif.
  note(26, 0, 10, .10); note(38, .15, 12, .045);
  [50, 53, 57, 63].forEach((pitch, i) => note(pitch, .5 + i * .12, 11, .025, "choir"));
  [74, 69, 65, 62, 61].forEach((pitch, i) => note(pitch, 2 + i * 1.5, 5, .024, "triangle"));
  const noise = context.createBuffer(1, rate * 3, rate), data = noise.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = random() * 2 - 1;
  const crack = context.createBufferSource(); crack.buffer = noise; const crackFilter = context.createBiquadFilter(); crackFilter.type = "highpass"; crackFilter.frequency.value = 1500;
  const crackGain = context.createGain(); crackGain.gain.setValueAtTime(.45, .02); crackGain.gain.exponentialRampToValueAtTime(.00001, .17); crack.connect(crackFilter).connect(crackGain).connect(master); crackGain.connect(reverb); crack.start(.02); crack.stop(.18);
  const wind = context.createBufferSource(); wind.buffer = noise; wind.loop = true; const filter = context.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 620;
  const breeze = context.createGain(); breeze.gain.setValueAtTime(0, 0); breeze.gain.linearRampToValueAtTime(.13, 1.4); breeze.gain.exponentialRampToValueAtTime(.00001, 8); wind.connect(filter).connect(breeze).connect(reverb); wind.start(); wind.stop(9);
  const buffer = await context.startRendering(), channels = [buffer.getChannelData(0), buffer.getChannelData(1)]; let peak = 0, energy = 0;
  for (const channel of channels) for (const value of channel) { peak = Math.max(peak, Math.abs(value)); energy += value * value; }
  const scale = .8 / Math.max(peak, .01), bytes = new Uint8Array(44 + buffer.length * 4), view = new DataView(bytes.buffer);
  const text = (offset, str) => [...str].forEach((letter, i) => view.setUint8(offset + i, letter.charCodeAt(0)));
  text(0,"RIFF"); view.setUint32(4,bytes.length-8,true);text(8,"WAVE");text(12,"fmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,2,true);view.setUint32(24,rate,true);view.setUint32(28,rate*4,true);view.setUint16(32,4,true);view.setUint16(34,16,true);text(36,"data");view.setUint32(40,buffer.length*4,true);
  for(let i=0;i<buffer.length;i++) for(let c=0;c<2;c++) view.setInt16(44+i*4+c*2,Math.max(-32767,Math.min(32767,channels[c][i]*scale*32767)),true);
  let binary="";for(let i=0;i<bytes.length;i+=16384) binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
  return { base64:btoa(binary), duration, peak:peak*scale, rms: Math.sqrt(energy/(buffer.length*2))*scale };
});
await browser.close();
const wav = "../../work/infinity-snap.wav";
await writeFile(wav,Buffer.from(result.base64,"base64"));
const encoded = spawnSync(process.env.WATCHVERSE_FFMPEG || "ffmpeg", ["-hide_banner","-loglevel","error","-y","-i",wav,"-c:a","aac","-b:a","128k","-movflags","+faststart","public/assets/infinity-snap.m4a"],{encoding:"utf8"});
if(encoded.status!==0) throw Error(encoded.stderr || "Encoding failed");
delete result.base64;await writeFile("reports/infinity-score-analysis.json",JSON.stringify(result,null,2)+"\n");console.log(result);
