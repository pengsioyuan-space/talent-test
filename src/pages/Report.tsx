import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { Card } from "../components/Card";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

type DimScore = {
  dim: string;
  n: number;
  sum: number;
  score20: number; // 0~20
};

type Narrative = {
  type: string;
  summary: string;
  strengths: string[];
  pitfalls: string[];
  suggestions: string[];
};

type ReportData = {
  rid: string;
  token: string;
  usedAt: string;
  report: {
    createdAt: string;
    primary: string;
    type: string;
    top3: string[];
    dims: DimScore[];
    narrative: Narrative;
  };
};

function badgeColor(idx: number) {
  // 不用自定义颜色也能好看：用不同浅底
  const cls = [
    "bg-violet-100 text-violet-700",
    "bg-sky-100 text-sky-700",
    "bg-emerald-100 text-emerald-700",
  ];
  return cls[idx] || "bg-slate-100 text-slate-700";
}

export function Report() {
  const nav = useNavigate();
  const { rid = "" } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    if (!rid) {
      setErr("缺少 rid");
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setErr("");

      try {
        const r = await fetch(`/api/report?rid=${encodeURIComponent(rid)}`, {
          method: "GET",
          headers: { "cache-control": "no-store" },
        });
        const j = await r.json().catch(() => ({}));

        if (!j?.ok) {
          setErr(j?.reason || "report_not_found");
          setData(null);
        } else {
          setData(j as ReportData);
        }
      } catch (e: any) {
        setErr(String(e?.message || e));
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [rid]);

  const report = data?.report;

  const radarData = useMemo(() => {
    const dims = report?.dims || [];
    // 雷达图用短标签更像你截图（A/B/C...也可以，但这里直接用中文更直观）
    return dims.map((d) => ({
      name: d.dim.replace("天赋", ""),
      value: d.score20,
    }));
  }, [report]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-slate-600">正在加载报告...</div>
      </div>
    );
  }

  if (!report || err) {
    return (
      <div className="min-h-screen">
        <Topbar />
        <div className="mx-auto max-w-3xl px-4 py-16">
          <Card className="p-8">
            <div className="text-2xl font-semibold">报告不存在</div>
            <div className="mt-2 text-slate-600">
              {err || "可能 rid 已过期或未生成成功。"}
            </div>
            <button
              onClick={() => nav("/", { replace: true })}
              className="mt-6 px-5 py-3 rounded-2xl bg-violet-600 text-white"
            >
              返回首页
            </button>
          </Card>
        </div>
      </div>
    );
  }

  const dimsSorted = [...report.dims].sort((a, b) => b.score20 - a.score20);
  const primary = report.primary;
  const top3 = report.top3 || [];
  const narrative = report.narrative;

  return (
    <div className="min-h-screen">
      <Topbar
        right={
          <button
            onClick={() => nav("/", { replace: true })}
            className="px-4 py-2 rounded-2xl bg-white/70 border border-slate-200"
          >
            回到首页
          </button>
        }
      />

      {/* Hero（模仿你截图的紫色大背景） */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600 to-violet-500" />
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-12 text-white">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/20">
              <span className="text-sm">职业深度版</span>
              <span className="text-sm opacity-80">· 基于多元智能理论</span>
            </div>

            <h1 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight">
              天赋能力测试报告
            </h1>

            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/20">
              <span className="text-sm opacity-90">你的类型：</span>
              <span className="font-medium">{report.type}</span>
            </div>

            <div className="mt-6 max-w-3xl text-white/90 leading-relaxed">
              {narrative?.summary || "报告摘要生成中…"}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {top3.map((t, i) => (
                <span
                  key={t}
                  className={[
                    "px-3 py-1 rounded-full text-xs font-medium",
                    "bg-white/15 border border-white/20",
                  ].join(" ")}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Hero 下方白色卡片承接 */}
        <div className="relative mx-auto max-w-6xl px-4 -mt-10 pb-10">
          <Card className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              {/* 雷达图 */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900">天赋能力图谱</div>
                  <div className="text-xs text-slate-500">10维度全景展示</div>
                </div>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <Radar dataKey="value" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  分数区间：0-20（越高越突出）
                </div>
              </div>

              {/* 维度条 */}
              <div>
                <div className="font-semibold text-slate-900">各项天赋详情</div>
                <div className="mt-4 space-y-4">
                  {dimsSorted.map((d) => {
                    const pct = Math.round((d.score20 / 20) * 100);
                    const level =
                      d.score20 >= 16
                        ? "非常擅长"
                        : d.score20 >= 12
                        ? "较擅长"
                        : d.score20 >= 8
                        ? "待发展"
                        : "需加强";

                    return (
                      <div key={d.dim} className="flex items-center gap-3">
                        <div className="w-28 text-sm font-medium text-slate-700">
                          {d.dim.replace("天赋", "")}
                        </div>
                        <div className="flex-1">
                          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-violet-600"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-12 text-sm text-slate-700 text-right">
                          {d.score20}
                        </div>
                        <div className="w-20 text-xs text-slate-500 text-right">
                          {level}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 解读区 */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="text-sm text-slate-500">你的第一天赋</div>
            <div className="mt-2 text-2xl font-semibold">{primary}</div>
            <div className="mt-4 text-slate-600 leading-relaxed">
              {narrative?.summary}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {top3.map((t, i) => (
                <span
                  key={t}
                  className={[
                    "px-3 py-1 rounded-full text-xs font-medium",
                    badgeColor(i),
                  ].join(" ")}
                >
                  {t}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="font-semibold">核心优势组合</div>
            <div className="mt-4 space-y-2 text-slate-700">
              {(narrative?.strengths || []).length ? (
                narrative.strengths.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <span>💪</span>
                    <span>{s}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-sm">暂无</div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="font-semibold">潜在挑战</div>
            <div className="mt-4 space-y-2 text-slate-700">
              {(narrative?.pitfalls || []).length ? (
                narrative.pitfalls.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <span>⚡</span>
                    <span>{s}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-sm">暂无</div>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-6 mt-6">
          <div className="font-semibold">发展建议</div>
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {(narrative?.suggestions || []).length ? (
              narrative.suggestions.map((s, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex gap-2 text-slate-700">
                    <span>✅</span>
                    <span>{s}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-sm">暂无</div>
            )}
          </div>

          <div className="mt-5 text-xs text-slate-500">
            报告生成时间：{new Date(report.createdAt).toLocaleString()}
          </div>
        </Card>
      </div>
    </div>
  );
}