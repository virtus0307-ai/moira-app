"use client";

import { useState } from "react";
import MedicationSchedule from "./MedicationSchedule";
import MedicationUpload from "./MedicationUpload";
import type { Medication, EmotionEntry } from "@/app/page";

interface Props {
  medications: Medication[];
  onToggle: (id: number) => void;
  onAddMedication: (med: Omit<Medication, "id" | "taken">) => void;
  emotionEntries: EmotionEntry[];
  onAddEmotion: (e: Omit<EmotionEntry, "id">) => void;
}

const QUICK_STAMPS = [
  { emoji: "😊", label: "ほっこり" },
  { emoji: "🌸", label: "穏やか"  },
  { emoji: "😔", label: "どんより" },
  { emoji: "😟", label: "ソワソワ" },
  { emoji: "😡", label: "イライラ" },
  { emoji: "💪", label: "頑張れた" },
] as const;

export default function TodayView({
  medications, onToggle, onAddMedication, emotionEntries, onAddEmotion,
}: Props) {
  const [showUpload, setShowUpload] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const todayEmotion = emotionEntries.filter(e => e.date === today).at(-1);

  const handleStamp = (stamp: typeof QUICK_STAMPS[number]) => {
    onAddEmotion({ date: today, emotion: stamp.label, emoji: stamp.emoji });
  };

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* 今日の気分クイック入力 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100">
        <p className="text-xs font-bold text-stone-500 mb-3">今日の気分は？</p>
        <div className="grid grid-cols-6 gap-1.5">
          {QUICK_STAMPS.map((stamp) => (
            <button
              key={stamp.label}
              onClick={() => handleStamp(stamp)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all active:scale-90 ${
                todayEmotion?.emotion === stamp.label
                  ? "bg-rose-100 ring-2 ring-rose-300"
                  : "hover:bg-rose-50"
              }`}
            >
              <span className="text-2xl">{stamp.emoji}</span>
              <span className="text-[9px] text-stone-500 leading-none">{stamp.label}</span>
            </button>
          ))}
        </div>
        {todayEmotion && (
          <p className="text-xs text-rose-500 mt-3 text-center font-medium">
            「{todayEmotion.emotion}」を記録しました。今日もお疲れさまです 🌸
          </p>
        )}
      </div>

      {/* お薬追加ボタン */}
      {!showUpload ? (
        <button
          onClick={() => setShowUpload(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-rose-200 text-rose-400 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors active:scale-[0.98]"
        >
          📷 お薬を追加する
        </button>
      ) : (
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-rose-100">
          <div className="flex justify-between items-center mb-3">
            <p className="font-bold text-stone-700 text-sm">お薬を追加</p>
            <button
              onClick={() => setShowUpload(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 text-lg leading-none hover:bg-stone-200 transition-colors"
            >
              ×
            </button>
          </div>
          <MedicationUpload
            onAddMedication={(med) => {
              onAddMedication(med);
              setShowUpload(false);
            }}
          />
        </div>
      )}

      {/* 服薬スケジュール */}
      <MedicationSchedule medications={medications} onToggle={onToggle} />
    </div>
  );
}
