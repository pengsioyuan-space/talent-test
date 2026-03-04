import { useNavigate } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { Card } from "../components/Card";
import { DIMENSIONS, QUESTIONS } from "../data/questions";

export function Home() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen">
      <Topbar right={
        <button className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm">我的报告</button>
      }/>

      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm">
            ★ {QUESTIONS.length} 道题目 · 10 大天赋维度
          </div>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight">发现你的天赋密码</h1>
          <p className="mt-4 text-slate-600 leading-relaxed">
            每个人都有独特的天赋组合。这个测试帮你发现：你最擅长的领域是什么，以及如何发挥你的优势。
          </p>
          <button
            onClick={() => nav("/test")}
            className="mt-8 px-10 py-4 rounded-full bg-violet-600 text-white text-lg shadow-[0_12px_40px_rgba(139,92,246,0.25)]"
          >
            ▶ 开始探索
          </button>
        </div>

        <div className="mt-12 grid md:grid-cols-4 gap-4">
          {[
            { t: "6-8", s: "分钟完成" },
            { t: `${QUESTIONS.length}`, s: "道题目" },
            { t: "10", s: "天赋维度" },
            { t: "100%", s: "隐私保护" },
          ].map((x, i) => (
            <Card key={i} className="p-6 text-center">
              <div className="text-3xl font-semibold">{x.t}</div>
              <div className="mt-2 text-slate-500">{x.s}</div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-semibold">十大天赋维度</h2>
          <p className="mt-2 text-slate-600">基于多元智能理论，全面评估你的能力倾向</p>
        </div>

        <div className="mt-8 grid md:grid-cols-5 gap-4">
          {DIMENSIONS.map((d) => (
            <Card key={d.key} className="p-6 text-center hover:-translate-y-0.5 transition">
              <div className="text-lg font-semibold">{d.label}</div>
              <div className="mt-2 text-xs text-slate-500">点击开始测评后进入题目页</div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-semibold">准备好发现你的天赋了吗？</h2>
          <p className="mt-2 text-slate-600">只需几分钟，根据直觉作答，发现你的独特优势～</p>
          <button
            onClick={() => nav("/test")}
            className="mt-6 px-10 py-4 rounded-full bg-violet-600 text-white shadow-[0_12px_40px_rgba(139,92,246,0.25)]"
          >
            ★ 开始测试
          </button>
        </div>
      </div>
    </div>
  );
}