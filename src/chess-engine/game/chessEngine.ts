'use client';
import { Chess, type Move, type Square } from "chess.js";
import type { BoardPiece } from "./types";

export function createChessEngine(): Chess {
  return new Chess();
}

export function piecesFromEngine(chess: Chess): BoardPiece[] {
  return chess
    .board()
    .flat()
    .filter((piece): piece is NonNullable<typeof piece> => piece !== null)
    .map((piece) => ({
      square: piece.square,
      type: piece.type,
      color: piece.color
    }));
}

export function legalMovesForSquare(chess: Chess, square: Square): Move[] {
  return chess.moves({ square, verbose: true });
}

export function isLegalMove(chess: Chess, from: Square, to: Square): Move | undefined {
  return legalMovesForSquare(chess, from).find((move) => move.to === to);
}

