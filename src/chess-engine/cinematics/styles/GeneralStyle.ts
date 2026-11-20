'use client';
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
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3
} from "three";
import type { RefObject } from "react";

export type CinematicObjectRef = RefObject<Object3D | null>;
export type Vec3Tuple = [number, number, number];

const pawnDurationMs = 1450;
const knightDurationMs = 1950;
const rookDurationMs = 2450;
const bishopDurationMs = 1950;
const queenDurationMs = 2450;
const castlingDurationMs = 1450;
const checkEscapeDurationMs = 1450;

function toVector3(value: Vec3Tuple | Vector3): Vector3 {
  return Array.isArray(value) ? new Vector3(value[0], value[1], value[2]) : value.clone();
}

function setObjectVisible(ref: CinematicObjectRef, visible: boolean): void {
  if (ref.current) {
    ref.current.visible = visible;
  }
}

function getRoot(attackerRef: CinematicObjectRef, victimRef: CinematicObjectRef): Object3D {
  const parent = attackerRef.current?.parent ?? victimRef.current?.parent;
  if (!parent) {
    throw new Error("GeneralStyle cinematic requires attackerRef or victimRef to be attached to a scene parent.");
  }
  return parent;
}

function waitNextFrame(): Promise<number> {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

async function runTimeline(durationMs: number, onFrame: (progress: number, deltaMs: number) => void): Promise<void> {
  const start = await waitNextFrame();
  let previous = start;

  return new Promise((resolve) => {
    const tick = (time: number) => {
      const elapsed = time - start;
      const delta = time - previous;
      previous = time;
      const progress = Math.min(elapsed / durationMs, 1);
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

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
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

function createGeneralCommander(): Group {
  const group = new Group();
  const coat = new MeshStandardMaterial({ color: "#202636", roughness: 0.42, metalness: 0.1 });
  const gold = new MeshStandardMaterial({ color: "#d9a441", roughness: 0.28, metalness: 0.55 });
  const skin = new MeshStandardMaterial({ color: "#e8c49a", roughness: 0.55 });

  const body = new Mesh(new CapsuleGeometry(0.16, 0.42, 6, 12), coat);
  body.position.y = 0.48;
  group.add(body);

  const head = new Mesh(new SphereGeometry(0.13, 18, 12), skin);
  head.position.y = 0.9;
  group.add(head);

  const cap = new Mesh(new CylinderGeometry(0.15, 0.18, 0.08, 20), gold);
  cap.position.y = 1.02;
  group.add(cap);

  const arm = new Mesh(new CapsuleGeometry(0.035, 0.36, 4, 8), gold);
  arm.name = "generalGestureArm";
  arm.position.set(0.2, 0.62, 0.06);
  arm.rotation.z = -0.65;
  group.add(arm);

  group.scale.setScalar(1.05);
  return group;
}

function createSpear(): Group {
  const spear = new Group();
  const shaftMaterial = new MeshStandardMaterial({ color: "#6f4b24", roughness: 0.6 });
  const bladeMaterial = new MeshStandardMaterial({ color: "#e8eef8", roughness: 0.2, metalness: 0.8 });

  const shaft = new Mesh(new CylinderGeometry(0.018, 0.018, 0.96, 10), shaftMaterial);
  shaft.rotation.z = Math.PI / 2;
  spear.add(shaft);

  const blade = new Mesh(new ConeGeometry(0.07, 0.22, 18), bladeMaterial);
  blade.position.x = 0.56;
  blade.rotation.z = -Math.PI / 2;
  spear.add(blade);

  spear.visible = false;
  return spear;
}

function createGeneralHorse(): Group {
  const group = new Group();
  const horseMaterial = new MeshStandardMaterial({ color: "#3c2b2a", roughness: 0.5 });
  const generalMaterial = new MeshStandardMaterial({ color: "#222a3a", roughness: 0.4 });
  const gold = new MeshStandardMaterial({ color: "#d9a441", roughness: 0.28, metalness: 0.55 });

  const horseBody = new Mesh(new CapsuleGeometry(0.2, 0.62, 8, 14), horseMaterial);
  horseBody.rotation.z = Math.PI / 2;
  horseBody.position.y = 0.38;
  group.add(horseBody);

  const horseHead = new Mesh(new SphereGeometry(0.15, 18, 12), horseMaterial);
  horseHead.position.set(0.42, 0.5, 0);
  horseHead.scale.set(1, 1.2, 0.85);
  group.add(horseHead);

  for (const x of [-0.25, -0.08, 0.12, 0.28]) {
    const leg = new Mesh(new CylinderGeometry(0.035, 0.035, 0.38, 8), horseMaterial);
    leg.position.set(x, 0.12, x < 0.05 ? -0.09 : 0.09);
    group.add(leg);
  }

  const rider = new Mesh(new CapsuleGeometry(0.11, 0.32, 6, 10), generalMaterial);
  rider.position.y = 0.82;
  group.add(rider);

  const sword = new Mesh(new CylinderGeometry(0.015, 0.015, 0.62, 8), gold);
  sword.name = "generalSword";
  sword.position.set(0.24, 0.86, 0);
  sword.rotation.z = -0.6;
  group.add(sword);

  group.scale.setScalar(1.25);
  return group;
}

function createGlassBurst(position: Vector3, color = "#dbeafe", count = 70): Points {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const i = index * 3;
    positions[i] = position.x;
    positions[i + 1] = position.y + 0.55;
    positions[i + 2] = position.z;

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.9 + Math.random() * 2.1;
    velocities[i] = Math.cos(angle) * speed;
    velocities[i + 1] = 1.0 + Math.random() * 2.5;
    velocities[i + 2] = Math.sin(angle) * speed;
  }

  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new BufferAttribute(velocities, 3));

  const material = new PointsMaterial({
    color: new Color(color),
    size: 0.065,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: AdditiveBlending
  });

  return new Points(geometry, material);
}

function updateParticles(points: Points, deltaMs: number, fadeProgress: number): void {
  const positionAttribute = points.geometry.getAttribute("position") as BufferAttribute;
  const velocityAttribute = points.geometry.getAttribute("velocity") as BufferAttribute;
  const dt = deltaMs / 1000;

  for (let index = 0; index < positionAttribute.count; index += 1) {
    const x = positionAttribute.getX(index) + velocityAttribute.getX(index) * dt;
    const y = positionAttribute.getY(index) + velocityAttribute.getY(index) * dt;
    const z = positionAttribute.getZ(index) + velocityAttribute.getZ(index) * dt;
    const vy = velocityAttribute.getY(index) - 4.8 * dt;

    positionAttribute.setXYZ(index, x, y, z);
    velocityAttribute.setY(index, vy);
  }

  positionAttribute.needsUpdate = true;
  (points.material as PointsMaterial).opacity = Math.max(0, 0.9 * (1 - fadeProgress));
}

function createSlashVfx(): Group {
  const group = new Group();
  const material = new MeshBasicMaterial({
    color: "#f8fafc",
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    blending: AdditiveBlending
  });

  const slashA = new Mesh(new CylinderGeometry(0.018, 0.018, 1.45, 8), material);
  slashA.rotation.z = Math.PI / 4;
  group.add(slashA);

  const slashB = new Mesh(new CylinderGeometry(0.014, 0.014, 1.05, 8), material.clone());
  slashB.rotation.z = -Math.PI / 4;
  group.add(slashB);

  group.visible = false;
  return group;
}

function createSiegeCannon(): Group {
  const group = new Group();
  const darkMetal = new MeshStandardMaterial({ color: "#20242c", roughness: 0.36, metalness: 0.65 });
  const brass = new MeshStandardMaterial({ color: "#b9822f", roughness: 0.28, metalness: 0.72 });

  const barrel = new Mesh(new CylinderGeometry(0.16, 0.23, 1.25, 18), darkMetal);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.y = 0.52;
  group.add(barrel);

  const muzzle = new Mesh(new CylinderGeometry(0.25, 0.2, 0.18, 18), brass);
  muzzle.rotation.z = Math.PI / 2;
  muzzle.position.set(0.7, 0.52, 0);
  group.add(muzzle);

  for (const x of [-0.32, 0.32]) {
    const wheel = new Mesh(new CylinderGeometry(0.22, 0.22, 0.11, 20), brass);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.2, -0.23);
    group.add(wheel);
  }

  group.scale.setScalar(1.05);
  return group;
}

function createMissile(): Group {
  const group = new Group();
  const shell = new MeshStandardMaterial({ color: "#313947", roughness: 0.28, metalness: 0.7 });
  const fire = new MeshBasicMaterial({ color: "#ff9a3c", transparent: true, opacity: 0.9, blending: AdditiveBlending });

  const body = new Mesh(new CylinderGeometry(0.055, 0.07, 0.52, 14), shell);
  body.rotation.z = Math.PI / 2;
  group.add(body);

  const nose = new Mesh(new ConeGeometry(0.075, 0.18, 14), shell);
  nose.position.x = 0.35;
  nose.rotation.z = -Math.PI / 2;
  group.add(nose);

  const flame = new Mesh(new ConeGeometry(0.085, 0.24, 12), fire);
  flame.position.x = -0.36;
  flame.rotation.z = Math.PI / 2;
  group.add(flame);

  return group;
}

function createLineBeam(length: number, color = "#7dd3fc"): Mesh {
  const beam = new Mesh(
    new CylinderGeometry(0.025, 0.025, length, 12),
    new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: AdditiveBlending
    })
  );
  beam.rotation.z = Math.PI / 2;
  return beam;
}

