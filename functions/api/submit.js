// functions/api/submit.js

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

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function computeReport(list = []) {
  // list: [{id, dim, value}]
  const byDim = new Map();
  for (const a of list) {
    const dim = a?.dim;
    if (!dim) continue;
    const v = clamp(Number(a.value || 0), 1, 5);
    if (!byDim.has(dim)) byDim.set(dim, []);
    byDim.get(dim).push(v);
  }

  const dims = Array.from(byDim.entries()).map(([dim, arr]) => {
    const sum = arr.reduce((s, x) => s + x, 0);
    const n = arr.length || 1;
    const score20 = clamp(Math.round((sum / n) * 4), 4, 20); // 1~5 -> 4~20
    return { dim, n, sum, score20 };
  });

  dims.sort((a, b) => b.score20 - a.score20);

  const top3 = dims.slice(0, 3).map((x) => x.dim);
  const primary = dims[0]?.dim || "未知";

  const templates = {
    "美学天赋": {
      type: "美学感知型",
      summary: "你对色彩、排版与形式细节更敏锐，擅长用“好看且有秩序”的方式表达观点。",
      strengths: ["审美与形式感", "信息可视化表达", "对细节一致性敏感"],
      pitfalls: ["过度追求完美拖慢进度", "把美感放在功能之前"],
      suggestions: ["先定结构再做美化", "建立自己的配色/字体组件库", "多做作品集沉淀风格"],
    },
    "人际天赋": {
      type: "沟通协同型",
      summary: "你更擅长理解他人、协调关系，在团队中容易成为连接器与推动者。",
      strengths: ["共情与洞察", "沟通表达", "协调冲突"],
      pitfalls: ["过度在意他人评价", "承担过多情绪劳动"],
      suggestions: ["学会设边界", "用流程替代情绪消耗", "把沟通落到具体行动清单"],
    },
    "逻辑-算数天赋": {
      type: "逻辑分析型",
      summary: "你更擅长结构化思考，喜欢用步骤、证据与模型把问题拆解清楚。",
      strengths: ["抽象与建模", "推理与验证", "高效决策"],
      pitfalls: ["忽视感受与体验", "陷入过度分析"],
      suggestions: ["用最小验证快速试错", "把结论写成可执行规则", "多做复盘沉淀方法论"],
    },
    "语言天赋": {
      type: "表达影响型",
      summary: "你能用清晰有力量的语言解释复杂事物，擅长说服、写作与讲述。",
      strengths: ["表达与叙事", "说服与演讲", "信息组织"],
      pitfalls: ["输出过载导致疲惫", "过度包装忽略事实"],
      suggestions: ["先列提纲再输出", "建立常用表达模板", "用数据/例子增强可信度"],
    },
  };

  const t = templates[primary] || {
    type: "综合发展型",
    summary: "你的能力分布更均衡，适合用项目驱动逐步强化优势。",
    strengths: [],
    pitfalls: [],
    suggestions: [],
  };

  return {
    createdAt: new Date().toISOString(),
    primary,
    type: t.type,
    top3,
    dims,
    narrative: t,
  };
}

export async function onRequestPost(ctx) {
  try {
    const { request, env } = ctx;

    // ✅ 最小：只用 TOKENS 一个 KV
    if (!env?.TOKENS) return json({ ok: false, reason: "missing_kv_binding_TOKENS" }, 500);

    const body = await request.json().catch(() => ({}));

    const token = body.token || new URL(request.url).searchParams.get("token");
    const list = body?.answers?.list; // 前端：{ token, answers: { list } }

    if (!token) return json({ ok: false, reason: "missing_token" }, 400);
    if (!Array.isArray(list) || list.length === 0) return json({ ok: false, reason: "missing_answers" }, 400);

    const raw = await env.TOKENS.get(`t:${token}`);
    if (!raw) return json({ ok: false, reason: "token_not_found" }, 404);

    const obj = JSON.parse(raw);
    if (obj.used === true) {
      return json({ ok: false, reason: "token_used", usedAt: obj.usedAt || null }, 409);
    }

    const usedAt = new Date().toISOString();
    obj.used = true;
    obj.usedAt = usedAt;

    const rid = crypto.randomUUID().replace(/-/g, "");
    const report = computeReport(list);

    await env.TOKENS.put(`t:${token}`, JSON.stringify(obj));

    // ✅ 报告也存 TOKENS（关键改动）
    await env.TOKENS.put(
      `r:${rid}`,
      JSON.stringify({ rid, token, usedAt, report }),
      { expirationTtl: 60 * 60 * 24 * 30 }
    );

    return json({ ok: true, rid, usedAt });
  } catch (e) {
    return json({ ok: false, reason: "server_error", message: String(e?.message || e) }, 500);
  }
}

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