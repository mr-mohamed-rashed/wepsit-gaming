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

export type ChronoObjectRef = RefObject<Object3D | null>;
export type ChronoVec3 = [number, number, number] | Vector3;

const pawnMs = 1500;
const rookMs = 2000;
const knightMs = 2000;
const bishopMs = 2000;
const queenMs = 2500;
const castlingMs = 1500;
const checkEscapeMs = 1500;

function v3(value: ChronoVec3): Vector3 {
  return Array.isArray(value) ? new Vector3(value[0], value[1], value[2]) : value.clone();
}

function rootFromRefs(...refs: ChronoObjectRef[]): Object3D {
  const parent = refs.find((ref) => ref.current?.parent)?.current?.parent;
  if (!parent) throw new Error("ChronomancerStyle cinematic requires at least one attached Object3D ref.");
  return parent;
}

function setVisible(ref: ChronoObjectRef, visible: boolean): void {
  if (ref.current) ref.current.visible = visible;
}

function setOpacity(ref: ChronoObjectRef, opacity: number): void {
  ref.current?.traverse((child) => {
    const mesh = child as Mesh;
    if (!("material" in mesh) || !mesh.material) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = opacity;
      material.needsUpdate = true;
    });
  });
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

function postEvent(type: string, detail: Record<string, number>): void {
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

function createChronomancer(): Group {
  const mage = new Group();
  const robe = new MeshStandardMaterial({ color: "#1f2937", roughness: 0.52, metalness: 0.1, emissive: "#78350f", emissiveIntensity: 0.25 });
  const gold = new MeshStandardMaterial({ color: "#d6a23f", roughness: 0.28, metalness: 0.55 });
  const glow = new MeshBasicMaterial({ color: "#facc15", transparent: true, opacity: 0.22, blending: AdditiveBlending, depthWrite: false });
  const body = new Mesh(new CapsuleGeometry(0.15, 0.46, 6, 12), robe);
  body.position.y = 0.46;
  const head = new Mesh(new SphereGeometry(0.12, 16, 12), gold);
  head.position.y = 0.86;
  const staff = new Mesh(new CylinderGeometry(0.016, 0.016, 0.78, 8), gold.clone());
  staff.name = "chronoStaff";
  staff.position.set(0.23, 0.58, 0);
  staff.rotation.z = -0.25;
  const aura = new Mesh(new SphereGeometry(0.42, 24, 12), glow);
  aura.position.y = 0.52;
  mage.add(body, head, staff, aura);
  return mage;
}

function createHourglass(): Group {
  const group = new Group();
  const gold = new MeshStandardMaterial({ color: "#d6a23f", roughness: 0.28, metalness: 0.58 });
  const sand = new MeshBasicMaterial({ color: "#facc15", transparent: true, opacity: 0.85, blending: AdditiveBlending });
  const top = new Mesh(new ConeGeometry(0.1, 0.18, 16), sand);
  top.position.y = 0.11;
  top.rotation.x = Math.PI;
  const bottom = new Mesh(new ConeGeometry(0.1, 0.18, 16), sand.clone());
  bottom.position.y = -0.11;
  const frameA = new Mesh(new CylinderGeometry(0.12, 0.12, 0.018, 16), gold);
  frameA.position.y = 0.22;
  const frameB = frameA.clone();
  frameB.position.y = -0.22;
  group.add(top, bottom, frameA, frameB);
  return group;
}

function createClockFace(radius = 1.2): Group {
  const group = new Group();
  const mat = new MeshBasicMaterial({ color: "#facc15", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending });
  const ring = new Mesh(new RingGeometry(radius * 0.9, radius, 96), mat);
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);
  for (let i = 0; i < 12; i += 1) {
    const tick = new Mesh(new BoxGeometry(0.04, 0.012, 0.18), mat.clone());
    const angle = (i / 12) * Math.PI * 2;
    tick.position.set(Math.cos(angle) * radius * 0.78, 0.02, Math.sin(angle) * radius * 0.78);
    tick.rotation.y = -angle;
    group.add(tick);
  }
  for (let i = 0; i < 3; i += 1) {
    const gear = new Mesh(new TorusGeometry(0.22 + i * 0.08, 0.018, 8, 28), mat.clone());
    gear.position.set((i - 1) * 0.32, 0.04, (i % 2) * 0.28 - 0.14);
    gear.rotation.x = -Math.PI / 2;
    gear.name = "chronoGear";
    group.add(gear);
  }
  return group;
}