function createDissolveAura(position: Vector3): Points {
  const count = 86;
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const i = index * 3;
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.18 + Math.random() * 0.42;
    positions[i] = position.x + Math.cos(angle) * radius;
    positions[i + 1] = position.y + 0.2 + Math.random() * 1.0;
    positions[i + 2] = position.z + Math.sin(angle) * radius;
    velocities[i] = Math.cos(angle) * 0.16;
    velocities[i + 1] = 0.45 + Math.random() * 0.8;
    velocities[i + 2] = Math.sin(angle) * 0.16;
  }

  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new BufferAttribute(velocities, 3));

  return new Points(
    geometry,
    new PointsMaterial({
      color: "#67e8f9",
      size: 0.055,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending
    })
  );
}

function createSmokeTrail(maxParticles = 120): Points {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(maxParticles * 3);
  const ages = new Float32Array(maxParticles);
  for (let i = 0; i < maxParticles; i += 1) {
    ages[i] = 1;
  }

  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("age", new BufferAttribute(ages, 1));

  const material = new PointsMaterial({
    color: "#9ca3af",
    size: 0.09,
    transparent: true,
    opacity: 0.55,
    depthWrite: false
  });

  return new Points(geometry, material);
}

function emitSmokeParticle(points: Points, position: Vector3, cursor: { value: number }): void {
  const positionAttribute = points.geometry.getAttribute("position") as BufferAttribute;
  const ageAttribute = points.geometry.getAttribute("age") as BufferAttribute;
  const index = cursor.value % positionAttribute.count;
  cursor.value += 1;

  positionAttribute.setXYZ(
    index,
    position.x + (Math.random() - 0.5) * 0.15,
    position.y + (Math.random() - 0.5) * 0.15,
    position.z + (Math.random() - 0.5) * 0.15
  );
  ageAttribute.setX(index, 0);
  positionAttribute.needsUpdate = true;
  ageAttribute.needsUpdate = true;
}

