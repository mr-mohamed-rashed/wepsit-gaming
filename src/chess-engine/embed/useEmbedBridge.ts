'use client';
import { useEffect, useMemo } from "react";
import { emitGameEvent, listenForHostMessages, readEmbedConfig } from "./embedBridge";
import { useGameStore } from "../game/gameStore";

export function useEmbedBridge() {
  const config = useMemo(() => readEmbedConfig(), []);
  const reset = useGameStore((state) => state.reset);
  const setPlayerStyle = useGameStore((state) => state.setPlayerStyle);

  useEffect(() => {
    document.documentElement.lang = config.lang;
    document.documentElement.dir = config.lang === "ar" ? "rtl" : "ltr";
    document.body.dataset.embed = config.embed ? "true" : "false";
    document.body.dataset.mode = config.mode;

    emitGameEvent({ type: "GAME_READY", payload: config });

    return listenForHostMessages((message) => {
      if (!message || typeof message !== "object") {
        return;
      }

      const typed = message as { type?: string; payload?: unknown };
      if (typed.type === "GRANDMASTER_RESET") {
        reset();
        emitGameEvent({ type: "MATCH_RESET", payload: { sessionId: config.sessionId } });
      }

      if (typed.type === "GRANDMASTER_SET_STYLE") {
        const payload = typed.payload as { style?: Parameters<typeof setPlayerStyle>[0] };
        if (payload?.style) {
          setPlayerStyle(payload.style);
        }
      }
    });
  }, [config, reset, setPlayerStyle]);

  return config;
}

