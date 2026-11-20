'use client';
import { create } from "zustand";
import type { Move, Square } from "chess.js";
import { createChessEngine, isLegalMove, legalMovesForSquare, piecesFromEngine } from "./chessEngine";
import type { BoardPiece, BoardThemeId, BotDifficulty, CaptureEffect, CaptureEvent, PendingMove, PieceSetId, PlayerStyle } from "./types";
import { emitGameEvent } from "../embed/embedBridge";
import { getPlayerStyleScene } from "../cinematics/playerStyleScenes";

type GameState = {
  fen: string;
  pieces: BoardPiece[];
  isGameOver: boolean;
  isCheckmate: boolean;
  turn: "w" | "b";
  selectedSquare: Square | null;
  legalMoves: Move[];
  playerStyle: PlayerStyle;
  pieceSet: PieceSetId;
  boardTheme: BoardThemeId;
  botDifficulty: BotDifficulty;
  matchStarted: boolean;
  captureEffect: CaptureEffect;
  captureEvent: CaptureEvent | null;
  pendingMove: PendingMove | null;
  selectSquare: (square: Square) => void;
  tryMove: (to: Square) => void;
  completePendingMove: (moveId: number) => void;
  setPlayerStyle: (style: PlayerStyle) => void;
  setPieceSet: (pieceSet: PieceSetId) => void;
  setBoardTheme: (boardTheme: BoardThemeId) => void;
  setBotDifficulty: (difficulty: BotDifficulty) => void;
  setCaptureEffect: (effect: CaptureEffect) => void;
  startMatch: () => void;
  backToSetup: () => void;
  reset: () => void;
};

const chess = createChessEngine();

function syncState() {
  return {
    fen: chess.fen(),
    pieces: piecesFromEngine(chess),
    isGameOver: chess.isGameOver(),
    isCheckmate: chess.isCheckmate(),
    turn: chess.turn()
  };
}

function onCaptureTriggered(targetSquare: Square) {
  // RPG VFX injection point: trigger Magic Freeze Shatter, Melee Smash, camera zoom, etc. for targetSquare.
  void targetSquare;
}

function castlingRookMove(move: Move): PendingMove["rookMove"] {
  if (!move.flags.includes("k") && !move.flags.includes("q")) {
    return undefined;
  }

  const rank = move.color === "w" ? "1" : "8";
  if (move.to[0] === "g") {
    return { from: `h${rank}` as Square, to: `f${rank}` as Square };
  }

  return { from: `a${rank}` as Square, to: `d${rank}` as Square };
}

const pieceValue: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0
};

function scoreBotMove(move: Move, difficulty: BotDifficulty): number {
  if (difficulty === "easy") {
    return Math.random();
  }

  let score = Math.random() * 12;
  if (move.captured) {
    score += pieceValue[move.captured] ?? 0;
  }
  if (move.promotion) {
    score += pieceValue[move.promotion] ?? 0;
  }
  if (move.san.includes("+")) {
    score += difficulty === "hard" ? 80 : 25;
  }
  if (move.san.includes("#")) {
    score += 10000;
  }

  if (difficulty === "hard") {
    score += pieceValue[move.piece] * 0.02;
    if (move.flags.includes("k") || move.flags.includes("q")) {
      score += 35;
    }
  }

  return score;
}

function chooseBotMove(difficulty: BotDifficulty): Move | null {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    return null;
  }

  if (difficulty === "easy") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const candidates = difficulty === "medium" ? moves.filter((move) => move.captured) : moves;
  const pool = candidates.length > 0 ? candidates : moves;
  return [...pool].sort((a, b) => scoreBotMove(b, difficulty) - scoreBotMove(a, difficulty))[0];
}

function queueBotMove(set: (partial: Partial<GameState>) => void, get: () => GameState) {
  window.setTimeout(() => {
    const state = get();
    if (!state.matchStarted || state.pendingMove || chess.turn() !== "b" || chess.isGameOver()) {
      return;
    }

    const plannedMove = chooseBotMove(state.botDifficulty);
    if (!plannedMove) {
      return;
    }

    const attacker = chess.get(plannedMove.from);
    const victim = chess.get(plannedMove.to);
    if (!attacker) {
      return;
    }

    set({
      selectedSquare: null,
      legalMoves: [],
      pendingMove: {
        id: Date.now(),
        from: plannedMove.from,
        to: plannedMove.to,
        attacker: { square: plannedMove.from, type: attacker.type, color: attacker.color },
        victim: victim ? { square: plannedMove.to, type: victim.type, color: victim.color } : null,
        promotion: "q",
        rookMove: castlingRookMove(plannedMove)
      }
    });
  }, 520);
}

