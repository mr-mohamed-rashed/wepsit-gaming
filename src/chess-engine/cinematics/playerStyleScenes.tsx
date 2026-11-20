'use client';
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, Mesh, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { squareToPosition } from "../game/coordinates";
import type { CaptureEffect, CaptureEvent, PlayerStyle } from "../game/types";

export type PlayerStyleScene = {
  style: PlayerStyle;
  arabicName: string;
  englishName: string;
  accentColor: string;
  cameraMood: "arcane" | "impact" | "tracking" | "summon" | "shadow" | "time" | "command";
  defaultEffect: CaptureEffect;
  effects: CaptureEffect[];
};

export const playerStyleScenes: Record<PlayerStyle, PlayerStyleScene> = {
  magic: {
    style: "magic",
    arabicName: "نمط السحر",
    englishName: "Magic Style",
    accentColor: "#8fd3ff",
    cameraMood: "arcane",
    defaultEffect: "freeze",
    effects: ["freeze", "teleport", "polymorph", "lightning"]
  },
  melee: {
    style: "melee",
    arabicName: "نمط الاشتباك القريب",
    englishName: "Melee Style",
    accentColor: "#ffcf6a",
    cameraMood: "impact",
    defaultEffect: "smash",
    effects: ["smash", "slice", "uppercut", "execution"]
  },
  range: {
    style: "range",
    arabicName: "نمط الهجوم بعيد المدى",
    englishName: "Range Style",
    accentColor: "#9ecbff",
    cameraMood: "tracking",
    defaultEffect: "sniper",
    effects: ["sniper", "artillery", "arrow-rain", "phantom"]
  },
  summoner: {
    style: "summoner",
    arabicName: "نمط المستدعي",
    englishName: "Summoner Style",
    accentColor: "#67e8a5",
    cameraMood: "summon",
    defaultEffect: "earth-claws",
    effects: ["earth-claws", "beast", "minions"]
  },
  assassin: {
    style: "assassin",
    arabicName: "نمط المغتال",
    englishName: "Assassin Style",
    accentColor: "#9b6cff",
    cameraMood: "shadow",
    defaultEffect: "backstab",
    effects: ["backstab", "toxic", "shadow"]
  },
  chrono: {
    style: "chrono",
    arabicName: "نمط التحكم بالوقت",
    englishName: "Chronomancer Style",
    accentColor: "#f6d365",
    cameraMood: "time",
    defaultEffect: "decay",
    effects: ["decay", "rewind"]
  },
  general: {
    style: "general",
    arabicName: "نمط الجنرال",
    englishName: "General Style",
    accentColor: "#f0f4ff",
    cameraMood: "command",
    defaultEffect: "command-strike",
    effects: ["command-strike", "royal-guard", "formation-break"]
  }
};

export function getPlayerStyleScene(style: PlayerStyle): PlayerStyleScene {
  return playerStyleScenes[style];
}

export function PlayerStyleCaptureScene({ event }: { event: CaptureEvent }) {
  if (event.effect === "freeze") {
    return <FreezeShatterScene event={event} />;
  }

  return <StylePulseScene event={event} />;
}

function FreezeShatterScene({ event }: { event: CaptureEvent }) {
  const target = squareToPosition(event.to);
  const scene = getPlayerStyleScene(event.style);
  const shards = useMemo(
    () =>
      Array.from({ length: 42 }, (_, index) => ({
        id: index,
        start: new Vector3(target.x, 0.72 + Math.random() * 0.75, target.z),
        velocity: new Vector3((Math.random() - 0.5) * 2.8, Math.random() * 2.3 + 0.8, (Math.random() - 0.5) * 2.8),
        scale: Math.random() * 0.075 + 0.035,
        color: new Color().setHSL(0.55 + Math.random() * 0.08, 0.92, 0.72)
      })),
    [target.x, target.z]
  );

  return (
    <group>
      <mesh position={[target.x, 0.88, target.z]}>
        <sphereGeometry args={[0.8, 32, 16]} />
        <meshBasicMaterial color={scene.accentColor} transparent opacity={0.2} blending={AdditiveBlending} />
      </mesh>
      {shards.map((shard) => (
        <FlyingShard key={shard.id} shard={shard} />
      ))}
      <pointLight position={[target.x, 2.3, target.z]} intensity={4.2} color={scene.accentColor} distance={5} />
    </group>
  );
}

function StylePulseScene({ event }: { event: CaptureEvent }) {
  const target = squareToPosition(event.to);
  const scene = getPlayerStyleScene(event.style);
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) {
      return;
    }

    const pulse = 1 + Math.sin(clock.elapsedTime * 8) * 0.08;
    meshRef.current.scale.setScalar(pulse);
    meshRef.current.rotation.z += 0.015;
  });

  return (
    <group position={[target.x, 0.16, target.z]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 1.1, 64]} />
        <meshBasicMaterial color={scene.accentColor} transparent opacity={0.68} blending={AdditiveBlending} />
      </mesh>
      <pointLight position={[0, 1.6, 0]} intensity={3} color={scene.accentColor} distance={4} />
    </group>
  );
}

function FlyingShard({
  shard
}: {
  shard: {
    start: Vector3;
    velocity: Vector3;
    scale: number;
    color: Color;
  };
}) {
  const meshRef = useRef<Mesh>(null);
  const positionRef = useRef(new Vector3());

  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * 1.15) % 1.4;
    positionRef.current.copy(shard.start).addScaledVector(shard.velocity, t);
    positionRef.current.y -= 1.8 * t * t;
    if (meshRef.current) {
      meshRef.current.position.copy(positionRef.current);
      meshRef.current.rotation.set(positionRef.current.x * 2, positionRef.current.y * 1.7, positionRef.current.z * 2);
    }
  });

  return (
    <mesh ref={meshRef} position={shard.start.toArray()}>
      <tetrahedronGeometry args={[shard.scale, 0]} />
      <meshBasicMaterial color={shard.color} transparent opacity={0.86} blending={AdditiveBlending} />
    </mesh>
  );
}

