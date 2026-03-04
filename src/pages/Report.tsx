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

type DimNarrative = {
  dim: string;
  score20: number;
  level: string;
  slogan: string;
  intro: string;
  traits: string[];
  scenes: string[];
  pitfalls: string[];
  synergy: { dim: string; text: string }[];
  actions: string[];
  growth?: { title: string; text: string; tips: string[] } | null;
};

type CareerItem = {
  rank: number;
  title: string;
  match: number; // 0~100
  tags: string[];
  reason: string;
  tips: string[];
};

type ActionPlan = {
  shortTitle: string;
  short: string[];
  midTitle: string;
  mid: string[];
  longTitle: string;
  long: string[];
};

type ReportShape = {
  createdAt: string;
  primary: string;
  type: string;
  top3: string[];
  dims: DimScore[];
  narrative: Narrative;

  // ✅ 新字段（后端 enrich 后）
  dimNarratives?: DimNarrative[];
  careers?: CareerItem[];
  actionPlan?: ActionPlan;
};

type ReportData = {
  rid: string;
  token: string;
  usedAt: string;
  report: ReportShape;
};

function badgeColor(idx: number) {
  const cls = [
    "bg-violet-100 text-violet-700",
    "bg-sky-100 text-sky-700",
    "bg-emerald-100 text-emerald-700",
  ];
  return cls[idx] || "bg-slate-100 text-slate-700";
}

function levelLabel(score20: number) {
  return score20 >= 16
    ? "非常擅长"
    : score20 >= 12
    ? "较为突出"
    : score20 >= 8
    ? "可发展"
    : "需要加强";
}

