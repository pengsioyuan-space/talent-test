import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { Topbar } from "../components/Topbar";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

type ReportData = any;

export function Report() {
  const { rid } = useParams();
  const [data, setData] = useState<ReportData | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/report?rid=${encodeURIComponent(rid || "")}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) setErr(j.reason || "load_failed");
        else setData(j.report);
      })
      .catch(() => setErr("network_error"));
  }, [rid]);

  return (
    <div className="min-h-screen">
      <Topbar right={<div className="text-xs text-slate-500">我的报告</div>} />

      <div className="mx-auto max-w-5xl px-4 py-10">
        {err && (
          <Card className="p-6 border border-rose-200 bg-rose-50 text-rose-700">
            加载失败：{err}
          </Card>
        )}

        {data && (
          <>
            <div className="text-center mb-8">
              <div className="text-3xl font-semibold">天赋能力测试报告</div>
              <div className="mt-2 text-slate-600">{data.type?.summary}</div>
            </div>

            <Card className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                  {data.type?.name}
                </span>
                <div className="text-sm text-slate-500">{(data.type?.tags || []).join(" · ")}</div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 bg-white/55">
                  <div className="font-semibold mb-3">天赋能力图谱</div>
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <RadarChart data={data.radar}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="key" />
                        <Radar dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-6 bg-white/55">
                  <div className="font-semibold mb-4">各项天赋详情</div>
                  <div className="space-y-3">
                    {data.breakdown.map((x: any) => (
                      <div key={x.dim} className="flex items-center gap-3">
                        <div className="w-28 text-sm text-slate-700">{x.dim}</div>
                        <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full bg-violet-600" style={{ width: `${(x.score / 20) * 100}%` }} />
                        </div>
                        <div className="w-20 text-right text-xs text-slate-500">{x.score}/20</div>
                        <div className="w-20 text-right text-xs px-2 py-1 rounded-full bg-slate-100">{x.level}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <Card className="p-8">
                <div className="font-semibold mb-4">核心优势组合</div>
                <div className="space-y-4">
                  {data.sections?.strengths?.map((s: any) => (
                    <div key={s.title} className="rounded-2xl bg-violet-50 border border-violet-100 p-5">
                      <div className="font-medium text-violet-700 mb-2">{s.title}</div>
                      <ul className="list-disc pl-5 text-slate-700 space-y-1">
                        {s.bullets.map((b: string, i: number) => <li key={i}>{b}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8">
                <div className="font-semibold mb-4">成长空间</div>
                <div className="space-y-4">
                  {data.sections?.growth?.map((g: any) => (
                    <div key={g.title} className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
                      <div className="font-medium text-amber-700 mb-2">{g.title}</div>
                      <ul className="list-disc pl-5 text-slate-700 space-y-1">
                        {g.bullets.map((b: string, i: number) => <li key={i}>{b}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}