'use client';
import type { RefObject } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  Color,
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

export type MagicObjectRef = RefObject<Object3D | null>;
export type MagicVec3 = [number, number, number] | Vector3;

const pawnMs = 1500;
const rookMs = 2000;
const knightMs = 2000;
const bishopMs = 2000;
const queenMs = 2500;
const castlingMs = 1500;
const checkEscapeMs = 1500;

function v3(value: MagicVec3): Vector3 {
  return Array.isArray(value) ? new Vector3(value[0], value[1], value[2]) : value.clone();
}

function rootFromRefs(...refs: MagicObjectRef[]): Object3D {
  const parent = refs.find((ref) => ref.current?.parent)?.current?.parent;
  if (!parent) {
    throw new Error("MagicStyle cinematic requires at least one attached Object3D ref.");
  }
  return parent;
}

function setVisible(ref: MagicObjectRef, visible: boolean): void {
  if (ref.current) {
    ref.current.visible = visible;
  }
}

function setOpacity(ref: MagicObjectRef, opacity: number): void {
  ref.current?.traverse((child) => {
    const mesh = child as Mesh;
    if (!("material" in mesh) || !mesh.material) {
      return;
    }
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      material.transparent = true;
      material.opacity = opacity;
      material.needsUpdate = true;
    }
  });
}

function disposeObject(object: Object3D): void {
  object.traverse((child) => {
    const mesh = child as Mesh;
    const points = child as Points;
    if ("geometry" in mesh && mesh.geometry) {
      mesh.geometry.dispose();
    }
    const material = "material" in mesh ? mesh.material : "material" in points ? points.material : undefined;
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
    } else {
      material?.dispose();
    }
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
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

function createWizard(): Group {
  const wizard = new Group();
  const robe = new MeshStandardMaterial({ color: "#3b1f72", roughness: 0.62, metalness: 0.03 });
  const hat = new MeshStandardMaterial({ color: "#4c1d95", roughness: 0.55 });
  const skin = new MeshStandardMaterial({ color: "#f0c9a4", roughness: 0.62 });
  const glow = new MeshBasicMaterial({ color: "#a78bfa", transparent: true, opacity: 0.78, blending: AdditiveBlending });

  const body = new Mesh(new CapsuleGeometry(0.16, 0.42, 6, 12), robe);
  body.position.y = 0.45;
  wizard.add(body);

  const head = new Mesh(new SphereGeometry(0.13, 18, 12), skin);
  head.position.y = 0.84;
  wizard.add(head);

  const cone = new Mesh(new ConeGeometry(0.17, 0.34, 18), hat);
  cone.position.y = 1.12;
  wizard.add(cone);

  const staff = new Mesh(new CylinderGeometry(0.018, 0.018, 0.72, 8), glow);
  staff.name = "wizardStaff";
  staff.position.set(0.23, 0.62, 0.02);
  staff.rotation.z = -0.18;
  wizard.add(staff);

  wizard.scale.setScalar(1.08);
  return wizard;
}

function createMagicDust(position: Vector3, color = "#c4b5fd", count = 80): Points {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const i = index * 3;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.9;
    positions[i] = position.x;
    positions[i + 1] = position.y + 0.55;
    positions[i + 2] = position.z;
    velocities[i] = Math.cos(angle) * speed;
    velocities[i + 1] = 0.7 + Math.random() * 2.1;
    velocities[i + 2] = Math.sin(angle) * speed;
  }
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new BufferAttribute(velocities, 3));
  return new Points(
    geometry,
    new PointsMaterial({
      color: new Color(color),
      size: 0.065,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending
    })
  );
}

function updateDust(points: Points, deltaMs: number, fade: number): void {
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
    velocities.setY(i, velocities.getY(i) - 2.4 * dt);
  }
  positions.needsUpdate = true;
  velocities.needsUpdate = true;
  (points.material as PointsMaterial).opacity = Math.max(0, 0.92 * (1 - fade));
}

function createPortal(color = "#8b5cf6"): Group {
  const portal = new Group();
  const material = new MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending });
  const ring = new Mesh(new TorusGeometry(0.48, 0.025, 8, 64), material);
  ring.rotation.x = Math.PI / 2;
  const inner = new Mesh(new RingGeometry(0.08, 0.44, 64), material.clone());
  inner.rotation.x = -Math.PI / 2;
  portal.add(ring, inner);
  return portal;
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

