'use client';
import type { CinematicPayload } from "../director/cinematicTypes";
import { runTimedStyleCinematic } from "./timedStyleCinematic";

export async function executeAssassinCinematic(payload: CinematicPayload): Promise<void> {
  await runTimedStyleCinematic(payload, 1600);
}

