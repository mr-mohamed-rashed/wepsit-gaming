'use client';
import type { Move } from "chess.js";
import { squareToPosition } from "../game/coordinates";

type MoveHighlightsProps = {
  moves: Move[];
};

export function MoveHighlights({ moves }: MoveHighlightsProps) {
  return (
    <group>
      {moves.map((move) => {
        const position = squareToPosition(move.to);
        const isCapture = Boolean(move.captured);
        return (
          <mesh key={`${move.from}-${move.to}-${move.flags}`} position={[position.x, 0.03, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
            {isCapture ? <ringGeometry args={[0.34, 0.45, 40]} /> : <circleGeometry args={[0.18, 32]} />}
            <meshBasicMaterial
              color={isCapture ? "#ff6f7d" : "#67e8a5"}
              transparent
              opacity={isCapture ? 0.78 : 0.72}
            />
          </mesh>
        );
      })}
    </group>
  );
}