function updateSmokeTrail(points: Points, deltaMs: number): void {
  const positionAttribute = points.geometry.getAttribute("position") as BufferAttribute;
  const ageAttribute = points.geometry.getAttribute("age") as BufferAttribute;
  const dt = deltaMs / 1000;

  for (let index = 0; index < positionAttribute.count; index += 1) {
    const age = Math.min(1, ageAttribute.getX(index) + dt * 0.72);
    ageAttribute.setX(index, age);
    positionAttribute.setY(index, positionAttribute.getY(index) + dt * 0.18);
  }

  ageAttribute.needsUpdate = true;
  positionAttribute.needsUpdate = true;
  (points.material as PointsMaterial).opacity = 0.45;
}

function setVictimOpacity(ref: CinematicObjectRef, opacity: number): void {
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

function getRootFromRefs(...refs: CinematicObjectRef[]): Object3D {
  const parent = refs.find((ref) => ref.current?.parent)?.current?.parent;
  if (!parent) {
    throw new Error("GeneralStyle cinematic requires at least one ref attached to a scene parent.");
  }
  return parent;
}

function dispatchCameraShake(durationMs: number, amplitude: number): void {
  window.dispatchEvent(
    new CustomEvent("general-style:camera-shake", {
      detail: { durationMs, amplitude }
    })
  );
}

function createAirshipSilhouette(): Group {
  const group = new Group();
  const dark = new MeshBasicMaterial({ color: "#05070d", transparent: true, opacity: 0.58, depthWrite: false });

  const body = new Mesh(new CapsuleGeometry(0.35, 1.7, 8, 18), dark);
  body.rotation.z = Math.PI / 2;
  group.add(body);

  const wing = new Mesh(new BoxGeometry(1.6, 0.04, 0.38), dark.clone());
  wing.position.y = -0.02;
  group.add(wing);

  const tail = new Mesh(new BoxGeometry(0.42, 0.04, 0.48), dark.clone());
  tail.position.x = -0.9;
  group.add(tail);

  group.scale.set(1.8, 1.8, 1.8);
  return group;
}

function createRocketBarrage(count: number, target: Vector3): Group {
  const group = new Group();
  for (let index = 0; index < count; index += 1) {
    const rocket = createMissile();
    rocket.name = `airstrikeRocket-${index}`;
    rocket.position.set(
      target.x + (Math.random() - 0.5) * 4.5,
      target.y + 5.2 + Math.random() * 1.5,
      target.z + (Math.random() - 0.5) * 4.5
    );
    rocket.scale.setScalar(0.72);
    rocket.lookAt(target.x, target.y + 0.3, target.z);
    rocket.visible = false;
    group.add(rocket);
  }
  return group;
}

function createExplosionCluster(target: Vector3): Group {
  const group = new Group();
  for (let index = 0; index < 4; index += 1) {
    const burst = createGlassBurst(
      target.clone().add(new Vector3((Math.random() - 0.5) * 0.8, 0, (Math.random() - 0.5) * 0.8)),
      index % 2 === 0 ? "#fb923c" : "#fef3c7",
      72
    );
    burst.visible = false;
    group.add(burst);
  }
  return group;
}

function createSmokeCloud(center: Vector3, radius = 1.6, count = 180): Points {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const i = index * 3;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    positions[i] = center.x + Math.cos(angle) * distance;
    positions[i + 1] = center.y + 0.25 + Math.random() * 0.8;
    positions[i + 2] = center.z + Math.sin(angle) * distance;
    velocities[i] = Math.cos(angle) * (0.2 + Math.random() * 0.55);
    velocities[i + 1] = 0.1 + Math.random() * 0.45;
    velocities[i + 2] = Math.sin(angle) * (0.2 + Math.random() * 0.55);
  }

  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new BufferAttribute(velocities, 3));

  return new Points(
    geometry,
    new PointsMaterial({
      color: "#cbd5e1",
      size: 0.18,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
  );
}

function createShieldRing(color = "#adc6ff"): Mesh {
  const ring = new Mesh(
    new TorusGeometry(0.58, 0.025, 8, 48),
    new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending
    })
  );
  ring.rotation.x = Math.PI / 2;
  return ring;
}

