"use client";

import { useState } from "react";
import TodayView from "@/components/TodayView";
import LongTermSchedule from "@/components/LongTermSchedule";
import VitalRecords from "@/components/VitalRecords";
import AICounseling from "@/components/AICounseling";
import FamilyShare from "@/components/FamilyShare";

// ─── 共有型定義 ───────────────────────────────────────────
export interface Medication {
  id: number;
  name: string;
  dose: string;
  time: string;
  period: string;
  taken: boolean;
}

export interface TreatmentDates {
  retrieval?: string;  // 採卵日 YYYY-MM-DD
  transfer?: string;   // 移植日
  judgment?: string;   // 判定日
}

export interface VitalRecord {
  id: number;
  date: string;
  temp: number | null;
  bleeding: "none" | "trace" | "light" | "medium";
  bleedingColor: "none" | "pink" | "red" | "brown";
  note: string;
}

export interface HcgRecord {
  id: number;
  date: string;
  dpt: number;   // days post transfer
  value: number; // mIU/mL
}

export interface EmotionEntry {
  id: number;
  date: string;
  emotion: string;
  emoji: string;
}

// ─── タブ定義 ─────────────────────────────────────────────
type Tab = "today" | "schedule" | "vitals" | "consult" | "share";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "today",    label: "今日",   emoji: "💊" },
  { id: "schedule", label: "予定",   emoji: "📅" },
  { id: "vitals",   label: "記録",   emoji: "📊" },
  { id: "consult",  label: "相談",   emoji: "💬" },
  { id: "share",    label: "共有",   emoji: "❤️" },
];

const INITIAL_MEDICATIONS: Medication[] = [
  { id: 1, name: "エストラーナ錠 2mg",      dose: "1錠",    time: "08:00", period: "morning", taken: true  },
  { id: 2, name: "プレマリン錠 0.625mg",    dose: "2錠",    time: "08:00", period: "morning", taken: true  },
  { id: 3, name: "ルトラール錠 5mg",         dose: "1錠",    time: "20:00", period: "evening", taken: false },
  { id: 4, name: "フォリスチム注射 150単位", dose: "150単位", time: "21:00", period: "night",   taken: false },
];

// ─── メインコンポーネント ─────────────────────────────────
export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [medications, setMedications]       = useState<Medication[]>(INITIAL_MEDICATIONS);
  const [treatmentDates, setTreatmentDates] = useState<TreatmentDates>({});
  const [vitalRecords, setVitalRecords]     = useState<VitalRecord[]>([]);
  const [hcgRecords, setHcgRecords]         = useState<HcgRecord[]>([]);
  const [emotionEntries, setEmotionEntries] = useState<EmotionEntry[]>([]);

  const toggleMedication = (id: number) =>
    setMedications(prev => prev.map(m => m.id === id ? { ...m, taken: !m.taken } : m));

  const addMedication = (med: Omit<Medication, "id" | "taken">) =>
    setMedications(prev => [...prev, { ...med, id: Date.now(), taken: false }]);

  const addVitalRecord = (r: Omit<VitalRecord, "id">) =>
    setVitalRecords(prev => [
      ...prev.filter(x => x.date !== r.date),
      { ...r, id: Date.now() },
    ]);

  const addHcgRecord = (r: Omit<HcgRecord, "id">) =>
    setHcgRecords(prev => [...prev, { ...r, id: Date.now() }]);

  const addEmotion = (e: Omit<EmotionEntry, "id">) =>
    setEmotionEntries(prev => [...prev, { ...e, id: Date.now() }]);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 flex flex-col">

      {/* ヘッダー */}
      <header className="bg-white/70 backdrop-blur-md border-b border-rose-100 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-5 py-3 flex items-center gap-3">
          <span className="text-3xl leading-none">🌸</span>
          <div>
            <h1 className="text-base font-bold text-rose-700 leading-tight">Moira</h1>
            <p className="text-xs text-rose-400 leading-none">不妊治療サポート</p>
          </div>
          <p className="ml-auto text-xs text-stone-400">
            {new Date().toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" })}
          </p>
        </div>
      </header>

      {/* コンテンツ */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-5 pb-24 overflow-y-auto">
        {activeTab === "today" && (
          <TodayView
            medications={medications}
            onToggle={toggleMedication}
            onAddMedication={addMedication}
            emotionEntries={emotionEntries}
            onAddEmotion={addEmotion}
          />
        )}
        {activeTab === "schedule" && (
          <LongTermSchedule
            treatmentDates={treatmentDates}
            onUpdateDates={setTreatmentDates}
          />
        )}
        {activeTab === "vitals" && (
          <VitalRecords
            vitalRecords={vitalRecords}
            hcgRecords={hcgRecords}
            onAddVital={addVitalRecord}
            onAddHcg={addHcgRecord}
            treatmentDates={treatmentDates}
          />
        )}
        {activeTab === "consult" && (
          <AICounseling
            treatmentDates={treatmentDates}
            emotionEntries={emotionEntries}
            onAddEmotion={addEmotion}
          />
        )}
        {activeTab === "share" && (
          <FamilyShare
            medications={medications}
            vitalRecords={vitalRecords}
            emotionEntries={emotionEntries}
            treatmentDates={treatmentDates}
          />
        )}
      </main>

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-rose-100 z-20">
        <div className="max-w-md mx-auto flex">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-3 px-1 transition-all ${
                  active ? "text-rose-500" : "text-stone-400 hover:text-rose-300"
                }`}
              >
                <span className={`text-xl leading-none transition-transform ${active ? "scale-110" : ""}`}>
                  {tab.emoji}
                </span>
                <span className={`text-[10px] font-bold leading-none ${active ? "text-rose-500" : "text-stone-400"}`}>
                  {tab.label}
                </span>
                {active && <span className="w-1 h-1 bg-rose-400 rounded-full mt-0.5" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
