"use client";

import { useState, useRef, useEffect } from "react";
import type { TreatmentDates, EmotionEntry } from "@/app/page";

interface Props {
  treatmentDates: TreatmentDates;
  emotionEntries: EmotionEntry[];
  onAddEmotion: (e: Omit<EmotionEntry, "id">) => void;
}

type SubTab = "emotion" | "advice" | "drug" | "chat";

interface ChatMessage {
  id: number;
  role: "user" | "ai";
  text: string;
}

// ─── 感情スタンプ定義 ─────────────────────────────────────
const STAMPS = [
  { emoji: "😊", label: "ほっこり",  response: "笑顔の一日を過ごせているようで嬉しいです。その気持ちをそのまま大切にしてくださいね。🌸" },
  { emoji: "🌸", label: "穏やか",    response: "穏やかに過ごせているのは素晴らしいことです。焦らず、今この瞬間を大切に。" },
  { emoji: "😔", label: "どんより",  response: "どんよりした気持ち、よくわかります。そんな日もあっていいんです。ゆっくり深呼吸して。💕" },
  { emoji: "😟", label: "ソワソワ",  response: "ソワソワする気持ち、とてもよくわかります。待つ時間は本当につらいですよね。一緒にいますよ。" },
  { emoji: "😡", label: "イライラ",  response: "ホルモンの影響でイライラしやすい時期ですね。今日はゆっくり休んで、自分を責めないで。" },
  { emoji: "💪", label: "頑張れた",  response: "今日も頑張りましたね！それだけで十分です。自分をたくさん褒めてあげてください。✨" },
  { emoji: "😢", label: "つらい",    response: "つらい気持ち、全部ここで受け止めます。一人で抱え込まないで。あなたは頑張っています。🌷" },
  { emoji: "🙏", label: "感謝",      response: "感謝の気持ちを持てるあなたは、とても強い方です。周りへの感謝、自分への感謝も忘れずに。" },
] as const;

// ─── 現在のステージを取得 ────────────────────────────────
function getStage(dates: TreatmentDates): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dates.transfer) {
    const t = new Date(dates.transfer);
    t.setHours(0, 0, 0, 0);
    const dpt = Math.round((today.getTime() - t.getTime()) / 86400000);
    if (dpt < -2) return "移植前準備中";
    if (dpt < 0)  return "移植直前";
    if (dpt <= 14) return "移植後（着床期）";
    if (dpt <= 42) return "妊娠初期";
    return "妊娠中期以降";
  }
  if (dates.retrieval) {
    const r = new Date(dates.retrieval);
    const d = Math.round((today.getTime() - r.getTime()) / 86400000);
    if (d < 0) return "採卵前";
    if (d < 7) return "採卵後";
    return "移植待機中";
  }
  return "治療中（周期不明）";
}

// ─── 周期別アドバイス ─────────────────────────────────────
interface Advice {
  title: string;
  foods: { item: string; reason: string }[];
  lifestyle: { item: string; caution?: boolean }[];
}