function createSmokeGrenade(): Group {
  const grenade = new Group();
  const body = new Mesh(
    new CylinderGeometry(0.08, 0.08, 0.18, 12),
    new MeshStandardMaterial({ color: "#263238", roughness: 0.45, metalness: 0.25 })
  );
  const cap = new Mesh(new CylinderGeometry(0.045, 0.045, 0.06, 10), new MeshStandardMaterial({ color: "#9ca3af" }));
  cap.position.y = 0.13;
  grenade.add(body, cap);
  return grenade;
}

function createStoneWall(): Group {
  const wall = new Group();
  const material = new MeshStandardMaterial({ color: "#6b7280", roughness: 0.85, metalness: 0.02 });
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const block = new Mesh(new BoxGeometry(0.28, 0.18, 0.16), material.clone());
      block.position.set((col - 1.5) * 0.3 + (row % 2) * 0.08, row * 0.18 + 0.08, 0);
      block.rotation.y = (Math.random() - 0.5) * 0.08;
      wall.add(block);
    }
  }
  return wall;
}

export async function animateGeneralPawnCapture(
  attackerRef: CinematicObjectRef,
  victimRef: CinematicObjectRef,
  from: Vec3Tuple | Vector3,
  to: Vec3Tuple | Vector3
): Promise<void> {
  const root = getRoot(attackerRef, victimRef);
  const fromPosition = toVector3(from);
  const toPosition = toVector3(to);
  const direction = toPosition.clone().sub(fromPosition).setY(0).normalize();
  if (direction.lengthSq() === 0) {
    direction.set(0, 0, -1);
  }

  const general = createGeneralCommander();
  const spear = createSpear();
  const burst = createGlassBurst(toPosition, "#dbeafe", 78);
  const shoulderPosition = fromPosition.clone().addScaledVector(direction, -0.5);

  general.position.copy(shoulderPosition);
  general.lookAt(fromPosition.x, fromPosition.y + 0.45, fromPosition.z);
  spear.position.copy(fromPosition).add(new Vector3(0.28, 0.7, 0));
  spear.lookAt(toPosition);
  burst.visible = false;

  root.add(general, spear, burst);

  try {
    await runTimeline(pawnDurationMs, (progress, deltaMs) => {
      const attacker = attackerRef.current;
      const victim = victimRef.current;
      const gesture = general.getObjectByName("generalGestureArm");

      if (gesture && progress < 0.22) {
        gesture.rotation.z = -0.65 + Math.sin(progress / 0.22 * Math.PI) * 0.65;
      }

      if (attacker) {
        if (progress < 0.25) {
          attacker.position.copy(fromPosition);
        } else if (progress < 0.72) {
          spear.visible = true;
          const t = smoothstep((progress - 0.25) / 0.47);
          attacker.position.lerpVectors(fromPosition, toPosition, t);
          attacker.position.y = fromPosition.y + Math.sin(t * Math.PI) * 0.18;
          spear.position.copy(attacker.position).add(new Vector3(0.28, 0.7, 0));
          spear.lookAt(toPosition.x, toPosition.y + 0.45, toPosition.z);
        } else {
          attacker.position.copy(toPosition);
        }
      }

      if (progress >= 0.72) {
        setObjectVisible(victimRef, false);
        burst.visible = true;
        updateParticles(burst, deltaMs, (progress - 0.72) / 0.28);
      }

      if (victim && progress > 0.9) {
        victim.visible = false;
      }
    });
  } finally {
    setObjectVisible(victimRef, false);
    general.visible = false;
    spear.visible = false;
    disposeObject(general);
    disposeObject(spear);
    disposeObject(burst);
  }
}

