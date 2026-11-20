'use client';
import type { Color, PieceSymbol } from "chess.js";
import type { PieceSetId } from "./game/types";

const pieceNames: Record<PieceSymbol, string> = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn"
};

export function pieceImageUrl(type: PieceSymbol, color: Color, pieceSet: PieceSetId): string {
  if (pieceSet === "stitch-black-gold" && color === "b") {
    return `/assets/stitch/black-gold-transparent/${pieceNames[type]}.png?v=black-gold-stitch-1`;
  }

  const metal = color === "w" ? "silver" : "gold";
  const versionByPiece: Partial<Record<PieceSymbol, string>> = {
    p: "gold-pawn-transparent-2",
    k: "gold-king-transparent-1"
  };
  const version = color === "b" && versionByPiece[type] ? `?v=${versionByPiece[type]}` : "";

  return `/assets/pieces/photo-gold-silver-clean-cut/${metal}/${pieceNames[type]}.png${version}`;
}

