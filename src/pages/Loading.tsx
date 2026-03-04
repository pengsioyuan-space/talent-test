import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "../components/Card";
import { getAnswers, getToken, setRid } from "../utils/storage";

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

export function Loading() {
  const nav = useNavigate();
  const loc = useLocation();
  const [sp, setSp] = useSearchParams();

  const rid = sp.get("rid") || "";
  const [done, setDone] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const pct = useMemo(() => Math.round((done / steps.length) * 100), [done]);

  // 1) 如果是从最后一题过来的（state.submit），就在这里提交并拿 rid
  useEffect(() => {
    const needSubmit = (loc.state as any)?.submit === true;
    if (!needSubmit) return;
    if (submitting) return;
    if (rid) return; // 已经有 rid 就不用再提交

    (async () => {
      setSubmitting(true);
      const token = getToken();
      const list = getAnswers();

      const { data } = await jsonFetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, answers: { list } }),
      });

      if (data?.ok && data?.rid) {
        setRid(data.rid);
        // 把 url 变成 /loading?rid=xxx（你说你想要这样）
        setSp({ rid: data.rid }, { replace: true });
        // 清掉 state，避免刷新重复提交
        nav(`/loading?rid=${encodeURIComponent(data.rid)}`, { replace: true, state: null });
      } else {
        alert(`提交失败：${data?.reason || "unknown"}`);
      }

      setSubmitting(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) 进度条 + 有 rid 才跳报告
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