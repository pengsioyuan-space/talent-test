import { buildReportFromSubmission } from "./_report_impl.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

// functions/api/submit.js
export async function onRequestPost(ctx) {
  try {
    const { request, env } = ctx;
    if (!env.TOKENS) return json({ ok: false, reason: "missing_kv_binding_TOKENS" }, 500);

    const body = await request.json().catch(() => ({}));
    const token = body.token || new URL(request.url).searchParams.get("token");
    const payload = body.payload || body.answers || body.data || null;

    if (!token) return json({ ok: false, reason: "missing_token" }, 400);

    const raw = await env.TOKENS.get(`t:${token}`);
    if (!raw) return json({ ok: false, reason: "token_not_found" }, 404);

    const obj = JSON.parse(raw);
    if (obj.used) return json({ ok: false, reason: "token_used", usedAt: obj.usedAt || null }, 409);

    const usedAt = new Date().toISOString();
    obj.used = true;
    obj.usedAt = usedAt;
    obj.submission = payload;

    // ✅ 新增：生成 rid，并把报告数据存一份（最小可用）
    const rid = crypto.randomUUID().replace(/-/g, "");
    obj.rid = rid;

    await env.TOKENS.put(`t:${token}`, JSON.stringify(obj));

    // ✅ 可选：把报告单独存成 r:rid，便于 /report/:rid 读取
    await env.TOKENS.put(`r:${rid}`, JSON.stringify({ token, usedAt, submission: payload }), {
      expirationTtl: 60 * 60 * 24 * 30,
    });

    return json({ ok: true, usedAt, rid });
  } catch (e) {
    return json({ ok: false, reason: "server_error", message: String(e?.message || e) }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}