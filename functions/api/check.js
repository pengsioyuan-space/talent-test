export async function onRequestGet(context) {
  try {
    const { TOKENS } = context.env;
    if (!TOKENS) return json({ ok: false, reason: "missing_kv_binding_TOKENS" }, 500);

    const url = new URL(context.request.url);
    const token = (url.searchParams.get("token") || "").trim();
    if (!token) return json({ ok: false, reason: "missing_token" }, 400);

    const raw = await TOKENS.get(`t:${token}`);
    if (!raw) return json({ ok: false, reason: "invalid_token" }, 404);

    const data = JSON.parse(raw);
    if (data.status === "used") return json({ ok: false, reason: "used", usedAt: data.usedAt || null }, 403);

    return json({ ok: true, status: data.status, createdAt: data.createdAt });
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