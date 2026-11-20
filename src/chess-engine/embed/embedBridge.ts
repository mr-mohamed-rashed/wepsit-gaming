'use client';
export type GameMode = "training" | "casual" | "ranked";
export type SupportedLanguage = "ar" | "en";

export type EmbedConfig = {
  embed: boolean;
  partnerId: string | null;
  userId: string | null;
  lang: SupportedLanguage;
  mode: GameMode;
  theme: string | null;
  sessionId: string;
};

export type GameEvent =
  | { type: "GAME_READY"; payload: EmbedConfig }
  | { type: "MATCH_STARTED"; payload: { mode: GameMode; sessionId: string } }
  | { type: "MOVE_PLAYED"; payload: { from: string; to: string; san: string; capture: boolean } }
  | { type: "CAPTURE_TRIGGERED"; payload: { style: string; effect: string; captured: string } }
  | { type: "MATCH_RESET"; payload: { sessionId: string } }
  | { type: "REWARD_EARNED"; payload: { coins: number; xp: number; reason: string } }
  | { type: "UNLOCK_REQUEST"; payload: { itemId: string; cost: number } }
  | { type: "GAME_ERROR"; payload: { message: string } };

const allowedModes = new Set<GameMode>(["training", "casual", "ranked"]);
const allowedLanguages = new Set<SupportedLanguage>(["ar", "en"]);

export function readEmbedConfig(): EmbedConfig {
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get("mode") as GameMode | null;
  const langParam = params.get("lang") as SupportedLanguage | null;

  return {
    embed: params.get("embed") === "1" || window.self !== window.top,
    partnerId: params.get("partner") || params.get("partnerId"),
    userId: params.get("user") || params.get("userId"),
    lang: langParam && allowedLanguages.has(langParam) ? langParam : "ar",
    mode: modeParam && allowedModes.has(modeParam) ? modeParam : "training",
    theme: params.get("theme"),
    sessionId: params.get("session") || crypto.randomUUID()
  };
}

export function emitGameEvent(event: GameEvent): void {
  window.dispatchEvent(new CustomEvent("grandmaster:event", { detail: event }));

  if (window.parent && window.parent !== window) {
    window.parent.postMessage(
      {
        source: "grandmaster-rpg-chess",
        ...event
      },
      "*"
    );
  }
}

export function listenForHostMessages(onMessage: (message: unknown) => void): () => void {
  const handler = (event: MessageEvent) => {
    if (!event.data || typeof event.data !== "object") {
      return;
    }

    onMessage(event.data);
  };

  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}

