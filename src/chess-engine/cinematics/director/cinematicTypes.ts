'use client';
export enum PlayerStyleType {
  MELEE = "MELEE",
  MAGIC = "MAGIC",
  GENERAL = "GENERAL",
  ASSASSIN = "ASSASSIN",
  RANGE = "RANGE",
  SUMMONER = "SUMMONER",
  CHRONO = "CHRONO"
}

export type ChessPieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king";

export type SpecialMoveType = "castling" | "checkEscape";

export type VectorTuple = [number, number, number];

export interface CinematicPayload {
  style: PlayerStyleType;
  piece: ChessPieceType;
  fromCoords: VectorTuple;
  toCoords: VectorTuple;
  isSpecialMove?: SpecialMoveType;
}

export type CinematicExecutor = (payload: CinematicPayload) => Promise<void>;

export class CinematicMissingAnimationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CinematicMissingAnimationError";
  }
}

