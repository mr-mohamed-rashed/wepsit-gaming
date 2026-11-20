'use client';
import { useFBX, useGLTF } from "@react-three/drei";
import { PlayerStyleType } from "../cinematics/director/cinematicTypes";

export type CharacterActionName =
  | "Idle"
  | "Walk"
  | "Pawn_Capture"
  | "Rook_Capture"
  | "Knight_Capture"
  | "Bishop_Capture"
  | "Queen_Capture"
  | "Castling"
  | "CheckEscape";

export type CharacterAssetDefinition = {
  style: PlayerStyleType;
  label: string;
  format: "glb" | "fbx";
  modelPath: string;
  defaultScale: number;
  actionClips: Record<CharacterActionName, string>;
};

const sharedClips: Record<CharacterActionName, string> = {
  Idle: "Idle",
  Walk: "Walk",
  Pawn_Capture: "Pawn_Capture",
  Rook_Capture: "Rook_Capture",
  Knight_Capture: "Knight_Capture",
  Bishop_Capture: "Bishop_Capture",
  Queen_Capture: "Queen_Capture",
  Castling: "Castling",
  CheckEscape: "CheckEscape"
};

export const characterAssets: Record<PlayerStyleType, CharacterAssetDefinition> = {
  [PlayerStyleType.MELEE]: {
    style: PlayerStyleType.MELEE,
    label: "Melee Warrior",
    format: "glb",
    modelPath: "/assets/characters/melee/character.glb",
    defaultScale: 1,
    actionClips: sharedClips
  },
  [PlayerStyleType.MAGIC]: {
    style: PlayerStyleType.MAGIC,
    label: "Magic Wizard Test",
    format: "fbx",
    modelPath: "/assets/characters/magic/Standing%202H%20Magic%20Attack%2001.fbx",
    defaultScale: 0.01,
    actionClips: sharedClips
  },
  [PlayerStyleType.RANGE]: {
    style: PlayerStyleType.RANGE,
    label: "Range Archer",
    format: "glb",
    modelPath: "/assets/characters/range/character.glb",
    defaultScale: 1,
    actionClips: sharedClips
  },
  [PlayerStyleType.GENERAL]: {
    style: PlayerStyleType.GENERAL,
    label: "General Commander",
    format: "glb",
    modelPath: "/assets/characters/general/character.glb",
    defaultScale: 1,
    actionClips: sharedClips
  },
  [PlayerStyleType.SUMMONER]: {
    style: PlayerStyleType.SUMMONER,
    label: "Summoner",
    format: "glb",
    modelPath: "/assets/characters/summoner/character.glb",
    defaultScale: 1,
    actionClips: sharedClips
  },
  [PlayerStyleType.ASSASSIN]: {
    style: PlayerStyleType.ASSASSIN,
    label: "Assassin",
    format: "glb",
    modelPath: "/assets/characters/assassin/character.glb",
    defaultScale: 1,
    actionClips: sharedClips
  },
  [PlayerStyleType.CHRONO]: {
    style: PlayerStyleType.CHRONO,
    label: "Chronomancer",
    format: "glb",
    modelPath: "/assets/characters/chrono/character.glb",
    defaultScale: 1,
    actionClips: sharedClips
  }
};

export function getCharacterAsset(style: PlayerStyleType): CharacterAssetDefinition {
  return characterAssets[style];
}

export function preloadCharacterAssets(styles: PlayerStyleType[] = Object.values(PlayerStyleType)): void {
  for (const style of styles) {
    const asset = characterAssets[style];
    if (asset.format === "fbx") {
      useFBX.preload(asset.modelPath);
    } else {
      useGLTF.preload(asset.modelPath);
    }
  }
}

export function CharacterAssetsPreloader() {
  preloadCharacterAssets();
  return null;
}

export function preloadMagicTestCharacter(): void {
  const asset = characterAssets[PlayerStyleType.MAGIC];
  useFBX.preload(asset.modelPath);
}