const STAGE_ADVICE: Record<string, Advice> = {
  "採卵前": {
    title: "採卵前期のサポート栄養",
    foods: [
      { item: "良質なタンパク質（卵・豆腐・魚）",     reason: "卵子の質を高める基礎栄養素です" },
      { item: "鉄分（レバー・ほうれん草・小松菜）",   reason: "貧血予防と卵巣機能のサポートに" },
      { item: "葉酸（ブロッコリー・枝豆・アスパラ）", reason: "細胞分裂に欠かせない必須栄養素" },
      { item: "CoQ10（サバ・イワシ）",                reason: "卵子のミトコンドリアを活性化します" },
    ],
    lifestyle: [
      { item: "適度な有酸素運動（ウォーキング30分程度）" },
      { item: "十分な睡眠（7〜8時間）" },
      { item: "カフェインは1日200mg以下（コーヒー1杯程度）", caution: true },
      { item: "喫煙・過度な飲酒は避けてください", caution: true },
    ],
  },
  "移植後（着床期）": {
    title: "移植後・着床期のサポート栄養",
    foods: [
      { item: "葉酸（ほうれん草・アスパラ・枝豆）",         reason: "神経管形成に重要。積極的に摂って" },
      { item: "ビタミンE（アーモンド・アボカド・オリーブ油）", reason: "子宮内膜の血流改善に役立ちます" },
      { item: "タンパク質（鶏胸肉・豆腐・鮭）",             reason: "胚の着床と発育をサポートします" },
      { item: "亜鉛（牡蠣・かぼちゃの種・牛肉）",           reason: "ホルモン分泌と細胞増殖に深く関与" },
    ],
    lifestyle: [
      { item: "お腹に直接カイロを当てない（子宮を温めすぎない）", caution: true },
      { item: "38℃以上の長湯・サウナは避けてください",           caution: true },
      { item: "アルコール・カフェインは控えてください",           caution: true },
      { item: "激しい運動は控え、ゆったり過ごしましょう" },
      { item: "好きなことをして、心をリラックスさせてください" },
    ],
  },
  "妊娠初期": {
    title: "妊娠初期のサポート栄養",
    foods: [
      { item: "葉酸（毎日400μg以上を目安に）", reason: "神経管閉鎖障害の予防に特に重要" },
      { item: "鉄分（ひじき・小松菜・赤身肉）", reason: "血液量が増える妊娠中は不足しがち" },
      { item: "カルシウム（乳製品・小魚・豆腐）", reason: "赤ちゃんの骨・歯の形成をサポート" },
      { item: "DHA（鮭・マグロ・青魚全般）", reason: "赤ちゃんの脳・神経の発達に貢献します" },
    ],
    lifestyle: [
      { item: "生魚・生肉・アルコールは避けてください",   caution: true },
      { item: "激しい運動・長距離移動は担当医に相談を",   caution: true },
      { item: "つわりがひどい時は無理せず横になりましょう" },
      { item: "気持ちが揺れやすい時期。自分を責めないで" },
    ],
  },
  "移植前準備中": {
    title: "移植前・卵胞期のサポート栄養",
    foods: [
      { item: "鉄分とタンパク質をしっかり摂る",           reason: "子宮内膜を厚くするための基礎栄養" },
      { item: "ビタミンD（鮭・干しシイタケ・卵）",        reason: "妊娠率との関連が多く報告されています" },
      { item: "葉酸（毎日400μg）",                       reason: "移植後の備えとして今から継続を" },
      { item: "温かい飲み物・食事（生姜・根菜など）",     reason: "体を内側から温めて子宮環境を整えます" },
    ],
    lifestyle: [
      { item: "体を冷やさないよう意識してください" },
      { item: "十分な睡眠と規則正しい生活リズムを" },
      { item: "激しい運動は控え、ストレッチやヨガ程度に", caution: true },
    ],
  },
};

const FALLBACK_ADVICE: Advice = {
  title: "治療中の基本的なサポート栄養",
  foods: [
    { item: "葉酸（毎日400μg）",               reason: "妊活中の必須栄養素です" },
    { item: "鉄分（赤身肉・豆類）",             reason: "妊活女性は不足しがちです" },
    { item: "ビタミンD（鮭・卵）",              reason: "妊娠率との関連が注目されています" },
    { item: "バランスの取れた食事全般",         reason: "偏食・過度なダイエットは避けて" },
  ],
  lifestyle: [
    { item: "適度な運動（激しすぎず軽すぎず）" },
    { item: "十分な睡眠と規則正しい生活を" },
    { item: "過度なダイエットは避けてください", caution: true },
    { item: "ストレスをうまく発散させましょう" },
  ],
};

// ─── 薬・食品データベース ─────────────────────────────────
type Safety = true | false | "consult";
interface DrugInfo { safe: Safety; message: string }

