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

export type SummonerObjectRef = RefObject<Object3D | null>;
export type SummonerVec3 = [number, number, number] | Vector3;

const pawnMs = 1500;
const knightMs = 2000;
const bishopMs = 2000;
const rookMs = 2500;
const queenMs = 3000;
const castlingMs = 2000;
const checkEscapeMs = 1500;

function v3(value: SummonerVec3): Vector3 {
  return Array.isArray(value) ? new Vector3(value[0], value[1], value[2]) : value.clone();
}

function rootFromRefs(...refs: SummonerObjectRef[]): Object3D {
  const parent = refs.find((ref) => ref.current?.parent)?.current?.parent;
  if (!parent) throw new Error("SummonerStyle cinematic requires at least one attached Object3D ref.");
  return parent;
}

function setVisible(ref: SummonerObjectRef, visible: boolean): void {
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

function nextFrame(): Promise<number> {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

async function timeline(durationMs: number, onFrame: (progress: number, deltaMs: number) => void): Promise<void> {
  const start = await nextFrame();
  let last = start;
  return new Promise((resolve) => {
    const tick = (time: number) => {
      const progress = Math.min((time - start) / durationMs, 1);
      const delta = time - last;
      last = time;
      onFrame(progress, delta);
      if (progress < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

function createPentagram(): Group {
  const group = new Group();
  const material = new MeshBasicMaterial({ color: "#a855f7", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending });
  const outer = new Mesh(new RingGeometry(0.48, 0.52, 64), material);
  outer.rotation.x = -Math.PI / 2;
  group.add(outer);
  for (let i = 0; i < 5; i += 1) {
    const line = new Mesh(new CylinderGeometry(0.012, 0.012, 0.9, 6), material.clone());
    line.rotation.x = Math.PI / 2;
    line.rotation.z = (Math.PI * 2 * i) / 5;
    group.add(line);
  }
  return group;
}

function setGroupOpacity(group: Group, opacity: number): void {
  group.traverse((child) => {
    const mesh = child as Mesh;
    if ("material" in mesh && mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        material.transparent = true;
        material.opacity = opacity;
        material.needsUpdate = true;
      });
    }
  });
}

function createImp(): Group {
  const imp = new Group();
  const bodyMaterial = new MeshStandardMaterial({ color: "#241137", roughness: 0.48, emissive: "#4c1d95", emissiveIntensity: 0.8 });
  const aura = new MeshBasicMaterial({ color: "#a855f7", transparent: true, opacity: 0.26, depthWrite: false, blending: AdditiveBlending });
  const body = new Mesh(new CapsuleGeometry(0.16, 0.34, 6, 12), bodyMaterial);
  body.position.y = 0.42;
  const head = new Mesh(new SphereGeometry(0.13, 16, 12), bodyMaterial.clone());
  head.position.y = 0.74;
  for (const x of [-0.08, 0.08]) {
    const horn = new Mesh(new ConeGeometry(0.035, 0.16, 8), bodyMaterial.clone());
    horn.position.set(x, 0.9, 0);
    imp.add(horn);
  }
  const glow = new Mesh(new SphereGeometry(0.35, 24, 16), aura);
  glow.position.y = 0.5;
  imp.add(body, head, glow);
  return imp;
}

function createGryphon(): Group {
  const beast = new Group();
  const spectral = new MeshStandardMaterial({ color: "#173d3a", roughness: 0.32, emissive: "#22c55e", emissiveIntensity: 0.9, transparent: true, opacity: 0.86 });
  const glow = new MeshBasicMaterial({ color: "#86efac", transparent: true, opacity: 0.24, depthWrite: false, blending: AdditiveBlending });
  const body = new Mesh(new CapsuleGeometry(0.2, 0.6, 8, 14), spectral);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.45;
  beast.add(body);
  for (const side of [-1, 1]) {
    const wing = new Mesh(new ConeGeometry(0.18, 0.82, 3), spectral.clone());
    wing.position.set(0, 0.55, side * 0.34);
    wing.rotation.x = side * 0.9;
    wing.name = `gryphonWing-${side}`;
    beast.add(wing);
  }
  const aura = new Mesh(new SphereGeometry(0.62, 24, 16), glow);
  aura.position.y = 0.45;
  beast.add(aura);
  beast.scale.setScalar(1.35);
  return beast;
}

function createWisp(color = "#bbf7d0"): Group {
  const wisp = new Group();
  const core = new Mesh(new SphereGeometry(0.12, 18, 12), new MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: AdditiveBlending }));
  const aura = new Mesh(new SphereGeometry(0.26, 20, 12), new MeshBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false, blending: AdditiveBlending }));
  wisp.add(core, aura);
  return wisp;
}

function createEssenceBurst(position: Vector3, color = "#bbf7d0", count = 92): Points {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const p = i * 3;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.7;
    positions[p] = position.x;
    positions[p + 1] = position.y + 0.55;
    positions[p + 2] = position.z;
    velocities[p] = Math.cos(angle) * speed;
    velocities[p + 1] = 0.8 + Math.random() * 1.8;
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
    velocities.setY(i, velocities.getY(i) - 2.7 * dt);
  }
  positions.needsUpdate = true;
  velocities.needsUpdate = true;
  (points.material as PointsMaterial).opacity = Math.max(0, 0.88 * (1 - fade));
}

