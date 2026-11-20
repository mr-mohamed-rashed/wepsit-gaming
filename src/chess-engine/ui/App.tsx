'use client';
import { Suspense, useState } from "react";
import type { CSSProperties } from "react";
import { ChessScene } from "../components/ChessScene";
import { useEmbedBridge } from "../embed/useEmbedBridge";
import { useGameStore } from "../game/gameStore";
import type { BoardThemeId, BotDifficulty, PieceSetId } from "../game/types";
import { captureEffectsByStyle, playerStyles } from "./captureOptions";

const pieceSetOptions: Array<{ id: PieceSetId; label: string; note: string; preview: string }> = [
  {
    id: "stitch-black-gold",
    label: "أسود وذهبي",
    note: "ثيم Stitch الفاخر",
    preview: "/assets/stitch/black-gold-transparent/king.png?v=black-gold-stitch-1"
  },
  {
    id: "stitch-white-gold",
    label: "أبيض وذهبي",
    note: "ثيم Stitch فاتح",
    preview: "/assets/stitch/black-gold-transparent/king.png?v=white-gold-stitch-1"
  },
  {
    id: "photo-gold-silver",
    label: "ذهبي وفضي",
    note: "الثيم الكلاسيكي",
    preview: "/assets/pieces/photo-gold-silver-clean-cut/gold/king.png?v=gold-king-transparent-1"
  }
];

const boardThemeOptions: Array<{ id: BoardThemeId; label: string; note: string; colors: [string, string] }> = [
  {
    id: "classic-slate",
    label: "سليت كلاسيك",
    note: "واضح وهادئ للتدريب",
    colors: ["#c9d1dc", "#344052"]
  },
  {
    id: "royal-wood",
    label: "خشب ملكي",
    note: "دفء وفخامة للبورد",
    colors: ["#c89b62", "#4a2a18"]
  },
  {
    id: "night-marble",
    label: "رخام ليلي",
    note: "تباين قوي ومظهر حديث",
    colors: ["#e4e7ec", "#111827"]
  },
  {
    id: "ocean-reef",
    label: "أعماق المحيط",
    note: "بورد خشبية مائية مذهلة",
    colors: ["#5db3c6", "#2a5f70"]
  }
];

const botDifficultyOptions: Array<{ id: BotDifficulty; label: string; note: string }> = [
  { id: "easy", label: "سهل", note: "نقلات عشوائية للتعلم" },
  { id: "medium", label: "متوسط", note: "يفضل الأكل والفرص الواضحة" },
  { id: "hard", label: "صعب", note: "يقيّم القطع والكش والتهديدات" }
];

