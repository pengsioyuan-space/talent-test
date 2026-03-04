// functions/api/submit.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}

export async function onRequestPost(ctx) {
  try {
    const { request, env } = ctx;

    if (!env.TOKENS) {
      return json({ ok: false, reason: "missing_kv_binding_TOKENS" }, 500);
    }

    const body = await request.json().catch(() => ({}));
    const token = body.token || new URL(request.url).searchParams.get("token");
    const payload = body.payload || body.answers || body.data || null; // 兼容你前端字段名

    if (!token) return json({ ok: false, reason: "missing_token" }, 400);

    // 读取 token 状态
    const raw = await env.TOKENS.get(`t:${token}`);
    if (!raw) return json({ ok: false, reason: "token_not_found" }, 404);

    const obj = JSON.parse(raw);

    if (obj.used) {
      return json({ ok: false, reason: "token_used", usedAt: obj.usedAt || null }, 409);
    }

    // 标记 used（提交才消耗）
    const usedAt = new Date().toISOString();
    obj.used = true;
    obj.usedAt = usedAt;

    // 可选：把提交内容也存进去（不想存可以删掉这两行）
    obj.submission = payload;

    await env.TOKENS.put(`t:${token}`, JSON.stringify(obj));

    return json({ ok: true, usedAt });
  } catch (e) {
    return json({ ok: false, reason: "server_error", message: String(e?.message || e) }, 500);
  }
}

// 处理预检（可选，但很多浏览器/跨域会用到）
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