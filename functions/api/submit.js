export async function onRequestPost(context) {
  try {
    const { TOKENS } = context.env;
    if (!TOKENS) return json({ ok: false, reason: "missing_kv_binding_TOKENS" }, 500);

    const body = await context.request.json().catch(() => null);
    if (!body) return json({ ok: false, reason: "invalid_json" }, 400);

    const token = (body.token || "").trim();
    const answers = body.answers || null;
    const result = body.result || null;

    if (!token) return json({ ok: false, reason: "missing_token" }, 400);

    // 先查 token
    const raw = await TOKENS.get(`t:${token}`);
    if (!raw) return json({ ok: false, reason: "invalid_token" }, 404);

    const data = JSON.parse(raw);
    if (data.status === "used") {
      return json({ ok: false, reason: "used", usedAt: data.usedAt || null }, 403);
    }

    // ✅ 提交时才消耗
    const now = Date.now();
    await TOKENS.put(
      `t:${token}`,
      JSON.stringify({ ...data, status: "used", usedAt: now }),
      { expirationTtl: 60 * 60 * 24 * 30 }
    );

    // 可选：保存结果
    await TOKENS.put(
      `r:${token}`,
      JSON.stringify({ token, submittedAt: now, answers, result }),
      { expirationTtl: 60 * 60 * 24 * 30 }
    );

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, reason: "exception", message: String(err?.message || err) }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}