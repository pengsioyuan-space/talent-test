export async function onRequest(context) {
  const { env } = context;

  const tokens = [];

  for (let i = 0; i < 100; i++) {
    const token = crypto.randomUUID().replace(/-/g, "");

    await env.TOKENS.put(
      token,
      JSON.stringify({
        used: false,
        createdAt: Date.now()
      })
    );

    tokens.push(token);
  }

  return new Response(JSON.stringify(tokens), {
    headers: { "Content-Type": "application/json" }
  });
}