function setGroupOpacity(group: Group, opacity: number): void {
  group.traverse((child) => {
    const mesh = child as Mesh;
    if (!("material" in mesh) || !mesh.material) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = opacity;
      material.needsUpdate = true;
    });
  });
}

function createParticles(position: Vector3, color = "#facc15", count = 90): Points {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const p = i * 3;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.9;
    positions[p] = position.x;
    positions[p + 1] = position.y + 0.55;
    positions[p + 2] = position.z;
    velocities[p] = Math.cos(angle) * speed;
    velocities[p + 1] = 0.6 + Math.random() * 1.8;
    velocities[p + 2] = Math.sin(angle) * speed;
  }
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new BufferAttribute(velocities, 3));
  return new Points(
    geometry,
    new PointsMaterial({ color, size: 0.065, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  );
}

function updateParticles(points: Points, deltaMs: number, fade: number): void {
  const positions = points.geometry.getAttribute("position") as BufferAttribute;
  const velocities = points.geometry.getAttribute("velocity") as BufferAttribute;
  const dt = deltaMs / 1000;
  for (let i = 0; i < positions.count; i += 1) {
    positions.setXYZ(i, positions.getX(i) + velocities.getX(i) * dt, positions.getY(i) + velocities.getY(i) * dt, positions.getZ(i) + velocities.getZ(i) * dt);
    velocities.setY(i, velocities.getY(i) - 2.4 * dt);
  }
  positions.needsUpdate = true;
  velocities.needsUpdate = true;
  (points.material as PointsMaterial).opacity = Math.max(0, 0.9 * (1 - fade));
}

function createEchoProjectile(): Group {
  const group = new Group();
  const core = new Mesh(new SphereGeometry(0.13, 18, 12), new MeshBasicMaterial({ color: "#fde68a", transparent: true, opacity: 0.95, blending: AdditiveBlending }));
  group.add(core);
  for (let i = 0; i < 4; i += 1) {
    const ghost = new Mesh(new SphereGeometry(0.11, 16, 10), new MeshBasicMaterial({ color: "#facc15", transparent: true, opacity: 0.18, blending: AdditiveBlending }));
    ghost.name = `timeEcho-${i}`;
    group.add(ghost);
  }
  return group;
}

function createStreak(start: Vector3, end: Vector3, color = "#fde68a"): Mesh {
  const length = start.distanceTo(end);
  const streak = new Mesh(
    new CylinderGeometry(0.025, 0.025, length, 10),
    new MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  );
  streak.position.copy(start.clone().lerp(end, 0.5)).add(new Vector3(0, 0.42, 0));
  streak.rotation.z = Math.PI / 2;
  return streak;
}

function createGoldenStatue(position: Vector3): Group {
  const statue = new Group();
  const mat = new MeshStandardMaterial({ color: "#d6a23f", roughness: 0.3, metalness: 0.75, transparent: true, opacity: 0.7 });
  const body = new Mesh(new CapsuleGeometry(0.16, 0.45, 6, 12), mat);
  body.position.y = 0.45;
  const crown = new Mesh(new ConeGeometry(0.15, 0.22, 6), mat.clone());
  crown.position.y = 0.88;
  statue.add(body, crown);
  statue.position.copy(position);
  return statue;
}

export async function animateChronoPawnCapture(attackerRef: ChronoObjectRef, victimRef: ChronoObjectRef, from: ChronoVec3, to: ChronoVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const mage = createChronomancer();
  const hourglass = createHourglass();
  const dust = createParticles(end, "#d6a23f", 100);
  mage.position.copy(start).add(new Vector3(-0.45, 0, 0.3));
  hourglass.position.copy(start).add(new Vector3(0, 1.1, 0));
  root.add(mage, hourglass, dust);

  try {
    await timeline(pawnMs, (progress, deltaMs) => {
      hourglass.rotation.y += 0.12;
      if (attackerRef.current) attackerRef.current.position.lerpVectors(start, end, smoothstep(Math.min(progress / 0.45, 1)));
      if (victimRef.current && progress > 0.3) victimRef.current.rotation.y += 0.004;
      if (progress > 0.58) {
        const age = Math.min((progress - 0.58) / 0.32, 1);
        victimRef.current?.scale.setScalar(Math.max(0, 1 - age));
        updateParticles(dust, deltaMs, age);
        if (age >= 1) setVisible(victimRef, false);
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (victimRef.current) victimRef.current.scale.setScalar(1);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(mage);
    disposeObject(hourglass);
    disposeObject(dust);
  }
}

export async function animateChronoRookCapture(attackerRef: ChronoObjectRef, victimRef: ChronoObjectRef, from: ChronoVec3, to: ChronoVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const clock = createClockFace(Math.max(start.distanceTo(end) / 2, 1));
  const shards = createParticles(end, "#cbd5e1", 110);
  clock.position.copy(start.clone().lerp(end, 0.5));
  root.add(clock, shards);

  try {
    await timeline(rookMs, (progress, deltaMs) => {
      setGroupOpacity(clock, progress < 0.82 ? Math.min(0.75, progress / 0.18) : Math.max(0, 0.75 * (1 - (progress - 0.82) / 0.18)));
      clock.children.forEach((child) => {
        if (child.name === "chronoGear") child.rotation.z += 0.08;
      });
      if (attackerRef.current) attackerRef.current.position.lerpVectors(start, end, smoothstep(Math.min(progress / 0.62, 1)));
      if (progress > 0.56 && progress < 0.72) {
        postEvent("chrono-style:freeze-frame", { durationMs: 300, intensity: 1 });
        setOpacity(victimRef, 0.55);
      }
      if (progress >= 0.72) {
        const hit = (progress - 0.72) / 0.28;
        setVisible(victimRef, false);
        updateParticles(shards, deltaMs, hit);
      }
    });
  } finally {
    setVisible(victimRef, false);
    setOpacity(victimRef, 1);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(clock);
    disposeObject(shards);
  }
}

export async function animateChronoKnightCapture(attackerRef: ChronoObjectRef, victimRef: ChronoObjectRef, from: ChronoVec3, to: ChronoVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const glitchA = createParticles(start, "#67e8f9", 90);
  const glitchB = createParticles(end, "#67e8f9", 90);
  root.add(glitchA, glitchB);

  try {
    await timeline(knightMs, (progress, deltaMs) => {
      if (progress < 0.24) {
        updateParticles(glitchA, deltaMs, 1 - progress / 0.24);
        setOpacity(attackerRef, 1 - progress / 0.24);
      } else if (progress < 0.48) {
        setVisible(attackerRef, false);
      } else {
        setVisible(attackerRef, true);
        setOpacity(attackerRef, 1);
        attackerRef.current?.position.copy(end);
        updateParticles(glitchB, deltaMs, Math.max(0, (progress - 0.78) / 0.22));
      }
      if (progress > 0.58) {
        const rewind = Math.min((progress - 0.58) / 0.34, 1);
        victimRef.current?.rotateY(-0.22);
        victimRef.current?.scale.setScalar(Math.max(0, 1 - rewind));
        if (rewind >= 1) setVisible(victimRef, false);
      }
    });
  } finally {
    setVisible(victimRef, false);
    setOpacity(attackerRef, 1);
    if (victimRef.current) victimRef.current.scale.setScalar(1);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(glitchA);
    disposeObject(glitchB);
  }
}

export async function animateChronoBishopCapture(attackerRef: ChronoObjectRef, victimRef: ChronoObjectRef, from: ChronoVec3, to: ChronoVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const projectile = createEchoProjectile();
  const erosion = createParticles(end, "#fde68a", 120);
  projectile.position.copy(start).add(new Vector3(0, 0.62, 0));
  root.add(projectile, erosion);

  try {
    await timeline(bishopMs, (progress, deltaMs) => {
      if (progress < 0.68) {
        const t = smoothstep(progress / 0.68);
        projectile.position.lerpVectors(start.clone().add(new Vector3(0, 0.62, 0)), end.clone().add(new Vector3(0, 0.62, 0)), t);
        projectile.children.forEach((child, index) => {
          if (child.name.startsWith("timeEcho")) child.position.x = -index * 0.1 - Math.sin(progress * Math.PI * 8) * 0.04;
        });
      } else {
        const accel = (progress - 0.68) / 0.32;
        victimRef.current?.scale.setScalar(Math.max(0, 1 - accel));
        updateParticles(erosion, deltaMs, accel);
        if (accel >= 1) setVisible(victimRef, false);
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (victimRef.current) victimRef.current.scale.setScalar(1);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(projectile);
    disposeObject(erosion);
  }
}

export async function animateChronoQueenCapture(attackerRef: ChronoObjectRef, victimRef: ChronoObjectRef, from: ChronoVec3, to: ChronoVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const mage = createChronomancer();
  const sand = createParticles(end, "#facc15", 180);
  const light = new PointLight("#facc15", 0, 8);
  mage.position.set(0, 0, 0);
  light.position.copy(end).add(new Vector3(0, 1.1, 0));
  root.add(mage, sand, light);
  postEvent("chrono-style:world-stop", { durationMs: queenMs, grayscale: 1 });

  try {
    await timeline(queenMs, (progress, deltaMs) => {
      if (attackerRef.current && progress > 0.18 && progress < 0.72) {
        attackerRef.current.position.lerpVectors(start, end, smoothstep((progress - 0.18) / 0.54));
      }
      const staff = mage.getObjectByName("chronoStaff");
      if (staff) staff.rotation.z = -0.25 + Math.sin(progress * Math.PI * 4) * 0.5;
      if (progress > 0.72) {
        const resume = (progress - 0.72) / 0.28;
        setVisible(victimRef, false);
        updateParticles(sand, deltaMs, resume);
        light.intensity = 12 * (1 - resume);
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(mage);
    disposeObject(sand);
    disposeObject(light);
    postEvent("chrono-style:world-stop", { durationMs: 0, grayscale: 0 });
  }
}

export async function animateChronoCastling(
  kingRef: ChronoObjectRef,
  rookRef: ChronoObjectRef,
  kingFrom: ChronoVec3,
  kingTo: ChronoVec3,
  rookFrom: ChronoVec3,
  rookTo: ChronoVec3
): Promise<void> {
  const root = rootFromRefs(kingRef, rookRef);
  const k0 = v3(kingFrom);
  const k1 = v3(kingTo);
  const r0 = v3(rookFrom);
  const r1 = v3(rookTo);
  const streakK = createStreak(k0, k1);
  const streakR = createStreak(r0, r1);
  root.add(streakK, streakR);

  try {
    await timeline(castlingMs, (progress) => {
      const phase = smoothstep(progress);
      kingRef.current?.position.lerpVectors(k0, k1, phase);
      rookRef.current?.position.lerpVectors(r0, r1, phase);
      (streakK.material as MeshBasicMaterial).opacity = progress < 0.78 ? 0.75 : Math.max(0, 0.75 * (1 - (progress - 0.78) / 0.22));
      (streakR.material as MeshBasicMaterial).opacity = (streakK.material as MeshBasicMaterial).opacity;
      setOpacity(kingRef, progress < 0.5 ? 0.55 : 1);
      setOpacity(rookRef, progress < 0.5 ? 0.55 : 1);
    });
  } finally {
    setOpacity(kingRef, 1);
    setOpacity(rookRef, 1);
    if (kingRef.current) kingRef.current.position.copy(k1);
    if (rookRef.current) rookRef.current.position.copy(r1);
    disposeObject(streakK);
    disposeObject(streakR);
  }
}

export async function animateChronoCheckEscape(kingRef: ChronoObjectRef, from: ChronoVec3, to: ChronoVec3): Promise<void> {
  const root = rootFromRefs(kingRef);
  const start = v3(from);
  const end = v3(to);
  const remnant = createGoldenStatue(start);
  const dust = createParticles(start, "#facc15", 80);
  root.add(remnant, dust);

  try {
    await timeline(checkEscapeMs, (progress, deltaMs) => {
      if (progress < 0.18) {
        kingRef.current?.position.copy(end);
      }
      if (progress > 0.28) {
        const fade = (progress - 0.28) / 0.72;
        setGroupOpacity(remnant, Math.max(0, 0.7 * (1 - fade)));
        updateParticles(dust, deltaMs, fade);
      }
    });
  } finally {
    if (kingRef.current) kingRef.current.position.copy(end);
    disposeObject(remnant);
    disposeObject(dust);
  }
}

