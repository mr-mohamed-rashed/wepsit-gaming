'use client';
import { executeAssassinCinematic } from "../styles/assassinCinematic";
import { executeChronoCinematic } from "../styles/chronoCinematic";
import { executeGeneralCinematic } from "../styles/generalCinematic";
import { executeMagicCinematic } from "../styles/magicCinematic";
import { executeMeleeCinematic } from "../styles/meleeCinematic";
import { executeRangeCinematic } from "../styles/rangeCinematic";
import { executeSummonerCinematic } from "../styles/summonerCinematic";
import { executeFallbackCinematic } from "./fallbackCinematic";
import type { CinematicExecutor, CinematicPayload } from "./cinematicTypes";
import { CinematicMissingAnimationError, PlayerStyleType } from "./cinematicTypes";

function getStyleExecutor(style: PlayerStyleType): CinematicExecutor {
  switch (style) {
    case PlayerStyleType.MAGIC:
      return executeMagicCinematic;
    case PlayerStyleType.MELEE:
      return executeMeleeCinematic;
    case PlayerStyleType.RANGE:
      return executeRangeCinematic;
    case PlayerStyleType.SUMMONER:
      return executeSummonerCinematic;
    case PlayerStyleType.ASSASSIN:
      return executeAssassinCinematic;
    case PlayerStyleType.CHRONO:
      return executeChronoCinematic;
    case PlayerStyleType.GENERAL:
      return executeGeneralCinematic;
    default:
      throw new CinematicMissingAnimationError(`No cinematic executor registered for style: ${style}`);
  }
}

export async function playCinematic(payload: CinematicPayload): Promise<void> {
  try {
    const execute = getStyleExecutor(payload.style);
    await execute(payload);
  } catch (error) {
    console.warn("[CinematicDirector] Falling back to quick transition.", {
      payload,
      error
    });
    await executeFallbackCinematic(payload);
  }
}

export function useCinematicDirector() {
  return { playCinematic };
}

export { PlayerStyleType };
export type { ChessPieceType, CinematicPayload, SpecialMoveType, VectorTuple } from "./cinematicTypes";

