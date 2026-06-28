"use client";

import { useState } from "react";
import type { TreatmentDates } from "@/app/page";

interface Props {
  treatmentDates: TreatmentDates;
  onUpdateDates: (d: TreatmentDates) => void;
}

interface Milestone {
  label: string;
  emoji: string;
  date: Date;
  description: string;
  alert?: string;
}

// ─── ユーティリティ ───────────────────────────────────────
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function diffDays(target: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - today.getTime()) / 86400000);
}

function fmtFull(d: Date) {
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

// ─── マイルストーン計算 ───────────────────────────────────
function calcMilestones(dates: TreatmentDates): Milestone[] {
  const list: Milestone[] = [];

  if (dates.retrieval) {
    list.push({
      label: "採卵",
      emoji: "🥚",
      date: new Date(dates.retrieval),
      description: "卵子の採取を行いました",
    });
  }

  if (dates.transfer) {
    list.push({
      label: "胚移植",
      emoji: "🌱",
      date: new Date(dates.transfer),
      description: "培養した胚を子宮に戻します",
    });
  }

  if (dates.judgment) {
    list.push({
      label: "妊娠判定",
      emoji: "🔬",
      date: new Date(dates.judgment),
      description: "血液検査（hCG値）で妊娠を確認します",
    });
  }

  // 移植日を基点に計算（なければ採卵日）
  const base = dates.transfer
    ? new Date(dates.transfer)
    : dates.retrieval
    ? new Date(dates.retrieval)
    : null;

  if (!base) return list.sort((a, b) => a.date.getTime() - b.date.getTime());

  // 凍結胚盤胞（D5）移植を想定
  const dueDate = addDays(base, 261); // LMP換算280日 − D5の5日 − 14日

  list.push({
    label: "胎嚢確認",
    emoji: "🫧",
    date: addDays(base, 21),
    description: "超音波で赤ちゃんの袋（胎嚢）を確認する目安の時期です",
  });
  list.push({
    label: "心拍確認",
    emoji: "💓",
    date: addDays(base, 28),
    description: "赤ちゃんの心臓の動きを確認する大切な時期です",
  });
  list.push({
    label: "出産予定日",
    emoji: "👶",
    date: dueDate,
    description: "待望の赤ちゃんとの初対面の目安です",
  });

  const matStart = addDays(dueDate, -42); // 産前6週
  list.push({
    label: "産前休業（産休）開始目安",
    emoji: "🏥",
    date: matStart,
    description: "出産予定日の6週前から産前休業を取得できます",
  });

  const hospitalDeadline = addDays(dueDate, -180); // 出産予定日の6ヶ月前
  const dToDeadline = diffDays(hospitalDeadline);
  list.push({
    label: "産院予約の締め切り目安",
    emoji: "🏨",
    date: hospitalDeadline,
    description: "人気の産院は妊娠初期中の予約が必要です。お早めに！",
    alert:
      dToDeadline >= 0 && dToDeadline <= 30
        ? `⚠️ あと${dToDeadline}日！産院の予約を急いでください`
        : dToDeadline < 0
        ? "⚠️ 産院予約の目安時期が過ぎています。早急にご確認を！"
        : undefined,
  });

  return list.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ─── コンポーネント ───────────────────────────────────────
export default function LongTermSchedule({ treatmentDates, onUpdateDates }: Props) {
  const hasAnyDate = !!(treatmentDates.transfer || treatmentDates.retrieval);
  const [editMode, setEditMode] = useState(!hasAnyDate);
  const [draft, setDraft] = useState<TreatmentDates>(treatmentDates);

  const milestones = calcMilestones(treatmentDates);

  const handleSave = () => {
    onUpdateDates(draft);
    setEditMode(false);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-xl font-bold text-stone-700">長期スケジュール</h2>
        <p className="text-sm text-stone-500 mt-0.5">治療の流れと今後の見通しを確認できます</p>
      </div>

      {/* 日程入力フォーム */}
      {editMode ? (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100 space-y-4">
          <p className="font-bold text-stone-700 text-sm">治療日程を入力してください</p>

          {([
            { key: "retrieval" as const, label: "採卵日",        emoji: "🥚", optional: true  },
            { key: "transfer"  as const, label: "移植日（予定）", emoji: "🌱", optional: false },
            { key: "judgment"  as const, label: "判定日（予定）", emoji: "🔬", optional: true  },
          ] as const).map(({ key, label, emoji, optional }) => (
            <div key={key}>
              <label className="block text-xs text-stone-500 mb-1.5">
                {emoji} {label}
                {optional && <span className="text-stone-300 ml-1">（任意）</span>}
              </label>
              <input
                type="date"
                value={draft[key] ?? ""}
                onChange={e =>
                  setDraft(d => ({ ...d, [key]: e.target.value || undefined }))
                }
                className="w-full bg-rose-50/50 border border-rose-200 rounded-xl px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={!draft.transfer && !draft.retrieval}
            className="w-full py-3.5 rounded-2xl bg-rose-400 text-white font-bold shadow-md shadow-rose-200 disabled:opacity-40 active:scale-[0.97] transition-transform"
          >
            スケジュールを表示する
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditMode(true)}
          className="w-full py-3 rounded-2xl border border-rose-200 text-rose-500 text-sm font-semibold hover:bg-rose-50 transition-colors"
        >
          ✏️ 日程を変更する
        </button>
      )}

      {/* タイムライン */}
      {milestones.length > 0 && (
        <div className="space-y-0">
          {milestones.map((m, i) => {
            const diff   = diffDays(m.date);
            const isPast = diff < 0;
            const isNow  = diff === 0;
            const isNear = diff > 0 && diff <= 14;

            return (
              <div key={i} className="flex gap-3">
                {/* ドット＋縦線 */}
                <div className="flex flex-col items-center w-10 flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                      isPast
                        ? "bg-stone-100 opacity-50"
                        : isNow
                        ? "bg-rose-400 shadow-lg shadow-rose-200"
                        : isNear
                        ? "bg-pink-100 border-2 border-rose-300"
                        : m.alert
                        ? "bg-amber-100 border-2 border-amber-300"
                        : "bg-rose-50 border border-rose-200"
                    }`}
                  >
                    {m.emoji}
                  </div>
                  {i < milestones.length - 1 && (
                    <div
                      className={`w-0.5 flex-1 min-h-5 my-1 ${isPast ? "bg-stone-200" : "bg-rose-100"}`}
                    />
                  )}
                </div>

                {/* カード */}
                <div className="flex-1 pb-3">
                  <div
                    className={`rounded-2xl p-3.5 ${
                      isPast
                        ? "bg-white/60 border border-stone-100 opacity-60"
                        : isNow
                        ? "bg-rose-400 text-white shadow-md shadow-rose-200"
                        : m.alert
                        ? "bg-amber-50 border border-amber-200 shadow-sm"
                        : "bg-white border border-rose-100 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${isNow ? "text-white" : isPast ? "text-stone-400" : m.alert ? "text-amber-800" : "text-stone-700"}`}>
                          {m.label}
                        </p>
                        <p className={`text-xs mt-0.5 ${isNow ? "text-rose-100" : "text-stone-400"}`}>
                          {fmtFull(m.date)}
                        </p>
                        <p className={`text-xs mt-1.5 leading-relaxed ${isNow ? "text-rose-100" : "text-stone-500"}`}>
                          {m.description}
                        </p>
                        {m.alert && (
                          <p className="text-xs mt-2 text-amber-700 font-bold">{m.alert}</p>
                        )}
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${
                          isPast
                            ? "bg-stone-100 text-stone-400"
                            : isNow
                            ? "bg-white/20 text-white"
                            : m.alert && diff <= 30
                            ? "bg-amber-200 text-amber-700"
                            : "bg-rose-50 text-rose-500"
                        }`}
                      >
                        {isPast
                          ? `${Math.abs(diff)}日前`
                          : isNow
                          ? "今日"
                          : `${diff}日後`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 未入力時の案内 */}
      {milestones.length === 0 && !editMode && (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-rose-100">
          <span className="text-5xl block mb-3">📅</span>
          <p className="text-stone-600 font-medium">日程を入力してください</p>
          <p className="text-sm text-stone-400 mt-1">
            移植日などを入力すると<br />スケジュールが自動で計算されます
          </p>
        </div>
      )}
    </div>
  );
}
