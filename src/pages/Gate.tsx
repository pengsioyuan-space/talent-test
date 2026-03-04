import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { Topbar } from "../components/Topbar";
import { getToken, setToken, clearAll } from "../utils/storage";

export function Gate() {
  const nav = useNavigate();
  const [token, setT] = useState(getToken());
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const t = getToken();
    if (!t) return;
    fetch(`/api/check?token=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) nav(`/q/0`, { replace: true });
        else setMsg(`链接不可用：${j.reason || "unknown"}`);
      })
      .catch(() => setMsg("网络异常，请稍后重试"));
  }, [nav]);

  const onVerify = async () => {
    clearAll();
    setToken(token.trim());
    const r = await fetch(`/api/check?token=${encodeURIComponent(token.trim())}`);
    const j = await r.json();
    if (j.ok) nav(`/q/0`);
    else setMsg(`链接不可用：${j.reason || "unknown"}`);
  };

  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card className="p-8">
          <h1 className="text-2xl font-semibold">天赋测试</h1>
          <p className="mt-2 text-slate-600">进入不消耗，只有提交才消耗。</p>

          {msg && <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-700">{msg}</div>}

          <div className="mt-6">
            <div className="text-sm text-slate-600 mb-2">如果你是管理员，可在下方输入 token 测试：</div>
            <div className="flex gap-3">
              <input
                value={token}
                onChange={(e) => setT(e.target.value)}
                placeholder="粘贴 token"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-violet-200"
              />
              <button
                onClick={onVerify}
                className="px-6 py-3 rounded-2xl bg-violet-600 text-white shadow-[0_12px_40px_rgba(139,92,246,0.25)]"
              >
                校验
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}