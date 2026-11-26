'use client';

import React from 'react';
import { PlayerColor } from './ludoUtils';
import { BOARD_SKINS, BoardTheme, GIFTS_LIST, GiftItem, H2HRecord } from './ludoConstants';
import {
  CoinGoldIcon,
  CrownIcon,
  HelpQuestionIcon,
  LockClosedIcon,
  PeaceDoveIcon,
  PeaceWarIcon,
  SettingsGearIcon,
  SpeakerToggleIcon,
  StarShieldIcon,
  StartLaunchIcon,
  TrophyCupIcon,
  WarSwordsIcon,
} from './ludoIcons';
import { calculateRoomLevel } from './ludoRealtime';

export function GiftPickerModal({
  lang,
  selectedGiftTarget,
  setSelectedGiftTarget,
  giftCategoryTab,
  setGiftCategoryTab,
  playerCoins,
  playerConfig,
  getPlayerName,
  handleSendGift,
}: {
  lang: string;
  selectedGiftTarget: PlayerColor | null;
  setSelectedGiftTarget: (c: PlayerColor | null) => void;
  giftCategoryTab: 'prank' | 'friendly';
  setGiftCategoryTab: (t: 'prank' | 'friendly') => void;
  playerCoins: number;
  playerConfig: Record<PlayerColor, 'human' | 'bot' | 'none'>;
  getPlayerName: (c: PlayerColor) => string;
  handleSendGift: (gift: GiftItem, target: PlayerColor) => void;
}) {
  if (!selectedGiftTarget) return null;

  return (
    <div
      onClick={() => setSelectedGiftTarget(null)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-950 border-2 border-amber-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl relative flex flex-col gap-3"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <PeaceWarIcon className="w-5 h-5" />
            <div>
              <h3 className="text-sm font-black text-amber-400">
                {lang === 'ar' ? 'السلام والحرب (الهدايا والمقالب)' : 'Peace & War (Gifts & Pranks)'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {lang === 'ar' ? 'إرسال إلى: ' : 'Send to: '}
                <span className="text-amber-300 font-bold">{getPlayerName(selectedGiftTarget)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
              <CoinGoldIcon className="w-3.5 h-3.5" />
              <span>{playerCoins}</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedGiftTarget(null)}
              className="w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {(['green', 'yellow', 'red'] as PlayerColor[])
            .filter((c) => playerConfig[c] !== 'none')
            .map((c) => (
              <button
                key={`target-${c}`}
                type="button"
                onClick={() => setSelectedGiftTarget(c)}
                className={`flex-1 py-1 px-2 rounded-xl text-[10px] font-black border transition-colors cursor-pointer truncate ${
                  selectedGiftTarget === c
                    ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {c === 'green' ? '🟢 ' : c === 'yellow' ? '🟡 ' : '🔴 '}
                {getPlayerName(c)}
              </button>
            ))}
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setGiftCategoryTab('prank')}
            className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              giftCategoryTab === 'prank'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <WarSwordsIcon className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'حرب (مقالب وضرب)' : 'War (Pranks)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setGiftCategoryTab('friendly')}
            className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              giftCategoryTab === 'friendly'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PeaceDoveIcon className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'سلام (تحيات وود)' : 'Peace (Greetings)'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto p-1">
          {GIFTS_LIST.filter((g) => g.category === giftCategoryTab).map((gift) => {
            const canAfford = playerCoins >= gift.cost;
            return (
              <button
                key={gift.id}
                type="button"
                onClick={() => handleSendGift(gift, selectedGiftTarget)}
                className={`flex flex-col items-center justify-between p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  canAfford
                    ? 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-700/60 hover:border-amber-400/80 hover:scale-[1.03] shadow-md active:scale-95'
                    : 'bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="text-3xl mb-1 filter drop-shadow">{gift.icon}</span>
                <span className="text-[11px] font-black text-slate-200 leading-tight">
                  {lang === 'ar' ? gift.nameAr : gift.nameEn}
                </span>
                <p className="text-[9px] text-slate-400 line-clamp-1 my-0.5">{gift.descAr}</p>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full mt-1 ${
                    canAfford ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  🪙 {gift.cost}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function H2HModal({
  lang,
  open,
  onClose,
  h2hRecord,
}: {
  lang: string;
  open: boolean;
  onClose: () => void;
  h2hRecord: H2HRecord;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-950 border-2 border-amber-500/50 rounded-3xl p-5 shadow-2xl relative flex flex-col gap-4 max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
              <TrophyCupIcon className="w-4 h-4" />
              <span>{lang === 'ar' ? 'سجل المواجهات التاريخي الدائم' : 'Historical Head-to-Head Record'}</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'ar' ? 'يتم حفظ وتحديث نتائجك باستمرار مع كل مباراة' : 'Your records are persistently tracked across all matches'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'إجمالي المباريات' : 'Matches'}</span>
            <span className="text-lg font-black text-white">{h2hRecord.totalMatches}</span>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-center">
            <span className="text-[10px] text-cyan-400 block">{lang === 'ar' ? 'انتصاراتك' : 'Your Wins'}</span>
            <span className="text-lg font-black text-cyan-300">
              {h2hRecord.playerWins}
              <span className="text-[10px] text-slate-400 font-normal mr-1">
                ({h2hRecord.totalMatches > 0 ? Math.round((h2hRecord.playerWins / h2hRecord.totalMatches) * 100) : 0}%)
              </span>
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center">
            <span className="text-[10px] text-rose-400 block">{lang === 'ar' ? 'انتصارات الخصوم' : 'Opponent Wins'}</span>
            <span className="text-lg font-black text-rose-300">{h2hRecord.opponentWins}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-300 block mb-2">
            {lang === 'ar' ? 'تفصيل انتصارات الخصوم حسب اللون:' : 'Wins by Opponent Color:'}
          </span>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <span className="text-emerald-400 font-bold block">🟢 الأخضر</span>
              <span className="font-black text-white text-sm">{h2hRecord.byColor?.green || 0}</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-500/30">
              <span className="text-rose-400 font-bold block">🔴 الأحمر</span>
              <span className="font-black text-white text-sm">{h2hRecord.byColor?.red || 0}</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30">
              <span className="text-amber-400 font-bold block">🟡 الأصفر</span>
              <span className="font-black text-white text-sm">{h2hRecord.byColor?.yellow || 0}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[30vh] border border-slate-800/80 rounded-2xl p-2 bg-slate-950/50">
          <span className="text-[10px] font-bold text-slate-400 block mb-1.5 px-1">
            {lang === 'ar' ? 'سجل آخر المباريات:' : 'Recent Matches:'}
          </span>
          {!h2hRecord.history || h2hRecord.history.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 font-bold">
              {lang === 'ar' ? 'لا توجد مباريات مسجلة بعد. العب الآن لبدء تسجيل تاريخك!' : 'No recorded matches yet. Play to start logging history!'}
            </div>
          ) : (
            <div className="space-y-1.5">
              {h2hRecord.history.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/70 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold">#{h2hRecord.history.length - idx}</span>
                    <span className="font-black text-slate-200">
                      {m.winner === 'blue' ? '👑 ' : '💀 '}
                      {m.winnerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>
                      {m.playersCount} {lang === 'ar' ? 'لاعبين' : 'players'}
                    </span>
                    <span>•</span>
                    <span>{m.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
          >
            {lang === 'ar' ? 'تم' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WinnerModal({
  lang,
  winner,
  winReward,
  mySeatColor,
  getPlayerName,
  onPlayAgain,
  onExitToHub,
}: {
  lang: string;
  winner: PlayerColor | null;
  winReward: number;
  mySeatColor: PlayerColor | null;
  getPlayerName: (c: PlayerColor) => string;
  onPlayAgain: () => void;
  onExitToHub: () => void;
}) {
  if (!winner) return null;
  const isMyWin = winner === mySeatColor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-950 border-2 border-amber-400/60 rounded-3xl p-6 text-center shadow-[0_0_60px_rgba(245,158,11,0.3)] relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-6xl inline-block mb-3 animate-bounce">{isMyWin ? '🏆' : '👑'}</span>
          <h3 className="text-2xl font-black text-amber-400 mb-1">
            {isMyWin ? (lang === 'ar' ? 'نصر أسطوري ساحق!' : 'Epic Victory!') : lang === 'ar' ? 'انتهت المعركة!' : 'Match Ended!'}
          </h3>
          <p className="text-xs text-slate-300 font-semibold mb-4">
            {lang === 'ar' ? 'الفائز بالبطولة هو: ' : 'Tournament Winner: '}
            <span className="text-amber-300 font-black">{getPlayerName(winner)}</span>
          </p>
          {isMyWin && winReward > 0 && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3 mb-5 flex items-center justify-center gap-3">
              <CoinGoldIcon className="w-7 h-7" />
              <div className="text-right">
                <p className="text-xs font-black text-amber-300">+{winReward} عملة ذهبية</p>
                <p className="text-[10px] text-slate-400">مكافأة الفوز في بطولة اللودو</p>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={onPlayAgain}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-98 transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'لعب جولة جديدة' : 'Play Again'}
            </button>
            <button
              onClick={onExitToHub}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs rounded-xl border border-slate-800 transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'العودة للرئيسية' : 'Exit to Hub'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuickChatModal({
  lang,
  open,
  onClose,
  quickInputText,
  setQuickInputText,
  isChatMuted = false,
  onSendMessage,
}: {
  lang: string;
  open: boolean;
  onClose: () => void;
  quickInputText: string;
  setQuickInputText: (v: string) => void;
  isChatMuted?: boolean;
  onSendMessage: (txt: string) => void;
}) {
  if (!open) return null;
  const phrases = [
    'لعبة ممتعة يا أبطال! 🔥',
    'عاش يا وحش! 👏',
    'ركز معايا بقى! 🎯',
    'حظ أوفر يا صديقي! 🤝',
    'يلا العب سريع ⚡',
    'كفو والله! 👑',
  ];

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-slate-950 border border-amber-500/50 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-sm font-black text-amber-300">💬 {lang === 'ar' ? 'الدردشة والتعليقات السريعة' : 'Quick Chat'}</span>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {isChatMuted ? (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-center text-xs font-bold text-rose-200 space-y-1">
            <div>🔇 {lang === 'ar' ? 'أنت مكتوم عن الكتابة حالياً' : 'You are chat-muted'}</div>
            <p className="text-[10px] text-rose-300/80">
              {lang === 'ar' ? 'يمكنك البقاء ومتابعة الغرفة، لكن الكتابة معطلة من المشرف.' : 'You may remain in the room, but chat is disabled by a moderator.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              {phrases.map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSendMessage(phrase);
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-400/50 text-[11px] text-slate-200 font-bold text-center active:scale-95 transition-all cursor-pointer"
                >
                  {phrase}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={quickInputText}
                onChange={(e) => setQuickInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && quickInputText.trim()) {
                    onSendMessage(quickInputText.trim());
                    setQuickInputText('');
                    onClose();
                  }
                }}
                placeholder={lang === 'ar' ? 'اكتب رسالة للغرفة...' : 'Type message...'}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (quickInputText.trim()) {
                    onSendMessage(quickInputText.trim());
                    setQuickInputText('');
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs active:scale-95 transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إرسال' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function RulesModal({ lang, open, onClose }: { lang: string; open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-950 border-2 border-amber-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 text-slate-100 max-h-[85dvh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
            <HelpQuestionIcon className="w-5 h-5" />
            <span>{lang === 'ar' ? 'قواعد ودليل لودو الممالك' : 'Mythical Ludo Rules'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2.5 text-xs leading-relaxed text-slate-300">
          <div className="p-2.5 rounded-2xl bg-slate-900/75 border border-slate-800 flex items-start gap-2.5">
            <StartLaunchIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              {lang === 'ar'
                ? 'احصل على الرقم (6) لإخراج مقاتلك من القاعدة إلى خانة الانطلاق، كما يمنحك الرقم 6 رمية إضافية!'
                : 'Roll a 6 to move a piece out from base onto the starting tile and earn an extra roll.'}
            </p>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/75 border border-slate-800 flex items-start gap-2.5">
            <StarShieldIcon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              {lang === 'ar'
                ? 'المربعات النجمية ومربعات الانطلاق آمنة تماماً ولا يمكن أكل أي قطعة فوقها، وتكوين جدار من قطعتين يحميها.'
                : 'Star tiles and launch tiles are Safe Zones where pieces cannot be captured.'}
            </p>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/75 border border-slate-800 flex items-start gap-2.5">
            <WarSwordsIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>
              {lang === 'ar'
                ? 'عند الوقوف على قطعة خصم منفردة خارج المناطق الآمنة، تُعاد لقاعدتها وتحصل على رمية إضافية!'
                : 'Landing on a single opponent pawn sends it back to base and grants a bonus roll!'}
            </p>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/75 border border-slate-800 flex items-start gap-2.5">
            <CrownIcon className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <p>
              {lang === 'ar'
                ? 'توصيل قطعة للنهاية يمنح رمية إضافية. الفائز يحصل على جائزة الرهان وتُحفظ نقاطه في الملف الشخصي!'
                : 'Reaching the center Crown gives an extra roll. Finish first to win the table prize!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExitConfirmModal({
  lang,
  open,
  onStay,
  onConfirm,
}: {
  lang: string;
  open: boolean;
  onStay: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div onClick={onStay} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs bg-slate-950 border-2 border-rose-500/60 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-center"
      >
        <h3 className="text-base font-black text-white">{lang === 'ar' ? 'تأكيد الخروج من المباراة' : 'Leave Match?'}</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {lang === 'ar'
            ? 'المباراة لا تزال جارية الآن! هل أنت متأكد أنك تريد مغادرة الطاولة والعودة إلى الصالة؟'
            : 'The match is still in progress. Are you sure you want to leave this table?'}
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onStay}
            className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
          >
            {lang === 'ar' ? 'البقاء في اللعب' : 'Stay'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-lg"
          >
            {lang === 'ar' ? 'نعم، خروج' : 'Yes, Exit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({
  lang,
  open,
  onClose,
  playerCoins,
  isMuted,
  onToggleMute,
  isMicOn,
  hasMicPermission,
  onToggleMic,
  musicTrackName,
  isPlayingMusic,
  onOpenMusic,
  onOpenIntro,
  onOpenH2H,
  canAccessSettings,
  isHost,
  isRoomLocked,
  onToggleRoomLock,
  selectedBoardSkin,
  onSelectTheme,
  roomMicMode,
  onCycleMicMode,
  onResetGame,
  MicIconComponent,
}: {
  lang: string;
  open: boolean;
  onClose: () => void;
  playerCoins: number;
  isMuted: boolean;
  onToggleMute: () => void;
  isMicOn: boolean;
  hasMicPermission: boolean;
  onToggleMic: () => void;
  musicTrackName: string | null;
  isPlayingMusic: boolean;
  onOpenMusic: () => void;
  onOpenIntro: () => void;
  onOpenH2H: () => void;
  canAccessSettings: boolean;
  isHost: boolean;
  isRoomLocked: boolean;
  onToggleRoomLock: () => void;
  selectedBoardSkin: BoardTheme;
  onSelectTheme: (t: BoardTheme) => void;
  roomMicMode: 'approval' | 'all' | 'admins_only';
  onCycleMicMode: () => void;
  onResetGame: () => void;
  MicIconComponent: React.FC<{ muted?: boolean; className?: string }>;
}) {
  if (!open) return null;
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-slate-950 border-2 border-amber-500/50 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-slate-100 max-h-[88dvh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-sm font-black text-amber-300 flex items-center gap-1.5">
            <SettingsGearIcon className="w-4 h-4" />
            <span>{lang === 'ar' ? 'الإعدادات والتحكم السريع' : 'Settings & Quick Controls'}</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs font-black text-amber-300 flex items-center gap-1">
              <CoinGoldIcon className="w-3.5 h-3.5" />
              <span>{playerCoins}</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={onToggleMute}
              className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                isMuted ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              }`}
            >
              <SpeakerToggleIcon muted={isMuted} className="w-4 h-4" />
              <span>{isMuted ? (lang === 'ar' ? 'الصوت مكتوم' : 'Muted') : lang === 'ar' ? 'المؤثرات شغالة' : 'Sound On'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleMic}
              className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                !hasMicPermission
                  ? 'bg-slate-900 text-slate-400 border-slate-700'
                  : isMicOn
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : 'bg-rose-950/80 text-rose-300 border-rose-800'
              }`}
            >
              <MicIconComponent muted={!hasMicPermission || !isMicOn} className="w-4 h-4" />
              <span>
                {!hasMicPermission
                  ? (lang === 'ar' ? 'بدون مايك' : 'No Mic')
                  : isMicOn
                  ? (lang === 'ar' ? 'المايك نشط' : 'Mic Active')
                  : lang === 'ar'
                  ? 'المايك مكتوم'
                  : 'Mic Off'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMusic();
              }}
              className="p-2 rounded-xl border border-amber-500/35 bg-slate-900/80 hover:bg-slate-800 text-amber-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{isPlayingMusic ? '⏸️' : '🎵'}</span>
              <span className="truncate">{musicTrackName || (lang === 'ar' ? 'مشغل الأغاني' : 'Music')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenIntro();
              }}
              className="p-2 rounded-xl border border-amber-500/35 bg-slate-900/80 hover:bg-slate-800 text-amber-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🎬</span>
              <span>{lang === 'ar' ? 'الدخلة السينمائية' : 'Intro'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenH2H();
              }}
              className="col-span-2 p-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <TrophyCupIcon className="w-4 h-4 text-amber-300" />
              <span>{lang === 'ar' ? 'سجل المواجهات' : 'H2H Stats'}</span>
            </button>
          </div>

          {!canAccessSettings ? (
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
              <LockClosedIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'إعدادات الغرفة مقتصرة على صاحب الغرفة والمشرفين المعيّنين فقط.'
                  : 'Room settings are restricted to the Room Owner and appointed Admins.'}
              </span>
            </div>
          ) : (
            <>
              <div className="space-y-1 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300 font-bold block">{lang === 'ar' ? 'تصميم الرقعة (الثيم):' : 'Board Theme:'}</span>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {(['classic', 'space', 'underwater', 'ancient'] as BoardTheme[]).map((themeKey) => (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => onSelectTheme(themeKey)}
                      className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        selectedBoardSkin === themeKey
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800'
                      }`}
                    >
                      {BOARD_SKINS[themeKey].icon} {lang === 'ar' ? BOARD_SKINS[themeKey].nameAr : BOARD_SKINS[themeKey].nameEn}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <span className="text-slate-300 font-bold block">{lang === 'ar' ? 'نظام الصعود على المايك:' : 'Mic Entry Mode:'}</span>
                  <span className="text-[9px] text-slate-500">
                    {roomMicMode === 'approval'
                      ? (lang === 'ar' ? 'بطلب وموافقة المالك/المشرف' : 'Owner/Admin Approval')
                      : roomMicMode === 'all'
                      ? (lang === 'ar' ? 'مفتوح مباشرة للجميع' : 'Open for all')
                      : (lang === 'ar' ? 'للمشرفين فقط' : 'Admins only')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onCycleMicMode}
                  className="px-2.5 py-1 rounded-lg text-xs font-black transition-colors cursor-pointer bg-amber-950 text-amber-300 border border-amber-700"
                >
                  {roomMicMode === 'approval' ? '✋ بإذن' : roomMicMode === 'all' ? '🎙️ حر' : '👑 مشرفين'}
                </button>
              </div>

              {isHost && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div>
                    <span className="text-slate-300 font-bold block">{lang === 'ar' ? 'حالة الغرفة الدائمة:' : 'Room Access:'}</span>
                    <span className="text-[9px] text-slate-500">
                      {isRoomLocked ? (lang === 'ar' ? 'مقفلة مؤقتاً أمام الزوار' : 'Temporarily closed') : (lang === 'ar' ? 'مفتوحة لاستقبال الأعضاء' : 'Open to join')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleRoomLock}
                    className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer border ${
                      isRoomLocked ? 'bg-rose-950 text-rose-300 border-rose-700' : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    }`}
                  >
                    {isRoomLocked ? (lang === 'ar' ? '🔒 مقفلة (افتح)' : '🔒 Closed (Open)') : (lang === 'ar' ? '🔓 مفتوحة (اقفل)' : '🔓 Open (Close)')}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-300 font-bold">{lang === 'ar' ? 'بدء جولة جديدة:' : 'Reset Match:'}</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onResetGame();
                  }}
                  className="px-3 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-xs font-black cursor-pointer"
                >
                  🔄 إعادة
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function RoomQuestsModal({
  lang,
  open,
  onClose,
  roomTitle,
  roomHostName,
  roomXp,
  roomMatches,
  roomGiftsSent,
  roomChatsSent,
  claimedQuestIds,
  onClaimQuest,
}: {
  lang: string;
  open: boolean;
  onClose: () => void;
  roomTitle: string;
  roomHostName: string;
  roomXp: number;
  roomMatches: number;
  roomGiftsSent: number;
  roomChatsSent: number;
  claimedQuestIds: string[];
  onClaimQuest: (questId: string, rewardXp: number, rewardCoins: number) => void;
}) {
  if (!open) return null;
  const lvlInfo = calculateRoomLevel(roomXp);
  const pct = Math.min(100, Math.round((lvlInfo.currentXp / lvlInfo.nextXpRequired) * 100));

  const quests = [
    {
      id: 'q-matches-1',
      titleAr: 'أكمل مباراة داخل الغرفة',
      titleEn: 'Complete 1 match in room',
      progress: roomMatches,
      target: 1,
      rewardXp: 60,
      rewardCoins: 25,
    },
    {
      id: 'q-gifts-1',
      titleAr: 'أرسل 2 هدية سلام أو حرب بالداخل',
      titleEn: 'Send 2 Peace or War gifts',
      progress: roomGiftsSent,
      target: 2,
      rewardXp: 40,
      rewardCoins: 20,
    },
    {
      id: 'q-chat-3',
      titleAr: 'شارك بـ 3 رسائل في شات الغرفة',
      titleEn: 'Send 3 room chat messages',
      progress: roomChatsSent,
      target: 3,
      rewardXp: 30,
      rewardCoins: 15,
    },
  ];

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-950 border-2 border-amber-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 text-slate-100 max-h-[85dvh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
            <StarShieldIcon className="w-5 h-5" />
            <span>{lang === 'ar' ? 'مستوى الغرفة ومهامها' : 'Room Level & Quests'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black text-white">{roomTitle}</h4>
              <span className="text-[10px] text-slate-400">
                {lang === 'ar' ? `غرفة ${roomHostName} الدائمة` : `${roomHostName}'s Permanent Room`}
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black">
              ⭐ Lv.{lvlInfo.level}
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Room XP: {lvlInfo.currentXp} / {lvlInfo.nextXpRequired}</span>
            <span>{lang === 'ar' ? `مباريات: ${roomMatches}` : `Matches: ${roomMatches}`}</span>
          </div>
        </div>

        <div className="space-y-2">
          {quests.map((q) => {
            const done = q.progress >= q.target;
            const claimed = claimedQuestIds.includes(q.id);
            return (
              <div key={q.id} className="p-2.5 rounded-2xl bg-slate-900/75 border border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-black text-white">{lang === 'ar' ? q.titleAr : q.titleEn}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    +{q.rewardXp} Room XP • +{q.rewardCoins} 🪙 ({Math.min(q.progress, q.target)}/{q.target})
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!done || claimed}
                  onClick={() => onClaimQuest(q.id, q.rewardXp, q.rewardCoins)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 ${
                    claimed
                      ? 'bg-slate-800 text-slate-500'
                      : done
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow'
                      : 'bg-slate-950 text-slate-500 border border-slate-800'
                  }`}
                >
                  {claimed ? (lang === 'ar' ? 'تم ✓' : 'Claimed') : done ? (lang === 'ar' ? 'استلام' : 'Claim') : (lang === 'ar' ? 'جاري' : 'In Progress')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

