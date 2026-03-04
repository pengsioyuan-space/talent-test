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
    const { env } = ctx;

    if (!env?.TOKENS) {
      return json({ ok: false, reason: "missing_kv_binding_TOKENS" }, 500);
    }

    const token = crypto.randomUUID().replace(/-/g, "");
    const now = Date.now();

    await env.TOKENS.put(
      `t:${token}`,
      JSON.stringify({ status: "new", createdAt: now, used: false }),
      { expirationTtl: 60 * 60 * 24 * 30 } // 30天
    );

    return json({ ok: true, token });
  } catch (err) {
    return json(
      { ok: false, reason: "exception", message: String(err?.message || err) },
      500
    );
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