import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "../components/Card";
import { getAnswers, getRid, getToken, setRid } from "../utils/storage";
import { QUESTIONS } from "../data/questions";

const steps = [
  "正在读取您的答题数据...",
  "分析您的答题模式...",
  "计算心理维度分数...",
  "生成个性化建议...",
  "整理测评报告...",
];

function jsonFetch(url: string, init?: RequestInit) {
  return fetch(url, init).then(async (r) => {
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data: j };
  });
}

function firstMissingIndex(): number {
  const answers = getAnswers();
  for (let idx = 0; idx < QUESTIONS.length; idx++) {
    const q = QUESTIONS[idx];
    const hit = answers.find((x) => x.id === q.id)?.value;
    if (!hit) return idx;
  }
  return -1;
}

export function Loading() {
  const nav = useNavigate();
  const loc = useLocation();
  const [sp, setSp] = useSearchParams();

  const ridInUrl = sp.get("rid") || "";
  const ridInStorage = getRid();
  const rid = ridInUrl || ridInStorage;

  const [done, setDone] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const pct = useMemo(() => Math.round((done / steps.length) * 100), [done]);

  useEffect(() => {
    const needSubmit = (loc.state as any)?.submit === true;

    // ✅ 没有 submit 意图就只显示动画（或等待 rid）
    if (!needSubmit) return;

    // ✅ 已经有 rid（提交过），不再 submit
    if (rid) return;

    // ✅ 关键：loading 提交前也强制校验答满
    const miss = firstMissingIndex();
    if (miss !== -1) {
      alert(`你还有第 ${miss + 1} 题未作答，请先完成再提交。`);
      nav(`/q/${miss}`, { replace: true });
      return;
    }

    if (submitting) return;

    (async () => {
      setSubmitting(true);

      try {
        const token = getToken();
        const list = getAnswers();

        if (!token) {
          alert("提交失败：missing_token");
          setSubmitting(false);
          nav(`/`, { replace: true });
          return;
        }

        const { data } = await jsonFetch("/api/submit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token, answers: { list } }),
        });

        if (data?.ok && data?.rid) {
          setRid(data.rid);
          setSp({ rid: data.rid }, { replace: true });
          nav(`/loading?rid=${encodeURIComponent(data.rid)}`, { replace: true, state: null });
        } else {
          alert(`提交失败：${data?.reason || "unknown"}`);
        }
      } catch (e: any) {
        alert(`提交异常：${String(e?.message || e)}`);
      } finally {
        setSubmitting(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setDone((d) => {
        const nd = Math.min(steps.length, d + 1);
        if (nd === steps.length && rid) {
          setTimeout(() => nav(`/report/${rid}`, { replace: true }), 800);
        }
        return nd;
      });
    }, 650);
    return () => clearInterval(t);
  }, [nav, rid]);

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl font-semibold tracking-tight">报告分析中……</div>
          <div className="mt-2 text-slate-600">正在为您生成天赋能力测试报告</div>
        </div>

        <Card className="p-8 bg-white/55">
          <div className="flex items-center gap-3 text-violet-700 font-medium mb-4">
            ✳ 分析进度
          </div>

          <div className="space-y-3">
            {steps.map((s, i) => {
              const ok = i < done;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={[
                      "h-6 w-6 rounded-full grid place-items-center text-xs",
                      ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400",
                    ].join(" ")}
                  >
                    {ok ? "✓" : "·"}
                  </div>
                  <div className={ok ? "text-slate-700" : "text-slate-400"}>{s}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 h-3 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-violet-600" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 text-center text-sm text-slate-600">
            分析进度：{done}/{steps.length}
          </div>
        </Card>

        <div className="mt-5 text-center text-xs text-slate-500">
          {submitting ? "正在提交答案并生成报告，请稍候…" : "提交成功后正在生成报告，请稍候…"}
        </div>
      </div>
    </div>
  );
}