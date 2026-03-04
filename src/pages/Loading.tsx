import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "../components/Card";

const steps = [
  "正在读取您的答题数据...",
  "分析您的答题模式...",
  "计算心理维度分数...",
  "生成个性化建议...",
  "整理测评报告...",
];

export function Loading() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const rid = (sp.get("rid") || "").trim();
  const [done, setDone] = useState(0);

  const pct = useMemo(() => Math.round((done / steps.length) * 100), [done]);

  // ✅ 防呆：手动打开 /loading 时没有 rid，就直接回首页/测试页
  useEffect(() => {
    if (!rid) {
      nav("/test", { replace: true }); // 你想回首页就改成 "/"
    }
  }, [rid, nav]);

  useEffect(() => {
    if (!rid) return;

    const t = setInterval(() => {
      setDone((d) => {
        const nd = Math.min(steps.length, d + 1);
        return nd;
      });
    }, 650);

    return () => clearInterval(t);
  }, [rid]);

  // ✅ 单独监听 done 到达后跳转，更稳（避免 setState 闭包时序问题）
  useEffect(() => {
    if (!rid) return;
    if (done === steps.length) {
      const to = setTimeout(() => {
        nav(`/report/${rid}`, { replace: true });
      }, 800);
      return () => clearTimeout(to);
    }
  }, [done, rid, nav]);

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
          提交成功后正在生成报告，请稍候…
        </div>
      </div>
    </div>
  );
}