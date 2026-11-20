'use client';
import { Billboard, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Square } from "chess.js";
import { useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import { Vector3 } from "three";
import { pieceImageUrl } from "../assets/pieceAssets";
import { squareToPosition } from "../game/coordinates";
import type { BoardPiece, PendingMove, PieceSetId } from "../game/types";

type Piece3DProps = {
  piece: BoardPiece;
  pieceSet: PieceSetId;
  selected: boolean;
  pendingMove: PendingMove | null;
  onClick: (square: Square) => void;
  onMoveComplete: (moveId: number) => void;
};

const baseY = 0.04;
const jumpHeight = 0.92;
const moveDurationSeconds = 0.52;

// Universal standard template for piece sizes (All sets will strictly use these)
const standardPieceScale = {
  p: [0.85, 0.95],
  r: [1.0, 1.1],
  n: [1.0, 1.1],
  b: [0.95, 1.1],
  q: [1.05, 1.2],
  k: [1.05, 1.25]
} as const;

// Universal ground anchors to keep pieces flush with the board
const standardGroundAnchor = {
  p: 0.6,
  r: 0.6,
  n: 0.6,
  b: 0.6,
  q: 0.6,
  k: 0.6
} as const;

export function Piece3D({ piece, pieceSet, selected, pendingMove, onClick, onMoveComplete }: Piece3DProps) {
  const texture = useTexture(pieceImageUrl(piece.type, piece.color, pieceSet));
  const groupRef = useRef<Group>(null);
  const elapsedRef = useRef(0);
  const completedMoveIdRef = useRef<number | null>(null);
  const startRef = useRef(new Vector3());
  const endRef = useRef(new Vector3());
  const currentRef = useRef(new Vector3());
  const squarePosition = useMemo(() => squareToPosition(piece.square), [piece.square]);
  const perspectiveScale = 1 + squarePosition.z * 0.014;
  const [scaleX, scaleY] = standardPieceScale[piece.type];
  const groundAnchor = standardGroundAnchor[piece.type];
  const movingSquare = pendingMove?.rookMove?.from === piece.square ? pendingMove.rookMove : pendingMove?.from === piece.square ? pendingMove : null;
  const shouldCompleteMove = pendingMove?.from === piece.square;

  useEffect(() => {
    if (!groupRef.current) {
      return;
    }

    elapsedRef.current = 0;
    completedMoveIdRef.current = null;
    groupRef.current.position.set(squarePosition.x, baseY, squarePosition.z);

    if (movingSquare) {
      startRef.current.copy(squareToPosition(movingSquare.from));
      endRef.current.copy(squareToPosition(movingSquare.to));
    }
  }, [movingSquare, pendingMove?.id, squarePosition]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group || !movingSquare || !pendingMove) {
      return;
    }

    elapsedRef.current += delta;
    const progress = Math.min(elapsedRef.current / moveDurationSeconds, 1);
    const eased = progress * progress * (3 - 2 * progress);
    const position = currentRef.current.lerpVectors(startRef.current, endRef.current, eased);
    position.y = baseY + Math.sin(progress * Math.PI) * jumpHeight;
    group.position.copy(position);

    if (progress >= 1 && shouldCompleteMove && completedMoveIdRef.current !== pendingMove.id) {
      completedMoveIdRef.current = pendingMove.id;
      group.position.set(endRef.current.x, baseY, endRef.current.z);
      onMoveComplete(pendingMove.id);
    }
  });

  return (
    <group ref={groupRef} position={[squarePosition.x, baseY, squarePosition.z]}>
      {selected ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.5, 40]} />
          <meshBasicMaterial color="#ffd36a" transparent opacity={0.9} />
        </mesh>
      ) : null}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <mesh
          castShadow
          onClick={(event) => {
            event.stopPropagation();
            onClick(piece.square);
          }}
          scale={[scaleX * perspectiveScale, scaleY * perspectiveScale, 1]}
          position={[0, groundAnchor * scaleY * perspectiveScale, 0]}
        >
          <planeGeometry args={[0.92, 1.28]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.05} />
        </mesh>
      </Billboard>
    </group>
  );
}

