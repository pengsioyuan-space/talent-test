// functions/api/check.js

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

    if (!env?.TOKENS) {
      return json({ ok: false, reason: "missing_kv_binding_TOKENS" }, 500);
    }

    const url = new URL(request.url);
    const token = (url.searchParams.get("token") || "").trim();

    if (!token) {
      return json({ ok: false, reason: "missing_token" }, 400);
    }

    const raw = await env.TOKENS.get(`t:${token}`);

    if (!raw) {
      return json({ ok: false, reason: "token_not_found" }, 404);
    }

    const obj = JSON.parse(raw);

    if (obj.used === true) {
      return json({
        ok: false,
        reason: "token_used",
        usedAt: obj.usedAt || null,
      });
    }

    return json({
      ok: true,
      createdAt: obj.createdAt || null,
    });

  } catch (e) {
    return json({
      ok: false,
      reason: "server_error",
      message: String(e?.message || e),
    }, 500);
  }
}