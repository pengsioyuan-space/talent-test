export async function onRequestGet(context) {
  try {
    const { TOKENS } = context.env;
    if (!TOKENS) {
      return json({ ok: false, reason: "missing_kv_binding_TOKENS" }, 500);
    }

    const token = crypto.randomUUID().replace(/-/g, "");
    const now = Date.now();

    await TOKENS.put(
      `t:${token}`,
      JSON.stringify({ status: "new", createdAt: now }),
      { expirationTtl: 60 * 60 * 24 * 30 } // 30天过期
    );

    return json({ ok: true, token });
  } catch (err) {
    return json({ ok: false, reason: "exception", message: String(err?.message || err) }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}