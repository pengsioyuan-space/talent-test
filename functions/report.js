// functions/api/report.js
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  if (!env.TOKENS) return json({ ok: false, reason: "missing_kv_binding_TOKENS" }, 500);

  const url = new URL(request.url);
  const rid = (url.searchParams.get("rid") || "").trim();
  if (!rid) return json({ ok: false, reason: "missing_rid" }, 400);

  const raw = await env.TOKENS.get(`r:${rid}`);
  if (!raw) return json({ ok: false, reason: "report_not_found" }, 404);

  const obj = JSON.parse(raw);
  return json({ ok: true, ...obj });
}