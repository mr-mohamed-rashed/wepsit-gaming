'use client';
import { useCallback, useEffect, useRef, useState } from "react";
import { CharacterFactory, type CharacterFactoryHandle } from "./CharacterFactory";
import type { CharacterActionName } from "./AssetsRegistry";
import type { PlayerStyleType } from "../cinematics/director/cinematicTypes";

export type CharacterCinematicRequest = {
  id: number;
  style: PlayerStyleType;
  actionType: CharacterActionName;
  position: [number, number, number];
  rotationY?: number;
  holdMs?: number;
};

type CharacterCinematicListener = (request: CharacterCinematicRequest) => void;

const listeners = new Set<CharacterCinematicListener>();

export function subscribeCharacterCinematics(listener: CharacterCinematicListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function playCharacterCinematic(request: Omit<CharacterCinematicRequest, "id">): Promise<void> {
  return new Promise((resolve) => {
    const id = Date.now();
    const onDone = (event: Event) => {
      const detail = (event as CustomEvent<{ id: number }>).detail;
      if (detail.id !== id) {
        return;
      }
      window.removeEventListener("character-cinematic:done", onDone);
      resolve();
    };

    window.addEventListener("character-cinematic:done", onDone);
    listeners.forEach((listener) => listener({ ...request, id }));
  });
}

function finishCharacterCinematic(id: number): void {
  window.dispatchEvent(new CustomEvent("character-cinematic:done", { detail: { id } }));
}

export function CharacterCinematicLayer() {
  const [request, setRequest] = useState<CharacterCinematicRequest | null>(null);
  const characterRef = useRef<CharacterFactoryHandle>(null);

  useEffect(() => subscribeCharacterCinematics(setRequest), []);

  useEffect(() => {
    if (!request?.holdMs) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      characterRef.current?.hide();
      finishCharacterCinematic(request.id);
      setRequest(null);
    }, request.holdMs);

    return () => window.clearTimeout(timeoutId);
  }, [request]);

  const handleFinished = useCallback(
    (actionName: CharacterActionName) => {
      if (!request || actionName !== request.actionType) {
        return;
      }
      if (request.holdMs) {
        return;
      }
      characterRef.current?.hide();
      finishCharacterCinematic(request.id);
      setRequest(null);
    },
    [request]
  );

  if (!request) {
    return null;
  }

  return (
    <CharacterFactory
      key={request.id}
      ref={characterRef}
      style={request.style}
      actionType={request.actionType}
      position={request.position}
      rotationY={request.rotationY}
      visible
      onActionFinished={request.holdMs ? undefined : handleFinished}
    />
  );
}

