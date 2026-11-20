'use client';
import type { RefObject } from "react";
import {
  AdditiveBlending,
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

export type AssassinObjectRef = RefObject<Object3D | null>;
export type AssassinVec3 = [number, number, number] | Vector3;

const pawnMs = 1500;
const rookMs = 2000;
const knightMs = 2000;
const bishopMs = 2000;
const queenMs = 2500;
const castlingMs = 1500;
const checkEscapeMs = 1500;

function v3(value: AssassinVec3): Vector3 {
  return Array.isArray(value) ? new Vector3(value[0], value[1], value[2]) : value.clone();
}

function rootFromRefs(...refs: AssassinObjectRef[]): Object3D {
  const parent = refs.find((ref) => ref.current?.parent)?.current?.parent;
  if (!parent) throw new Error("AssassinStyle cinematic requires at least one attached Object3D ref.");
  return parent;
}

function setVisible(ref: AssassinObjectRef, visible: boolean): void {
  if (ref.current) ref.current.visible = visible;
}

function setOpacity(ref: AssassinObjectRef, opacity: number): void {
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

function dispatchVfx(type: string, detail: Record<string, number>): void {
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

function createAssassin(opacity = 0.95): Group {
  const assassin = new Group();
  const cloth = new MeshStandardMaterial({
    color: "#11111a",
    roughness: 0.72,
    metalness: 0.02,
    transparent: true,
    opacity
  });
  const violet = new MeshBasicMaterial({ color: "#8b5cf6", transparent: true, opacity: 0.22, blending: AdditiveBlending, depthWrite: false });
  const bladeMat = new MeshBasicMaterial({ color: "#d8b4fe", transparent: true, opacity: 0.92, blending: AdditiveBlending });

  const body = new Mesh(new CapsuleGeometry(0.13, 0.42, 6, 12), cloth);
  body.position.y = 0.44;
  const hood = new Mesh(new ConeGeometry(0.16, 0.25, 18), cloth.clone());
  hood.position.y = 0.84;
  const aura = new Mesh(new SphereGeometry(0.38, 20, 12), violet);
  aura.position.y = 0.48;
  const blade = new Mesh(new CylinderGeometry(0.012, 0.012, 0.42, 8), bladeMat);
  blade.name = "assassinBlade";
  blade.position.set(0.22, 0.48, 0);
  blade.rotation.z = -0.75;
  assassin.add(body, hood, aura, blade);
  return assassin;
}

function createSmoke(position: Vector3, color = "#3b1a52", count = 120): Points {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const p = i * 3;
    positions[p] = position.x + (Math.random() - 0.5) * 0.35;
    positions[p + 1] = position.y + Math.random() * 0.7;
    positions[p + 2] = position.z + (Math.random() - 0.5) * 0.35;
    velocities[p] = (Math.random() - 0.5) * 0.55;
    velocities[p + 1] = 0.25 + Math.random() * 0.75;
    velocities[p + 2] = (Math.random() - 0.5) * 0.55;
  }
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new BufferAttribute(velocities, 3));
  return new Points(
    geometry,
    new PointsMaterial({ color, size: 0.11, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  );
}

function updateSmoke(smoke: Points, deltaMs: number, fade: number): void {
  const positions = smoke.geometry.getAttribute("position") as BufferAttribute;
  const velocities = smoke.geometry.getAttribute("velocity") as BufferAttribute;
  const dt = deltaMs / 1000;
  for (let i = 0; i < positions.count; i += 1) {
    positions.setXYZ(i, positions.getX(i) + velocities.getX(i) * dt, positions.getY(i) + velocities.getY(i) * dt, positions.getZ(i) + velocities.getZ(i) * dt);
  }
  positions.needsUpdate = true;
  (smoke.material as PointsMaterial).opacity = Math.max(0, 0.85 * (1 - fade));
}

function createInkPool(position: Vector3): Mesh {
  const pool = new Mesh(
    new RingGeometry(0.08, 0.65, 64),
    new MeshBasicMaterial({ color: "#16051f", transparent: true, opacity: 0, depthWrite: false })
  );
  pool.position.copy(position).add(new Vector3(0, 0.025, 0));
  pool.rotation.x = -Math.PI / 2;
  return pool;
}

function createShadowHand(position: Vector3): Group {
  const hand = new Group();
  const mat = new MeshBasicMaterial({ color: "#12051d", transparent: true, opacity: 0, depthWrite: false });
  const palm = new Mesh(new SphereGeometry(0.18, 16, 10), mat);
  palm.position.y = 0.18;
  hand.add(palm);
  for (let i = 0; i < 5; i += 1) {
    const finger = new Mesh(new CylinderGeometry(0.025, 0.018, 0.38, 8), mat.clone());
    finger.position.set((i - 2) * 0.07, 0.38, 0);
    finger.rotation.z = (i - 2) * 0.16;
    hand.add(finger);
  }
  hand.position.copy(position);
  return hand;
}

function createKunai(): Group {
  const group = new Group();
  const mat = new MeshBasicMaterial({ color: "#bbf7d0", transparent: true, opacity: 0.95, blending: AdditiveBlending });
  const blade = new Mesh(new ConeGeometry(0.04, 0.18, 10), mat);
  blade.position.x = 0.16;
  blade.rotation.z = -Math.PI / 2;
  const shaft = new Mesh(new CylinderGeometry(0.01, 0.01, 0.28, 8), mat.clone());
  shaft.rotation.z = Math.PI / 2;
  group.add(blade, shaft);
  return group;
}

function createPoisonSplash(position: Vector3, count = 90): Points {
  const smoke = createSmoke(position, "#22c55e", count);
  (smoke.material as PointsMaterial).size = 0.075;
  return smoke;
}

function createStreak(start: Vector3, end: Vector3): Mesh {
  const length = start.distanceTo(end);
  const streak = new Mesh(
    new CylinderGeometry(0.018, 0.018, length, 8),
    new MeshBasicMaterial({ color: "#c084fc", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  );
  streak.position.copy(start.clone().lerp(end, 0.5)).add(new Vector3(0, 0.52, 0));
  streak.rotation.z = Math.PI / 2;
  streak.lookAt(end.x, end.y + 0.52, end.z);
  return streak;
}

export async function animateAssassinPawnCapture(attackerRef: AssassinObjectRef, victimRef: AssassinObjectRef, from: AssassinVec3, to: AssassinVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const assassin = createAssassin();
  const smokeA = createSmoke(start);
  const smokeB = createSmoke(end);
  const mist = createPoisonSplash(end, 100);
  assassin.position.copy(start).add(new Vector3(0.42, 0, 0));
  root.add(assassin, smokeA, smokeB, mist);

  try {
    await timeline(pawnMs, (progress, deltaMs) => {
      if (progress < 0.28) {
        updateSmoke(smokeA, deltaMs, 1 - progress / 0.28);
        setOpacity(attackerRef, Math.max(0, 1 - progress / 0.28));
      } else if (progress < 0.48) {
        setVisible(attackerRef, false);
      } else {
        setVisible(attackerRef, true);
        setOpacity(attackerRef, 1);
        attackerRef.current?.position.copy(end);
      }

      if (progress > 0.48) {
        assassin.position.copy(end).add(new Vector3(0.28, 0, -0.22));
        const blade = assassin.getObjectByName("assassinBlade");
        if (blade) blade.rotation.z = -0.75 - Math.sin((progress - 0.48) * Math.PI * 6) * 0.9;
      }
      if (progress > 0.68) {
        setVisible(victimRef, false);
        updateSmoke(mist, deltaMs, (progress - 0.68) / 0.32);
      }
      if (progress > 0.38) updateSmoke(smokeB, deltaMs, Math.max(0, (progress - 0.75) / 0.25));
    });
  } finally {
    setVisible(victimRef, false);
    setOpacity(attackerRef, 1);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(assassin);
    disposeObject(smokeA);
    disposeObject(smokeB);
    disposeObject(mist);
  }
}

export async function animateAssassinRookCapture(attackerRef: AssassinObjectRef, victimRef: AssassinObjectRef, from: AssassinVec3, to: AssassinVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const assassin = createAssassin(0.75);
  const hand = createShadowHand(end);
  const pool = createInkPool(end);
  assassin.position.copy(end).add(new Vector3(0.26, 0, 0.18));
  root.add(assassin, hand, pool);

  try {
    await timeline(rookMs, (progress) => {
      setGroupOpacity(hand, Math.min(0.8, progress / 0.25));
      (pool.material as MeshBasicMaterial).opacity = progress < 0.8 ? Math.min(0.65, progress / 0.2) : Math.max(0, 0.65 * (1 - (progress - 0.8) / 0.2));
      if (attackerRef.current) attackerRef.current.position.lerpVectors(start, end, smoothstep(Math.min(Math.max((progress - 0.2) / 0.48, 0), 1)));
      if (progress > 0.5) {
        const sink = smoothstep(Math.min((progress - 0.5) / 0.35, 1));
        victimRef.current?.position.copy(end.clone().add(new Vector3(0, -sink * 0.8, 0)));
        setOpacity(victimRef, 1 - sink);
      }
    });
  } finally {
    setVisible(victimRef, false);
    setOpacity(victimRef, 1);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(assassin);
    disposeObject(hand);
    disposeObject(pool);
  }
}

export async function animateAssassinKnightCapture(attackerRef: AssassinObjectRef, victimRef: AssassinObjectRef, from: AssassinVec3, to: AssassinVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const smokeA = createSmoke(start, "#171124", 110);
  const smokeB = createSmoke(end, "#171124", 110);
  const assassin = createAssassin();
  assassin.position.copy(end).add(new Vector3(0, 0, -0.38));
  root.add(smokeA, smokeB, assassin);

  try {
    await timeline(knightMs, (progress, deltaMs) => {
      if (progress < 0.26) {
        updateSmoke(smokeA, deltaMs, 1 - progress / 0.26);
        setOpacity(attackerRef, 1 - progress / 0.26);
      } else if (progress < 0.52) {
        setVisible(attackerRef, false);
      } else {
        setVisible(attackerRef, true);
        setOpacity(attackerRef, 1);
        attackerRef.current?.position.copy(end).add(new Vector3(0, 0, -0.28));
      }
      if (progress > 0.48) updateSmoke(smokeB, deltaMs, Math.max(0, (progress - 0.8) / 0.2));
      if (progress > 0.62 && progress < 0.82) dispatchVfx("assassin-style:slow-motion", { durationMs: 300, factor: 0.35 });
      if (progress > 0.76) setVisible(victimRef, false);
    });
  } finally {
    setVisible(victimRef, false);
    setOpacity(attackerRef, 1);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(smokeA);
    disposeObject(smokeB);
    disposeObject(assassin);
  }
}

export async function animateAssassinBishopCapture(attackerRef: AssassinObjectRef, victimRef: AssassinObjectRef, from: AssassinVec3, to: AssassinVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const assassin = createAssassin();
  const kunai = Array.from({ length: 5 }, () => createKunai());
  const poison = createPoisonSplash(end, 130);
  assassin.position.copy(start).add(new Vector3(-0.5, 0, 0.25));
  kunai.forEach((knife) => {
    knife.visible = false;
    root.add(knife);
  });
  root.add(assassin, poison);

  try {
    await timeline(bishopMs, (progress, deltaMs) => {
      kunai.forEach((knife, index) => {
        const localStart = 0.16 + index * 0.08;
        const t = Math.min(Math.max((progress - localStart) / 0.34, 0), 1);
        if (t > 0 && t < 1) {
          knife.visible = true;
          knife.position.lerpVectors(start.clone().add(new Vector3(0, 0.55, 0)), end.clone().add(new Vector3(0, 0.55, 0)), smoothstep(t));
          knife.lookAt(end.x, end.y + 0.55, end.z);
        } else if (t >= 1) {
          knife.visible = false;
        }
      });
      if (progress > 0.48) {
        const melt = Math.min((progress - 0.48) / 0.42, 1);
        setOpacity(victimRef, 1 - melt);
        updateSmoke(poison, deltaMs, Math.max(0, progress - 0.72) / 0.28);
        if (melt >= 1) setVisible(victimRef, false);
      }
    });
  } finally {
    setVisible(victimRef, false);
    setOpacity(victimRef, 1);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(assassin);
    kunai.forEach(disposeObject);
    disposeObject(poison);
  }
}

export async function animateAssassinQueenCapture(attackerRef: AssassinObjectRef, victimRef: AssassinObjectRef, from: AssassinVec3, to: AssassinVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const clones = Array.from({ length: 6 }, (_, index) => {
    const clone = createAssassin(0.68);
    const angle = (Math.PI * 2 * index) / 6;
    clone.position.copy(end).add(new Vector3(Math.cos(angle) * 1.05, 0, Math.sin(angle) * 1.05));
    clone.lookAt(end);
    root.add(clone);
    return clone;
  });
  const streaks = clones.map((clone) => {
    const streak = createStreak(clone.position, end);
    root.add(streak);
    return streak;
  });
  const ink = createInkPool(end);
  const mist = createSmoke(end, "#2e073f", 150);
  const light = new PointLight("#a855f7", 0, 6);
  light.position.copy(end).add(new Vector3(0, 1, 0));
  root.add(ink, mist, light);

  try {
    await timeline(queenMs, (progress, deltaMs) => {
      if (progress > 0.22 && progress < 0.64) {
        clones.forEach((clone, index) => {
          const t = smoothstep((progress - 0.22) / 0.42);
          const angle = (Math.PI * 2 * index) / 6;
          clone.position.lerpVectors(end.clone().add(new Vector3(Math.cos(angle) * 1.05, 0, Math.sin(angle) * 1.05)), end.clone().add(new Vector3(Math.cos(angle) * 0.18, 0, Math.sin(angle) * 0.18)), t);
        });
        streaks.forEach((streak) => ((streak.material as MeshBasicMaterial).opacity = 0.85));
        dispatchVfx("assassin-style:screen-blur", { durationMs: 360, intensity: 0.7 });
      }
      if (progress >= 0.62) {
        const fade = (progress - 0.62) / 0.38;
        setVisible(victimRef, false);
        updateSmoke(mist, deltaMs, fade);
        light.intensity = 7 * (1 - fade);
        (ink.material as MeshBasicMaterial).opacity = Math.max(0, 0.7 * (1 - fade * 0.45));
        ink.scale.setScalar(1 + fade * 1.2);
        if (attackerRef.current) attackerRef.current.position.lerpVectors(start, end, smoothstep(fade));
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    clones.forEach(disposeObject);
    streaks.forEach(disposeObject);
    disposeObject(ink);
    disposeObject(mist);
    disposeObject(light);
  }
}

export async function animateMagicCastling(
  kingRef: AssassinObjectRef,
  rookRef: AssassinObjectRef,
  kingFrom: AssassinVec3,
  kingTo: AssassinVec3,
  rookFrom: AssassinVec3,
  rookTo: AssassinVec3
): Promise<void> {
  const root = rootFromRefs(kingRef, rookRef);
  const k0 = v3(kingFrom);
  const k1 = v3(kingTo);
  const r0 = v3(rookFrom);
  const r1 = v3(rookTo);
  const smokeK = createSmoke(k0, "#171124", 120);
  const smokeR = createSmoke(r0, "#171124", 120);
  const flashK = createSmoke(k1, "#8b5cf6", 90);
  const flashR = createSmoke(r1, "#8b5cf6", 90);
  root.add(smokeK, smokeR, flashK, flashR);

  try {
    await timeline(castlingMs, (progress, deltaMs) => {
      if (progress < 0.38) {
        const vanish = progress / 0.38;
        updateSmoke(smokeK, deltaMs, 1 - vanish);
        updateSmoke(smokeR, deltaMs, 1 - vanish);
        setOpacity(kingRef, 1 - vanish);
        setOpacity(rookRef, 1 - vanish);
      } else if (progress < 0.62) {
        kingRef.current?.position.copy(k1);
        rookRef.current?.position.copy(r1);
      } else {
        const reform = (progress - 0.62) / 0.38;
        setOpacity(kingRef, reform);
        setOpacity(rookRef, reform);
        updateSmoke(flashK, deltaMs, reform);
        updateSmoke(flashR, deltaMs, reform);
      }
    });
  } finally {
    setOpacity(kingRef, 1);
    setOpacity(rookRef, 1);
    if (kingRef.current) kingRef.current.position.copy(k1);
    if (rookRef.current) rookRef.current.position.copy(r1);
    disposeObject(smokeK);
    disposeObject(smokeR);
    disposeObject(flashK);
    disposeObject(flashR);
  }
}

export const animateAssassinCastling = animateMagicCastling;

export async function animateAssassinCheckEscape(kingRef: AssassinObjectRef, from: AssassinVec3, to: AssassinVec3): Promise<void> {
  const root = rootFromRefs(kingRef);
  const start = v3(from);
  const end = v3(to);
  const bomb = createSmoke(start, "#171124", 140);
  const decoy = createAssassin(0.32);
  decoy.position.copy(start);
  root.add(bomb, decoy);

  try {
    await timeline(checkEscapeMs, (progress, deltaMs) => {
      updateSmoke(bomb, deltaMs, Math.max(0, (progress - 0.65) / 0.35));
      if (progress > 0.18) {
        const t = smoothstep(Math.min((progress - 0.18) / 0.42, 1));
        kingRef.current?.position.lerpVectors(start, end, t);
      }
      setGroupOpacity(decoy, Math.max(0, 0.32 * (1 - Math.max(0, progress - 0.48) / 0.52)));
    });
  } finally {
    if (kingRef.current) kingRef.current.position.copy(end);
    disposeObject(bomb);
    disposeObject(decoy);
  }
}

