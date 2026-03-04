export async function onRequestGet({ env }) {
  return Response.json({
    hasTOKENS: !!env.TOKENS,
    envKeys: Object.keys(env || {}),
    typeTOKENS: typeof env.TOKENS,
  });
}