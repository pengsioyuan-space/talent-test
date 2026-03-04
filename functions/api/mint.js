function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      ...extraHeaders,
    },
  });
}

function parseCookies(cookieHeader = "") {
  const out = {};
  cookieHeader.split(";").forEach((p) => {
    const [k, ...rest] = p.trim().split("=");
    if (!k) return;
    out[k] = decodeURIComponent(rest.join("=") || "");
  });
  return out;
}

function setCookie(name, value, maxAgeSec = 60 * 60 * 24 * 365) {
  // 1年
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax`;
}

export async function onRequestGet(ctx) {
  try {
    const { env, request } = ctx;
    if (!env?.TOKENS) return json({ ok: false, reason: "missing_kv_binding_TOKENS" }, 500);

    const cookies = parseCookies(request.headers.get("cookie") || "");
    let did = cookies["talent_did"] || "";

    if (!did) did = crypto.randomUUID().replace(/-/g, "");

    // 设备 -> token
    const existingToken = await env.TOKENS.get(`d:${did}`);

    // 如果已经领过 token：直接复用/拒绝
    if (existingToken) {
      const raw = await env.TOKENS.get(`t:${existingToken}`);
      if (!raw) {
        // token 丢了就清映射，让它重新领
        await env.TOKENS.delete(`d:${did}`);
      } else {
        const obj = JSON.parse(raw);
        if (obj.used === true) {
          return json(
            { ok: false, reason: "token_used" },
            409,
            { "set-cookie": setCookie("talent_did", did) }
          );
        }
        return json(
          { ok: true, token: existingToken, reused: true },
          200,
          { "set-cookie": setCookie("talent_did", did) }
        );
      }
    }

    // 没领过：发新 token
    const token = crypto.randomUUID().replace(/-/g, "");
    const now = Date.now();

    await env.TOKENS.put(`t:${token}`, JSON.stringify({ status: "new", createdAt: now, used: false }), {
      expirationTtl: 60 * 60 * 24 * 365, // token 最长存一年（你也可改 30 天）
    });

    await env.TOKENS.put(`d:${did}`, token, { expirationTtl: 60 * 60 * 24 * 365 });

    return json(
      { ok: true, token, reused: false },
      200,
      { "set-cookie": setCookie("talent_did", did) }
    );
  } catch (err) {
    return json({ ok: false, reason: "exception", message: String(err?.message || err) }, 500);
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