export async function animateGeneralKnightCapture(
  attackerRef: CinematicObjectRef,
  victimRef: CinematicObjectRef,
  from: Vec3Tuple | Vector3,
  to: Vec3Tuple | Vector3
): Promise<void> {
  const root = getRoot(attackerRef, victimRef);
  const fromPosition = toVector3(from);
  const toPosition = toVector3(to);
  const ridingGeneral = createGeneralHorse();
  const slashVfx = createSlashVfx();
  const explosion = createGlassBurst(toPosition, "#fef3c7", 96);
  const startQuaternion = new Quaternion();
  const endLookTarget = toPosition.clone();

  ridingGeneral.position.copy(fromPosition);
  ridingGeneral.lookAt(endLookTarget.x, endLookTarget.y + 0.3, endLookTarget.z);
  startQuaternion.copy(ridingGeneral.quaternion);
  slashVfx.position.copy(toPosition).add(new Vector3(0, 0.82, 0));
  explosion.visible = false;

  root.add(ridingGeneral, slashVfx, explosion);
  setObjectVisible(attackerRef, false);

  try {
    await runTimeline(knightDurationMs, (progress, deltaMs) => {
      if (progress < 0.74) {
        const t = smoothstep(progress / 0.74);
        ridingGeneral.position.lerpVectors(fromPosition, toPosition, t);
        ridingGeneral.position.y = fromPosition.y + Math.sin(t * Math.PI) * 1.35;
        ridingGeneral.quaternion.copy(startQuaternion);
        ridingGeneral.rotation.z = Math.sin(t * Math.PI) * 0.18;
      } else {
        ridingGeneral.position.copy(toPosition);
        const impactT = (progress - 0.74) / 0.26;
        const sword = ridingGeneral.getObjectByName("generalSword");
        if (sword) {
          sword.rotation.z = -0.6 - Math.sin(Math.min(impactT, 1) * Math.PI) * 1.45;
        }

        slashVfx.visible = true;
        slashVfx.scale.setScalar(0.65 + impactT * 0.85);
        slashVfx.rotation.y += 0.05;
        explosion.visible = true;
        updateParticles(explosion, deltaMs, impactT);
        setObjectVisible(victimRef, false);
      }
    });
  } finally {
    setObjectVisible(victimRef, false);
    setObjectVisible(attackerRef, true);
    if (attackerRef.current) {
      attackerRef.current.position.copy(toPosition);
    }
    ridingGeneral.visible = false;
    slashVfx.visible = false;
    disposeObject(ridingGeneral);
    disposeObject(slashVfx);
    disposeObject(explosion);
  }
}

export async function animateGeneralRookCapture(
  attackerRef: CinematicObjectRef,
  victimRef: CinematicObjectRef,
  from: Vec3Tuple | Vector3,
  to: Vec3Tuple | Vector3
): Promise<void> {
  const root = getRoot(attackerRef, victimRef);
  const fromPosition = toVector3(from);
  const toPosition = toVector3(to);
  const direction = toPosition.clone().sub(fromPosition).setY(0);
  const distance = Math.max(direction.length(), 0.001);
  direction.normalize();

  const general = createGeneralCommander();
  const cannon = createSiegeCannon();
  const missile = createMissile();
  const smoke = createSmokeTrail();
  const explosion = createGlassBurst(toPosition, "#fb923c", 120);
  const explosionLight = new PointLight("#ff8a2a", 0, 5);
  const smokeCursor = { value: 0 };
  const side = new Vector3(-direction.z, 0, direction.x).multiplyScalar(0.55);

  general.position.copy(fromPosition).add(side).add(new Vector3(0, 0, 0));
  general.lookAt(toPosition.x, toPosition.y + 0.35, toPosition.z);
  cannon.position.copy(fromPosition);
  cannon.lookAt(toPosition.x, toPosition.y + 0.32, toPosition.z);
  missile.position.copy(fromPosition).add(new Vector3(0, 0.55, 0));
  missile.lookAt(toPosition.x, toPosition.y + 0.55, toPosition.z);
  explosion.visible = false;
  explosionLight.position.copy(toPosition).add(new Vector3(0, 0.8, 0));

  root.add(general, cannon, missile, smoke, explosion, explosionLight);
  setObjectVisible(attackerRef, false);

  try {
    await runTimeline(rookDurationMs, (progress, deltaMs) => {
      const arm = general.getObjectByName("generalGestureArm");
      if (arm && progress < 0.22) {
        arm.rotation.z = -0.85 - Math.sin(progress / 0.22 * Math.PI) * 0.55;
        arm.rotation.x = -0.55;
      }

      if (progress < 0.2) {
        const transformT = smoothstep(progress / 0.2);
        cannon.scale.setScalar(0.55 + transformT * 0.5);
        missile.visible = false;
      } else if (progress < 0.78) {
        const shotT = smoothstep((progress - 0.2) / 0.58);
        const projectilePosition = fromPosition.clone().lerp(toPosition, shotT).add(new Vector3(0, 0.6, 0));
        missile.visible = true;
        missile.position.copy(projectilePosition);
        missile.lookAt(toPosition.x, toPosition.y + 0.6, toPosition.z);
        emitSmokeParticle(smoke, projectilePosition.clone().addScaledVector(direction, -0.22), smokeCursor);
        updateSmokeTrail(smoke, deltaMs);
      } else {
        missile.visible = false;
        explosion.visible = true;
        setObjectVisible(victimRef, false);
        const impactT = (progress - 0.78) / 0.22;
        explosionLight.intensity = 7.5 * (1 - impactT);
        updateParticles(explosion, deltaMs, impactT);
      }

      cannon.position.y = fromPosition.y + 0.03 + Math.sin(progress * Math.PI * 10) * (progress > 0.2 && progress < 0.35 ? 0.05 : 0);
      cannon.position.x = fromPosition.x - direction.x * Math.sin(progress * Math.PI * 8) * 0.015;
      cannon.position.z = fromPosition.z - direction.z * Math.sin(progress * Math.PI * 8) * 0.015;
      cannon.scale.z = Math.max(0.96, 1 - Math.min(distance, 8) * 0.005);
    });
  } finally {
    setObjectVisible(victimRef, false);
    setObjectVisible(attackerRef, true);
    if (attackerRef.current) {
      attackerRef.current.position.copy(toPosition);
    }
    general.visible = false;
    cannon.visible = false;
    missile.visible = false;
    disposeObject(general);
    disposeObject(cannon);
    disposeObject(missile);
    disposeObject(smoke);
    disposeObject(explosion);
    disposeObject(explosionLight);
  }
}

