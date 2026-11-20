'use client';
import { playerStyleScenes } from "../cinematics/playerStyleScenes";
import type { CaptureEffect, PlayerStyle } from "../game/types";

const effectLabels: Record<CaptureEffect, string> = {
  freeze: "تجميد وتحطيم",
  teleport: "انتقال آني",
  polymorph: "تحول",
  lightning: "صاعقة برق",
  smash: "سحق بدني",
  slice: "قطع بالسيف",
  uppercut: "إطاحة علوية",
  execution: "إعدام سينمائي",
  sniper: "قنص سهمي",
  artillery: "قذيفة نارية",
  "arrow-rain": "مطر سهام",
  phantom: "اختراق شبحي",
  "earth-claws": "مخالب الأرض",
  beast: "انقضاض الوحش",
  minions: "انفجار التوابع",
  backstab: "طعن من الخلف",
  toxic: "ذوبان سام",
  shadow: "خنق ظلي",
  decay: "تحلل الزمن",
  rewind: "محو عكسي",
  "command-strike": "ضربة قيادة",
  "royal-guard": "حرس ملكي",
  "formation-break": "كسر التشكيل"
};

const playerLabels: Record<PlayerStyle, string> = {
  magic: "الساحر",
  melee: "المقاتل",
  range: "الرنجر",
  summoner: "المستدعي",
  assassin: "المغتال",
  chrono: "حاكم الوقت",
  general: "الجنرال"
};

const playerNotes: Record<PlayerStyle, string> = {
  magic: "بوابات، تجميد، صواعق",
  melee: "ضربات قريبة واهتزاز",
  range: "أسهم ومقذوفات بعيدة",
  summoner: "استدعاء كائنات ومخالب",
  assassin: "ظل، دخان، سموم",
  chrono: "تسريع وإرجاع الزمن",
  general: "قيادة، تكتيك، هيبة"
};

export const captureEffectsByStyle = Object.fromEntries(
  Object.values(playerStyleScenes).map((scene) => [
    scene.style,
    scene.effects.map((id) => ({ id, label: effectLabels[id] }))
  ])
) as Record<PlayerStyle, Array<{ id: CaptureEffect; label: string }>>;

export const playerStyles: Array<{ id: PlayerStyle; label: string; note: string }> = Object.values(playerStyleScenes).map(
  (scene) => ({
    id: scene.style,
    label: playerLabels[scene.style],
    note: playerNotes[scene.style]
  })
);

