import { useEffect, useRef, useState } from "react";

type Atmosphere = {
  context: AudioContext;
  master: GainNode;
  source: AudioBufferSourceNode | null;
};
let scoreBytes: Promise<ArrayBuffer> | undefined;
function createAtmosphere(): Atmosphere {
  const context = new AudioContext(),
    master = context.createGain();
  master.gain.value = 0;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.ratio.value = 3;
  master.connect(compressor).connect(context.destination);
  return { context, master, source: null };
}
async function loadScore(node: Atmosphere) {
  const closed = () => node.context.state === "closed";
  scoreBytes ??= fetch(`${import.meta.env.BASE_URL}assets/temporal-score.m4a`)
    .then((r) => {
      if (!r.ok) throw Error("Temporal score unavailable");
      return r.arrayBuffer();
    })
    .catch((e) => {
      scoreBytes = undefined;
      throw e;
    });
  const bytes = await scoreBytes;
  if (closed()) return;
  const buffer = await node.context.decodeAudioData(bytes.slice(0));
  if (closed()) return;
  const source = node.context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(node.master);
  source.start();
  node.source = source;
}
export function useTvaAmbience(paused: boolean) {
  const audio = useRef<Atmosphere | null>(null),
    alive = useRef(true),
    pending = useRef(false);
  const [enabled, setEnabled] = useState(false),
    [volume, setVolume] = useState(35),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const toggle = async () => {
    if (pending.current) return;
    if (enabled) {
      setEnabled(false);
      return;
    }
    pending.current = true;
    setLoading(true);
    try {
      audio.current ??= createAtmosphere();
      // Create/resume in the button gesture, before downloading or decoding.
      await audio.current.context.resume();
      if (!audio.current.source) await loadScore(audio.current);
      if (alive.current && audio.current.context.state !== "closed") {
        setEnabled(true);
        setError("");
      }
    } catch {
      if (alive.current)
        setError(
          "Impossibile caricare l’atmosfera. Riprova dal pulsante Audio.",
        );
    } finally {
      pending.current = false;
      if (alive.current) setLoading(false);
    }
  };
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const apply = () => {
      clearTimeout(timer);
      const node = audio.current;
      if (!node || node.context.state === "closed") return;
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
        timer = setTimeout(() => {
          if (node.context.state !== "closed") void node.context.suspend();
        }, 1100);
    };
    apply();
    document.addEventListener("visibilitychange", apply);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", apply);
    };
  }, [enabled, volume, paused]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      const node = audio.current;
      if (node) {
        node.source?.stop();
        void node.context.close();
      }
    };
  }, []);
  return { enabled, volume, setVolume, toggle, error, loading };
}