export async function animateGeneralBishopCapture(
  attackerRef: CinematicObjectRef,
  victimRef: CinematicObjectRef,
  from: Vec3Tuple | Vector3,
  to: Vec3Tuple | Vector3
): Promise<void> {
  const root = getRoot(attackerRef, victimRef);
  const fromPosition = toVector3(from);
  const toPosition = toVector3(to);
  const direction = toPosition.clone().sub(fromPosition).setY(0);
  const distance = Math.max(direction.length(), 0.001);
  direction.normalize();
  const side = new Vector3(-direction.z, 0, direction.x).multiplyScalar(0.42);

  const general = createGeneralCommander();
  const rifle = new Group();
  const barrel = new Mesh(
    new CylinderGeometry(0.025, 0.025, 0.95, 10),
    new MeshStandardMaterial({ color: "#151922", roughness: 0.32, metalness: 0.75 })
  );
  const stock = new Mesh(
    new CapsuleGeometry(0.045, 0.22, 4, 8),
    new MeshStandardMaterial({ color: "#5c3b22", roughness: 0.58 })
  );
  barrel.rotation.z = Math.PI / 2;
  stock.position.x = -0.42;
  rifle.add(barrel, stock);

  const beam = createLineBeam(distance, "#67e8f9");
  const dissolveAura = createDissolveAura(toPosition);
  const impactLight = new PointLight("#67e8f9", 0, 4);

  general.position.copy(fromPosition).add(side);
  general.scale.set(0.92, 0.72, 0.92);
  general.lookAt(toPosition.x, toPosition.y + 0.28, toPosition.z);
  rifle.position.copy(general.position).add(new Vector3(0.2, 0.58, 0));
  rifle.lookAt(toPosition.x, toPosition.y + 0.52, toPosition.z);
  beam.position.copy(fromPosition.clone().lerp(toPosition, 0.5)).add(new Vector3(0, 0.62, 0));
  beam.lookAt(toPosition.x, toPosition.y + 0.62, toPosition.z);
  beam.visible = false;
  dissolveAura.visible = false;
  impactLight.position.copy(toPosition).add(new Vector3(0, 0.8, 0));

  root.add(general, rifle, beam, dissolveAura, impactLight);

  try {
    await runTimeline(bishopDurationMs, (progress, deltaMs) => {
      const arm = general.getObjectByName("generalGestureArm");
      if (arm && progress < 0.25) {
        arm.rotation.z = -0.35;
        arm.rotation.x = -0.95;
      }

      if (progress < 0.28) {
        const crouchT = smoothstep(progress / 0.28);
        general.scale.y = 1 - crouchT * 0.28;
        rifle.position.y = general.position.y + 0.65 - crouchT * 0.1;
      } else if (progress < 0.55) {
        const fireT = (progress - 0.28) / 0.27;
        beam.visible = true;
        beam.scale.set(1, Math.max(0.05, fireT), 1);
        impactLight.intensity = 2 + fireT * 4;
      } else {
        beam.visible = progress < 0.68;
        dissolveAura.visible = true;
        const dissolveT = Math.min((progress - 0.55) / 0.25, 1);
        setVictimOpacity(victimRef, 1 - dissolveT);
        impactLight.intensity = 4 * (1 - dissolveT);
        updateParticles(dissolveAura, deltaMs, Math.max(0, progress - 0.7) / 0.3);
        (dissolveAura.material as PointsMaterial).opacity = Math.max(0, 0.92 * (1 - Math.max(0, progress - 0.78) / 0.22));
        if (dissolveT >= 1) {
          setObjectVisible(victimRef, false);
        }
      }

      rifle.rotation.z = Math.sin(progress * Math.PI * 18) * 0.01;
    });
  } finally {
    setVictimOpacity(victimRef, 1);
    setObjectVisible(victimRef, false);
    general.visible = false;
    rifle.visible = false;
    beam.visible = false;
    dissolveAura.visible = false;
    disposeObject(general);
    disposeObject(rifle);
    disposeObject(beam);
    disposeObject(dissolveAura);
    disposeObject(impactLight);
  }
}

