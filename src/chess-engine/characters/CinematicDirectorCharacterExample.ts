'use client';
import { PlayerStyleType } from "../cinematics/director";
import { playCharacterCinematic } from "./CharacterCinematicBridge";

export async function playMagicWizardPawnCaptureExample(spawnPosition: [number, number, number]): Promise<void> {
  await playCharacterCinematic({
    style: PlayerStyleType.MAGIC,
    actionType: "Pawn_Capture",
    position: spawnPosition,
    rotationY: 0
  });
}

