'use client';
import { PlayerStyleCaptureScene } from "../cinematics/playerStyleScenes";
import { useGameStore } from "../game/gameStore";

export function CaptureVfxController() {
  const captureEvent = useGameStore((state) => state.captureEvent);

  if (!captureEvent) {
    return null;
  }

  return <PlayerStyleCaptureScene key={captureEvent.id} event={captureEvent} />;
}

