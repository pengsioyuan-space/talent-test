import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { Card } from "../components/Card";
import { OptionCard } from "../components/OptionCard";
import { QUESTIONS } from "../data/questions";
import { getAnswers, upsertAnswer, getToken, setRid } from "../utils/storage";

const options = [
  { label: "非常符合", value: 5 },
  { label: "很符合", value: 4 },
  { label: "部分符合", value: 3 },
  { label: "不太符合", value: 2 },
  { label: "完全不符合", value: 1 },
];

export function Question() {
  const nav = useNavigate();
  const { i } = useParams();
  const total = QUESTIONS.length;

  const idx = Math.max(0, Math.min(total - 1, Number(i ?? "0")));
  const q = QUESTIONS[idx];

  const answers = getAnswers();
  const selected = answers.find((x) => x.id === q.id)?.value;

  const progress = useMemo(() => Math.round(((idx + 1) / total) * 100), [idx, total]);

  // ✅ 防止最后一题点击太快重复提交
  const [submitting, setSubmitting] = useState(false);

  const submitNow = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const token = getToken();
      const list = getAnswers();

      const r = await fetch(`/api/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, answers: { list } }),
      });

      const j = await r.json();

      // ✅ 关键：submit 必须返回 rid（如果你后端还没返回 rid，会走到 alert）
      if (j.ok && j.rid) {
        setRid(j.rid);
        nav(`/loading?rid=${encodeURIComponent(j.rid)}`, { replace: true });
      } else {
        alert(`提交失败：${j.reason || "unknown"}（是否后端没返回 rid？）`);
        setSubmitting(false);
      }
    } catch (e: any) {
      alert(`提交异常：${String(e?.message || e)}`);
      setSubmitting(false);
    }
  };

  // ✅ 最小改动：最后一题选完 -> 直接 submitNow()（从而进入 /loading?rid=xxx）
  const onPick = async (v: number) => {
    upsertAnswer({ id: q.id, dim: q.dim, value: v });

    if (idx < total - 1) {
      nav(`/q/${idx + 1}`);
    } else {
      await submitNow();
    }
  };

  return (
    <div className="min-h-screen">
      <Topbar
        right={
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">答题进度 {idx + 1}/{total}</div>
            <div className="w-40 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-violet-600" style={{ width: `${progress}%` }} />
            </div>
          </div>
        }
      />

      <div className="mx-auto max-w-5xl px-4 py-10">
        <Card className="p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-slate-500 mb-2">题目 {idx + 1}</div>
              <div className="inline-flex px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                {q.dim}
              </div>
            </div>
            <div className="text-xs text-slate-500 px-3 py-1 rounded-full bg-slate-100">
              第 {idx + 1} / {total} 题
            </div>
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight">{q.text}</h1>

          <div className="mt-6 grid gap-4">
            {options.map((op) => (
              <OptionCard
                key={op.value}
                checked={selected === op.value}
                label={op.label}
                onClick={() => onPick(op.value)}
              />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              disabled={idx === 0}
              onClick={() => nav(`/q/${idx - 1}`)}
              className="px-5 py-3 rounded-2xl bg-white border border-slate-200 disabled:opacity-40"
            >
              ← 上一题
            </button>

            {/* ✅ 保留你原本按钮逻辑，但最后一题按钮点了也能提交 */}
            {idx < total - 1 ? (
              <button
                onClick={() => nav(`/q/${idx + 1}`)}
                className="px-6 py-3 rounded-2xl bg-violet-600 text-white shadow-[0_12px_40px_rgba(139,92,246,0.25)]"
              >
                下一题 →
              </button>
            ) : (
              <button
                disabled={submitting}
                onClick={submitNow}
                className="px-6 py-3 rounded-2xl bg-violet-600 text-white shadow-[0_12px_40px_rgba(139,92,246,0.25)] disabled:opacity-60"
              >
                {submitting ? "提交中..." : "提交测评 ✓"}
              </button>
            )}
          </div>

          <div className="mt-4 text-xs text-slate-500">
            说明：进入不消耗，只有提交才消耗。提交后 token 会被标记 used，无法再次进入。
          </div>
        </Card>
      </div>
    </div>
  );
}