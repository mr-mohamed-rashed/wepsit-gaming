'use client';
import type { CinematicPayload } from "../director/cinematicTypes";

export async function runTimedStyleCinematic(_payload: CinematicPayload, durationMs: number): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

