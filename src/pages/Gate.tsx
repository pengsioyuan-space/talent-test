import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { Topbar } from "../components/Topbar";
import { getToken, setToken, clearAll } from "../utils/storage";

export function Gate() {
  const nav = useNavigate();
  const [token, setT] = useState(getToken());
  const [msg, setMsg] = useState("");
  const [minting, setMinting] = useState(false);

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
    const t = token.trim();
    if (!t) {
      setMsg("请输入 token");
      return;
    }

    clearAll();
    setToken(t);

    try {
      const r = await fetch(`/api/check?token=${encodeURIComponent(t)}`);
      const j = await r.json().catch(() => ({}));
      if (j.ok) nav(`/q/0`);
      else setMsg(`链接不可用：${j.reason || "unknown"}`);
    } catch {
      setMsg("网络异常，请稍后重试");
    }
  };

  // ✅ 最小新增：从 /api/mint 自动获取 token，避免 missing_token
  const onMint = async () => {
    if (minting) return;
    setMinting(true);
    setMsg("");

    try {
      const r = await fetch(`/api/mint`, { method: "GET" });
      const j = await r.json().catch(() => ({}));

      if (j?.ok && j?.token) {
        clearAll();
        setToken(j.token);
        setT(j.token);

        // 拿到 token 后直接校验并进入
        const r2 = await fetch(`/api/check?token=${encodeURIComponent(j.token)}`);
        const j2 = await r2.json().catch(() => ({}));
        if (j2.ok) nav(`/q/0`, { replace: true });
        else setMsg(`token 获取成功但校验失败：${j2.reason || "unknown"}`);
      } else {
        setMsg(`获取 token 失败：${j?.reason || "unknown"}`);
      }
    } catch (e: any) {
      setMsg(`获取 token 异常：${String(e?.message || e)}`);
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card className="p-8">
          <h1 className="text-2xl font-semibold">天赋测试</h1>
          <p className="mt-2 text-slate-600">进入不消耗，只有提交才消耗。</p>

          {msg && (
            <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-700">
              {msg}
            </div>
          )}

          <div className="mt-6">
            <div className="text-sm text-slate-600 mb-2">
              如果你是管理员，可在下方输入 token 测试：
            </div>

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

              {/* ✅ 最小新增按钮 */}
              <button
                disabled={minting}
                onClick={onMint}
                className="px-6 py-3 rounded-2xl bg-white border border-slate-200 disabled:opacity-60"
              >
                {minting ? "获取中..." : "获取token"}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}