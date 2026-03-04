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

export async function onRequestGet(ctx) {
  try {
    const { env, request } = ctx;
    if (!env?.RESULTS) return json({ ok: false, reason: "missing_kv_binding_RESULTS" }, 500);

    const url = new URL(request.url);
    const rid = (url.searchParams.get("rid") || "").trim();
    if (!rid) return json({ ok: false, reason: "missing_rid" }, 400);

    const raw = await env.RESULTS.get(`r:${rid}`);
    if (!raw) return json({ ok: false, reason: "not_found" }, 404);

    // 你前端 Report.tsx 期望 j.ok=true 且字段结构里有 report
    const data = JSON.parse(raw);
    return json({ ok: true, ...data });
  } catch (e) {
    return json({ ok: false, reason: "exception", message: String(e?.message || e) }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}