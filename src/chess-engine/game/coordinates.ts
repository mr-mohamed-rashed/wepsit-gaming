'use client';
import type { Square } from "chess.js";
import { Vector3 } from "three";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export function squareToPosition(square: Square): Vector3 {
  const file = files.indexOf(square[0] as (typeof files)[number]);
  const rank = Number(square[1]);
  return new Vector3(file - 3.5, 0, 3.5 - (rank - 1));
}

export function squareColor(square: Square): "light" | "dark" {
  const file = files.indexOf(square[0] as (typeof files)[number]);
  const rank = Number(square[1]);
  return (file + rank) % 2 === 0 ? "dark" : "light";
}

export function allSquares(): Square[] {
  const squares: Square[] = [];
  for (let rank = 8; rank >= 1; rank -= 1) {
    for (const file of files) {
      squares.push(`${file}${rank}` as Square);
    }
  }
  return squares;
}