export async function animateGeneralQueenCapture(
  attackerRef: CinematicObjectRef,
  victimRef: CinematicObjectRef,
  from: Vec3Tuple | Vector3,
  to: Vec3Tuple | Vector3
): Promise<void> {
  const root = getRoot(attackerRef, victimRef);
  const fromPosition = toVector3(from);
  const toPosition = toVector3(to);
  const boardCenter = new Vector3(0, 0, 0);
  const general = createGeneralCommander();
  const airship = createAirshipSilhouette();
  const rockets = createRocketBarrage(12, toPosition);
  const cluster = createExplosionCluster(toPosition);
  const explosionLight = new PointLight("#fb923c", 0, 7);
  const queenStart = fromPosition.clone();

  general.position.copy(boardCenter).add(new Vector3(0, 0, 0));
  general.lookAt(toPosition.x, toPosition.y, toPosition.z);
  airship.position.set(0, 5.8, 0);
  airship.rotation.y = -0.35;
  explosionLight.position.copy(toPosition).add(new Vector3(0, 1.0, 0));
  cluster.visible = false;
  root.add(general, airship, rockets, cluster, explosionLight);

  try {
    await runTimeline(queenDurationMs, (progress, deltaMs) => {
      const arm = general.getObjectByName("generalGestureArm");
      if (arm && progress < 0.24) {
        arm.rotation.z = -0.2 + Math.sin(progress / 0.24 * Math.PI) * 1.35;
        arm.rotation.x = -1.2;
      }

      airship.position.x = Math.sin(progress * Math.PI * 1.4) * 0.7;
      airship.position.z = Math.cos(progress * Math.PI * 1.2) * 0.35;

      if (progress >= 0.18 && progress < 0.68) {
        rockets.children.forEach((rocket, index) => {
          const localStart = 0.18 + index * 0.026;
          const rocketT = Math.min(Math.max((progress - localStart) / 0.32, 0), 1);
          if (rocketT > 0) {
            rocket.visible = true;
            const start = new Vector3(
              toPosition.x + ((index % 4) - 1.5) * 0.75,
              toPosition.y + 5.4 + (index % 3) * 0.28,
              toPosition.z + (Math.floor(index / 4) - 1) * 0.75
            );
            rocket.position.lerpVectors(start, toPosition.clone().add(new Vector3(0, 0.45, 0)), smoothstep(rocketT));
            rocket.lookAt(toPosition.x, toPosition.y, toPosition.z);
          }
        });
      }

      if (progress >= 0.62) {
        const impactT = Math.min((progress - 0.62) / 0.38, 1);
        if (progress < 0.78) {
          dispatchCameraShake(400, 0.08);
        }
        setObjectVisible(victimRef, false);
        cluster.visible = true;
        explosionLight.intensity = 9 * (1 - impactT);
        cluster.children.forEach((child) => updateParticles(child as Points, deltaMs, impactT));
      }

      if (attackerRef.current && progress >= 0.7) {
        const slideT = smoothstep(Math.min((progress - 0.7) / 0.3, 1));
        attackerRef.current.position.lerpVectors(queenStart, toPosition, slideT);
      }
    });
  } finally {
    setObjectVisible(victimRef, false);
    if (attackerRef.current) {
      attackerRef.current.position.copy(toPosition);
    }
    disposeObject(general);
    disposeObject(airship);
    disposeObject(rockets);
    disposeObject(cluster);
    disposeObject(explosionLight);
  }
}