export function App() {
  const [setupStep, setSetupStep] = useState(1);
  const embedConfig = useEmbedBridge();
  const playerStyle = useGameStore((state) => state.playerStyle);
  const pieceSet = useGameStore((state) => state.pieceSet);
  const boardTheme = useGameStore((state) => state.boardTheme);
  const botDifficulty = useGameStore((state) => state.botDifficulty);
  const matchStarted = useGameStore((state) => state.matchStarted);
  const captureEffect = useGameStore((state) => state.captureEffect);
  const setPlayerStyle = useGameStore((state) => state.setPlayerStyle);
  const setPieceSet = useGameStore((state) => state.setPieceSet);
  const setBoardTheme = useGameStore((state) => state.setBoardTheme);
  const setBotDifficulty = useGameStore((state) => state.setBotDifficulty);
  const setCaptureEffect = useGameStore((state) => state.setCaptureEffect);
  const startMatch = useGameStore((state) => state.startMatch);
  const backToSetup = useGameStore((state) => state.backToSetup);
  const reset = useGameStore((state) => state.reset);
  const legalMoves = useGameStore((state) => state.legalMoves);
  const selectedSquare = useGameStore((state) => state.selectedSquare);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const isCheckmate = useGameStore((state) => state.isCheckmate);
  const turn = useGameStore((state) => state.turn);

  const selectedPlayer = playerStyles.find((style) => style.id === playerStyle);
  const selectedPieceSet = pieceSetOptions.find((set) => set.id === pieceSet);
  const selectedBoard = boardThemeOptions.find((board) => board.id === boardTheme);
  const selectedBot = botDifficultyOptions.find((bot) => bot.id === botDifficulty);

  return (
    <main className="shell" dir="rtl">
      <header className="topbar">
        <div>
          <p className="eyebrow">Grandmaster RPG Chess</p>
          <h1>شطرنج سينمائي ثلاثي الأبعاد</h1>
          <p className="subtext">
            اختار شخصية اللاعب، شكل القطع، البورد، ومستوى الروبوت قبل دخول المباراة.
          </p>
          <p className="embedMeta">
            {embedConfig.embed ? "وضع التضمين" : "وضع مستقل"} · {embedConfig.mode} · {embedConfig.partnerId ?? "direct"}
          </p>
        </div>
        {matchStarted ? (
          <div className="topbarActions">
            <button className="primary ghost" onClick={backToSetup}>
              إعداد مباراة جديدة
            </button>
            <button className="primary" onClick={reset}>
              إعادة المباراة
            </button>
          </div>
        ) : null}
      </header>

      {!matchStarted ? (
        <section className="setupPanel">
          <div className="setupIntro">
            <p className="eyebrow">تجهيز المباراة (الخطوة {setupStep} من 3)</p>
            <h2>{setupStep === 1 ? 'اختار هوية اللعب قبل البداية' : setupStep === 2 ? 'اختر شكل القطع' : 'تجهيز الرقعة والخصم'}</h2>
            <p className="panelHint">
              {setupStep === 1 ? 'اختر الشخصية التي تمثلك في المعركة.' : setupStep === 2 ? 'تخصيص القطع التي ستلعب بها.' : 'بعد الضغط على ابدأ اللعب، المباراة تدخل بالإعدادات المختارة فقط.'}
            </p>
          </div>

          {setupStep === 1 ? (
            <>
              <section>
            <h2>شخصية اللاعب</h2>
            <div className="gridButtons characterGrid">
              {playerStyles.map((style) => (
                <button
                  key={style.id}
                  className={style.id === playerStyle ? "choice active" : "choice"}
                  onClick={() => setPlayerStyle(style.id)}
                >
                  <strong>{style.label}</strong>
                  <span>{style.note}</span>
                </button>
              ))}
            </div>
          </section>

          <button className="startButton" style={{ marginTop: '12px' }} onClick={() => setSetupStep(2)}>
            التالي ➡️
          </button>
        </>
      ) : setupStep === 2 ? (
        <>
          <section>
            <h2>شكل القطع</h2>
            <div className="pieceSetGrid">
              {pieceSetOptions.map((option) => (
                <button
                  key={option.id}
                  className={option.id === pieceSet ? "pieceSetCard active" : "pieceSetCard"}
                  onClick={() => setPieceSet(option.id)}
                >
                  <span className="piecePreview">
                    <img src={option.preview} alt="" />
                  </span>
                  <strong>{option.label}</strong>
                  <span>{option.note}</span>
                </button>
              ))}
            </div>
          </section>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button className="startButton ghost" style={{ flex: 1, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--text)' }} onClick={() => setSetupStep(1)}>
              ⬅️ السابق
            </button>
            <button className="startButton" style={{ flex: 2 }} onClick={() => setSetupStep(3)}>
              التالي ➡️
            </button>
          </div>
        </>
      ) : (
        <>
          <section>
            <h2>شكل البورد</h2>
            <div className="boardThemeGrid">
              {boardThemeOptions.map((option) => (
                <button
                  key={option.id}
                  className={option.id === boardTheme ? "boardThemeCard active" : "boardThemeCard"}
                  onClick={() => setBoardTheme(option.id)}
                >
                  <span
                    className="boardSwatch"
                    style={{ "--light-square": option.colors[0], "--dark-square": option.colors[1] } as CSSProperties}
                  />
                  <strong>{option.label}</strong>
                  <span>{option.note}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2>اللعب ضد الروبوت</h2>
            <div className="gridButtons difficultyGrid">
              {botDifficultyOptions.map((option) => (
                <button
                  key={option.id}
                  className={option.id === botDifficulty ? "choice active" : "choice"}
                  onClick={() => setBotDifficulty(option.id)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.note}</span>
                </button>
              ))}
            </div>
          </section>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="startButton ghost" style={{ flex: 1, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--text)' }} onClick={() => setSetupStep(2)}>
                  ⬅️ السابق
                </button>
                <button className="startButton" style={{ flex: 2 }} onClick={startMatch}>
                  ابدأ اللعب ♟️
                </button>
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="layout">
          <div className="scenePanel">
            <Suspense fallback={<div className="loading">تحميل المشهد...</div>}>
              <ChessScene />
            </Suspense>
          </div>

          <aside className="controlPanel">
            <section className="matchSummary">
              <h2>اختيارات المباراة</h2>
              <p>
                الشخصية: <strong>{selectedPlayer?.label}</strong>
              </p>
              <p>
                القطع: <strong>{selectedPieceSet?.label}</strong>
              </p>
              <p>
                البورد: <strong>{selectedBoard?.label}</strong>
              </p>
              <p>
                الروبوت: <strong>{selectedBot?.label}</strong>
              </p>
            </section>

            <section>
              <h2>مشهد الأكل داخل الشخصية</h2>
              <p className="panelHint">اختيار تجريبي لنوع الضربة. لاحقا سيتحدد المشهد تلقائيا حسب القطعة والحالة.</p>
              <div className="gridButtons">
                {captureEffectsByStyle[playerStyle].map((effect) => (
                  <button
                    key={effect.id}
                    className={effect.id === captureEffect ? "choice active" : "choice"}
                    onClick={() => setCaptureEffect(effect.id)}
                  >
                    <strong>{effect.label}</strong>
                    <span>{effect.id}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="status">
              <h2>تعليم الحركة</h2>
              {isGameOver ? (
                <div style={{ padding: '16px', background: 'var(--accent)', borderRadius: '8px', marginTop: '16px', border: '1px solid var(--accent-hover)' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: 'var(--bg)' }}>
                    {isCheckmate ? "كش مات! (Game Over)" : "تعادل! (Draw)"}
                  </h3>
                  <p style={{ margin: '0 0 16px 0', color: 'var(--bg)', opacity: 0.8 }}>
                    {isCheckmate
                      ? turn === "w" ? "لقد خسرت. الروبوت فاز!" : "مبروك! لقد فزت على الروبوت!"
                      : "انتهت اللعبة بالتعادل."}
                  </p>
                  <button className="startButton" onClick={reset} style={{ width: '100%', background: 'var(--bg)', color: 'var(--text)' }}>
                    العب مجدداً 🔄
                  </button>
                </div>
              ) : selectedSquare ? (
                <p>
                  القطعة المختارة: <strong>{selectedSquare}</strong>. النقلات القانونية المتاحة:{" "}
                  <strong>{legalMoves.length}</strong>.
                </p>
              ) : (
                <p>أنت تلعب بالأبيض. اضغط على قطعة لتظهر النقلات القانونية، والروبوت سيرد بالأسود.</p>
              )}
            </section>
          </aside>
        </section>
      )}
    </main>
  );
}

