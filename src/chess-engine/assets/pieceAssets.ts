'use client';
import type { Color, PieceSymbol } from "chess.js";
import type { PieceSetId } from "../game/types";

const pieceNames: Record<PieceSymbol, string> = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn"
};

export function pieceImageUrl(type: PieceSymbol, color: Color, pieceSet: PieceSetId): string {
  // If playing as White (color 'w'), apply the selected pieceSet
  if (color === "w") {
    if (pieceSet === "stitch-black-gold") {
      return `/assets/stitch/black-gold-transparent/${pieceNames[type]}.png?v=black-gold-stitch-1`;
    }
    if (pieceSet === "stitch-white-gold") {
      return `/assets/stitch/black-gold-transparent/${pieceNames[type]}.png?v=white-gold-stitch-1`;
    }
    // Default fallback for photo-gold-silver
    return `/assets/pieces/photo-gold-silver-clean-cut/gold/${pieceNames[type]}.png?v=gold-king-transparent-1`;
  }

  // If opponent (Black 'b'), apply a contrasting set
  if (pieceSet === "stitch-black-gold" || pieceSet === "stitch-white-gold") {
    // If player uses a stitch set, give opponent the classic silver
    return `/assets/pieces/photo-gold-silver-clean-cut/silver/${pieceNames[type]}.png`;
  }
  
  // Default fallback for opponent
  return `/assets/pieces/photo-gold-silver-clean-cut/silver/${pieceNames[type]}.png`;
}

