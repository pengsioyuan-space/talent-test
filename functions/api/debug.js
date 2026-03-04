function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function onRequestGet(ctx) {
  const env = ctx.env || {};
  const keys = Object.keys(env || {});
  return json({
    hasTOKENS: !!env.TOKENS,
    hasRESULTS: !!env.RESULTS,
    envKeys: keys,
    typeTOKENS: typeof env.TOKENS,
    typeRESULTS: typeof env.RESULTS,
  });
}