export const useGameStore = create<GameState>((set, get) => ({
  ...syncState(),
  selectedSquare: null,
  legalMoves: [],
  playerStyle: "magic",
  pieceSet: "stitch-black-gold",
  boardTheme: "classic-slate",
  botDifficulty: "medium",
  matchStarted: false,
  captureEffect: "freeze",
  captureEvent: null,
  pendingMove: null,

  selectSquare(square) {
    if (get().pendingMove || chess.turn() !== "w") {
      return;
    }

    const piece = chess.get(square);
    if (!piece || piece.color !== chess.turn()) {
      set({ selectedSquare: null, legalMoves: [] });
      return;
    }

    set({
      selectedSquare: square,
      legalMoves: legalMovesForSquare(chess, square)
    });
  },

  tryMove(to) {
    const { selectedSquare, pendingMove } = get();
    if (pendingMove) {
      return;
    }

    if (!selectedSquare) {
      get().selectSquare(to);
      return;
    }

    const plannedMove = isLegalMove(chess, selectedSquare, to);
    if (!plannedMove) {
      get().selectSquare(to);
      return;
    }

    const attacker = chess.get(selectedSquare);
    const victim = chess.get(to);
    if (!attacker) {
      return;
    }

    set({
      selectedSquare: null,
      legalMoves: [],
      pendingMove: {
        id: Date.now(),
        from: selectedSquare,
        to,
        attacker: { square: selectedSquare, type: attacker.type, color: attacker.color },
        victim: victim ? { square: to, type: victim.type, color: victim.color } : null,
        promotion: "q",
        rookMove: castlingRookMove(plannedMove)
      }
    });
  },

  completePendingMove(moveId) {
    const { pendingMove, playerStyle, captureEffect } = get();
    if (!pendingMove || pendingMove.id !== moveId) {
      return;
    }

    const move = chess.move({ from: pendingMove.from, to: pendingMove.to, promotion: pendingMove.promotion });

    let captureEvent: CaptureEvent | null = null;
    if (move && move.captured && pendingMove.victim) {
      onCaptureTriggered(pendingMove.to);
      captureEvent = {
        id: Date.now(),
        attacker: pendingMove.attacker,
        victim: pendingMove.victim,
        to: pendingMove.to,
        style: playerStyle,
        effect: captureEffect
      };
      emitGameEvent({
        type: "CAPTURE_TRIGGERED",
        payload: {
          style: playerStyle,
          effect: captureEffect,
          captured: pendingMove.victim.type
        }
      });
    }

    if (move) {
      emitGameEvent({
        type: "MOVE_PLAYED",
        payload: {
          from: pendingMove.from,
          to: pendingMove.to,
          san: move.san,
          capture: Boolean(move.captured)
        }
      });
    }

    set({
      ...syncState(),
      selectedSquare: null,
      legalMoves: [],
      captureEvent,
      pendingMove: null
    });

    if (move && chess.turn() === "b") {
      queueBotMove(set, get);
    }
  },

  setPlayerStyle(style) {
    set({ playerStyle: style, captureEffect: getPlayerStyleScene(style).defaultEffect });
  },

  setPieceSet(pieceSet) {
    set({ pieceSet });
  },

  setBoardTheme(boardTheme) {
    set({ boardTheme });
  },

  setBotDifficulty(botDifficulty) {
    set({ botDifficulty });
  },

  setCaptureEffect(effect) {
    set({ captureEffect: effect });
  },

  startMatch() {
    chess.reset();
    emitGameEvent({ type: "MATCH_STARTED", payload: { mode: "training", sessionId: "local" } });
    set({
      ...syncState(),
      matchStarted: true,
      selectedSquare: null,
      legalMoves: [],
      captureEvent: null,
      pendingMove: null
    });
  },

  backToSetup() {
    chess.reset();
    set({
      ...syncState(),
      matchStarted: false,
      selectedSquare: null,
      legalMoves: [],
      captureEvent: null,
      pendingMove: null
    });
  },

  reset() {
    chess.reset();
    emitGameEvent({ type: "MATCH_RESET", payload: { sessionId: "local" } });
    set({
      ...syncState(),
      selectedSquare: null,
      legalMoves: [],
      captureEvent: null,
      pendingMove: null
    });
  }
}));

