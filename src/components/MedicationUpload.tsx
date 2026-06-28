"use client";

import { useState, useRef } from "react";

interface MedicationData {
  name: string;
  dose: string;
  time: string;
  period: string;
}

interface Props {
  onAddMedication: (med: MedicationData) => void;
}

const MOCK_RESULT = {
  name: "エストラーナ錠 2mg",
  dose: "1錠",
  time: "08:00",
  period: "morning",
  frequency: "毎朝 1回",
  duration: "14日間",
  notes: "食後に服用してください",
};

type State = "idle" | "analyzing" | "result" | "added";

export default function MedicationUpload({ onAddMedication }: Props) {
  const [state, setState] = useState<State>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
    setState("analyzing");
    setTimeout(() => setState("result"), 2500);
  };

  const handleAdd = () => {
    onAddMedication({
      name: MOCK_RESULT.name,
      dose: MOCK_RESULT.dose,
      time: MOCK_RESULT.time,
      period: MOCK_RESULT.period,
    });
    setState("added");
  };

  const handleReset = () => {
    setState("idle");
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-xl font-bold text-stone-700">お薬を登録する</h2>
        <p className="text-sm text-stone-500 mt-1">
          写真を撮るだけで AIがスケジュールを自動設定します
        </p>
      </div>

      {state === "idle" && (
        <div className="space-y-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gradient-to-br from-rose-400 to-pink-500 text-white rounded-3xl py-10 flex flex-col items-center gap-3 shadow-lg shadow-rose-200 active:scale-[0.97] transition-transform"
          >
            <span className="text-6xl">📸</span>
            <span className="font-bold text-xl">写真を撮る / アップロード</span>
            <span className="text-rose-100 text-sm">タップして薬の写真を選択</span>
          </button>

          <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
            <p className="font-semibold text-rose-600 text-sm mb-2">📌 使い方</p>
            <ul className="text-sm text-stone-600 space-y-1.5">
              <li>• 薬の袋・箱・説明書の写真を選択</li>
              <li>• AI が薬名・用量・タイミングを自動解析</li>
              <li>• 内容を確認してスケジュールに追加</li>
            </ul>
          </div>
        </div>
      )}

      {state === "analyzing" && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-rose-100 text-center space-y-5">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="薬の写真"
              className="w-full h-44 object-cover rounded-2xl"
            />
          )}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 border-4 border-rose-100 border-t-rose-400 rounded-full animate-spin" />
            <p className="font-semibold text-stone-700">AI が解析中...</p>
            <p className="text-sm text-stone-400">薬の情報を読み取っています</p>
          </div>
        </div>
      )}

      {state === "result" && (
        <div className="space-y-4 animate-fade-in-up">
          {imageUrl && (
            <div className="rounded-3xl overflow-hidden shadow-sm border border-rose-100">
              <img
                src={imageUrl}
                alt="薬の写真"
                className="w-full h-40 object-cover"
              />
            </div>
          )}

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs font-bold">
                ✓
              </span>
              <h3 className="font-bold text-stone-700">解析完了</h3>
              <span className="ml-auto text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full border border-green-100">
                AI 解析
              </span>
            </div>

            {[
              ["薬の名前", MOCK_RESULT.name],
              ["服用量", MOCK_RESULT.dose],
              ["タイミング", MOCK_RESULT.frequency],
              ["服用期間", MOCK_RESULT.duration],
              ["注意事項", MOCK_RESULT.notes],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between items-center py-2.5 border-b border-rose-50 last:border-0"
              >
                <span className="text-sm text-stone-400">{label}</span>
                <span className="font-semibold text-stone-700 text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-3.5 rounded-2xl border border-rose-200 text-rose-500 font-semibold active:scale-[0.97] transition-transform"
            >
              やり直す
            </button>
            <button
              onClick={handleAdd}
              className="flex-[2] py-3.5 rounded-2xl bg-rose-400 text-white font-semibold shadow-md shadow-rose-200 active:scale-[0.97] transition-transform"
            >
              スケジュールに追加
            </button>
          </div>
        </div>
      )}

      {state === "added" && (
        <div className="bg-white rounded-3xl p-10 shadow-sm border border-rose-100 text-center space-y-5 animate-fade-in-up">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-4xl">
            ✅
          </div>
          <div>
            <p className="font-bold text-stone-700 text-lg">追加しました！</p>
            <p className="text-sm text-stone-500 mt-1">
              {MOCK_RESULT.name} のリマインダーが設定されました
            </p>
          </div>
          <button
            onClick={handleReset}
            className="w-full py-3.5 rounded-2xl bg-rose-400 text-white font-semibold shadow-md shadow-rose-200 active:scale-[0.97] transition-transform"
          >
            別のお薬を追加する
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
