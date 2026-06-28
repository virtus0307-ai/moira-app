"use client";

import { useState } from "react";
import type { Medication, VitalRecord, EmotionEntry, TreatmentDates } from "@/app/page";

interface Props {
  medications: Medication[];
  vitalRecords: VitalRecord[];
  emotionEntries: EmotionEntry[];
  treatmentDates: TreatmentDates;
}

const MOODS = [
  { emoji: "😊", label: "元気" },
  { emoji: "😐", label: "普通" },
  { emoji: "😔", label: "疲れ気味" },
  { emoji: "😢", label: "つらい" },
] as const;

const CIRC = 2 * Math.PI * 30;

// ─── AI サポートアドバイス自動生成 ────────────────────────
function generateAdvice(
  medications: Medication[],
  vitalRecords: VitalRecord[],
  emotionEntries: EmotionEntry[],
  dates: TreatmentDates,
): { text: string; priority: "high" | "normal" }[] {
  const list: { text: string; priority: "high" | "normal" }[] = [];
  const today = new Date().toISOString().split("T")[0];
  const todayRec = vitalRecords.find(r => r.date === today);
  const recentEmotions = emotionEntries.slice(-7);
  const negCount = recentEmotions.filter(e =>
    ["どんより", "ソワソワ", "イライラ", "つらい"].includes(e.emotion)
  ).length;

  // 移植後の着床期アドバイス
  if (dates.transfer) {
    const t = new Date(dates.transfer);
    const dpt = Math.round((Date.now() - t.getTime()) / 86400000);
    if (dpt >= 0 && dpt <= 14) {
      list.push({ text: "🚫 移植後の大切な時期です。重い荷物・買い物袋は必ず代わって持ってあげてください。", priority: "high" });
      list.push({ text: "🌡️ お腹に直接カイロを当てることは避けてください。子宮への過度な熱は控えます。", priority: "high" });
      list.push({ text: "🏠 掃除・洗濯・料理など、家事はできるだけ引き受けてあげてください。", priority: "normal" });
      list.push({ text: "🤫 判定まで結果を急かさないようにしてください。プレッシャーにならない声かけを心がけて。", priority: "normal" });
    } else if (dpt > 14 && dpt <= 42) {
      list.push({ text: "🌸 妊娠初期は流産リスクが高い時期です。体を大切に過ごせるようサポートを。", priority: "high" });
      list.push({ text: "🤢 つわりで辛い場合があります。食べたいものを優先し、家事は無理をさせないで。", priority: "normal" });
    }
  }

  // 出血時のアドバイス
  if (todayRec?.bleeding && todayRec.bleeding !== "none") {
    list.push({
      text: `⚠️ 今日は少量の出血（${todayRec.bleeding === "trace" ? "微量" : "少量"}）があります。安静にできる環境を整えてあげてください。`,
      priority: "high",
    });
  }

  // 精神的なサポート
  if (negCount >= 3) {
    list.push({ text: "💕 最近つらそうな日が続いています。「頑張っているね」のひとことが、とても心の支えになります。", priority: "high" });
    list.push({ text: "🍽️ 好きな食べ物を一緒に食べる時間を作ると、とても気持ちが和らぎます。", priority: "normal" });
  } else if (negCount >= 1) {
    list.push({ text: "💬 気持ちが揺れやすい時期かもしれません。話を聞いてあげる時間を大切に。", priority: "normal" });
  }

  // 服薬サポート
  const untakenMeds = medications.filter(m => !m.taken);
  if (untakenMeds.length > 0) {
    list.push({
      text: `💊 まだ飲んでいないお薬があります（${untakenMeds.map(m => m.name.split(" ")[0]).join("・")}）。やさしく声をかけてあげてください。`,
      priority: "normal",
    });
  }

  // デフォルトアドバイス
  if (list.length < 2) {
    list.push({ text: "😴 十分な睡眠が取れているか、無理をしていないか気にかけてあげてください。", priority: "normal" });
    list.push({ text: "💬 治療の不安や気持ちを、いつでも話せる雰囲気を作り続けてください。それが一番の支えです。", priority: "normal" });
  }

  return list.slice(0, 5);
}

// ─── ステージテキスト取得 ────────────────────────────────
function getStageText(dates: TreatmentDates): string {
  if (!dates.transfer && !dates.retrieval) return "治療中";
  if (dates.transfer) {
    const dpt = Math.round((Date.now() - new Date(dates.transfer).getTime()) / 86400000);
    if (dpt < 0) return "移植前準備中";
    if (dpt <= 14) return `移植後${dpt}日目（着床期）`;
    if (dpt <= 42) return "妊娠初期";
    return "妊娠継続中";
  }
  return "採卵後・待機中";
}

