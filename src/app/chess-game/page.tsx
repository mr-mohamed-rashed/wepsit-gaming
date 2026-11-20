'use client';

import { useState, useEffect } from 'react';

export default function ChessGameIframe() {
  const [userId, setUserId] = useState<string>('mock-gamer-uuid-12345');
  const [gameState, setGameState] = useState<string>('IN_PROGRESS'); // IN_PROGRESS, CHECKMATE_WIN, CHECKMATE_LOSS
  
  // Parse userId from query params if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('userId');
      if (id) setUserId(id);
    }
  }, []);

  const triggerMatchEnd = (outcome: 'win' | 'loss') => {
    setGameState(outcome === 'win' ? 'CHECKMATE_WIN' : 'CHECKMATE_LOSS');

    // SECURITY EXPLANATION IN CODE:
    // ----------------------------
    // To prevent a user from opening the Chrome DevTools console and executing:
    // `window.parent.postMessage({ type: 'CHESS_GAME_OVER', result: 'win' }, '*')`
    // to arbitrarily inflate their coin balance:
    //
    // 1. The iframe generates a cryptographic payload signature token (`gameToken`)
    //    signed/encrypted using a shared secret between the chess game server and the Next.js API.
    // 2. In this prototype, we simulate this secure token generation:
    //    `valid-token-<userId>-<outcome>`.
    // 3. When the Parent Site receives the postMessage, it forwards this `gameToken`
    //    to the backend Server Action, which verifies its validity.
    // 4. Any manually sent postMessage containing an invalid or replay-attacked token will be rejected by the server.
    const mockSecureToken = `valid-token-${userId}-${outcome}`;

    const message = {
      type: 'CHESS_GAME_OVER',
      userId: userId,
      result: outcome,
      gameToken: mockSecureToken
    };

    // Post message back to the parent window
    // In production, restrict targetOrigin from '*' to the exact parent domain (e.g. 'https://portal.mygames.com')
    // to prevent eavesdropping by malicious parent wrappers/iframes.
    const targetOrigin = window.location.origin; // Using current origin for local testing
    window.parent.postMessage(message, targetOrigin);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 select-none">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl text-center">
        <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400 font-mono">3D RPG Chess Engine v1.0</span>
          </div>
          <span className="text-xs bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/50">
            Active User: {userId.substring(0, 8)}...
          </span>
        </div>

        <h2 className="text-lg font-bold mb-2 text-indigo-400"> Flagship Game IFrame Simulator</h2>
        <p className="text-xs text-slate-400 mb-6">
          This panel simulates the 3D Chess game state. Triggering a checkmate will communicate the results securely to the parent portal.
        </p>

        {gameState === 'IN_PROGRESS' ? (
          <div className="space-y-6">
            {/* Mock Chessboard */}
            <div className="grid grid-cols-4 gap-1 w-48 h-48 mx-auto bg-slate-950 p-2 rounded-lg border border-slate-700">
              {Array.from({ length: 16 }).map((_, i) => {
                const isDark = (Math.floor(i / 4) + (i % 4)) % 2 === 1;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-center rounded-sm text-lg font-semibold ${
                      isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {i === 5 && '👑'}
                    {i === 10 && '⚔️'}
                    {i === 3 && '🛡️'}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => triggerMatchEnd('win')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-xs font-bold rounded-lg border border-emerald-500 shadow-lg shadow-emerald-900/30"
              >
                🏁 Trigger Checkmate (Win)
              </button>
              <button
                onClick={() => triggerMatchEnd('loss')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all text-xs font-bold rounded-lg border border-rose-500 shadow-lg shadow-rose-900/30"
              >
                💥 Trigger Checkmate (Loss)
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className={`text-5xl ${gameState === 'CHECKMATE_WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {gameState === 'CHECKMATE_WIN' ? '🏆' : '💀'}
            </div>
            <h3 className="text-xl font-bold">
              {gameState === 'CHECKMATE_WIN' ? 'لقد فزت! (Checkmate Win)' : 'لقد خسرت! (Checkmate Loss)'}
            </h3>
            <p className="text-xs text-slate-400">
              تم إرسال الحدث والرمز الأمني بنجاح إلى منصة الألعاب الرئيسية.
            </p>
            <button
              onClick={() => setGameState('IN_PROGRESS')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-xs font-bold rounded-lg"
            >
              🔄 إعادة تشغيل المباراة
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
