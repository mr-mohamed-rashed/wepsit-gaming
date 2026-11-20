'use client';
import type { CinematicPayload } from "../director/cinematicTypes";
import { runTimedStyleCinematic } from "./timedStyleCinematic";

export async function executeChronoCinematic(payload: CinematicPayload): Promise<void> {
  await runTimedStyleCinematic(payload, 2000);
}

