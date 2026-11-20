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

export type RangeObjectRef = RefObject<Object3D | null>;
export type RangeVec3 = [number, number, number] | Vector3;

const pawnMs = 1500;
const knightMs = 2000;
const bishopMs = 2000;
const rookMs = 2500;
const queenMs = 2500;
const castlingMs = 1500;
const checkEscapeMs = 1500;

function v3(value: RangeVec3): Vector3 {
  return Array.isArray(value) ? new Vector3(value[0], value[1], value[2]) : value.clone();
}

function rootFromRefs(...refs: RangeObjectRef[]): Object3D {
  const parent = refs.find((ref) => ref.current?.parent)?.current?.parent;
  if (!parent) {
    throw new Error("RangeStyle cinematic requires at least one attached Object3D ref.");
  }
  return parent;
}

function setVisible(ref: RangeObjectRef, visible: boolean): void {
  if (ref.current) ref.current.visible = visible;
}

function setOpacity(ref: RangeObjectRef, opacity: number): void {
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

function createArcher(): Group {
  const archer = new Group();
  const cloak = new MeshStandardMaterial({ color: "#12352f", roughness: 0.64, metalness: 0.04 });
  const leather = new MeshStandardMaterial({ color: "#5b3a24", roughness: 0.78 });
  const metal = new MeshStandardMaterial({ color: "#94a3b8", roughness: 0.3, metalness: 0.55 });
  const skin = new MeshStandardMaterial({ color: "#d6a06d", roughness: 0.58 });

  const body = new Mesh(new CapsuleGeometry(0.14, 0.42, 6, 12), cloak);
  body.position.y = 0.44;
  archer.add(body);

  const head = new Mesh(new SphereGeometry(0.11, 16, 12), skin);
  head.position.y = 0.82;
  archer.add(head);

  const bow = new Mesh(new TorusGeometry(0.24, 0.012, 8, 32, Math.PI * 1.45), leather);
  bow.name = "archerBow";
  bow.position.set(0.24, 0.58, 0);
  bow.rotation.z = Math.PI / 2;
  archer.add(bow);

  const crossbow = new Mesh(new CylinderGeometry(0.018, 0.018, 0.5, 8), metal);
  crossbow.name = "archerCrossbow";
  crossbow.position.set(0.26, 0.55, 0);
  crossbow.rotation.z = Math.PI / 2;
  crossbow.visible = false;
  archer.add(crossbow);

  archer.scale.setScalar(1.04);
  return archer;
}

function createArrow(color = "#93c5fd", length = 0.74): Group {
  const arrow = new Group();
  const shaft = new Mesh(
    new CylinderGeometry(0.014, 0.014, length, 8),
    new MeshBasicMaterial({ color, transparent: true, opacity: 0.95, blending: AdditiveBlending })
  );
  shaft.rotation.z = Math.PI / 2;
  const tip = new Mesh(
    new ConeGeometry(0.045, 0.14, 12),
    new MeshBasicMaterial({ color: "#e0f2fe", transparent: true, opacity: 0.95, blending: AdditiveBlending })
  );
  tip.position.x = length / 2 + 0.07;
  tip.rotation.z = -Math.PI / 2;
  arrow.add(shaft, tip);
  return arrow;
}

function createShardBurst(position: Vector3, count = 72): Points {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const i = index * 3;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 2.2;
    positions[i] = position.x;
    positions[i + 1] = position.y + 0.48;
    positions[i + 2] = position.z;
    velocities[i] = Math.cos(angle) * speed;
    velocities[i + 1] = 0.8 + Math.random() * 2.4;
    velocities[i + 2] = Math.sin(angle) * speed;
  }
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new BufferAttribute(velocities, 3));
  return new Points(
    geometry,
    new PointsMaterial({ color: "#60a5fa", size: 0.07, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  );
}

function updateParticles(points: Points, deltaMs: number, fade: number): void {
  const positions = points.geometry.getAttribute("position") as BufferAttribute;
  const velocities = points.geometry.getAttribute("velocity") as BufferAttribute;
  const dt = deltaMs / 1000;
  for (let i = 0; i < positions.count; i += 1) {
    positions.setXYZ(i, positions.getX(i) + velocities.getX(i) * dt, positions.getY(i) + velocities.getY(i) * dt, positions.getZ(i) + velocities.getZ(i) * dt);
    velocities.setY(i, velocities.getY(i) - 3.8 * dt);
  }
  positions.needsUpdate = true;
  velocities.needsUpdate = true;
  (points.material as PointsMaterial).opacity = Math.max(0, 0.9 * (1 - fade));
}

function createWindPulse(): Mesh {
  const pulse = new Mesh(
    new RingGeometry(0.2, 0.28, 72),
    new MeshBasicMaterial({ color: "#bae6fd", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  );
  pulse.rotation.x = -Math.PI / 2;
  return pulse;
}

function createPierceHole(): Mesh {
  return new Mesh(
    new TorusGeometry(0.18, 0.018, 8, 36),
    new MeshBasicMaterial({ color: "#e0f2fe", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  );
}

function cameraShake(durationMs: number, amplitude: number): void {
  window.dispatchEvent(new CustomEvent("range-style:camera-shake", { detail: { durationMs, amplitude } }));
}

function createBallista(): Group {
  const ballista = new Group();
  const wood = new MeshStandardMaterial({ color: "#5b3a24", roughness: 0.75 });
  const steel = new MeshStandardMaterial({ color: "#334155", roughness: 0.35, metalness: 0.7 });
  const base = new Mesh(new BoxGeometry(0.9, 0.18, 0.5), wood);
  base.position.y = 0.22;
  const rail = new Mesh(new BoxGeometry(1.35, 0.08, 0.12), steel);
  rail.position.y = 0.48;
  const bow = new Mesh(new TorusGeometry(0.42, 0.018, 8, 40, Math.PI * 1.35), wood);
  bow.position.set(0.2, 0.5, 0);
  bow.rotation.z = Math.PI / 2;
  const lever = new Mesh(new CylinderGeometry(0.018, 0.018, 0.5, 8), steel);
  lever.name = "ballistaLever";
  lever.position.set(-0.45, 0.55, -0.22);
  lever.rotation.x = 0.8;
  ballista.add(base, rail, bow, lever);
  return ballista;
}

function createSonicTrail(count = 90): Points {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const p = i * 3;
    positions[p] = 0;
    positions[p + 1] = -99;
    positions[p + 2] = 0;
    velocities[p] = (Math.random() - 0.5) * 0.18;
    velocities[p + 1] = (Math.random() - 0.5) * 0.18;
    velocities[p + 2] = (Math.random() - 0.5) * 0.18;
  }
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new BufferAttribute(velocities, 3));
  return new Points(
    geometry,
    new PointsMaterial({ color: "#dbeafe", size: 0.075, transparent: true, opacity: 0.45, depthWrite: false, blending: AdditiveBlending })
  );
}

function emitTrail(points: Points, position: Vector3, cursor: { value: number }): void {
  const positions = points.geometry.getAttribute("position") as BufferAttribute;
  const i = cursor.value % positions.count;
  cursor.value += 1;
  positions.setXYZ(i, position.x + (Math.random() - 0.5) * 0.12, position.y + (Math.random() - 0.5) * 0.12, position.z + (Math.random() - 0.5) * 0.12);
  positions.needsUpdate = true;
}

function updateTrail(points: Points, deltaMs: number): void {
  const positions = points.geometry.getAttribute("position") as BufferAttribute;
  const velocities = points.geometry.getAttribute("velocity") as BufferAttribute;
  const dt = deltaMs / 1000;
  for (let i = 0; i < positions.count; i += 1) {
    positions.setXYZ(i, positions.getX(i) + velocities.getX(i) * dt, positions.getY(i) + velocities.getY(i) * dt, positions.getZ(i) + velocities.getZ(i) * dt);
  }
  positions.needsUpdate = true;
}

function createArrowRain(count: number, target: Vector3): Group {
  const group = new Group();
  for (let i = 0; i < count; i += 1) {
    const arrow = createArrow("#bfdbfe", 0.62);
    arrow.name = `rainArrow-${i}`;
    arrow.position.set(target.x + (Math.random() - 0.5) * 3.2, target.y + 4.2 + Math.random() * 2.2, target.z + (Math.random() - 0.5) * 3.2);
    arrow.rotation.z = -Math.PI / 2;
    arrow.visible = false;
    group.add(arrow);
  }
  return group;
}

function createImpactFlashes(target: Vector3, count = 24): Group {
  const group = new Group();
  for (let i = 0; i < count; i += 1) {
    const flash = new Mesh(
      new RingGeometry(0.08, 0.16, 24),
      new MeshBasicMaterial({ color: "#e0f2fe", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
    );
    flash.position.copy(target).add(new Vector3((Math.random() - 0.5) * 1.1, 0.06, (Math.random() - 0.5) * 1.1));
    flash.rotation.x = -Math.PI / 2;
    group.add(flash);
  }
  return group;
}

function createWindTunnel(start: Vector3, end: Vector3): Group {
  const group = new Group();
  const distance = start.distanceTo(end);
  for (let i = 0; i < 5; i += 1) {
    const ring = new Mesh(
      new TorusGeometry(0.45 + i * 0.03, 0.014, 8, 42),
      new MeshBasicMaterial({ color: "#bae6fd", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
    );
    ring.position.copy(start.clone().lerp(end, i / 4)).add(new Vector3(0, 0.38, 0));
    ring.lookAt(end);
    group.add(ring);
  }
  const streak = new Mesh(
    new CylinderGeometry(0.04, 0.04, distance, 12),
    new MeshBasicMaterial({ color: "#7dd3fc", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  );
  streak.position.copy(start.clone().lerp(end, 0.5)).add(new Vector3(0, 0.38, 0));
  streak.rotation.z = Math.PI / 2;
  group.add(streak);
  return group;
}

function createSmokeScreen(center: Vector3, count = 160): Points {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const p = i * 3;
    positions[p] = center.x + (Math.random() - 0.5) * 1.35;
    positions[p + 1] = center.y + Math.random() * 1.25;
    positions[p + 2] = center.z + (Math.random() - 0.5) * 0.55;
    velocities[p] = (Math.random() - 0.5) * 0.35;
    velocities[p + 1] = 0.25 + Math.random() * 0.55;
    velocities[p + 2] = (Math.random() - 0.5) * 0.35;
  }
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new BufferAttribute(velocities, 3));
  return new Points(
    geometry,
    new PointsMaterial({ color: "#86a389", size: 0.16, transparent: true, opacity: 0, depthWrite: false })
  );
}

export async function animateRangePawnCapture(attackerRef: RangeObjectRef, victimRef: RangeObjectRef, from: RangeVec3, to: RangeVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const dir = end.clone().sub(start).setY(0).normalize();
  if (dir.lengthSq() === 0) dir.set(0, 0, -1);
  const archer = createArcher();
  const bolt = createArrow("#7dd3fc", 0.52);
  const shards = createShardBurst(end, 78);
  const light = new PointLight("#60a5fa", 0, 4);
  archer.position.copy(start).addScaledVector(dir, -0.58);
  archer.lookAt(end);
  bolt.position.copy(archer.position).add(new Vector3(0.22, 0.52, 0));
  bolt.lookAt(end.x, end.y + 0.45, end.z);
  bolt.visible = false;
  light.position.copy(end).add(new Vector3(0, 0.8, 0));
  root.add(archer, bolt, shards, light);

  try {
    await timeline(pawnMs, (progress, deltaMs) => {
      const crossbow = archer.getObjectByName("archerCrossbow");
      if (crossbow) crossbow.visible = progress > 0.08;
      if (attackerRef.current) {
        const slideT = smoothstep(Math.min(Math.max((progress - 0.18) / 0.36, 0), 1));
        attackerRef.current.position.lerpVectors(start, end, slideT);
      }
      if (progress > 0.34 && progress < 0.64) {
        const shotT = smoothstep((progress - 0.34) / 0.3);
        bolt.visible = true;
        bolt.position.lerpVectors(archer.position.clone().add(new Vector3(0.22, 0.52, 0)), end.clone().add(new Vector3(0, 0.48, 0)), shotT);
        bolt.lookAt(end.x, end.y, end.z);
      }
      if (progress >= 0.64) {
        bolt.visible = false;
        setVisible(victimRef, false);
        light.intensity = 4.5 * (1 - (progress - 0.64) / 0.36);
        updateParticles(shards, deltaMs, (progress - 0.64) / 0.36);
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(archer);
    disposeObject(bolt);
    disposeObject(shards);
    disposeObject(light);
  }
}

export async function animateRangeKnightCapture(attackerRef: RangeObjectRef, victimRef: RangeObjectRef, from: RangeVec3, to: RangeVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const archer = createArcher();
  const hookArrow = createArrow("#38bdf8", 0.82);
  const pulse = createWindPulse();
  archer.position.copy(start).add(new Vector3(0, 1.0, 0.35));
  hookArrow.position.copy(archer.position);
  hookArrow.visible = false;
  pulse.position.copy(end).add(new Vector3(0, 0.04, 0));
  root.add(archer, hookArrow, pulse);

  try {
    await timeline(knightMs, (progress) => {
      if (progress < 0.72) {
        const t = smoothstep(progress / 0.72);
        const arc = Math.sin(t * Math.PI);
        const knightPosition = start.clone().lerp(end, t);
        knightPosition.y = start.y + arc * 1.35;
        attackerRef.current?.position.copy(knightPosition);
        archer.position.copy(knightPosition).add(new Vector3(0.18, 0.55, 0.22));
        if (progress > 0.18) {
          const arrowT = Math.min((progress - 0.18) / 0.26, 1);
          hookArrow.visible = true;
          hookArrow.position.lerpVectors(archer.position, end.clone().add(new Vector3(0, 0.5, 0)), smoothstep(arrowT));
          hookArrow.lookAt(end.x, end.y + 0.5, end.z);
        }
      } else {
        attackerRef.current?.position.copy(end);
        setVisible(victimRef, false);
        const impact = (progress - 0.72) / 0.28;
        (pulse.material as MeshBasicMaterial).opacity = Math.max(0, 0.8 * (1 - impact));
        pulse.scale.setScalar(1 + impact * 4);
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(archer);
    disposeObject(hookArrow);
    disposeObject(pulse);
  }
}

export async function animateRangeBishopCapture(attackerRef: RangeObjectRef, victimRef: RangeObjectRef, from: RangeVec3, to: RangeVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const distance = Math.max(start.distanceTo(end), 0.001);
  const archer = createArcher();
  const tracer = createArrow("#93c5fd", distance);
  const hole = createPierceHole();
  const dissolve = createShardBurst(end, 86);
  archer.position.copy(start);
  archer.scale.y = 0.72;
  archer.lookAt(end);
  tracer.position.copy(start).add(new Vector3(0, 0.55, 0));
  tracer.scale.x = 0.05;
  tracer.visible = false;
  hole.position.copy(end).add(new Vector3(0, 0.55, 0));
  hole.visible = false;
  root.add(archer, tracer, hole, dissolve);

  try {
    await timeline(bishopMs, (progress, deltaMs) => {
      if (progress > 0.24 && progress < 0.6) {
        const t = smoothstep((progress - 0.24) / 0.36);
        tracer.visible = true;
        tracer.position.lerpVectors(start.clone().add(new Vector3(0, 0.55, 0)), end.clone().add(new Vector3(0, 0.55, 0)), t);
        tracer.lookAt(end.x, end.y + 0.55, end.z);
        tracer.scale.x = 0.25 + t * 0.75;
      }
      if (progress >= 0.6) {
        tracer.visible = false;
        hole.visible = true;
        const dissolveT = Math.min((progress - 0.6) / 0.4, 1);
        (hole.material as MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - dissolveT));
        setOpacity(victimRef, 1 - dissolveT);
        updateParticles(dissolve, deltaMs, dissolveT);
        if (dissolveT >= 1) setVisible(victimRef, false);
      }
    });
  } finally {
    setOpacity(victimRef, 1);
    setVisible(victimRef, false);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(archer);
    disposeObject(tracer);
    disposeObject(hole);
    disposeObject(dissolve);
  }
}

export async function animateRangeRookCapture(attackerRef: RangeObjectRef, victimRef: RangeObjectRef, from: RangeVec3, to: RangeVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const archer = createArcher();
  const ballista = createBallista();
  const harpoon = createArrow("#dbeafe", 1.18);
  const trail = createSonicTrail(110);
  const shards = createShardBurst(end, 120);
  const shock = createWindPulse();
  const light = new PointLight("#bfdbfe", 0, 6);
  const cursor = { value: 0 };
  archer.position.copy(start).add(new Vector3(0.65, 0, 0));
  ballista.position.copy(start);
  harpoon.position.copy(start).add(new Vector3(0, 0.58, 0));
  harpoon.visible = false;
  shock.position.copy(end).add(new Vector3(0, 0.04, 0));
  light.position.copy(end).add(new Vector3(0, 0.9, 0));
  root.add(archer, ballista, harpoon, trail, shards, shock, light);
  setVisible(attackerRef, false);

  try {
    await timeline(rookMs, (progress, deltaMs) => {
      const lever = ballista.getObjectByName("ballistaLever");
      if (lever && progress < 0.28) lever.rotation.x = 0.8 + Math.sin(progress / 0.28 * Math.PI) * 1.2;
      if (progress > 0.26 && progress < 0.74) {
        const t = smoothstep((progress - 0.26) / 0.48);
        const pos = start.clone().lerp(end, t).add(new Vector3(0, 0.58, 0));
        harpoon.visible = true;
        harpoon.position.copy(pos);
        harpoon.lookAt(end.x, end.y + 0.58, end.z);
        emitTrail(trail, pos, cursor);
        updateTrail(trail, deltaMs);
      } else if (progress >= 0.74) {
        harpoon.visible = false;
        setVisible(victimRef, false);
        const impact = (progress - 0.74) / 0.26;
        if (impact < 0.08) cameraShake(420, 0.1);
        updateParticles(shards, deltaMs, impact);
        (shock.material as MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - impact));
        shock.scale.setScalar(1 + impact * 4.6);
        light.intensity = 7 * (1 - impact);
      }
    });
  } finally {
    setVisible(victimRef, false);
    setVisible(attackerRef, true);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(archer);
    disposeObject(ballista);
    disposeObject(harpoon);
    disposeObject(trail);
    disposeObject(shards);
    disposeObject(shock);
    disposeObject(light);
  }
}

export async function animateRangeQueenCapture(attackerRef: RangeObjectRef, victimRef: RangeObjectRef, from: RangeVec3, to: RangeVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const archer = createArcher();
  const flare = createArrow("#fef3c7", 0.7);
  const rain = createArrowRain(120, end);
  const flashes = createImpactFlashes(end, 34);
  const shards = createShardBurst(end, 150);
  const light = new PointLight("#e0f2fe", 0, 8);
  archer.position.set(end.x > 0 ? -4.5 : 4.5, start.y, end.z > 0 ? -4.5 : 4.5);
  archer.lookAt(end);
  flare.position.copy(archer.position).add(new Vector3(0, 0.62, 0));
  light.position.copy(end).add(new Vector3(0, 1.1, 0));
  root.add(archer, flare, rain, flashes, shards, light);

  try {
    await timeline(queenMs, (progress, deltaMs) => {
      if (progress < 0.26) {
        const t = smoothstep(progress / 0.26);
        flare.position.y = archer.position.y + 0.62 + t * 3.4;
        flare.scale.setScalar(1 + t * 0.8);
      } else {
        flare.visible = false;
      }

      if (progress > 0.24 && progress < 0.82) {
        rain.children.forEach((arrow, index) => {
          const localStart = 0.24 + (index % 24) * 0.011;
          const t = Math.min(Math.max((progress - localStart) / 0.34, 0), 1);
          if (t > 0) {
            arrow.visible = true;
            const startPos = new Vector3(end.x + ((index % 10) - 4.5) * 0.22, end.y + 4.2 + (index % 5) * 0.32, end.z + (Math.floor(index / 10) - 5) * 0.18);
            arrow.position.lerpVectors(startPos, end.clone().add(new Vector3((Math.random() - 0.5) * 0.55, 0.12, (Math.random() - 0.5) * 0.55)), smoothstep(t));
            arrow.lookAt(end.x, end.y, end.z);
          }
        });
        flashes.children.forEach((flash, index) => {
          const pulse = Math.sin((progress * 24 + index) * Math.PI);
          const material = (flash as Mesh).material as MeshBasicMaterial;
          material.opacity = Math.max(0, pulse) * 0.7;
          flash.scale.setScalar(0.8 + Math.max(0, pulse) * 1.1);
        });
      }

      if (progress >= 0.62) {
        setVisible(victimRef, false);
        const impact = (progress - 0.62) / 0.38;
        if (impact < 0.08) cameraShake(520, 0.12);
        updateParticles(shards, deltaMs, impact);
        light.intensity = 10 * (1 - impact);
        if (attackerRef.current) attackerRef.current.position.lerpVectors(start, end, smoothstep(impact));
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(archer);
    disposeObject(flare);
    disposeObject(rain);
    disposeObject(flashes);
    disposeObject(shards);
    disposeObject(light);
  }
}

export async function animateRangeCastling(
  kingRef: RangeObjectRef,
  rookRef: RangeObjectRef,
  kingFrom: RangeVec3,
  kingTo: RangeVec3,
  rookFrom: RangeVec3,
  rookTo: RangeVec3
): Promise<void> {
  const root = rootFromRefs(kingRef, rookRef);
  const k0 = v3(kingFrom);
  const k1 = v3(kingTo);
  const r0 = v3(rookFrom);
  const r1 = v3(rookTo);
  const archer = createArcher();
  const arrowA = createArrow("#7dd3fc", 0.62);
  const arrowB = createArrow("#7dd3fc", 0.62);
  const tunnel = createWindTunnel(k0, r0);
  archer.position.copy(k0.clone().add(r0).multiplyScalar(0.5)).add(new Vector3(0, 0, 0.8));
  arrowA.position.copy(archer.position);
  arrowB.position.copy(archer.position);
  root.add(archer, arrowA, arrowB, tunnel);

  try {
    await timeline(castlingMs, (progress) => {
      const fireT = smoothstep(Math.min(progress / 0.22, 1));
      arrowA.position.lerpVectors(archer.position, k0.clone().add(new Vector3(0, 0.4, 0)), fireT);
      arrowB.position.lerpVectors(archer.position, r0.clone().add(new Vector3(0, 0.4, 0)), fireT);
      tunnel.children.forEach((child, index) => {
        const material = (child as Mesh).material as MeshBasicMaterial;
        material.opacity = progress < 0.82 ? Math.min(0.75, progress / 0.2) : Math.max(0, 0.75 * (1 - (progress - 0.82) / 0.18));
        child.rotation.z += 0.06 + index * 0.008;
      });
      const moveT = smoothstep(Math.min(Math.max((progress - 0.22) / 0.54, 0), 1));
      kingRef.current?.position.lerpVectors(k0, k1, moveT);
      rookRef.current?.position.lerpVectors(r0, r1, moveT);
    });
  } finally {
    if (kingRef.current) kingRef.current.position.copy(k1);
    if (rookRef.current) rookRef.current.position.copy(r1);
    disposeObject(archer);
    disposeObject(arrowA);
    disposeObject(arrowB);
    disposeObject(tunnel);
  }
}

export async function animateRangeCheckEscape(kingRef: RangeObjectRef, from: RangeVec3, to: RangeVec3): Promise<void> {
  const root = rootFromRefs(kingRef);
  const start = v3(from);
  const end = v3(to);
  const archer = createArcher();
  const smokeArrow = createArrow("#86efac", 0.62);
  const smoke = createSmokeScreen(end.clone().add(new Vector3(0, 0.2, -0.35)), 180);
  archer.position.copy(start).add(new Vector3(-0.55, 0, 0.35));
  smokeArrow.position.copy(archer.position).add(new Vector3(0, 0.55, 0));
  root.add(archer, smokeArrow, smoke);

  try {
    await timeline(checkEscapeMs, (progress, deltaMs) => {
      if (progress < 0.32) {
        const t = smoothstep(progress / 0.32);
        smokeArrow.position.lerpVectors(archer.position.clone().add(new Vector3(0, 0.55, 0)), end.clone().add(new Vector3(0, 0.5, -0.35)), t);
        smokeArrow.lookAt(end);
      } else {
        smokeArrow.visible = false;
      }
      const smokeMaterial = smoke.material as PointsMaterial;
      if (progress > 0.24 && progress < 0.78) {
        smokeMaterial.opacity = Math.min(0.88, (progress - 0.24) / 0.18);
        updateParticles(smoke, deltaMs, 0);
      } else if (progress >= 0.78) {
        smokeMaterial.opacity = Math.max(0, 0.88 * (1 - (progress - 0.78) / 0.22));
        updateParticles(smoke, deltaMs, 0.5);
      }
      const moveT = smoothstep(Math.min(Math.max((progress - 0.36) / 0.38, 0), 1));
      kingRef.current?.position.lerpVectors(start, end, moveT);
    });
  } finally {
    if (kingRef.current) kingRef.current.position.copy(end);
    disposeObject(archer);
    disposeObject(smokeArrow);
    disposeObject(smoke);
  }
}

