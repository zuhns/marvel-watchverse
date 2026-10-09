import { useEffect, useRef, useState } from "react";

type Atmosphere = {
  context: AudioContext;
  master: GainNode;
  sources: AudioScheduledSourceNode[];
};
function createAtmosphere(): Atmosphere {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -22;
  compressor.ratio.value = 5;
  master.connect(compressor).connect(context.destination);
  const bus = context.createGain();
  bus.gain.value = 0.22;
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1400;
  filter.Q.value = 0.4;
  bus.connect(filter).connect(master);
  const sources: AudioScheduledSourceNode[] = [];
  // Original ambient synthesis: low drones, slow beating and distant harmonics.
  const impulse = context.createBuffer(
    2,
    context.sampleRate * 3.5,
    context.sampleRate,
  );
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3.4);
  }
  const reverb = context.createConvolver();
  reverb.buffer = impulse;
  const wet = context.createGain();
  wet.gain.value = 0.25;
  bus.connect(reverb).connect(wet).connect(master);
  [55, 55.16, 82.41, 110, 164.81, 220.12].forEach((frequency, i) => {
    const oscillator = context.createOscillator();
    oscillator.type = i === 0 ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    const gain = context.createGain();
    gain.gain.value = [0.18, 0.12, 0.06, 0.045, 0.03, 0.015][i];
    const panner = context.createStereoPanner();
    panner.pan.value = (i % 2 ? 1 : -1) * 0.35;
    oscillator.connect(gain).connect(panner).connect(bus);
    const breathing = context.createOscillator();
    breathing.frequency.value = 0.025 + i * 0.006;
    const modulation = context.createGain();
    modulation.gain.value = gain.gain.value * 0.28;
    breathing.connect(modulation).connect(gain.gain);
    oscillator.start();
    breathing.start();
    sources.push(oscillator, breathing);
  });
  const noise = context.createBuffer(
    1,
    context.sampleRate * 4,
    context.sampleRate,
  );
  const data = noise.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + (Math.random() * 2 - 1) * 0.018) / 1.018;
    data[i] = last * 3;
  }
  const tape = context.createBufferSource();
  tape.buffer = noise;
  tape.loop = true;
  const tapeFilter = context.createBiquadFilter();
  tapeFilter.type = "bandpass";
  tapeFilter.frequency.value = 480;
  tapeFilter.Q.value = 0.3;
  const tapeGain = context.createGain();
  tapeGain.gain.value = 0.065;
  tape.connect(tapeFilter).connect(tapeGain).connect(bus);
  tape.start();
  sources.push(tape);
  return { context, master, sources };
}
export function useTvaAmbience(paused: boolean) {
  const audio = useRef<Atmosphere | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(35);
  const [error, setError] = useState("");
  const toggle = async () => {
    if (enabled) {
      setEnabled(false);
      return;
    }
    try {
      audio.current ??= createAtmosphere();
      // Called directly by the sound button: browsers require a user gesture.
      await audio.current.context.resume();
      setEnabled(true);
      setError("");
    } catch {
      setError("Audio non disponibile in questo browser.");
    }
  };
  useEffect(() => {
    let suspendTimer: ReturnType<typeof setTimeout> | undefined;
    const apply = () => {
      clearTimeout(suspendTimer);
      const node = audio.current;
      if (!node) return;
      const active = enabled && !paused && !document.hidden;
      node.master.gain.setTargetAtTime(
        active ? (volume / 100) * 0.75 : 0,
        node.context.currentTime,
        0.3,
      );
      if (active)
        void node.context
          .resume()
          .catch(() => setError("Tocca Audio per riprendere l’atmosfera."));
      else
        suspendTimer = setTimeout(() => {
          if (node.context.state !== "closed") void node.context.suspend();
        }, 1100);
    };
    apply();
    document.addEventListener("visibilitychange", apply);
    return () => {
      clearTimeout(suspendTimer);
      document.removeEventListener("visibilitychange", apply);
    };
  }, [enabled, volume, paused]);
  useEffect(
    () => () => {
      const node = audio.current;
      if (node) {
        node.sources.forEach((source) => source.stop());
        void node.context.close();
      }
    },
    [],
  );
  return { enabled, volume, setVolume, toggle, error };
}
