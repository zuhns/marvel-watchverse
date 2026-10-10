const active = new Set<string>();
export const cinematicAudioActive = () => active.size > 0;
export function setCinematicAudio(value: boolean, owner = "snap") {
  if (value) active.add(owner);
  else active.delete(owner);
  window.dispatchEvent(new Event("watchverse:cinematic-audio"));
}
