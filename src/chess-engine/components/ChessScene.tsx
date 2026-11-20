'use client';
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import type { Square } from "chess.js";
import { Suspense } from "react";
import { useGameStore } from "../game/gameStore";
import { Board3D } from "./Board3D";
import { Piece3D } from "./Piece3D";
import { MoveHighlights } from "./MoveHighlights";
import { CaptureVfxController } from "../vfx/CaptureVfxController";
import { CharacterCinematicLayer } from "../characters/CharacterCinematicBridge";

export function ChessScene() {
  const pieces = useGameStore((state) => state.pieces);
  const pieceSet = useGameStore((state) => state.pieceSet);
  const boardTheme = useGameStore((state) => state.boardTheme);
  const selectedSquare = useGameStore((state) => state.selectedSquare);
  const legalMoves = useGameStore((state) => state.legalMoves);
  const pendingMove = useGameStore((state) => state.pendingMove);
  const selectSquare = useGameStore((state) => state.selectSquare);
  const tryMove = useGameStore((state) => state.tryMove);
  const completePendingMove = useGameStore((state) => state.completePendingMove);

  const handleSquareClick = (square: Square) => {
    if (legalMoves.some((move) => move.to === square)) {
      tryMove(square);
      return;
    }
    selectSquare(square);
  };

  return (
    <Canvas shadows camera={{ position: [0, 7.2, 8.6], fov: 42 }}>
      <color attach="background" args={["#101722"]} />
      <ambientLight intensity={0.38} />
      <directionalLight position={[5, 9, 4]} intensity={1.25} castShadow shadow-mapSize={[2048, 2048]} />
      <Board3D theme={boardTheme} onSquareClick={handleSquareClick} />
      <MoveHighlights moves={legalMoves} />
      {pieces.map((piece) => (
        <Piece3D
          key={piece.square}
          piece={piece}
          pieceSet={pieceSet}
          selected={piece.square === selectedSquare}
          pendingMove={pendingMove}
          onClick={handleSquareClick}
          onMoveComplete={completePendingMove}
        />
      ))}
      <CaptureVfxController />
      <Suspense
        fallback={
          <mesh position={[0, 0.25, 2.6]}>
            <sphereGeometry args={[0.16, 16, 12]} />
            <meshBasicMaterial color="#adc6ff" transparent opacity={0.8} />
          </mesh>
        }
      >
        <CharacterCinematicLayer />
      </Suspense>
      <ContactShadows position={[0, -0.08, 0]} opacity={0.45} scale={11} blur={2.4} />
      <Environment preset="park" environmentIntensity={0.45} />
      <OrbitControls enablePan={false} minDistance={6.5} maxDistance={12} maxPolarAngle={Math.PI / 2.2} />
      <EffectComposer>
        <Bloom intensity={0.28} luminanceThreshold={0.82} luminanceSmoothing={0.22} />
      </EffectComposer>
    </Canvas>
  );
}

