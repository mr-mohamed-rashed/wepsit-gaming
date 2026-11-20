'use client';
import type { RefObject } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PointLight,
  Points,
  PointsMaterial,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector3
} from "three";

export type MeleeObjectRef = RefObject<Object3D | null>;
export type MeleeVec3 = [number, number, number] | Vector3;

const durations = {
  pawn: 1500,
  rook: 2000,
  knight: 2000,
  bishop: 2000,
  queen: 2500,
  castling: 1500,
  checkEscape: 1500
} as const;

function v3(value: MeleeVec3): Vector3 {
  return Array.isArray(value) ? new Vector3(value[0], value[1], value[2]) : value.clone();
}

function rootFromRefs(...refs: MeleeObjectRef[]): Object3D {
  const parent = refs.find((ref) => ref.current?.parent)?.current?.parent;
  if (!parent) {
    throw new Error("MeleeStyle cinematic requires at least one attached Object3D ref.");
  }
  return parent;
}

function setVisible(ref: MeleeObjectRef, visible: boolean): void {
  if (ref.current) ref.current.visible = visible;
}

function disposeObject(object: Object3D): void {
  object.traverse((child) => {
    const mesh = child as Mesh;
    const points = child as Points;
    if ("geometry" in mesh && mesh.geometry) mesh.geometry.dispose();
    const material = "material" in mesh ? mesh.material : "material" in points ? points.material : undefined;
    if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
    else material?.dispose();
  });
  object.removeFromParent();
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function easeOutBack(t: number): number {
  const c1 = 1.7;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function nextFrame(): Promise<number> {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

async function timeline(durationMs: number, onFrame: (progress: number, deltaMs: number) => void): Promise<void> {
  const start = await nextFrame();
  let previous = start;
  return new Promise((resolve) => {
    const tick = (time: number) => {
      const progress = Math.min((time - start) / durationMs, 1);
      const delta = time - previous;
      previous = time;
      onFrame(progress, delta);
      if (progress < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

function cameraShake(durationMs: number, amplitude: number): void {
  window.dispatchEvent(new CustomEvent("melee-style:camera-shake", { detail: { durationMs, amplitude } }));
}

function createWarrior(): Group {
  const warrior = new Group();
  const skin = new MeshStandardMaterial({ color: "#c08457", roughness: 0.68 });
  const iron = new MeshStandardMaterial({ color: "#3f4652", roughness: 0.34, metalness: 0.65 });
  const leather = new MeshStandardMaterial({ color: "#5a3423", roughness: 0.78 });

  const body = new Mesh(new CapsuleGeometry(0.18, 0.5, 6, 12), leather);
  body.position.y = 0.48;
  warrior.add(body);

  const head = new Mesh(new SphereGeometry(0.13, 16, 12), skin);
  head.position.y = 0.92;
  warrior.add(head);

  const shoulder = new Mesh(new BoxGeometry(0.58, 0.08, 0.18), iron);
  shoulder.position.y = 0.72;
  warrior.add(shoulder);

  const sword = new Mesh(new BoxGeometry(0.08, 0.86, 0.035), iron.clone());
  sword.name = "warriorSword";
  sword.position.set(0.32, 0.7, 0);
  sword.rotation.z = -0.55;
  warrior.add(sword);

  warrior.scale.setScalar(1.16);
  return warrior;
}

function createChunks(position: Vector3, color = "#d8e3f2", count = 48): Points {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const p = i * 3;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.9 + Math.random() * 2.4;
    positions[p] = position.x;
    positions[p + 1] = position.y + 0.5;
    positions[p + 2] = position.z;
    velocities[p] = Math.cos(angle) * speed;
    velocities[p + 1] = 1.0 + Math.random() * 2.7;
    velocities[p + 2] = Math.sin(angle) * speed;
  }
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new BufferAttribute(velocities, 3));
  return new Points(
    geometry,
    new PointsMaterial({ color, size: 0.085, transparent: true, opacity: 0, depthWrite: false })
  );
}

function updateChunks(points: Points, deltaMs: number, fade: number): void {
  const positions = points.geometry.getAttribute("position") as BufferAttribute;
  const velocities = points.geometry.getAttribute("velocity") as BufferAttribute;
  const dt = deltaMs / 1000;
  for (let i = 0; i < positions.count; i += 1) {
    positions.setXYZ(
      i,
      positions.getX(i) + velocities.getX(i) * dt,
      positions.getY(i) + velocities.getY(i) * dt,
      positions.getZ(i) + velocities.getZ(i) * dt
    );
    velocities.setY(i, velocities.getY(i) - 5.7 * dt);
  }
  positions.needsUpdate = true;
  velocities.needsUpdate = true;
  (points.material as PointsMaterial).opacity = Math.max(0, 0.92 * (1 - fade));
}

function createShockwave(color = "#f59e0b"): Mesh {
  const wave = new Mesh(
    new RingGeometry(0.18, 0.24, 72),
    new MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  );
  wave.rotation.x = -Math.PI / 2;
  return wave;
}

function createRam(): Group {
  const ram = new Group();
  const iron = new MeshStandardMaterial({ color: "#222833", roughness: 0.3, metalness: 0.72 });
  const red = new MeshStandardMaterial({ color: "#7f1d1d", roughness: 0.6 });
  const body = new Mesh(new BoxGeometry(0.42, 0.36, 0.72), iron);
  body.position.y = 0.42;
  const head = new Mesh(new ConeGeometry(0.24, 0.46, 4), iron.clone());
  head.position.set(0, 0.42, -0.56);
  head.rotation.x = Math.PI / 2;
  const banner = new Mesh(new BoxGeometry(0.08, 0.48, 0.04), red);
  banner.position.set(0.27, 0.72, 0.14);
  ram.add(body, head, banner);
  return ram;
}

function createCrescent(): Mesh {
  return new Mesh(
    new TorusGeometry(0.42, 0.025, 8, 48, Math.PI * 1.15),
    new MeshBasicMaterial({ color: "#fef3c7", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  );
}

function createSplitHalves(position: Vector3): Group {
  const group = new Group();
  const mat = new MeshStandardMaterial({ color: "#dbeafe", transparent: true, opacity: 0.72, roughness: 0.15, metalness: 0.05 });
  for (const side of [-1, 1]) {
    const half = new Mesh(new BoxGeometry(0.24, 0.62, 0.12), mat.clone());
    half.position.copy(position).add(new Vector3(side * 0.1, 0.42, 0));
    half.rotation.z = side * 0.15;
    group.add(half);
  }
  group.visible = false;
  return group;
}

function createCracks(position: Vector3): Group {
  const group = new Group();
  const mat = new MeshBasicMaterial({ color: "#111827", transparent: true, opacity: 0, depthWrite: false });
  for (let i = 0; i < 12; i += 1) {
    const line = new Mesh(new BoxGeometry(0.65 + Math.random() * 0.65, 0.012, 0.018), mat.clone());
    line.position.copy(position).add(new Vector3(0, 0.018, 0));
    line.rotation.y = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.18;
    group.add(line);
  }
  return group;
}

function createSparkTrail(count = 120): Points {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const p = i * 3;
    positions[p] = 0;
    positions[p + 1] = -99;
    positions[p + 2] = 0;
    velocities[p] = 0;
    velocities[p + 1] = 0;
    velocities[p + 2] = 0;
  }
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new BufferAttribute(velocities, 3));
  return new Points(
    geometry,
    new PointsMaterial({ color: "#fbbf24", size: 0.05, transparent: true, opacity: 0.85, depthWrite: false, blending: AdditiveBlending })
  );
}

function emitSpark(points: Points, position: Vector3, cursor: { value: number }): void {
  const positions = points.geometry.getAttribute("position") as BufferAttribute;
  const velocities = points.geometry.getAttribute("velocity") as BufferAttribute;
  const i = cursor.value % positions.count;
  cursor.value += 1;
  positions.setXYZ(i, position.x, position.y + 0.08, position.z);
  velocities.setXYZ(i, (Math.random() - 0.5) * 1.3, Math.random() * 1.1, (Math.random() - 0.5) * 1.3);
  positions.needsUpdate = true;
  velocities.needsUpdate = true;
}

function updateSparks(points: Points, deltaMs: number): void {
  const positions = points.geometry.getAttribute("position") as BufferAttribute;
  const velocities = points.geometry.getAttribute("velocity") as BufferAttribute;
  const dt = deltaMs / 1000;
  for (let i = 0; i < positions.count; i += 1) {
    positions.setXYZ(i, positions.getX(i) + velocities.getX(i) * dt, positions.getY(i) + velocities.getY(i) * dt, positions.getZ(i) + velocities.getZ(i) * dt);
    velocities.setY(i, velocities.getY(i) - 3.8 * dt);
  }
  positions.needsUpdate = true;
  velocities.needsUpdate = true;
}

export async function animateMeleePawnCapture(attackerRef: MeleeObjectRef, victimRef: MeleeObjectRef, from: MeleeVec3, to: MeleeVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const dir = end.clone().sub(start).setY(0).normalize();
  if (dir.lengthSq() === 0) dir.set(0, 0, -1);
  const warrior = createWarrior();
  const chunks = createChunks(end, "#cbd5e1", 70);
  warrior.position.copy(start).addScaledVector(dir, -0.55);
  warrior.lookAt(end);
  root.add(warrior, chunks);

  try {
    await timeline(durations.pawn, (progress, deltaMs) => {
      const dash = smoothstep(Math.min(progress / 0.38, 1));
      warrior.position.lerpVectors(start.clone().addScaledVector(dir, -0.55), start.clone().addScaledVector(dir, -0.12), dash);
      const sword = warrior.getObjectByName("warriorSword");
      if (sword) sword.rotation.z = -0.55 - Math.sin(progress * Math.PI * 5) * 0.55;
      if (attackerRef.current && progress > 0.22) {
        const t = easeOutBack(Math.min((progress - 0.22) / 0.43, 1));
        attackerRef.current.position.lerpVectors(start, end, t);
      }
      if (progress > 0.62) {
        setVisible(victimRef, false);
        updateChunks(chunks, deltaMs, (progress - 0.62) / 0.38);
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(warrior);
    disposeObject(chunks);
  }
}

export async function animateMeleeRookCapture(attackerRef: MeleeObjectRef, victimRef: MeleeObjectRef, from: MeleeVec3, to: MeleeVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const warrior = createWarrior();
  const ram = createRam();
  const wave = createShockwave();
  const chunks = createChunks(end, "#e5e7eb", 90);
  warrior.position.copy(start).add(new Vector3(0.55, 0, 0));
  ram.position.copy(start);
  wave.position.copy(end).add(new Vector3(0, 0.03, 0));
  root.add(warrior, ram, wave, chunks);
  setVisible(attackerRef, false);

  try {
    await timeline(durations.rook, (progress, deltaMs) => {
      if (progress < 0.22) ram.scale.setScalar(0.35 + smoothstep(progress / 0.22) * 0.85);
      else if (progress < 0.72) ram.position.lerpVectors(start, end, easeOutBack((progress - 0.22) / 0.5));
      else {
        setVisible(victimRef, false);
        const impact = (progress - 0.72) / 0.28;
        (wave.material as MeshBasicMaterial).opacity = Math.max(0, 0.8 * (1 - impact));
        wave.scale.setScalar(1 + impact * 3.8);
        updateChunks(chunks, deltaMs, impact);
      }
    });
  } finally {
    setVisible(victimRef, false);
    setVisible(attackerRef, true);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(warrior);
    disposeObject(ram);
    disposeObject(wave);
    disposeObject(chunks);
  }
}

export async function animateMeleeKnightCapture(attackerRef: MeleeObjectRef, victimRef: MeleeObjectRef, from: MeleeVec3, to: MeleeVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const warrior = createWarrior();
  const halves = createSplitHalves(end);
  const wave = createShockwave("#f97316");
  wave.position.copy(end).add(new Vector3(0, 0.03, 0));
  root.add(warrior, halves, wave);
  setVisible(attackerRef, false);

  try {
    await timeline(durations.knight, (progress) => {
      if (progress < 0.72) {
        const t = smoothstep(progress / 0.72);
        warrior.position.lerpVectors(start, end, t);
        warrior.position.y = start.y + Math.sin(t * Math.PI) * 1.65;
        warrior.rotation.z = Math.sin(t * Math.PI) * 0.28;
      } else {
        warrior.position.copy(end);
        halves.visible = true;
        halves.children.forEach((half, index) => {
          const side = index === 0 ? -1 : 1;
          half.position.x += side * 0.018;
          half.rotation.z += side * 0.03;
          half.position.y = Math.max(end.y + 0.12, half.position.y - 0.018);
        });
        setVisible(victimRef, false);
        const impact = (progress - 0.72) / 0.28;
        if (impact < 0.08) cameraShake(420, 0.1);
        (wave.material as MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - impact));
        wave.scale.setScalar(1 + impact * 4.2);
      }
    });
  } finally {
    setVisible(victimRef, false);
    setVisible(attackerRef, true);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(warrior);
    disposeObject(halves);
    disposeObject(wave);
  }
}

export async function animateMeleeBishopCapture(attackerRef: MeleeObjectRef, victimRef: MeleeObjectRef, from: MeleeVec3, to: MeleeVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const warrior = createWarrior();
  const crescent = createCrescent();
  const halves = createSplitHalves(end);
  warrior.position.copy(start).add(new Vector3(-0.45, 0, 0));
  crescent.position.copy(start).add(new Vector3(0, 0.45, 0));
  root.add(warrior, crescent, halves);

  try {
    await timeline(durations.bishop, (progress) => {
      const sword = warrior.getObjectByName("warriorSword");
      if (sword) sword.rotation.z = -0.55 - progress * Math.PI * 3;
      if (progress > 0.2 && progress < 0.76) {
        const t = smoothstep((progress - 0.2) / 0.56);
        crescent.position.lerpVectors(start.clone().add(new Vector3(0, 0.45, 0)), end.clone().add(new Vector3(0, 0.45, 0)), t);
        crescent.rotation.y += 0.08;
        (crescent.material as MeshBasicMaterial).opacity = 0.86;
      }
      if (progress >= 0.76) {
        setVisible(victimRef, false);
        halves.visible = true;
        const fade = (progress - 0.76) / 0.24;
        (crescent.material as MeshBasicMaterial).opacity = Math.max(0, 0.86 * (1 - fade));
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(warrior);
    disposeObject(crescent);
    disposeObject(halves);
  }
}

export async function animateMeleeQueenCapture(attackerRef: MeleeObjectRef, victimRef: MeleeObjectRef, from: MeleeVec3, to: MeleeVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const warrior = createWarrior();
  const cracks = createCracks(end);
  const chunks = createChunks(end, "#e5e7eb", 150);
  const light = new PointLight("#f97316", 0, 8);
  warrior.position.set(0, 0, 0);
  light.position.copy(end).add(new Vector3(0, 1.2, 0));
  root.add(warrior, cracks, chunks, light);

  try {
    await timeline(durations.queen, (progress, deltaMs) => {
      if (progress < 0.58) {
        const t = smoothstep(progress / 0.58);
        warrior.position.lerpVectors(new Vector3(0, 0, 0), end, t);
        warrior.position.y = Math.sin(t * Math.PI) * 3.2;
      } else {
        const impact = Math.min((progress - 0.58) / 0.42, 1);
        if (impact < 0.06) cameraShake(650, 0.16);
        setVisible(victimRef, false);
        light.intensity = 11 * (1 - impact);
        updateChunks(chunks, deltaMs, impact);
        cracks.children.forEach((child) => {
          const mat = (child as Mesh).material as MeshBasicMaterial;
          mat.opacity = Math.max(0, 0.78 * (1 - impact));
          child.scale.x = 1 + impact * 2.8;
        });
        if (attackerRef.current) attackerRef.current.position.lerpVectors(start, end, smoothstep(impact));
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(warrior);
    disposeObject(cracks);
    disposeObject(chunks);
    disposeObject(light);
  }
}

export async function animateMeleeCastling(
  kingRef: MeleeObjectRef,
  rookRef: MeleeObjectRef,
  kingFrom: MeleeVec3,
  kingTo: MeleeVec3,
  rookFrom: MeleeVec3,
  rookTo: MeleeVec3
): Promise<void> {
  const root = rootFromRefs(kingRef, rookRef);
  const k0 = v3(kingFrom);
  const k1 = v3(kingTo);
  const r0 = v3(rookFrom);
  const r1 = v3(rookTo);
  const center = k0.clone().add(r0).multiplyScalar(0.5);
  const warrior = createWarrior();
  const barricade = new Mesh(new BoxGeometry(k0.distanceTo(r0), 0.08, 0.12), new MeshStandardMaterial({ color: "#374151", roughness: 0.32, metalness: 0.75 }));
  const sparks = createSparkTrail();
  const cursor = { value: 0 };
  warrior.position.copy(center).add(new Vector3(0, 0, 0.65));
  barricade.position.copy(center).add(new Vector3(0, 0.22, 0));
  root.add(warrior, barricade, sparks);

  try {
    await timeline(durations.castling, (progress, deltaMs) => {
      const t = easeOutBack(Math.min(Math.max((progress - 0.16) / 0.62, 0), 1));
      kingRef.current?.position.lerpVectors(k0, k1, t);
      rookRef.current?.position.lerpVectors(r0, r1, t);
      if (kingRef.current) emitSpark(sparks, kingRef.current.position, cursor);
      if (rookRef.current) emitSpark(sparks, rookRef.current.position, cursor);
      updateSparks(sparks, deltaMs);
      barricade.scale.y = progress < 0.75 ? 1 : Math.max(0, 1 - (progress - 0.75) / 0.25);
    });
  } finally {
    if (kingRef.current) kingRef.current.position.copy(k1);
    if (rookRef.current) rookRef.current.position.copy(r1);
    disposeObject(warrior);
    disposeObject(barricade);
    disposeObject(sparks);
  }
}

export async function animateMeleeCheckEscape(kingRef: MeleeObjectRef, from: MeleeVec3, to: MeleeVec3): Promise<void> {
  const root = rootFromRefs(kingRef);
  const start = v3(from);
  const end = v3(to);
  const warrior = createWarrior();
  const shield = new Mesh(new BoxGeometry(1.1, 1.0, 0.1), new MeshStandardMaterial({ color: "#475569", roughness: 0.34, metalness: 0.7 }));
  const sparks = createSparkTrail(90);
  const cursor = { value: 0 };
  warrior.position.copy(start).add(new Vector3(-0.5, 0, 0.25));
  shield.position.copy(end).add(new Vector3(0, 0.55, -0.5));
  shield.scale.set(1, 0.01, 1);
  root.add(warrior, shield, sparks);

  try {
    await timeline(durations.checkEscape, (progress, deltaMs) => {
      const t = smoothstep(Math.min(progress / 0.55, 1));
      kingRef.current?.position.lerpVectors(start, end, t);
      warrior.position.lerpVectors(start.clone().add(new Vector3(-0.5, 0, 0.25)), end.clone().add(new Vector3(-0.5, 0, 0.25)), t);
      shield.scale.y = progress < 0.28 ? smoothstep(progress / 0.28) : Math.max(0, 1 - Math.max(0, progress - 0.75) / 0.25);
      if (progress > 0.42 && progress < 0.7) {
        for (let i = 0; i < 3; i += 1) emitSpark(sparks, shield.position, cursor);
      }
      updateSparks(sparks, deltaMs);
    });
  } finally {
    if (kingRef.current) kingRef.current.position.copy(end);
    disposeObject(warrior);
    disposeObject(shield);
    disposeObject(sparks);
  }
}

