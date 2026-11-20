'use client';
import type { CinematicPayload } from "../director/cinematicTypes";
import { runTimedStyleCinematic } from "./timedStyleCinematic";

export async function executeRangeCinematic(payload: CinematicPayload): Promise<void> {
  await runTimedStyleCinematic(payload, 1700);
}