function scoreChipTone(score20: number) {
  if (score20 >= 16) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score20 >= 12) return "bg-sky-50 text-sky-700 border-sky-200";
  if (score20 >= 8) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
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
        const r = await fetch(
          `/api/report?rid=${encodeURIComponent(rid)}&_t=${Date.now()}`,
          {
            method: "GET",
            headers: { "cache-control": "no-store" },
          }
        );
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

  const dimsSorted = [...(report.dims || [])].sort((a, b) => b.score20 - a.score20);
  const primary = report.primary;
  const top3 = report.top3 || [];
  const narrative = report.narrative;

  const dimNarratives: DimNarrative[] = Array.isArray(report.dimNarratives)
    ? report.dimNarratives
    : [];

  // dimNarratives 如果后端没给，就从 dims 简单兜底生成“短卡”
  const dimCards: DimNarrative[] =
    dimNarratives.length > 0
      ? dimNarratives
      : dimsSorted.map((d) => ({
          dim: d.dim,
          score20: d.score20,
          level: levelLabel(d.score20),
          slogan: "持续练习，逐步提升你的能力表现。",
          intro: "这个维度反映你在相关能力上的倾向与表现。",
          traits: [],
          scenes: [],
          pitfalls: [],
          synergy: [],
          actions: [],
          growth: null,
        }));

  const careers: CareerItem[] = Array.isArray(report.careers) ? report.careers : [];
  const actionPlan: ActionPlan | null = report.actionPlan || null;

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

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600 to-violet-500" />
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />

        <div className="relative mx-auto max-w-6xl px-4 pt-10 md:pt-16 pb-10 md:pb-12 text-white">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/20">
              <span className="text-sm">职业深度版</span>
              <span className="text-sm opacity-80">· 基于多元智能理论</span>
            </div>

            <h1 className="mt-6 text-3xl md:text-5xl font-semibold tracking-tight">
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
                  key={`${t}-${i}`}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white/15 border border-white/20"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 图谱卡 */}
        <div className="relative mx-auto max-w-6xl px-4 -mt-8 md:-mt-10 pb-8 md:pb-10">
          <Card className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              <div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900">天赋能力图谱</div>
                  <div className="text-xs text-slate-500">10维度全景展示</div>
                </div>

                <div className="mt-4 h-56 sm:h-64 md:h-72">
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

              <div>
                <div className="font-semibold text-slate-900">各项天赋详情</div>
                <div className="mt-4 space-y-4">
                  {dimsSorted.map((d) => {
                    const pct = Math.round((d.score20 / 20) * 100);
                    const level = levelLabel(d.score20);

                    return (
                      <div key={d.dim} className="flex items-center gap-3">
                        <div className="w-24 sm:w-28 text-sm font-medium text-slate-700">
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
                        <div className="w-10 sm:w-12 text-sm text-slate-700 text-right">
                          {d.score20}
                        </div>
                        <div className="hidden sm:block w-20 text-xs text-slate-500 text-right">
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

      <div className="mx-auto max-w-6xl px-4 pb-16">
        {/* 类型解读（上面你截图那块） */}
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
                  key={`${t}-${i}`}
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

        {/* 发展建议 */}
        <Card className="p-6 mt-6">
          <div className="font-semibold">发展建议</div>
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {(narrative?.suggestions || []).length ? (
              narrative.suggestions.map((s, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200"
                >
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

        {/* ✅ 核心优势深度解读（每个维度一张） */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-slate-900">
              核心优势深度解读
            </div>
            <div className="text-sm text-slate-500">你的第一天赋与全维度解析</div>
          </div>

          <div className="mt-4 grid lg:grid-cols-2 gap-6">
            {dimCards.map((d) => (
              <Card key={d.dim} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-xl font-semibold text-slate-900">
                        {d.dim}
                      </div>

                      <div
                        className={[
                          "px-3 py-1 rounded-full text-xs border",
                          scoreChipTone(d.score20),
                        ].join(" ")}
                      >
                        {d.score20}/20 · {d.level || levelLabel(d.score20)}
                      </div>
                    </div>

                    <div className="mt-3 text-slate-700 font-medium">
                      {d.slogan}
                    </div>
                    <div className="mt-3 text-slate-600 leading-relaxed">
                      {d.intro}
                    </div>

                    {/* 你可能的特征 */}
                    <div className="mt-5">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>✨</span>
                        <span>你可能的特征</span>
                      </div>
                      <div className="mt-3 space-y-2 text-slate-700">
                        {(d.traits || []).length ? (
                          d.traits.map((x, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="mt-0.5">•</span>
                              <span>{x}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500 text-sm">暂无</div>
                        )}
                      </div>
                    </div>

                    {/* 最佳应用场景 */}
                    <div className="mt-5">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>💼</span>
                        <span>职场最佳应用场景</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(d.scenes || []).length ? (
                          d.scenes.map((x, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 rounded-full text-xs bg-violet-50 border border-violet-100 text-violet-700"
                            >
                              {x}
                            </span>
                          ))
                        ) : (
                          <div className="text-slate-500 text-sm">暂无</div>
                        )}
                      </div>
                    </div>

                    {/* 需要注意的陷阱 */}
                    <div className="mt-5">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>⚠️</span>
                        <span>需要注意的陷阱</span>
                      </div>
                      <div className="mt-3 space-y-2 text-slate-700">
                        {(d.pitfalls || []).length ? (
                          d.pitfalls.map((x, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="mt-0.5">•</span>
                              <span>{x}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500 text-sm">暂无</div>
                        )}
                      </div>
                    </div>

                    {/* 与其他天赋协同 */}
                    <div className="mt-5">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>🤝</span>
                        <span>与其他天赋的协同</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {(d.synergy || []).length ? (
                          d.synergy.map((s, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800"
                            >
                              <div className="text-sm font-medium">
                                + {s.dim}
                              </div>
                              <div className="mt-1 text-sm opacity-90">
                                {s.text}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500 text-sm">暂无</div>
                        )}
                      </div>
                    </div>

                    {/* 发挥建议 / 行动建议 */}
                    <div className="mt-5">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>💡</span>
                        <span>发挥建议</span>
                      </div>
                      <div className="mt-3 space-y-2 text-slate-700">
                        {(d.actions || []).length ? (
                          d.actions.map((x, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="mt-0.5">✅</span>
                              <span>{x}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500 text-sm">暂无</div>
                        )}
                      </div>
                    </div>

                    {/* 成长空间（低分维度才有） */}
                    {d.growth ? (
                      <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>🌱</span>
                          <span>{d.growth.title}</span>
                        </div>
                        <div className="mt-2 text-slate-600 text-sm leading-relaxed">
                          {d.growth.text}
                        </div>
                        <div className="mt-3 space-y-2 text-slate-700 text-sm">
                          {(d.growth.tips || []).map((x, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="mt-0.5">•</span>
                              <span>{x}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ✅ 职业发展指南 */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-slate-900">职业发展指南</div>
            <div className="text-sm text-slate-500">基于天赋的职业匹配</div>
          </div>

          <Card className="p-6 mt-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">推荐职业方向</div>
              <div className="text-sm text-slate-500">
                {careers.length ? `${careers.length} 个` : "暂无"}
              </div>
            </div>

            {careers.length ? (
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                {careers.map((c) => (
                  <div
                    key={`${c.rank}-${c.title}`}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500">No.{c.rank}</div>
                        <div className="mt-1 text-xl font-semibold text-slate-900">
                          {c.title}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(c.tags || []).map((t, i) => (
                            <span
                              key={`${t}-${i}`}
                              className="px-3 py-1 rounded-full text-xs bg-violet-50 border border-violet-100 text-violet-700"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm text-slate-500">匹配度</div>
                        <div className="mt-1 text-xl font-semibold text-slate-900">
                          {c.match}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-sky-500"
                        style={{ width: `${clamp(c.match, 0, 100)}%` }}
                      />
                    </div>

                    <div className="mt-4 text-slate-700">
                      <div className="text-sm text-slate-500">核心原因</div>
                      <div className="mt-1">{c.reason}</div>
                    </div>

                    <div className="mt-4 space-y-2 text-slate-700 text-sm">
                      {(c.tips || []).slice(0, 2).map((t, i) => (
                        <div key={i} className="flex gap-2">
                          <span>🚀</span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-slate-500 text-sm">暂无职业推荐</div>
            )}

            <div className="mt-5 text-xs text-slate-500">
              小贴士：选择方向时，不妨想一想哪类工作更能让你的天赋被看见、被需要。
            </div>
          </Card>
        </div>

        {/* ✅ 行动计划 */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-slate-900">行动计划</div>
            <div className="text-sm text-slate-500">分阶段成长路径</div>
          </div>

          <Card className="p-6 mt-4">
            {actionPlan ? (
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="p-5 rounded-3xl bg-white border border-slate-200">
                  <div className="font-semibold flex items-center gap-2">
                    <span>🎯</span>
                    <span>{actionPlan.shortTitle}</span>
                  </div>
                  <div className="mt-4 space-y-3 text-slate-700 text-sm">
                    {actionPlan.short.map((x, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="mt-0.5">✅</span>
                        <span>{x}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200">
                  <div className="font-semibold flex items-center gap-2">
                    <span>📈</span>
                    <span>{actionPlan.midTitle}</span>
                  </div>
                  <div className="mt-4 space-y-3 text-slate-700 text-sm">
                    {actionPlan.mid.map((x, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="mt-0.5">✅</span>
                        <span>{x}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200">
                  <div className="font-semibold flex items-center gap-2">
                    <span>🌟</span>
                    <span>{actionPlan.longTitle}</span>
                  </div>
                  <div className="mt-4 space-y-3 text-slate-700 text-sm">
                    {actionPlan.long.map((x, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="mt-0.5">✅</span>
                        <span>{x}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">暂无行动计划</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// 小工具：避免 match 超范围
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}