// ─── メインコンポーネント ─────────────────────────────────
export default function FamilyShare({ medications, vitalRecords, emotionEntries, treatmentDates }: Props) {
  const [moodIdx,     setMoodIdx]     = useState(0);
  const [note,        setNote]        = useState("");
  const [shareState,  setShareState]  = useState<"idle" | "shared">("idle");

  const takenCount = medications.filter(m => m.taken).length;
  const total      = medications.length;
  const rate       = total > 0 ? Math.round((takenCount / total) * 100) : 0;
  const dashOffset = CIRC * (1 - rate / 100);

  const today     = new Date();
  const todayStr  = today.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "long" });
  const stageText = getStageText(treatmentDates);
  const advices   = generateAdvice(medications, vitalRecords, emotionEntries, treatmentDates);

  const handleShare = () => {
    setShareState("shared");
    setTimeout(() => setShareState("idle"), 3000);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-xl font-bold text-stone-700">家族への共有</h2>
        <p className="text-sm text-stone-500 mt-0.5">パートナーに状況と必要なサポートを伝えましょう</p>
      </div>

      {/* AI おすすめ サポートアドバイス */}
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl p-5 border border-rose-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 bg-rose-100 rounded-full flex items-center justify-center text-xl">🌸</div>
          <div>
            <p className="font-bold text-rose-700 text-sm">AI おすすめ サポートアドバイス</p>
            <p className="text-xs text-rose-400">現在の状況をもとに自動生成</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {advices.map((a, i) => (
            <div
              key={i}
              className={`flex gap-2 items-start rounded-2xl px-3 py-2.5 ${
                a.priority === "high"
                  ? "bg-rose-100/70 border border-rose-200"
                  : "bg-white/70"
              }`}
            >
              {a.priority === "high" && (
                <span className="text-xs bg-rose-400 text-white font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5">重要</span>
              )}
              <p className="text-sm text-stone-700 leading-relaxed">{a.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ダッシュボード */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100 space-y-4">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">今日のダッシュボード</p>

        <div className="flex items-center gap-5">
          {/* 達成率サークル */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="30" fill="none" stroke="#fce7f3" strokeWidth="7" />
              <circle
                cx="40" cy="40" r="30" fill="none" stroke="#f43f5e"
                strokeWidth="7"
                strokeDasharray={`${CIRC}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-base font-bold text-rose-500">{rate}%</span>
            </div>
          </div>

          <div className="flex-1">
            <p className="font-bold text-stone-700">服薬達成率</p>
            <p className="text-sm text-stone-500 mt-0.5">{takenCount} / {total} 服用済み</p>
            <div className="mt-2 bg-rose-50 rounded-lg px-2.5 py-1.5">
              <p className="text-xs text-rose-600 font-semibold">📍 {stageText}</p>
            </div>
          </div>
        </div>

        {medications.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-rose-50">
            <p className="text-xs text-stone-400 font-semibold">本日の服薬</p>
            {medications.map(med => (
              <div key={med.id} className="flex items-center gap-2 text-sm">
                <span>{med.taken ? "✅" : "⬜"}</span>
                <span className={med.taken ? "text-stone-400" : "text-stone-700 font-medium"}>{med.name}</span>
                <span className="text-stone-400 text-xs ml-auto">{med.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 気分セレクター */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100">
        <p className="text-xs font-bold text-stone-500 mb-3">今日の気分</p>
        <div className="flex gap-2">
          {MOODS.map((m, i) => (
            <button
              key={i}
              onClick={() => setMoodIdx(i)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all active:scale-95 ${
                moodIdx === i ? "border-rose-300 bg-rose-50 shadow-sm" : "border-stone-100 hover:border-rose-200"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className={`text-xs font-medium ${moodIdx === i ? "text-rose-600" : "text-stone-500"}`}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* パートナーへのメッセージ */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100">
        <p className="text-xs font-bold text-stone-500 mb-3">パートナーへのメッセージ（任意）</p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="今日の体調や気持ちをひとこと…"
          rows={3}
          className="w-full bg-rose-50/40 border border-rose-100 rounded-2xl px-4 py-3 text-sm text-stone-700 resize-none focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-50 placeholder:text-stone-400"
        />
      </div>

      {/* 共有ボタン */}
      <button
        onClick={handleShare}
        className={`w-full py-4 rounded-3xl font-bold text-base shadow-lg transition-all active:scale-[0.97] ${
          shareState === "shared"
            ? "bg-green-400 text-white shadow-green-200"
            : "bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-rose-200"
        }`}
      >
        {shareState === "shared"
          ? "✓ パートナーに共有しました！"
          : "❤️ パートナーに共有する（AI アドバイス付き）"}
      </button>

      {/* 共有プレビューカード */}
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl p-5 border border-rose-100">
        <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3">共有プレビュー</p>
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌸</span>
            <div>
              <p className="font-bold text-stone-700 text-sm">今日の状況</p>
              <p className="text-xs text-stone-400">{todayStr}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-stone-500">服薬達成率</span>
              <span className="font-bold text-rose-500">{rate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">今日の気分</span>
              <span>{MOODS[moodIdx].emoji} {MOODS[moodIdx].label}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">現在のステージ</span>
              <span className="text-xs font-bold text-rose-500">{stageText}</span>
            </div>
          </div>

          {note.trim() && (
            <div className="pt-2 border-t border-rose-50">
              <p className="text-xs text-stone-500 leading-relaxed">{note}</p>
            </div>
          )}

          <div className="pt-2 border-t border-rose-50">
            <p className="text-xs font-bold text-rose-600 mb-2">🌸 サポートのお願い</p>
            {advices.filter(a => a.priority === "high").slice(0, 2).map((a, i) => (
              <p key={i} className="text-xs text-stone-600 mb-1.5 leading-relaxed">{a.text}</p>
            ))}
            {advices.filter(a => a.priority === "normal").slice(0, 1).map((a, i) => (
              <p key={i} className="text-xs text-stone-500 leading-relaxed">{a.text}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
