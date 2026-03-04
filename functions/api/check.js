export async function onRequest(context) {
  const { request, env } = context;

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(JSON.stringify({ ok: false, reason: "missing_token" }), {
      status: 400
    });
  }

  const data = await env.TOKENS.get(token);

  if (!data) {
    return new Response(JSON.stringify({ ok: false, reason: "invalid_token" }), {
      status: 403
    });
  }

  const parsed = JSON.parse(data);

  if (parsed.used) {
    return new Response(JSON.stringify({ ok: false, reason: "used_token" }), {
      status: 403
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
}