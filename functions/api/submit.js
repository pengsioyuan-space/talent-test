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

export async function onRequestPost(ctx) {
  try {
    const { request, env } = ctx;
    if (!env.TOKENS) return json({ ok: false, reason: "missing_kv_binding_TOKENS" }, 500);
    if (!env.RESULTS) return json({ ok: false, reason: "missing_kv_binding_RESULTS" }, 500);

    const body = await request.json().catch(() => ({}));
    const token = (body.token || new URL(request.url).searchParams.get("token") || "").trim();
    const answers = body.answers || body.payload || body.data || null;

    if (!token) return json({ ok: false, reason: "missing_token" }, 400);
    if (!answers || typeof answers !== "object") return json({ ok: false, reason: "missing_answers" }, 400);

    const raw = await env.TOKENS.get(`t:${token}`);
    if (!raw) return json({ ok: false, reason: "token_not_found" }, 404);

    const tok = JSON.parse(raw);
    if (tok.status === "used") return json({ ok: false, reason: "token_used", usedAt: tok.usedAt || null }, 409);

    // 生成报告（个性化）
    const report = buildReportFromSubmission({ token, answers });

    // 先写报告（RESULTS）
    const rid = crypto.randomUUID().replace(/-/g, "");
    await env.RESULTS.put(`r:${rid}`, JSON.stringify(report), { expirationTtl: 60 * 60 * 24 * 30 });

    // 再标记 token used（提交才消耗）
    tok.status = "used";
    tok.usedAt = new Date().toISOString();
    tok.rid = rid;
    await env.TOKENS.put(`t:${token}`, JSON.stringify(tok), { expirationTtl: 60 * 60 * 24 * 30 });

    return json({ ok: true, rid });
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