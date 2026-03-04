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
  const env = ctx.env || {};
  return json({
    ok: true,
    hasTOKENS: !!env.TOKENS,
    hasRESULTS: !!env.RESULTS,
    now: new Date().toISOString(),
    // 用来确认你部署的就是这版代码：
    reportReadsFrom: "TOKENS:r:${rid}",
    version: "debug-v1",
  });
}