const DRUG_DB: Record<string, DrugInfo> = {
  "カフェイン":      { safe: "consult", message: "移植後は1日200mg以下（コーヒー1〜2杯程度）が目安です。できれば控えめにするのが安心です。" },
  "コーヒー":        { safe: "consult", message: "1日1〜2杯程度なら一般的に許容範囲とされますが、移植後は減らすのが望ましいです。" },
  "ロキソニン":      { safe: false,     message: "ロキソニン（NSAIDs）は着床を阻害する可能性が指摘されています。移植後・妊娠中は避け、痛みがある場合は担当医にご相談ください。" },
  "ロキソプロフェン":{ safe: false,     message: "NSAIDsのため移植後は服用しないでください。代替薬を担当医に相談してください。" },
  "イブプロフェン":  { safe: false,     message: "NSAIDsのため移植後・妊娠中は避けてください。担当医に代替薬を相談してください。" },
  "アセトアミノフェン":{ safe: true,   message: "アセトアミノフェン（カロナール等）は妊活中・妊娠中の解熱鎮痛剤として比較的使いやすい薬です。用法・用量を守って服用してください。" },
  "カロナール":      { safe: true,     message: "カロナール（アセトアミノフェン）は妊活中・妊娠初期でも比較的使用しやすいとされています。処方量を守って服用してください。" },
  "バファリン":      { safe: "consult", message: "低用量アスピリン（バファリン81mg）は医師処方の場合はOKなことも。一般用の解熱バファリンは成分に注意が必要です。必ず担当医に確認を。" },
  "風邪薬":          { safe: "consult", message: "市販の風邪薬には複数の成分が含まれます。移植後・妊娠中は成分を確認し、必ず担当医や薬剤師に相談してから服用してください。" },
  "パブロン":        { safe: "consult", message: "パブロンには解熱成分や血管収縮成分が含まれる場合があります。移植後は使用前に担当医へ必ずご相談ください。" },
  "葉酸":            { safe: true,     message: "葉酸は妊活中・妊娠初期に積極的に摂ることが推奨されています。サプリメントで1日400μgを目安に継続しましょう。" },
  "アルコール":      { safe: false,    message: "アルコールは妊活中・妊娠中は避けてください。移植後は特に禁酒が大切です。" },
  "お酒":            { safe: false,    message: "アルコールは妊活中・妊娠中は禁酒が強く推奨されています。" },
  "タバコ":          { safe: false,    message: "喫煙は妊娠率を大幅に下げ、流産リスクも高めます。禁煙を強くおすすめします。" },
  "生薬":            { safe: "consult", message: "漢方・生薬は成分によっては子宮収縮作用があるものも。移植後に新たに始める場合は必ず担当医にご確認ください。" },
};

const AI_CHAT_RESPONSES = [
  "そのお気持ち、よくわかります。不安を感じるのはとても自然なことですよ。一人で抱え込まないでくださいね。💕",
  "毎日お薬を頑張って続けていらっしゃるのですね。その努力、本当に素晴らしいです。あなたのペースで大丈夫です。🌸",
  "つらい気持ちを打ち明けてくれてありがとうございます。ここでは何でも自由に話せますよ。いつもそばにいます。",
  "不妊治療の道のりは、体だけでなく心にも大きな負担がかかりますよね。でも、あなたは一人じゃありません。",
  "今日も一歩一歩前に進んでいるあなたを、たくさん褒めてあげてください。どんな小さな一歩も大きな意味があります。🍀",
  "深呼吸をして、今この瞬間だけに集中してみましょう。明日のことは明日考えればいいのです。",
  "パートナーや周りの方に気持ちを伝えることも、時には大切です。あなたの感情はとても大切なものです。",
  "あなたが感じていることをここで話してくれること、本当に嬉しいです。どうぞ続けて話してください。🌷",
];

