'use client';
import type { Color, PieceSymbol, Square } from "chess.js";

export type PlayerStyle = "melee" | "magic" | "range" | "summoner" | "assassin" | "chrono" | "general";

export type CaptureEffect =
  | "freeze"
  | "teleport"
  | "polymorph"
  | "lightning"
  | "smash"
  | "slice"
  | "uppercut"
  | "execution"
  | "sniper"
  | "artillery"
  | "arrow-rain"
  | "phantom"
  | "earth-claws"
  | "beast"
  | "minions"
  | "backstab"
  | "toxic"
  | "shadow"
  | "decay"
  | "rewind"
  | "command-strike"
  | "royal-guard"
  | "formation-break";

export type BoardPiece = {
  square: Square;
  type: PieceSymbol;
  color: Color;
};

export type CaptureEvent = {
  id: number;
  attacker: BoardPiece;
  victim: BoardPiece;
  to: Square;
  style: PlayerStyle;
  effect: CaptureEffect;
};

export type PendingMove = {
  id: number;
  from: Square;
  to: Square;
  attacker: BoardPiece;
  victim: BoardPiece | null;
  promotion: "q";
  rookMove?: {
    from: Square;
    to: Square;
  };
};

export type PieceSetId = "photo-gold-silver" | "stitch-black-gold" | "stitch-white-gold";

export type BoardThemeId = "classic-slate" | "royal-wood" | "night-marble" | "ocean-reef";

export type BotDifficulty = "easy" | "medium" | "hard";

