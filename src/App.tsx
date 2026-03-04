import { useEffect, useMemo, useState } from "react";
import { DIMENSIONS, QUESTIONS } from "./data/questions";
import { calcScores, type AnswerMap } from "./utils/score";

const OPTIONS = [
  { label: "非常符合", value: 5 },
  { label: "很符合", value: 4 },
  { label: "部分符合", value: 3 },
  { label: "不太符合", value: 2 },
  { label: "完全不符合", value: 1 },
];

function getTokenFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("token") || "";
}

export default function App() {
  const [token, setToken] = useState<string>(() => getTokenFromUrl());
  const [checked, setChecked] = useState(false);
  const [valid, setValid] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  const progress = useMemo(() => {
    const done = Object.keys(answers).length;
    return { done, total: QUESTIONS.length };
  }, [answers]);

  const result = useMemo(() => calcScores(QUESTIONS, answers), [answers]);

  async function checkToken(tk: string) {
    setChecked(false);
    setValid(false);
    setReason("");
    try {
      const res = await fetch(`/api/check?token=${encodeURIComponent(tk)}`, {
        method: "GET",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setValid(true);
      } else {
        setValid(false);
        setReason(data.reason || "invalid");
      }
    } catch (e: any) {
      setValid(false);
      setReason("network_error");
    } finally {
      setChecked(true);
    }
  }

  useEffect(() => {
    const tk = getTokenFromUrl();
    if (tk) {
      setToken(tk);
      checkToken(tk);
    } else {
      setChecked(true);
      setValid(false);
      setReason("missing_token");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setAnswer(qid: number, v: number) {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
  }

  async function onSubmit() {
    setSubmitError("");
    if (!token) {
      setSubmitError("缺少 token");
      return;
    }
    if (progress.done < progress.total) {
      setSubmitError(`还有 ${progress.total - progress.done} 题未作答`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, answers, ts: Date.now() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setSubmitted(true);
      } else {
        setSubmitError(data.reason || "提交失败");
      }
    } catch (e: any) {
      setSubmitError("网络异常，提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- UI ----
  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl bg-white shadow p-6">
          <div className="text-xl font-semibold">正在校验链接…</div>
          <div className="mt-2 text-gray-600">请稍等</div>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-xl rounded-2xl bg-white shadow p-6">
          <div className="text-2xl font-bold">天赋测试</div>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <div className="font-semibold">链接不可用</div>
            <div className="mt-1 text-sm text-gray-600">
              {reason === "missing_token" && "缺少 token：请使用完整链接（带 ?token=xxxx）"}
              {reason === "invalid_token" && "token 无效"}
              {reason === "used_token" && "该链接已使用（一次性链接）"}
              {reason === "network_error" && "网络错误：无法校验"}
              {["missing_token", "invalid_token", "used_token", "network_error"].includes(reason) === false &&
                `原因：${reason}`}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm text-gray-600">如果你是管理员，可在下方输入 token 测试：</div>
            <div className="mt-2 flex gap-2">
              <input
                className="flex-1 rounded-xl border px-3 py-2"
                value={token}
                onChange={(e) => setToken(e.target.value.trim())}
                placeholder="粘贴 token"
              />
              <button
                className="rounded-xl bg-black text-white px-4 py-2"
                onClick={() => checkToken(token)}
              >
                校验
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              说明：进入不消耗，只有提交才消耗。
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-white shadow p-6">
            <div className="text-2xl font-bold">提交成功 ✅</div>
            <div className="mt-2 text-gray-600">
              该 token 已消耗，链接将无法再次进入。
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white shadow p-6">
            <div className="text-xl font-semibold">你的天赋排序</div>
            <div className="mt-4 space-y-3">
              {result.map((r) => (
                <div key={r.dim} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{r.dim}</div>
                    <div className="text-sm text-gray-600">
                      平均 {r.avg.toFixed(2)} / 5（{r.total} 分，{r.count} 题）
                    </div>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-2 bg-black"
                      style={{ width: `${Math.min(100, (r.avg / 5) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              className="mt-6 rounded-xl border px-4 py-2"
              onClick={() => {
                const payload = { token: "USED", answers, result };
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "talent_result.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              下载结果 JSON
            </button>
          </div>
        </div>
      </div>
    );
  }

  // test page
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white shadow p-6">
          <div className="text-2xl font-bold">天赋测试</div>
          <div className="mt-2 text-gray-600">
            进度：{progress.done}/{progress.total}（进入不消耗，提交才消耗）
          </div>

          <div className="mt-4 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-2 bg-black"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>

          <div className="mt-4 text-xs text-gray-500">
            维度：{DIMENSIONS.map((d) => d.label).join(" / ")}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="rounded-2xl bg-white shadow p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-gray-500">题目 {q.id} · {q.dim}</div>
                  <div className="mt-1 text-lg font-semibold">{q.text}</div>
                </div>
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  {answers[q.id] ? `已选：${answers[q.id]}` : "未作答"}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OPTIONS.map((op) => (
                  <label
                    key={op.value}
                    className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer ${
                      answers[q.id] === op.value ? "border-black bg-gray-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === op.value}
                      onChange={() => setAnswer(q.id, op.value)}
                    />
                    <span>{op.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-white shadow p-6">
          {submitError && (
            <div className="mb-3 rounded-xl bg-red-50 text-red-700 p-3 text-sm">
              {submitError}
            </div>
          )}
          <button
            className="w-full rounded-xl bg-black text-white px-4 py-3 disabled:opacity-50"
            disabled={submitting}
            onClick={onSubmit}
          >
            {submitting ? "提交中…" : "提交并消耗链接"}
          </button>
          <div className="mt-2 text-xs text-gray-500">
            提交后 token 会被标记为 used，链接将无法再次进入。
          </div>
        </div>
      </div>
    </div>
  );
}