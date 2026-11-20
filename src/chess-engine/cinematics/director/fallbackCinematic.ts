'use client';
import type { CinematicPayload } from "./cinematicTypes";

const fallbackDurationMs = 180;

export async function executeFallbackCinematic(_payload: CinematicPayload): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, fallbackDurationMs);
  });
}