function createShockwave(): Mesh {
  const ring = new Mesh(
    new RingGeometry(0.18, 0.28, 64),
    new MeshBasicMaterial({ color: "#86efac", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  );
  ring.rotation.x = -Math.PI / 2;
  return ring;
}

function cameraShake(durationMs: number, amplitude: number): void {
  window.dispatchEvent(new CustomEvent("summoner-style:camera-shake", { detail: { durationMs, amplitude } }));
}

function createGolemArm(): Group {
  const arm = new Group();
  const stone = new MeshStandardMaterial({ color: "#5c5146", roughness: 0.9, metalness: 0.02 });
  const glow = new MeshBasicMaterial({ color: "#bbf7d0", transparent: true, opacity: 0.22, depthWrite: false, blending: AdditiveBlending });
  const forearm = new Mesh(new CapsuleGeometry(0.22, 0.95, 8, 14), stone);
  forearm.position.y = 0.55;
  const fist = new Mesh(new BoxGeometry(0.58, 0.36, 0.46), stone.clone());
  fist.position.y = 1.18;
  const aura = new Mesh(new SphereGeometry(0.62, 24, 16), glow);
  aura.position.y = 1.08;
  arm.add(forearm, fist, aura);
  arm.position.y = -1.2;
  return arm;
}

function createDragonSilhouette(): Group {
  const dragon = new Group();
  const mat = new MeshBasicMaterial({ color: "#06120e", transparent: true, opacity: 0.48, depthWrite: false });
  const body = new Mesh(new CapsuleGeometry(0.32, 1.7, 8, 18), mat);
  body.rotation.z = Math.PI / 2;
  const head = new Mesh(new ConeGeometry(0.28, 0.48, 5), mat.clone());
  head.position.x = 1.0;
  head.rotation.z = -Math.PI / 2;
  for (const side of [-1, 1]) {
    const wing = new Mesh(new ConeGeometry(0.5, 1.4, 3), mat.clone());
    wing.position.set(0, 0, side * 0.55);
    wing.rotation.x = side * 0.9;
    dragon.add(wing);
  }
  dragon.add(body, head);
  dragon.scale.setScalar(2.3);
  return dragon;
}

function createDragonHead(): Group {
  const head = new Group();
  const spectral = new MeshStandardMaterial({ color: "#134e4a", roughness: 0.28, emissive: "#22c55e", emissiveIntensity: 1.2, transparent: true, opacity: 0.9 });
  const skull = new Mesh(new ConeGeometry(0.38, 0.78, 5), spectral);
  skull.rotation.z = -Math.PI / 2;
  const jaw = new Mesh(new BoxGeometry(0.52, 0.12, 0.24), spectral.clone());
  jaw.position.set(0.18, -0.18, 0);
  for (const side of [-1, 1]) {
    const horn = new Mesh(new ConeGeometry(0.055, 0.4, 8), spectral.clone());
    horn.position.set(-0.24, 0.22, side * 0.16);
    horn.rotation.z = Math.PI * 0.72;
    head.add(horn);
  }
  head.add(skull, jaw);
  head.scale.setScalar(1.35);
  return head;
}

function createSpiritFire(count = 120): Points {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new BufferAttribute(velocities, 3));
  return new Points(
    geometry,
    new PointsMaterial({ color: "#86efac", size: 0.085, transparent: true, opacity: 0.82, depthWrite: false, blending: AdditiveBlending })
  );
}

function emitSpiritFire(points: Points, position: Vector3, direction: Vector3, cursor: { value: number }): void {
  const positions = points.geometry.getAttribute("position") as BufferAttribute;
  const velocities = points.geometry.getAttribute("velocity") as BufferAttribute;
  const i = cursor.value % positions.count;
  cursor.value += 1;
  positions.setXYZ(i, position.x, position.y, position.z);
  velocities.setXYZ(i, direction.x * 2 + (Math.random() - 0.5) * 0.6, direction.y * 2 + Math.random() * 0.4, direction.z * 2 + (Math.random() - 0.5) * 0.6);
  positions.needsUpdate = true;
  velocities.needsUpdate = true;
}

function createVoidPortal(): Group {
  const portal = new Group();
  const mat = new MeshBasicMaterial({ color: "#7c3aed", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending });
  const ring = new Mesh(new TorusGeometry(0.5, 0.025, 8, 64), mat);
  ring.rotation.x = Math.PI / 2;
  const center = new Mesh(new RingGeometry(0.06, 0.42, 64), mat.clone());
  center.rotation.x = -Math.PI / 2;
  portal.add(ring, center);
  return portal;
}

function createTentacles(count = 6): Group {
  const group = new Group();
  const mat = new MeshBasicMaterial({ color: "#c4b5fd", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending });
  for (let i = 0; i < count; i += 1) {
    const tentacle = new Mesh(new CylinderGeometry(0.018, 0.028, 0.82, 8), mat.clone());
    tentacle.position.set(Math.cos(i) * 0.32, 0.34, Math.sin(i) * 0.32);
    tentacle.rotation.z = (i / count) * Math.PI;
    group.add(tentacle);
  }
  return group;
}

function createGuardianSpirit(): Group {
  const guardian = new Group();
  const mat = new MeshStandardMaterial({ color: "#0f766e", roughness: 0.25, emissive: "#5eead4", emissiveIntensity: 1.3, transparent: true, opacity: 0.78 });
  const auraMat = new MeshBasicMaterial({ color: "#99f6e4", transparent: true, opacity: 0.22, depthWrite: false, blending: AdditiveBlending });
  const body = new Mesh(new CapsuleGeometry(0.22, 0.75, 8, 14), mat);
  body.position.y = 0.72;
  const shield = new Mesh(new SphereGeometry(0.58, 24, 14), auraMat);
  shield.position.y = 0.72;
  shield.scale.set(1.1, 1.35, 0.25);
  guardian.add(body, shield);
  return guardian;
}

export async function animateSummonerPawnCapture(attackerRef: SummonerObjectRef, victimRef: SummonerObjectRef, from: SummonerVec3, to: SummonerVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const pentagram = createPentagram();
  const imp = createImp();
  const dust = createEssenceBurst(end, "#a855f7", 84);
  const light = new PointLight("#a855f7", 0, 4);
  pentagram.position.copy(end).add(new Vector3(0, 0.03, 0));
  imp.position.copy(end).add(new Vector3(0, -0.65, 0));
  light.position.copy(end).add(new Vector3(0, 0.8, 0));
  root.add(pentagram, imp, dust, light);

  try {
    await timeline(pawnMs, (progress, deltaMs) => {
      if (attackerRef.current) {
        const halfT = smoothstep(Math.min(progress / 0.32, 1));
        attackerRef.current.position.lerpVectors(start, start.clone().lerp(end, 0.5), halfT);
      }
      setGroupOpacity(pentagram, progress < 0.78 ? Math.min(0.9, progress / 0.18) : Math.max(0, 0.9 * (1 - (progress - 0.78) / 0.22)));
      pentagram.rotation.y += 0.04;
      if (progress > 0.24 && progress < 0.7) {
        const leapT = smoothstep((progress - 0.24) / 0.46);
        imp.position.lerpVectors(end.clone().add(new Vector3(0, -0.65, 0)), end.clone().add(new Vector3(0, 0.45, 0)), leapT);
        imp.position.y += Math.sin(leapT * Math.PI) * 0.42;
      }
      if (progress >= 0.66) {
        setVisible(victimRef, false);
        updateParticles(dust, deltaMs, (progress - 0.66) / 0.34);
        light.intensity = 4.5 * (1 - (progress - 0.66) / 0.34);
        if (attackerRef.current) attackerRef.current.position.lerpVectors(start.clone().lerp(end, 0.5), end, smoothstep((progress - 0.66) / 0.34));
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(pentagram);
    disposeObject(imp);
    disposeObject(dust);
    disposeObject(light);
  }
}

export async function animateSummonerKnightCapture(attackerRef: SummonerObjectRef, victimRef: SummonerObjectRef, from: SummonerVec3, to: SummonerVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const gryphon = createGryphon();
  const feathers = createEssenceBurst(end, "#bbf7d0", 120);
  const wave = createShockwave();
  wave.position.copy(end).add(new Vector3(0, 0.04, 0));
  gryphon.position.copy(start);
  root.add(gryphon, feathers, wave);
  setVisible(attackerRef, false);

  try {
    await timeline(knightMs, (progress, deltaMs) => {
      if (progress < 0.72) {
        const t = smoothstep(progress / 0.72);
        gryphon.position.lerpVectors(start, end, t);
        gryphon.position.y = start.y + Math.sin(t * Math.PI) * 2.0;
        gryphon.rotation.z = Math.sin(t * Math.PI) * 0.18;
        gryphon.children.forEach((child) => {
          if (child.name.startsWith("gryphonWing")) child.rotation.y = Math.sin(progress * Math.PI * 14) * 0.55;
        });
      } else {
        gryphon.position.copy(end);
        setVisible(victimRef, false);
        const impact = (progress - 0.72) / 0.28;
        updateParticles(feathers, deltaMs, impact);
        (wave.material as MeshBasicMaterial).opacity = Math.max(0, 0.8 * (1 - impact));
        wave.scale.setScalar(1 + impact * 4.0);
      }
    });
  } finally {
    setVisible(victimRef, false);
    setVisible(attackerRef, true);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(gryphon);
    disposeObject(feathers);
    disposeObject(wave);
  }
}

export async function animateSummonerBishopCapture(attackerRef: SummonerObjectRef, victimRef: SummonerObjectRef, from: SummonerVec3, to: SummonerVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const wispA = createWisp("#bbf7d0");
  const wispB = createWisp("#86efac");
  const vortex = new Mesh(
    new TorusGeometry(0.55, 0.018, 8, 64),
    new MeshBasicMaterial({ color: "#bbf7d0", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  );
  const essence = createEssenceBurst(end, "#d9f99d", 110);
  wispA.position.copy(start).add(new Vector3(0, 0.7, 0.18));
  wispB.position.copy(start).add(new Vector3(0, 0.7, -0.18));
  vortex.position.copy(end).add(new Vector3(0, 0.6, 0));
  root.add(wispA, wispB, vortex, essence);

  try {
    await timeline(bishopMs, (progress, deltaMs) => {
      if (progress < 0.55) {
        const t = smoothstep(progress / 0.55);
        wispA.position.lerpVectors(start.clone().add(new Vector3(0, 0.7, 0.18)), end.clone().add(new Vector3(0.32, 0.75, 0)), t);
        wispB.position.lerpVectors(start.clone().add(new Vector3(0, 0.7, -0.18)), end.clone().add(new Vector3(-0.32, 0.75, 0)), t);
      } else {
        const circleT = (progress - 0.55) / 0.45;
        const angle = circleT * Math.PI * 8;
        wispA.position.copy(end).add(new Vector3(Math.cos(angle) * 0.42, 0.75 + Math.sin(angle * 0.7) * 0.16, Math.sin(angle) * 0.42));
        wispB.position.copy(end).add(new Vector3(Math.cos(angle + Math.PI) * 0.42, 0.75 + Math.sin(angle) * 0.16, Math.sin(angle + Math.PI) * 0.42));
        (vortex.material as MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - Math.max(0, circleT - 0.78) / 0.22));
        vortex.rotation.y += 0.12;
        vortex.scale.setScalar(1 + circleT * 0.45);
        victimRef.current?.position.add(new Vector3(0, 0.018, 0));
        victimRef.current?.scale.setScalar(Math.max(0, 1 - circleT));
        if (circleT > 0.82) {
          setVisible(victimRef, false);
          updateParticles(essence, deltaMs, (circleT - 0.82) / 0.18);
        }
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (victimRef.current) victimRef.current.scale.setScalar(1);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(wispA);
    disposeObject(wispB);
    disposeObject(vortex);
    disposeObject(essence);
  }
}

export async function animateSummonerRookCapture(attackerRef: SummonerObjectRef, victimRef: SummonerObjectRef, from: SummonerVec3, to: SummonerVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const arm = createGolemArm();
  const dust = createEssenceBurst(end, "#a8a29e", 150);
  const wave = createShockwave();
  const light = new PointLight("#bbf7d0", 0, 5);
  arm.position.copy(end).add(new Vector3(0, -1.4, 0));
  wave.position.copy(end).add(new Vector3(0, 0.04, 0));
  light.position.copy(end).add(new Vector3(0, 1.1, 0));
  root.add(arm, dust, wave, light);

  try {
    await timeline(rookMs, (progress, deltaMs) => {
      if (attackerRef.current) {
        attackerRef.current.position.copy(start);
        attackerRef.current.rotation.y += Math.sin(progress * Math.PI * 18) * 0.008;
      }
      if (progress < 0.42) {
        const rise = smoothstep(progress / 0.42);
        arm.position.y = end.y - 1.4 + rise * 1.35;
      } else if (progress < 0.62) {
        const smash = smoothstep((progress - 0.42) / 0.2);
        arm.position.y = end.y - 0.05 + Math.sin((1 - smash) * Math.PI) * 0.5;
        arm.rotation.z = -smash * 0.35;
      } else if (progress < 0.82) {
        const impact = (progress - 0.62) / 0.2;
        if (impact < 0.08) cameraShake(520, 0.13);
        setVisible(victimRef, false);
        light.intensity = 6 * (1 - impact);
        updateParticles(dust, deltaMs, impact);
        (wave.material as MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - impact));
        wave.scale.setScalar(1 + impact * 4.5);
      } else {
        const retract = smoothstep((progress - 0.82) / 0.18);
        arm.position.y = end.y - 0.05 - retract * 1.35;
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(arm);
    disposeObject(dust);
    disposeObject(wave);
    disposeObject(light);
  }
}

export async function animateSummonerQueenCapture(attackerRef: SummonerObjectRef, victimRef: SummonerObjectRef, from: SummonerVec3, to: SummonerVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const silhouette = createDragonSilhouette();
  const dragonHead = createDragonHead();
  const fire = createSpiritFire(150);
  const vapor = createEssenceBurst(end, "#86efac", 180);
  const light = new PointLight("#86efac", 0, 8);
  const cursor = { value: 0 };
  const direction = end.clone().sub(start).setY(0).normalize();
  if (direction.lengthSq() === 0) direction.set(0, 0, -1);
  silhouette.position.set(0, 4.4, -3.6);
  dragonHead.position.copy(start).addScaledVector(direction, -1.8).add(new Vector3(0, 1.2, 0));
  dragonHead.lookAt(end);
  light.position.copy(end).add(new Vector3(0, 1.2, 0));
  root.add(silhouette, dragonHead, fire, vapor, light);

  try {
    await timeline(queenMs, (progress, deltaMs) => {
      attackerRef.current?.position.copy(start);
      attackerRef.current?.scale.setScalar(1 + Math.sin(progress * Math.PI * 10) * 0.04);
      silhouette.rotation.y += 0.01;
      if (progress > 0.18 && progress < 0.68) {
        const lunge = smoothstep((progress - 0.18) / 0.5);
        dragonHead.position.lerpVectors(start.clone().addScaledVector(direction, -1.8).add(new Vector3(0, 1.2, 0)), end.clone().add(new Vector3(0, 0.85, 0)), lunge);
        dragonHead.lookAt(end.x, end.y + 0.4, end.z);
        for (let i = 0; i < 4; i += 1) emitSpiritFire(fire, dragonHead.position, direction, cursor);
        updateParticles(fire, deltaMs, 0);
      }
      if (progress >= 0.62) {
        setVisible(victimRef, false);
        const impact = (progress - 0.62) / 0.38;
        light.intensity = 11 * (1 - impact);
        updateParticles(vapor, deltaMs, impact);
        if (attackerRef.current) attackerRef.current.position.lerpVectors(start, end, smoothstep(impact));
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (attackerRef.current) {
      attackerRef.current.position.copy(end);
      attackerRef.current.scale.setScalar(1);
    }
    disposeObject(silhouette);
    disposeObject(dragonHead);
    disposeObject(fire);
    disposeObject(vapor);
    disposeObject(light);
  }
}

export async function animateSummonerCastling(
  kingRef: SummonerObjectRef,
  rookRef: SummonerObjectRef,
  kingFrom: SummonerVec3,
  kingTo: SummonerVec3,
  rookFrom: SummonerVec3,
  rookTo: SummonerVec3
): Promise<void> {
  const root = rootFromRefs(kingRef, rookRef);
  const k0 = v3(kingFrom);
  const k1 = v3(kingTo);
  const r0 = v3(rookFrom);
  const r1 = v3(rookTo);
  const kingPortal = createVoidPortal();
  const rookPortal = createVoidPortal();
  const kingExit = createVoidPortal();
  const rookExit = createVoidPortal();
  const kingHands = createTentacles();
  const rookHands = createTentacles();
  kingPortal.position.copy(k0).add(new Vector3(0, 0.03, 0));
  rookPortal.position.copy(r0).add(new Vector3(0, 0.03, 0));
  kingExit.position.copy(k1).add(new Vector3(0, 0.03, 0));
  rookExit.position.copy(r1).add(new Vector3(0, 0.03, 0));
  kingHands.position.copy(k0);
  rookHands.position.copy(r0);
  root.add(kingPortal, rookPortal, kingExit, rookExit, kingHands, rookHands);

  try {
    await timeline(castlingMs, (progress) => {
      const portalOpacity = progress < 0.8 ? Math.min(0.92, progress / 0.2) : Math.max(0, 0.92 * (1 - (progress - 0.8) / 0.2));
      [kingPortal, rookPortal, kingExit, rookExit].forEach((portal) => {
        setGroupOpacity(portal, portalOpacity);
        portal.rotation.y += 0.07;
      });
      [kingHands, rookHands].forEach((hands) => {
        setGroupOpacity(hands, portalOpacity);
        hands.children.forEach((child, index) => {
          child.rotation.z += 0.025 + index * 0.002;
        });
      });
      if (progress < 0.45) {
        const sink = smoothstep(progress / 0.45);
        kingRef.current?.position.copy(k0.clone().add(new Vector3(0, -sink * 0.75, 0)));
        rookRef.current?.position.copy(r0.clone().add(new Vector3(0, -sink * 0.75, 0)));
      } else {
        const rise = smoothstep((progress - 0.45) / 0.42);
        kingRef.current?.position.copy(k1.clone().add(new Vector3(0, -0.75 + rise * 0.75, 0)));
        rookRef.current?.position.copy(r1.clone().add(new Vector3(0, -0.75 + rise * 0.75, 0)));
      }
    });
  } finally {
    if (kingRef.current) kingRef.current.position.copy(k1);
    if (rookRef.current) rookRef.current.position.copy(r1);
    disposeObject(kingPortal);
    disposeObject(rookPortal);
    disposeObject(kingExit);
    disposeObject(rookExit);
    disposeObject(kingHands);
    disposeObject(rookHands);
  }
}

export async function animateSummonerCheckEscape(kingRef: SummonerObjectRef, from: SummonerVec3, to: SummonerVec3): Promise<void> {
  const root = rootFromRefs(kingRef);
  const start = v3(from);
  const end = v3(to);
  const guardian = createGuardianSpirit();
  const particles = createEssenceBurst(end, "#99f6e4", 110);
  guardian.position.copy(end).add(new Vector3(0, 0, -0.55));
  root.add(guardian, particles);

  try {
    await timeline(checkEscapeMs, (progress, deltaMs) => {
      const moveT = smoothstep(Math.min(progress / 0.48, 1));
      kingRef.current?.position.lerpVectors(start, end, moveT);
      if (progress < 0.38) {
        guardian.scale.setScalar(0.4 + smoothstep(progress / 0.38) * 0.85);
      } else if (progress < 0.7) {
        guardian.scale.set(1.25 + Math.sin(progress * Math.PI * 12) * 0.08, 1.25, 1.25);
      } else {
        const fade = (progress - 0.7) / 0.3;
        setGroupOpacity(guardian, Math.max(0, 0.78 * (1 - fade)));
        updateParticles(particles, deltaMs, fade);
      }
    });
  } finally {
    if (kingRef.current) kingRef.current.position.copy(end);
    disposeObject(guardian);
    disposeObject(particles);
  }
}

