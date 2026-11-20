'use client';
import type { CinematicPayload } from "../director/cinematicTypes";
import { runTimedStyleCinematic } from "./timedStyleCinematic";

export async function executeSummonerCinematic(payload: CinematicPayload): Promise<void> {
  await runTimedStyleCinematic(payload, 2100);
}

