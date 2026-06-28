"use client";

import { useState } from "react";
import type { VitalRecord, HcgRecord, TreatmentDates } from "@/app/page";

interface Props {
  vitalRecords: VitalRecord[];
  hcgRecords: HcgRecord[];
  onAddVital: (r: Omit<VitalRecord, "id">) => void;
  onAddHcg: (r: Omit<HcgRecord, "id">) => void;
  treatmentDates: TreatmentDates;
}

type SubTab = "temp" | "hcg";

// ─── hCG 着床率推定 ───────────────────────────────────────
// 文献値を参考にした目安（医療診断ではない）
function predictRate(dpt: number, value: number): number {
  // 14dpt 相当値に正規化して評価
  const norm = value * (14 / Math.max(dpt, 1));
  if (norm >= 400) return 93;
  if (norm >= 200) return 85;
  if (norm >= 100) return 74;
  if (norm >= 50)  return 58;
  if (norm >= 20)  return 37;
  return 14;
}

// ─── 体温グラフ（SVG）────────────────────────────────────
function TempGraph({ records }: { records: VitalRecord[] }) {
  const pts = records.filter(r => r.temp !== null).slice(-14);

  if (pts.length < 2) {
    return (
      <div className="text-center py-8 text-stone-400 text-sm">
        2日分以上記録するとグラフが表示されます 📈
      </div>
    );
  }

  const temps  = pts.map(r => r.temp as number);
  const minT   = Math.min(...temps) - 0.15;
  const maxT   = Math.max(...temps) + 0.15;
  const range  = maxT - minT || 0.3;

  const W = 300, H = 120;
  const P = { top: 8, right: 8, bottom: 28, left: 38 };
  const iW = W - P.left - P.right;
  const iH = H - P.top - P.bottom;

  const x = (i: number) => P.left + (i / (pts.length - 1)) * iW;
  const y = (t: number) => P.top + iH - ((t - minT) / range) * iH;

  const line  = pts.map((r, i) => `${x(i)},${y(r.temp as number)}`).join(" L ");
  const area  = `M ${x(0)},${P.top + iH} L ${pts.map((r, i) => `${x(i)},${y(r.temp as number)}`).join(" L ")} L ${x(pts.length - 1)},${P.top + iH} Z`;

  // Y軸目盛り（min, mid, max）
  const yTicks = [minT, (minT + maxT) / 2, maxT].map(t => ({ y: y(t), label: t.toFixed(1) }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
      </defs>

      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={P.left} y1={t.y} x2={W - P.right} y2={t.y} stroke="#fce7f3" strokeWidth="1" strokeDasharray="3,3" />
          <text x={P.left - 4} y={t.y + 3.5} textAnchor="end" fontSize="8.5" fill="#a8a29e">{t.label}</text>
        </g>
      ))}

      <path d={area} fill="url(#tg)" />
      <path d={`M ${line}`} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {pts.map((r, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(r.temp as number)} r="4.5" fill="white" stroke="#f43f5e" strokeWidth="2" />
          <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="8" fill="#a8a29e">
            {new Date(r.date).getDate()}日
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── メインコンポーネント ─────────────────────────────────
export default function VitalRecords({
  vitalRecords, hcgRecords, onAddVital, onAddHcg, treatmentDates,
}: Props) {
  const [subTab, setSubTab] = useState<SubTab>("temp");

  const today = new Date().toISOString().split("T")[0];
  const todayRec = vitalRecords.find(r => r.date === today);

  const [tempStr,       setTempStr]       = useState(todayRec?.temp?.toFixed(2) ?? "");
  const [bleeding,      setBleeding]      = useState<VitalRecord["bleeding"]>(todayRec?.bleeding ?? "none");
  const [bleedingColor, setBleedingColor] = useState<VitalRecord["bleedingColor"]>(todayRec?.bleedingColor ?? "none");
  const [vNote,         setVNote]         = useState(todayRec?.note ?? "");
  const [saved,         setSaved]         = useState(false);

  const [hDate,         setHDate]         = useState(today);
  const [hDpt,          setHDpt]          = useState("");
  const [hVal,          setHVal]          = useState("");
  const [prediction,    setPrediction]    = useState<number | null>(null);

  const handleSaveVital = () => {
    onAddVital({
      date: today,
      temp: tempStr ? parseFloat(tempStr) : null,
      bleeding,
      bleedingColor: bleeding === "none" ? "none" : bleedingColor,
      note: vNote,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleHcg = () => {
    const dpt = parseInt(hDpt);
    const val = parseFloat(hVal);
    if (isNaN(dpt) || isNaN(val)) return;
    onAddHcg({ date: hDate, dpt, value: val });
    setPrediction(predictRate(dpt, val));
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-xl font-bold text-stone-700">体調記録</h2>
        <p className="text-sm text-stone-500 mt-0.5">日々の体調をていねいに記録しましょう</p>
      </div>

      {/* サブタブ */}
      <div className="bg-rose-50/80 rounded-2xl p-1 flex gap-1">
        {(["temp", "hcg"] as SubTab[]).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              subTab === t ? "bg-white text-rose-600 shadow-sm" : "text-stone-400"
            }`}
          >
            {t === "temp" ? "🌡️ 体温・出血" : "🔬 hCG・着床率"}
          </button>
        ))}
      </div>

      {/* ─── 体温・出血タブ ─── */}
      {subTab === "temp" && (
        <>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100 space-y-4">
            <p className="text-xs font-bold text-stone-500">
              今日の記録（{new Date().toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}）
            </p>

            {/* 基礎体温 */}
            <div>
              <label className="block text-xs text-stone-500 mb-1.5">🌡️ 基礎体温（℃）</label>
              <input
                type="number"
                step="0.01" min="35.0" max="40.0"
                value={tempStr}
                onChange={e => setTempStr(e.target.value)}
                placeholder="36.70"
                className="w-full bg-rose-50/40 border border-rose-200 rounded-xl px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            {/* 不正出血 */}
            <div>
              <label className="block text-xs text-stone-500 mb-1.5">💧 不正出血の有無</label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { v: "none",   l: "なし" },
                  { v: "trace",  l: "微量" },
                  { v: "light",  l: "少量" },
                  { v: "medium", l: "中量" },
                ] as const).map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => setBleeding(opt.v)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                      bleeding === opt.v
                        ? "bg-rose-400 text-white border-rose-400 shadow-sm"
                        : "border-rose-100 text-stone-500 hover:border-rose-300"
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>

              {bleeding !== "none" && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <p className="col-span-3 text-xs text-stone-400 mb-1">出血の色</p>
                  {([
                    { v: "pink",  l: "ピンク" },
                    { v: "red",   l: "赤" },
                    { v: "brown", l: "茶褐色" },
                  ] as const).map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setBleedingColor(opt.v)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        bleedingColor === opt.v
                          ? "bg-rose-100 text-rose-600 border-rose-300"
                          : "border-rose-100 text-stone-500 hover:border-rose-200"
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* メモ */}
            <div>
              <label className="block text-xs text-stone-500 mb-1.5">📝 メモ（任意）</label>
              <input
                type="text"
                value={vNote}
                onChange={e => setVNote(e.target.value)}
                placeholder="今日の体調をひとこと..."
                className="w-full bg-rose-50/40 border border-rose-200 rounded-xl px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-rose-400"
              />
            </div>

            <button
              onClick={handleSaveVital}
              className={`w-full py-3.5 rounded-2xl font-bold shadow-md active:scale-[0.97] transition-all ${
                saved
                  ? "bg-green-400 text-white shadow-green-200"
                  : "bg-rose-400 text-white shadow-rose-200"
              }`}
            >
              {saved ? "✓ 保存しました！" : "今日の記録を保存"}
            </button>
          </div>

          {/* 体温グラフ */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100">
            <p className="text-xs font-bold text-stone-500 mb-4">📈 基礎体温グラフ（直近14日）</p>
            <TempGraph records={vitalRecords} />
          </div>

          {/* 記録一覧 */}
          {vitalRecords.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100">
              <p className="text-xs font-bold text-stone-500 mb-3">直近の記録</p>
              <div className="space-y-2">
                {[...vitalRecords].reverse().slice(0, 7).map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-2 border-b border-rose-50 last:border-0">
                    <span className="text-stone-400 text-xs w-14">
                      {new Date(r.date).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                    </span>
                    <span className="font-semibold text-stone-700 w-16">
                      {r.temp != null ? `${r.temp}℃` : "—"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.bleeding === "none"
                        ? "bg-stone-100 text-stone-400"
                        : "bg-rose-100 text-rose-600"
                    }`}>
                      {r.bleeding === "none" ? "出血なし" : `出血 ${r.bleeding}`}
                    </span>
                    {r.note && <span className="text-stone-400 text-xs truncate flex-1">{r.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── hCG・着床率タブ ─── */}
      {subTab === "hcg" && (
        <>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100 space-y-4">
            <div>
              <p className="font-bold text-stone-700 text-sm">βhCG値で着床率を予測</p>
              <p className="text-xs text-stone-400 mt-0.5">
                ※ 統計的なシミュレーションです。医療診断ではありません。
              </p>
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1.5">検査日</label>
              <input
                type="date"
                value={hDate}
                onChange={e => setHDate(e.target.value)}
                className="w-full bg-rose-50/40 border border-rose-200 rounded-xl px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1.5">移植後日数（ET○日目）</label>
              <input
                type="number" min="7" max="21"
                value={hDpt}
                onChange={e => setHDpt(e.target.value)}
                placeholder="例: 14"
                className="w-full bg-rose-50/40 border border-rose-200 rounded-xl px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1.5">βhCG値（mIU/mL）</label>
              <input
                type="number" min="0"
                value={hVal}
                onChange={e => setHVal(e.target.value)}
                placeholder="例: 250"
                className="w-full bg-rose-50/40 border border-rose-200 rounded-xl px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-rose-400"
              />
            </div>

            <button
              onClick={handleHcg}
              disabled={!hDpt || !hVal}
              className="w-full py-3.5 rounded-2xl bg-rose-400 text-white font-bold shadow-md shadow-rose-200 disabled:opacity-40 active:scale-[0.97] transition-transform"
            >
              着床率をシミュレーションする
            </button>
          </div>

          {/* 予測結果 */}
          {prediction !== null && (
            <div className="bg-gradient-to-br from-rose-400 to-pink-500 rounded-3xl p-6 text-white shadow-lg shadow-rose-200 animate-fade-in-up">
              <p className="text-rose-100 text-sm mb-1">妊娠継続率シミュレーション</p>
              <p className="text-6xl font-bold mb-3">{prediction}<span className="text-3xl font-normal">%</span></p>
              <div className="bg-white/20 rounded-full h-3 mb-4">
                <div
                  className="bg-white rounded-full h-3 transition-all duration-1000"
                  style={{ width: `${prediction}%` }}
                />
              </div>
              <p className="text-xs text-rose-100 leading-relaxed">
                入力された hCG 値と移植後日数をもとにした統計的な目安です。
                個人差が大きいため、詳細は必ず担当医にご確認ください。
              </p>
            </div>
          )}

          {/* hCG 記録一覧 */}
          {hcgRecords.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100">
              <p className="text-xs font-bold text-stone-500 mb-3">hCG 記録</p>
              <div className="space-y-2">
                {[...hcgRecords].reverse().map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-2 border-b border-rose-50 last:border-0">
                    <span className="text-stone-400 text-xs w-14">
                      {new Date(r.date).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                    </span>
                    <span className="text-xs text-stone-500">ET{r.dpt}日目</span>
                    <span className="font-bold text-rose-600">{r.value} mIU/mL</span>
                    <span className="text-xs text-stone-400 ml-auto">推定 {predictRate(r.dpt, r.value)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