function createBeam(length: number, color = "#93c5fd", radius = 0.03): Mesh {
  const beam = new Mesh(
    new CylinderGeometry(radius, radius, length, 12),
    new MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  );
  beam.rotation.z = Math.PI / 2;
  return beam;
}

function createObelisk(): Group {
  const group = new Group();
  const material = new MeshStandardMaterial({ color: "#6d28d9", roughness: 0.25, metalness: 0.2, emissive: "#4c1d95", emissiveIntensity: 1.4 });
  const base = new Mesh(new CylinderGeometry(0.22, 0.28, 0.28, 6), material);
  base.position.y = 0.18;
  const pillar = new Mesh(new CylinderGeometry(0.16, 0.2, 0.9, 6), material.clone());
  pillar.position.y = 0.68;
  const tip = new Mesh(new ConeGeometry(0.19, 0.32, 6), material.clone());
  tip.position.y = 1.29;
  group.add(base, pillar, tip);
  return group;
}

function createOrb(): Mesh {
  return new Mesh(
    new SphereGeometry(0.16, 24, 16),
    new MeshBasicMaterial({ color: "#c084fc", transparent: true, opacity: 0.9, blending: AdditiveBlending })
  );
}

function createLightningBolt(from: Vector3, to: Vector3): Group {
  const group = new Group();
  const segments = 5;
  const material = new MeshBasicMaterial({ color: "#fef9c3", transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
  let previous = from.clone();
  for (let i = 1; i <= segments; i += 1) {
    const t = i / segments;
    const current = from.clone().lerp(to, t).add(new Vector3((Math.random() - 0.5) * 0.22, 0, (Math.random() - 0.5) * 0.22));
    const length = previous.distanceTo(current);
    const bolt = new Mesh(new CylinderGeometry(0.018, 0.018, length, 6), material.clone());
    bolt.position.copy(previous.clone().lerp(current, 0.5));
    bolt.lookAt(current);
    bolt.rotateX(Math.PI / 2);
    group.add(bolt);
    previous = current;
  }
  return group;
}

function createSmokeWall(center: Vector3, count = 130): Points {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const p = i * 3;
    positions[p] = center.x + (Math.random() - 0.5) * 1.1;
    positions[p + 1] = center.y + Math.random() * 1.35;
    positions[p + 2] = center.z + (Math.random() - 0.5) * 0.18;
    velocities[p] = (Math.random() - 0.5) * 0.16;
    velocities[p + 1] = Math.random() * 0.45;
    velocities[p + 2] = (Math.random() - 0.5) * 0.16;
  }
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new BufferAttribute(velocities, 3));
  return new Points(
    geometry,
    new PointsMaterial({ color: "#a78bfa", size: 0.13, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  );
}

export async function animateMagicPawnCapture(
  attackerRef: MagicObjectRef,
  victimRef: MagicObjectRef,
  from: MagicVec3,
  to: MagicVec3
): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const direction = end.clone().sub(start).setY(0).normalize();
  if (direction.lengthSq() === 0) direction.set(0, 0, -1);
  const wizard = createWizard();
  const lasso = new Mesh(new TorusGeometry(0.42, 0.018, 8, 64), new MeshBasicMaterial({ color: "#facc15", transparent: true, opacity: 0, blending: AdditiveBlending }));
  const dust = createMagicDust(end, "#ddd6fe", 90);
  const light = new PointLight("#c4b5fd", 0, 4);
  wizard.position.copy(start).addScaledVector(direction, -0.56);
  wizard.lookAt(start);
  lasso.position.copy(start).add(new Vector3(0, 0.68, 0));
  lasso.rotation.x = Math.PI / 2;
  light.position.copy(end).add(new Vector3(0, 1, 0));
  root.add(wizard, lasso, dust, light);

  try {
    await timeline(pawnMs, (progress, deltaMs) => {
      const staff = wizard.getObjectByName("wizardStaff");
      if (staff) staff.rotation.z = -0.18 + Math.sin(progress * Math.PI * 4) * 0.35;
      (lasso.material as MeshBasicMaterial).opacity = progress < 0.62 ? Math.min(0.9, progress / 0.15) : Math.max(0, 0.9 * (1 - (progress - 0.62) / 0.2));
      lasso.scale.setScalar(1 + Math.sin(progress * Math.PI * 8) * 0.18);
      if (attackerRef.current) {
        const moveT = smoothstep(Math.min(Math.max((progress - 0.22) / 0.42, 0), 1));
        attackerRef.current.position.lerpVectors(start, end, moveT);
        attackerRef.current.position.y = start.y + Math.sin(moveT * Math.PI) * 0.22;
      }
      if (progress > 0.64) {
        setVisible(victimRef, false);
        light.intensity = 4.8 * (1 - (progress - 0.64) / 0.36);
        updateDust(dust, deltaMs, (progress - 0.64) / 0.36);
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(wizard);
    disposeObject(lasso);
    disposeObject(dust);
    disposeObject(light);
  }
}

export async function animateMagicRookCapture(attackerRef: MagicObjectRef, victimRef: MagicObjectRef, from: MagicVec3, to: MagicVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const distance = Math.max(start.distanceTo(end), 0.01);
  const wizard = createWizard();
  const obelisk = createObelisk();
  const beam = createBeam(distance, "#93c5fd", 0.04);
  const puddle = new Mesh(new CylinderGeometry(0.44, 0.44, 0.025, 32), new MeshBasicMaterial({ color: "#bfdbfe", transparent: true, opacity: 0, blending: AdditiveBlending }));
  const light = new PointLight("#93c5fd", 0, 5);
  wizard.position.copy(start).add(new Vector3(0.55, 0, 0));
  wizard.lookAt(end);
  obelisk.position.copy(start);
  beam.position.copy(start.clone().lerp(end, 0.5)).add(new Vector3(0, 0.72, 0));
  beam.lookAt(end.x, end.y + 0.72, end.z);
  puddle.position.copy(end).add(new Vector3(0, 0.03, 0));
  light.position.copy(end).add(new Vector3(0, 0.8, 0));
  root.add(wizard, obelisk, beam, puddle, light);
  setVisible(attackerRef, false);

  try {
    await timeline(rookMs, (progress) => {
      const transformT = smoothstep(Math.min(progress / 0.28, 1));
      obelisk.scale.setScalar(0.5 + transformT * 0.75);
      if (progress > 0.28 && progress < 0.78) {
        (beam.material as MeshBasicMaterial).opacity = 0.9;
        beam.scale.y = smoothstep((progress - 0.28) / 0.16);
        light.intensity = 5.5;
        setOpacity(victimRef, Math.max(0, 1 - (progress - 0.38) / 0.36));
        (puddle.material as MeshBasicMaterial).opacity = Math.min(0.75, (progress - 0.38) / 0.28);
        puddle.scale.setScalar(0.35 + progress * 0.9);
      } else if (progress >= 0.78) {
        (beam.material as MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - (progress - 0.78) / 0.22));
        light.intensity = Math.max(0, 5.5 * (1 - (progress - 0.78) / 0.22));
        setVisible(victimRef, false);
      }
    });
  } finally {
    setVisible(victimRef, false);
    setVisible(attackerRef, true);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(wizard);
    disposeObject(obelisk);
    disposeObject(beam);
    disposeObject(puddle);
    disposeObject(light);
  }
}

export async function animateMagicKnightCapture(attackerRef: MagicObjectRef, victimRef: MagicObjectRef, from: MagicVec3, to: MagicVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const wizard = createWizard();
  const portalA = createPortal("#7c3aed");
  const portalB = createPortal("#22d3ee");
  const burst = createMagicDust(end, "#f5d0fe", 110);
  wizard.position.copy(start).add(new Vector3(-0.55, 0, 0));
  portalA.position.copy(start).add(new Vector3(0, 0.05, 0));
  portalB.position.copy(end).add(new Vector3(0, 0.05, 0));
  root.add(wizard, portalA, portalB, burst);

  try {
    await timeline(knightMs, (progress, deltaMs) => {
      setGroupOpacity(portalA, Math.min(0.95, progress / 0.16));
      setGroupOpacity(portalB, Math.min(0.95, progress / 0.16));
      portalA.rotation.y += 0.08;
      portalB.rotation.y -= 0.08;
      if (attackerRef.current) {
        if (progress < 0.34) {
          attackerRef.current.position.copy(start).add(new Vector3(0, -smoothstep(progress / 0.34) * 0.9, 0));
        } else if (progress < 0.78) {
          const t = smoothstep((progress - 0.34) / 0.44);
          attackerRef.current.position.lerpVectors(start.clone().add(new Vector3(0, 2.8, 0)), end, t);
          attackerRef.current.position.y = end.y + 2.8 * (1 - t) + Math.sin(t * Math.PI) * 0.55;
        } else {
          attackerRef.current.position.copy(end);
          setVisible(victimRef, false);
          updateDust(burst, deltaMs, (progress - 0.78) / 0.22);
        }
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(wizard);
    disposeObject(portalA);
    disposeObject(portalB);
    disposeObject(burst);
  }
}

export async function animateMagicBishopCapture(attackerRef: MagicObjectRef, victimRef: MagicObjectRef, from: MagicVec3, to: MagicVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const wizard = createWizard();
  const orb = createOrb();
  const corner = new Vector3(start.x < 0 ? -4.4 : 4.4, start.y, start.z < 0 ? -4.4 : 4.4);
  wizard.position.copy(corner);
  wizard.lookAt(end);
  orb.position.copy(start).add(new Vector3(0, 0.75, 0));
  root.add(wizard, orb);

  try {
    await timeline(bishopMs, (progress) => {
      const staff = wizard.getObjectByName("wizardStaff");
      if (staff) staff.rotation.z = -0.4 + Math.sin(progress * Math.PI * 3) * 0.8;
      if (progress > 0.2) {
        const t = smoothstep(Math.min((progress - 0.2) / 0.55, 1));
        orb.position.lerpVectors(start.clone().add(new Vector3(0, 0.75, 0)), end.clone().add(new Vector3(0, 0.75, 0)), t);
        orb.scale.setScalar(1 + Math.sin(progress * Math.PI * 10) * 0.18);
      }
      if (progress > 0.74) {
        const shrinkT = Math.min((progress - 0.74) / 0.2, 1);
        victimRef.current?.scale.setScalar(Math.max(0, 1 - shrinkT));
        if (shrinkT >= 1) setVisible(victimRef, false);
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (victimRef.current) victimRef.current.scale.setScalar(1);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(wizard);
    disposeObject(orb);
  }
}

export async function animateMagicQueenCapture(attackerRef: MagicObjectRef, victimRef: MagicObjectRef, from: MagicVec3, to: MagicVec3): Promise<void> {
  const root = rootFromRefs(attackerRef, victimRef);
  const start = v3(from);
  const end = v3(to);
  const wizard = createWizard();
  const storm = createSmokeWall(new Vector3(0, 2.2, 0), 180);
  const bolts = Array.from({ length: 5 }, () => createLightningBolt(end.clone().add(new Vector3((Math.random() - 0.5) * 1.8, 4.5, (Math.random() - 0.5) * 1.8)), end.clone().add(new Vector3(0, 0.45, 0))));
  const burst = createMagicDust(end, "#fef08a", 150);
  const light = new PointLight("#fde68a", 0, 8);
  wizard.position.set(0, 0, 0);
  light.position.copy(end).add(new Vector3(0, 1.2, 0));
  bolts.forEach((bolt) => {
    setGroupOpacity(bolt, 0);
    root.add(bolt);
  });
  root.add(wizard, storm, burst, light);

  try {
    await timeline(queenMs, (progress, deltaMs) => {
      const staff = wizard.getObjectByName("wizardStaff");
      if (staff) staff.rotation.x = -1.1 + Math.sin(progress * Math.PI * 5) * 0.35;
      (storm.material as PointsMaterial).opacity = progress < 0.75 ? Math.min(0.65, progress / 0.28) : Math.max(0, 0.65 * (1 - (progress - 0.75) / 0.25));
      updateDust(storm, deltaMs, Math.max(0, progress - 0.75) / 0.25);
      bolts.forEach((bolt, index) => {
        const strikeStart = 0.35 + index * 0.075;
        const strikeT = Math.max(0, Math.min((progress - strikeStart) / 0.12, 1));
        setGroupOpacity(bolt, strikeT > 0 && strikeT < 1 ? 1 - strikeT : 0);
      });
      if (progress > 0.62) {
        setVisible(victimRef, false);
        updateDust(burst, deltaMs, (progress - 0.62) / 0.38);
        light.intensity = 9 * (1 - (progress - 0.62) / 0.38);
        if (attackerRef.current) attackerRef.current.position.lerpVectors(start, end, smoothstep((progress - 0.62) / 0.38));
      }
    });
  } finally {
    setVisible(victimRef, false);
    if (attackerRef.current) attackerRef.current.position.copy(end);
    disposeObject(wizard);
    disposeObject(storm);
    bolts.forEach(disposeObject);
    disposeObject(burst);
    disposeObject(light);
  }
}

export async function animateMagicCastling(
  kingRef: MagicObjectRef,
  rookRef: MagicObjectRef,
  kingFrom: MagicVec3,
  kingTo: MagicVec3,
  rookFrom: MagicVec3,
  rookTo: MagicVec3
): Promise<void> {
  const root = rootFromRefs(kingRef, rookRef);
  const k0 = v3(kingFrom);
  const k1 = v3(kingTo);
  const r0 = v3(rookFrom);
  const r1 = v3(rookTo);
  const center = k0.clone().add(r0).multiplyScalar(0.5);
  const wizard = createWizard();
  const spiral = createMagicDust(center, "#c084fc", 130);
  wizard.position.copy(center).add(new Vector3(0, 0, 0.8));
  root.add(wizard, spiral);

  try {
    await timeline(castlingMs, (progress, deltaMs) => {
      const t = smoothstep(progress);
      const angle = progress * Math.PI * 4;
      const lift = Math.sin(progress * Math.PI) * 0.42;
      kingRef.current?.position.lerpVectors(k0, k1, t);
      rookRef.current?.position.lerpVectors(r0, r1, t);
      if (kingRef.current) kingRef.current.position.y = k0.y + lift;
      if (rookRef.current) rookRef.current.position.y = r0.y + lift;
      kingRef.current?.rotateY(0.12);
      rookRef.current?.rotateY(-0.12);
      spiral.rotation.y = angle;
      updateDust(spiral, deltaMs, Math.max(0, progress - 0.72) / 0.28);
    });
  } finally {
    if (kingRef.current) kingRef.current.position.copy(k1);
    if (rookRef.current) rookRef.current.position.copy(r1);
    disposeObject(wizard);
    disposeObject(spiral);
  }
}

export async function animateMagicCheckEscape(kingRef: MagicObjectRef, from: MagicVec3, to: MagicVec3): Promise<void> {
  const root = rootFromRefs(kingRef);
  const start = v3(from);
  const end = v3(to);
  const wizard = createWizard();
  const wall = new Mesh(
    new BoxGeometry(1.25, 1.1, 0.06),
    new MeshBasicMaterial({ color: "#a78bfa", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending })
  );
  const wallDust = createSmokeWall(end.clone().add(new Vector3(0, 0.55, 0)), 90);
  wizard.position.copy(start).add(new Vector3(-0.45, 0, 0.28));
  wall.position.copy(end).add(new Vector3(0, 0.58, -0.55));
  root.add(wizard, wall, wallDust);

  try {
    await timeline(checkEscapeMs, (progress, deltaMs) => {
      const moveT = smoothstep(Math.min(progress / 0.52, 1));
      kingRef.current?.position.lerpVectors(start, end, moveT);
      wizard.position.lerpVectors(start.clone().add(new Vector3(-0.45, 0, 0.28)), end.clone().add(new Vector3(-0.45, 0, 0.28)), moveT);
      (wall.material as MeshBasicMaterial).opacity = progress < 0.7 ? Math.min(0.7, progress / 0.2) : Math.max(0, 0.7 * (1 - (progress - 0.7) / 0.3));
      wall.scale.set(1 + Math.sin(progress * Math.PI) * 0.2, 1, 1);
      (wallDust.material as PointsMaterial).opacity = Math.max(0, 0.75 * (1 - Math.max(0, progress - 0.7) / 0.3));
      updateDust(wallDust, deltaMs, Math.max(0, progress - 0.72) / 0.28);
    });
  } finally {
    if (kingRef.current) kingRef.current.position.copy(end);
    disposeObject(wizard);
    disposeObject(wall);
    disposeObject(wallDust);
  }
}

