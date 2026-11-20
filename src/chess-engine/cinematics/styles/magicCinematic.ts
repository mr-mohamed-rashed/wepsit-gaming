'use client';
import type { CinematicPayload } from "../director/cinematicTypes";
import { runTimedStyleCinematic } from "./timedStyleCinematic";

export async function executeMagicCinematic(payload: CinematicPayload): Promise<void> {
  await runTimedStyleCinematic(payload, 2000);
}

