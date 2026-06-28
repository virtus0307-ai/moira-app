"use client";

interface Medication {
  id: number;
  name: string;
  dose: string;
  time: string;
  period: string;
  taken: boolean;
}

interface Props {
  medications: Medication[];
  onToggle: (id: number) => void;
}

const PERIOD_META: Record<string, { label: string; emoji: string; textColor: string; bgColor: string }> = {
  morning: { label: "朝",   emoji: "🌅", textColor: "text-amber-600",  bgColor: "bg-amber-50" },
  noon:    { label: "昼",   emoji: "☀️", textColor: "text-orange-600", bgColor: "bg-orange-50" },
  evening: { label: "夕",   emoji: "🌇", textColor: "text-rose-600",   bgColor: "bg-rose-50" },
  night:   { label: "夜",   emoji: "🌙", textColor: "text-indigo-600", bgColor: "bg-indigo-50" },
};

const ORDER = ["morning", "noon", "evening", "night"];

export default function MedicationSchedule({ medications, onToggle }: Props) {
  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const takenCount = medications.filter((m) => m.taken).length;
  const total = medications.length;
  const rate = total > 0 ? Math.round((takenCount / total) * 100) : 0;

  const nextMed = medications.find((m) => !m.taken && m.time >= nowStr);

  const grouped = ORDER.reduce<Record<string, Medication[]>>((acc, period) => {
    const list = medications.filter((m) => m.period === period);
    if (list.length) acc[period] = list;
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* 達成率カード */}
      <div className="bg-gradient-to-br from-rose-400 to-pink-500 rounded-3xl p-5 text-white shadow-lg shadow-rose-200">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-rose-100 text-sm">今日の服薬達成率</p>
            <p className="text-5xl font-bold mt-0.5">{rate}%</p>
          </div>
          <div className="text-right pb-1">
            <p className="text-rose-100 text-xs mb-1">服用済み</p>
            <p className="text-2xl font-bold">
              {takenCount}
              <span className="text-rose-200 text-lg font-normal"> / {total}</span>
            </p>
          </div>
        </div>
        <div className="bg-white/20 rounded-full h-2.5">
          <div
            className="bg-white rounded-full h-2.5 transition-all duration-700"
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>

      {/* 次のリマインダー */}
      {nextMed && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-3xl">⏰</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-600 font-bold mb-0.5">次のリマインダー</p>
            <p className="font-semibold text-stone-700 truncate">
              {nextMed.time} — {nextMed.name}
            </p>
            <p className="text-xs text-stone-500">{nextMed.dose}</p>
          </div>
          <span className="text-xs bg-amber-200 text-amber-700 px-2.5 py-1 rounded-full font-bold flex-shrink-0">
            もうすぐ
          </span>
        </div>
      )}

      {/* 薬リスト */}
      {Object.entries(grouped).map(([period, meds]) => {
        const meta = PERIOD_META[period] ?? {
          label: period,
          emoji: "💊",
          textColor: "text-stone-600",
          bgColor: "bg-stone-50",
        };
        return (
          <section key={period}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-xl">{meta.emoji}</span>
              <h3 className={`font-bold text-base ${meta.textColor}`}>{meta.label}</h3>
              <span className="text-stone-400 text-sm">{meds[0].time}</span>
            </div>

            <div className="space-y-2.5">
              {meds.map((med) => (
                <div
                  key={med.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                    med.taken ? "border-green-100 opacity-70" : "border-rose-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggle(med.id)}
                      aria-label={med.taken ? "服用済みを取り消す" : "投薬完了にする"}
                      className={`w-10 h-10 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all active:scale-90 ${
                        med.taken
                          ? "bg-green-400 border-green-400 text-white text-lg"
                          : "border-rose-300 hover:border-rose-400 hover:bg-rose-50"
                      }`}
                    >
                      {med.taken ? "✓" : ""}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold truncate ${
                          med.taken ? "line-through text-stone-400" : "text-stone-700"
                        }`}
                      >
                        {med.name}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">{med.dose}</p>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${
                        med.taken
                          ? "bg-green-100 text-green-600"
                          : "bg-rose-50 text-rose-500 border border-rose-100"
                      }`}
                    >
                      {med.taken ? "服用済み" : "未服用"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {medications.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-rose-100">
          <span className="text-5xl block mb-3">💊</span>
          <p className="text-stone-500 font-medium">お薬が登録されていません</p>
          <p className="text-sm text-stone-400 mt-1">「お薬登録」タブから追加できます</p>
        </div>
      )}
    </div>
  );
}