export async function animateGeneralCastling(
  kingRef: CinematicObjectRef,
  rookRef: CinematicObjectRef,
  kingFrom: Vec3Tuple | Vector3,
  kingTo: Vec3Tuple | Vector3,
  rookFrom: Vec3Tuple | Vector3,
  rookTo: Vec3Tuple | Vector3
): Promise<void> {
  const root = getRootFromRefs(kingRef, rookRef);
  const kingStart = toVector3(kingFrom);
  const kingEnd = toVector3(kingTo);
  const rookStart = toVector3(rookFrom);
  const rookEnd = toVector3(rookTo);
  const center = kingStart.clone().add(rookStart).multiplyScalar(0.5);
  const general = createGeneralCommander();
  const grenade = createSmokeGrenade();
  const smoke = createSmokeCloud(center, kingStart.distanceTo(rookStart) * 0.55 + 0.8, 220);
  const kingShield = createShieldRing("#adc6ff");
  const rookShield = createShieldRing("#f0f4ff");

  general.position.copy(center).add(new Vector3(0, 0, 0.7));
  general.lookAt(center.x, center.y, center.z);
  grenade.position.copy(center).add(new Vector3(0, 0.22, 0));
  kingShield.position.copy(kingStart).add(new Vector3(0, 0.18, 0));
  rookShield.position.copy(rookStart).add(new Vector3(0, 0.18, 0));
  root.add(general, grenade, smoke, kingShield, rookShield);

  try {
    await runTimeline(castlingDurationMs, (progress, deltaMs) => {
      if (progress < 0.18) {
        const throwT = smoothstep(progress / 0.18);
        grenade.position.y = center.y + 0.22 + Math.sin(throwT * Math.PI) * 0.55;
        grenade.position.x = center.x + (throwT - 0.5) * 0.8;
      }

      const smokeMaterial = smoke.material as PointsMaterial;
      if (progress >= 0.12 && progress < 0.84) {
        smokeMaterial.opacity = Math.min(0.92, (progress - 0.12) / 0.18);
        updateParticles(smoke, deltaMs, 0);
      } else if (progress >= 0.84) {
        smokeMaterial.opacity = Math.max(0, 0.92 * (1 - (progress - 0.84) / 0.16));
        updateParticles(smoke, deltaMs, 0.4);
      }

      if (progress >= 0.28 && progress < 0.78) {
        const moveT = smoothstep((progress - 0.28) / 0.5);
        kingRef.current?.position.lerpVectors(kingStart, kingEnd, moveT);
        rookRef.current?.position.lerpVectors(rookStart, rookEnd, moveT);
      }

      const shieldOpacity = progress < 0.82 ? Math.min(0.72, progress / 0.22) : Math.max(0, 0.72 * (1 - (progress - 0.82) / 0.18));
      (kingShield.material as MeshBasicMaterial).opacity = shieldOpacity;
      (rookShield.material as MeshBasicMaterial).opacity = shieldOpacity;
      kingShield.position.copy(kingRef.current?.position ?? kingEnd).add(new Vector3(0, 0.18, 0));
      rookShield.position.copy(rookRef.current?.position ?? rookEnd).add(new Vector3(0, 0.18, 0));
      kingShield.rotation.z += 0.05;
      rookShield.rotation.z -= 0.05;
    });
  } finally {
    if (kingRef.current) {
      kingRef.current.position.copy(kingEnd);
    }
    if (rookRef.current) {
      rookRef.current.position.copy(rookEnd);
    }
    disposeObject(general);
    disposeObject(grenade);
    disposeObject(smoke);
    disposeObject(kingShield);
    disposeObject(rookShield);
  }
}

export async function animateGeneralCheckEscape(
  kingRef: CinematicObjectRef,
  from: Vec3Tuple | Vector3,
  to: Vec3Tuple | Vector3
): Promise<void> {
  const root = getRootFromRefs(kingRef);
  const fromPosition = toVector3(from);
  const toPosition = toVector3(to);
  const direction = toPosition.clone().sub(fromPosition).setY(0);
  if (direction.lengthSq() === 0) {
    direction.set(0, 0, -1);
  }
  direction.normalize();

  const general = createGeneralCommander();
  const wall = createStoneWall();
  const side = new Vector3(-direction.z, 0, direction.x).multiplyScalar(0.42);
  const wallPosition = toPosition.clone().addScaledVector(direction, 0.58).add(new Vector3(0, 0.02, 0));

  general.position.copy(fromPosition).add(side);
  general.lookAt(toPosition.x, toPosition.y, toPosition.z);
  wall.position.copy(wallPosition);
  wall.lookAt(fromPosition.x, fromPosition.y, fromPosition.z);
  wall.scale.set(1, 0.01, 1);
  root.add(general, wall);

  try {
    await runTimeline(checkEscapeDurationMs, (progress) => {
      if (progress < 0.62) {
        const moveT = smoothstep(progress / 0.62);
        kingRef.current?.position.lerpVectors(fromPosition, toPosition, moveT);
        general.position.lerpVectors(fromPosition.clone().add(side), toPosition.clone().add(side), moveT);
        wall.scale.y = Math.max(0.01, smoothstep(Math.min(progress / 0.22, 1)));
      } else {
        const crumbleT = (progress - 0.62) / 0.38;
        wall.children.forEach((child, index) => {
          child.position.y -= 0.008 + index * 0.0006;
          child.rotation.x += 0.015 + index * 0.0008;
        });
        wall.scale.y = Math.max(0, 1 - crumbleT);
        general.position.y = toPosition.y + Math.sin(crumbleT * Math.PI) * 0.1;
      }
    });
  } finally {
    if (kingRef.current) {
      kingRef.current.position.copy(toPosition);
    }
    disposeObject(general);
    disposeObject(wall);
  }
}

