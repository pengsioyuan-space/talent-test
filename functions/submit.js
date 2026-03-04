export async function onRequest(context) {
  const { request, env } = context;

  const body = await request.json();
  const token = body.token;

  if (!token) {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }

  const data = await env.TOKENS.get(token);

  if (!data) {
    return new Response(JSON.stringify({ ok: false, reason: "invalid_token" }), { status: 403 });
  }

  const parsed = JSON.parse(data);

  if (parsed.used) {
    return new Response(JSON.stringify({ ok: false, reason: "already_used" }), { status: 403 });
  }

  parsed.used = true;
  parsed.usedAt = Date.now();

  await env.TOKENS.put(token, JSON.stringify(parsed));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
}