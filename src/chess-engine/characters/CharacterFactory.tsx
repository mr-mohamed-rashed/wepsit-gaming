'use client';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import type { AnimationClip, Group, Object3D } from "three";
import { AnimationAction, LoopOnce, Vector3 } from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { getCharacterAsset, type CharacterActionName } from "./AssetsRegistry";
import type { PlayerStyleType } from "../cinematics/director/cinematicTypes";

export type CharacterFactoryHandle = {
  root: Group | null;
  switchAction: (actionName: CharacterActionName, fadeSeconds?: number) => Promise<void>;
  hide: () => void;
  show: () => void;
};

export type CharacterFactoryProps = {
  style: PlayerStyleType;
  actionType?: CharacterActionName;
  position?: [number, number, number];
  rotationY?: number;
  visible?: boolean;
  playOnMount?: boolean;
  onActionFinished?: (actionName: CharacterActionName) => void;
};

type CharacterRuntimeProps = CharacterFactoryProps & {
  scene: Object3D;
  animations: AnimationClip[];
};

function disposeUniqueClone(root: Object3D): void {
  root.traverse((child) => {
    const maybeMesh = child as { geometry?: { dispose: () => void }; material?: unknown };
    const material = maybeMesh.material;
    if (Array.isArray(material)) {
      material.forEach((entry) => {
        if (entry && typeof entry === "object" && "dispose" in entry) {
          (entry as { dispose: () => void }).dispose();
        }
      });
    } else if (material && typeof material === "object" && "dispose" in material) {
      (material as { dispose: () => void }).dispose();
    }
    maybeMesh.geometry?.dispose();
  });
}

function playAction(action: AnimationAction, fadeSeconds: number): Promise<void> {
  action.reset();
  action.enabled = true;
  action.setLoop(LoopOnce, 1);
  action.clampWhenFinished = true;
  action.fadeIn(fadeSeconds);
  action.play();

  const mixer = action.getMixer();
  return new Promise((resolve) => {
    const onFinished = (event: { action: AnimationAction }) => {
      if (event.action !== action) return;
      mixer.removeEventListener("finished", onFinished);
      resolve();
    };
    mixer.addEventListener("finished", onFinished);
  });
}

const CharacterRuntime = forwardRef<CharacterFactoryHandle, CharacterRuntimeProps>(function CharacterRuntime(
  {
    style,
    actionType = "Idle",
    position = [0, 0, 0],
    rotationY = 0,
    visible = false,
    playOnMount = true,
    onActionFinished,
    scene,
    animations
  },
  ref
) {
  const asset = getCharacterAsset(style);
  const groupRef = useRef<Group>(null);
  const currentActionRef = useRef<AnimationAction | null>(null);
  const clonedScene = useMemo(() => cloneSkeleton(scene) as Group, [scene]);
  const { actions } = useAnimations(animations, groupRef);
  const positionVector = useMemo(() => new Vector3(position[0], position[1], position[2]), [position]);

  useEffect(() => {
    return () => {
      for (const action of Object.values(actions)) action?.stop();
      disposeUniqueClone(clonedScene);
    };
  }, [actions, clonedScene]);

  const switchAction = async (actionName: CharacterActionName, fadeSeconds = 0.12): Promise<void> => {
    const clipName = asset.actionClips[actionName];
    const nextAction = actions[clipName] ?? actions[actionName] ?? Object.values(actions).find(Boolean);

    if (!nextAction) {
      console.warn(`[CharacterFactory] Missing animation clip "${clipName}" for ${asset.label}.`);
      window.setTimeout(() => onActionFinished?.(actionName), 350);
      return;
    }

    if (currentActionRef.current && currentActionRef.current !== nextAction) {
      currentActionRef.current.fadeOut(fadeSeconds);
    }

    currentActionRef.current = nextAction;
    await playAction(nextAction, fadeSeconds);
    onActionFinished?.(actionName);
  };

  useImperativeHandle(
    ref,
    () => ({
      root: groupRef.current,
      switchAction,
      hide: () => {
        if (groupRef.current) groupRef.current.visible = false;
      },
      show: () => {
        if (groupRef.current) groupRef.current.visible = true;
      }
    }),
    [switchAction]
  );

  useEffect(() => {
    if (playOnMount && visible) void switchAction(actionType);
  }, [actionType, playOnMount, switchAction, visible]);

  return (
    <group ref={groupRef} visible={visible} position={positionVector} rotation-y={rotationY} scale={asset.defaultScale}>
      <pointLight position={[0, 1.6, 0]} intensity={1.8} distance={3} color="#adc6ff" />
      <primitive object={clonedScene} />
    </group>
  );
});

const GltfCharacter = forwardRef<CharacterFactoryHandle, CharacterFactoryProps>(function GltfCharacter(props, ref) {
  const asset = getCharacterAsset(props.style);
  const gltf = useGLTF(asset.modelPath);
  return <CharacterRuntime ref={ref} {...props} scene={gltf.scene} animations={gltf.animations} />;
});

const FbxCharacter = forwardRef<CharacterFactoryHandle, CharacterFactoryProps>(function FbxCharacter(props, ref) {
  const asset = getCharacterAsset(props.style);
  const fbx = useFBX(asset.modelPath);
  return <CharacterRuntime ref={ref} {...props} scene={fbx} animations={fbx.animations} />;
});

export const CharacterFactory = forwardRef<CharacterFactoryHandle, CharacterFactoryProps>(function CharacterFactory(props, ref) {
  const asset = getCharacterAsset(props.style);
  if (asset.format === "fbx") {
    return <FbxCharacter ref={ref} {...props} />;
  }
  return <GltfCharacter ref={ref} {...props} />;
});

