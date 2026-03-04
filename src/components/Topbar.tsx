import { useNavigate } from "react-router-dom";
import { getRid } from "../utils/storage";

export function Topbar({ right }: { right?: any }) {
  const nav = useNavigate();
  const rid = getRid();

  const defaultRight = (
    <button
      disabled={!rid}
      onClick={() => rid && nav(`/report/${rid}`)}
      className={[
        "px-4 py-2 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur",
        "text-sm md:text-base",
        "disabled:opacity-40 disabled:cursor-not-allowed",
      ].join(" ")}
      title={!rid ? "你还没有生成报告" : "查看我的报告"}
    >
      我的报告
    </button>
  );

  return (
    <div className="sticky top-0 z-50">
      <div className="bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-violet-600 grid place-items-center text-white font-semibold">
              ★
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-slate-900">天赋测试</div>
              <div className="text-xs text-slate-500">Talent Assessment</div>
            </div>
          </div>

          <div className="flex items-center gap-2">{right ?? defaultRight}</div>
        </div>
      </div>
    </div>
  );
}