// ─── メインコンポーネント ─────────────────────────────────
export default function AICounseling({ treatmentDates, emotionEntries, onAddEmotion }: Props) {
  const [subTab,          setSubTab]          = useState<SubTab>("emotion");
  const [selectedStamp,   setSelectedStamp]   = useState<typeof STAMPS[number] | null>(null);
  const [drugQuery,       setDrugQuery]        = useState("");
  const [drugResult,      setDrugResult]       = useState<DrugInfo | null>(null);
  const [chatMessages,    setChatMessages]     = useState<ChatMessage[]>([
    { id: 0, role: "ai", text: "こんにちは。私はあなたの不妊治療をサポートする Hana AI です。今日のお気持ちをどうぞ自由にお話しください。🌸" },
  ]);
  const [chatInput,       setChatInput]        = useState("");
  const [isTyping,        setIsTyping]         = useState(false);
  const responseIdx = useRef(0);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const handleStamp = (stamp: typeof STAMPS[number]) => {
    setSelectedStamp(stamp);
    onAddEmotion({ date: today, emotion: stamp.label, emoji: stamp.emoji });
  };

  const handleDrugCheck = () => {
    const q = drugQuery.trim().toLowerCase();
    const entry = Object.entries(DRUG_DB).find(([key]) =>
      q.includes(key.toLowerCase()) || key.toLowerCase().includes(q)
    );
    setDrugResult(entry
      ? entry[1]
      : {
          safe: "consult",
          message: `「${drugQuery}」については情報が手元にありません。移植後・妊娠中の服用については、必ず担当医・薬剤師にご確認ください。`,
        }
    );
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text || isTyping) return;
    setChatMessages(prev => [...prev, { id: Date.now(), role: "user", text }]);
    setChatInput("");
    setIsTyping(true);
    setTimeout(() => {
      const reply = AI_CHAT_RESPONSES[responseIdx.current % AI_CHAT_RESPONSES.length];
      responseIdx.current++;
      setChatMessages(prev => [...prev, { id: Date.now(), role: "ai", text: reply }]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const stage  = getStage(treatmentDates);
  const advice = STAGE_ADVICE[stage] ?? FALLBACK_ADVICE;

  const SUB_TABS: { id: SubTab; label: string }[] = [
    { id: "emotion", label: "気分スタンプ"  },
    { id: "advice",  label: "アドバイス"    },
    { id: "drug",    label: "薬チェック"    },
    { id: "chat",    label: "AI チャット"   },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-xl font-bold text-stone-700">相談・アドバイス</h2>
        <p className="text-sm text-stone-500 mt-0.5">あなたの心と体をサポートします</p>
      </div>

      {/* サブタブ */}
      <div className="bg-rose-50/80 rounded-2xl p-1 grid grid-cols-4 gap-1">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`py-2 rounded-xl text-[11px] font-bold transition-all ${
              subTab === t.id ? "bg-white text-rose-600 shadow-sm" : "text-stone-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── 感情スタンプ ─── */}
      {subTab === "emotion" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100">
            <p className="text-xs font-bold text-stone-500 mb-4">今の気持ちをスタンプで教えて</p>
            <div className="grid grid-cols-4 gap-2">
              {STAMPS.map(stamp => (
                <button
                  key={stamp.label}
                  onClick={() => handleStamp(stamp)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all active:scale-90 ${
                    selectedStamp?.label === stamp.label
                      ? "bg-rose-100 border-rose-300 ring-2 ring-rose-200"
                      : "border-rose-100 hover:bg-rose-50"
                  }`}
                >
                  <span className="text-3xl">{stamp.emoji}</span>
                  <span className="text-[10px] text-stone-500 leading-none">{stamp.label}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedStamp && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100 animate-fade-in-up">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex-shrink-0 flex items-center justify-center text-xl">🌸</div>
                <div className="flex-1">
                  <p className="text-xs text-rose-400 font-semibold mb-1">Hana AI より</p>
                  <p className="text-sm text-stone-700 leading-relaxed">{selectedStamp.response}</p>
                </div>
              </div>
            </div>
          )}

          {emotionEntries.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100">
              <p className="text-xs font-bold text-stone-500 mb-3">気分の記録</p>
              <div className="flex flex-wrap gap-2">
                {[...emotionEntries].reverse().slice(0, 12).map(e => (
                  <div key={e.id} className="flex items-center gap-1.5 bg-rose-50 rounded-full px-3 py-1.5">
                    <span className="text-sm">{e.emoji}</span>
                    <span className="text-xs text-stone-600">{e.emotion}</span>
                    <span className="text-xs text-stone-400">
                      {new Date(e.date).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 周期別アドバイス ─── */}
      {subTab === "advice" && (
        <div className="space-y-4">
          <div className="bg-rose-50 rounded-2xl px-4 py-3 border border-rose-100 flex items-center gap-3">
            <span className="text-xl">📍</span>
            <div>
              <p className="text-xs text-stone-400">現在のステージ</p>
              <p className="font-bold text-rose-600 text-sm">{stage}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100">
            <p className="font-bold text-stone-700 mb-4">🥗 {advice.title}</p>
            <div className="space-y-3">
              {advice.foods.map((f, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5">✓</span>
                  <div>
                    <p className="text-sm font-semibold text-stone-700">{f.item}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{f.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100">
            <p className="font-bold text-stone-700 mb-4">🌿 この時期の過ごし方</p>
            <div className="space-y-3">
              {advice.lifestyle.map((l, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 ${
                    l.caution ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-500"
                  }`}>
                    {l.caution ? "⚠" : "♡"}
                  </span>
                  <p className={`text-sm ${l.caution ? "text-amber-700 font-semibold" : "text-stone-700"}`}>{l.item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 薬チェック ─── */}
      {subTab === "drug" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100">
            <p className="font-bold text-stone-700 text-sm">「これ、飲んでいい？」クイック確認</p>
            <p className="text-xs text-stone-400 mt-0.5 mb-4">薬・食品・飲み物の名前を入力してください</p>

            <div className="flex gap-2">
              <input
                type="text"
                value={drugQuery}
                onChange={e => setDrugQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleDrugCheck()}
                placeholder="例: ロキソニン、コーヒー..."
                className="flex-1 bg-rose-50/40 border border-rose-200 rounded-xl px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-rose-400"
              />
              <button
                onClick={handleDrugCheck}
                disabled={!drugQuery.trim()}
                className="px-4 py-2.5 bg-rose-400 text-white rounded-xl font-bold text-sm shadow-md shadow-rose-200 disabled:opacity-40 active:scale-95 transition-transform"
              >
                確認
              </button>
            </div>

            {/* クイック候補 */}
            <div className="flex flex-wrap gap-2 mt-3">
              {["ロキソニン", "カロナール", "コーヒー", "バファリン", "風邪薬", "葉酸", "生薬"].map(q => (
                <button
                  key={q}
                  onClick={() => setDrugQuery(q)}
                  className="text-xs bg-rose-50 text-rose-500 border border-rose-100 px-3 py-1 rounded-full hover:bg-rose-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {drugResult && (
            <div className={`rounded-3xl p-5 shadow-sm border animate-fade-in-up ${
              drugResult.safe === true
                ? "bg-green-50 border-green-200"
                : drugResult.safe === false
                ? "bg-red-50 border-red-100"
                : "bg-amber-50 border-amber-200"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">
                  {drugResult.safe === true ? "✅" : drugResult.safe === false ? "❌" : "⚠️"}
                </span>
                <p className={`font-bold text-sm ${
                  drugResult.safe === true ? "text-green-700" : drugResult.safe === false ? "text-red-700" : "text-amber-700"
                }`}>
                  {drugResult.safe === true ? "比較的安全です" : drugResult.safe === false ? "避けてください" : "医師に確認してください"}
                </p>
              </div>
              <p className="text-sm text-stone-700 leading-relaxed">{drugResult.message}</p>
              <p className="text-xs text-stone-400 mt-3 pt-3 border-t border-current/10">
                ※ この情報は参考用です。最終的な判断は必ず担当医・薬剤師にご確認ください。
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── AI チャット ─── */}
      {subTab === "chat" && (
        <div className="flex flex-col" style={{ height: "calc(100dvh - 300px)" }}>
          <div className="flex-1 overflow-y-auto space-y-4 pb-3">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {msg.role === "ai" && (
                  <div className="w-8 h-8 bg-rose-100 rounded-full flex-shrink-0 flex items-center justify-center text-base mt-0.5">🌸</div>
                )}
                <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-rose-400 text-white rounded-tr-sm shadow-sm"
                    : "bg-white text-stone-700 rounded-tl-sm shadow-sm border border-rose-50"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2.5">
                <div className="w-8 h-8 bg-rose-100 rounded-full flex-shrink-0 flex items-center justify-center text-base mt-0.5">🌸</div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm border border-rose-50 flex items-center gap-1">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-2 h-2 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 pt-3 border-t border-rose-100 flex-shrink-0">
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder="今日の気持ちを話してみてください…"
              rows={2}
              className="flex-1 bg-white border border-rose-200 rounded-2xl px-4 py-3 text-sm text-stone-700 resize-none focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 placeholder:text-stone-400"
            />
            <button
              onClick={sendChat}
              disabled={!chatInput.trim() || isTyping}
              className="self-end w-11 h-11 bg-rose-400 text-white rounded-full flex items-center justify-center shadow-md shadow-rose-200 disabled:opacity-40 active:scale-90 transition-transform text-xl"
            >↑</button>
          </div>
        </div>
      )}
    </div>
  );
}
