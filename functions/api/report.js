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
    if (!env?.TOKENS) return json({ ok: false, reason: "missing_kv_binding_TOKENS" }, 500);

    const url = new URL(request.url);
    const rid = (url.searchParams.get("rid") || "").trim();
    if (!rid) return json({ ok: false, reason: "missing_rid" }, 400);

    const raw = await env.TOKENS.get(`r:${rid}`);
    if (!raw) return json({ ok: false, reason: "not_found" }, 404);

    return json({ ok: true, ...JSON.parse(raw) });
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