import { useTexture } from "@react-three/drei";
import { Suspense } from "react";
import type { Square } from "chess.js";
import { allSquares, squareColor, squareToPosition } from "../game/coordinates";
import type { BoardThemeId } from "../game/types";

type Board3DProps = {
  theme: BoardThemeId;
  onSquareClick: (square: Square) => void;
};

const boardThemes: Partial<Record<BoardThemeId, { light: string; dark: string; base: string; roughness: number; metalness: number }>> = {
  "classic-slate": {
    light: "#c9d1dc",
    dark: "#344052",
    base: "#151b26",
    roughness: 0.72,
    metalness: 0.02
  },
  "royal-wood": {
    light: "#c89b62",
    dark: "#4a2a18",
    base: "#24150d",
    roughness: 0.54,
    metalness: 0.08
  },
  "night-marble": {
    light: "#e4e7ec",
    dark: "#111827",
    base: "#080b12",
    roughness: 0.36,
    metalness: 0.18
  }
};

function ImageBoard({ src }: { src: string }) {
  const texture = useTexture(src);
  return (
    <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[10.4, 10.4]} />
      <meshStandardMaterial map={texture} roughness={0.4} metalness={0.1} />
    </mesh>
  );
}

export function Board3D({ theme, onSquareClick }: Board3DProps) {
  const isImageTheme = theme === "ocean-reef";
  const colors = boardThemes[theme];

  return (
    <group>
      {isImageTheme && (
        <Suspense fallback={null}>
          <ImageBoard src="/assets/boards/ocean-reef.jpg" />
        </Suspense>
      )}

      {allSquares().map((square) => {
        const position = squareToPosition(square);
        const color = colors ? (squareColor(square) === "light" ? colors.light : colors.dark) : undefined;
        return (
          <group key={square}>
          {!isImageTheme && colors && (
            <mesh position={[position.x, -0.06, position.z]} receiveShadow>
              <boxGeometry args={[1, 0.08, 1]} />
              <meshStandardMaterial color={color} roughness={colors.roughness} metalness={colors.metalness} />
            </mesh>
          )}
          <mesh
            position={[position.x, 0.015, position.z]}
            onClick={(event) => {
              event.stopPropagation();
              onSquareClick(square);
            }}
          >
            <boxGeometry args={[0.98, 0.03, 0.98]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          </group>
        );
      })}
      
      {!isImageTheme && colors && (
        <mesh position={[0, -0.13, 0]} receiveShadow>
          <boxGeometry args={[8.4, 0.14, 8.4]} />
          <meshStandardMaterial color={colors.base} roughness={0.58} metalness={0.18} />
        </mesh>
      )}
    </group>
  );
}

