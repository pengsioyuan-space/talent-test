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

function scoreToLabel(score20) {
  if (score20 >= 16) return "非常擅长";
  if (score20 >= 12) return "较擅长";
  if (score20 >= 8) return "待发展";
  return "需加强";
}

const DIM_INFO = {
  "语言天赋": {
    type: "表达影响型",
    summary: "你能用清晰有力量的语言解释复杂事物，擅长说服、写作与讲述。",
    strengths: ["表达与叙事能力强", "信息组织清晰", "善于说服与沟通"],
    pitfalls: ["输出过载导致疲惫", "容易过度包装忽略事实"],
    suggestions: ["先列提纲再输出", "用例子/数据增强可信度", "沉淀常用表达模板"],
  },
  "逻辑-算数天赋": {
    type: "逻辑分析型",
    summary: "你更擅长结构化思考，喜欢用步骤、证据与模型把问题拆解清楚。",
    strengths: ["推理与验证能力强", "结构化拆解问题", "决策更依赖证据"],
    pitfalls: ["容易陷入过度分析", "忽视体验与情绪因素"],
    suggestions: ["用最小验证快速试错", "把结论写成可执行规则", "复盘沉淀方法论"],
  },
  "空间天赋": {
    type: "空间想象型",
    summary: "你对空间关系与结构更敏感，擅长构建布局、图像化理解与规划。",
    strengths: ["空间与结构感强", "可视化理解快", "擅长布局规划"],
    pitfalls: ["细节执行耐心不足", "直觉强但表达困难"],
    suggestions: ["把直觉画出来（草图/流程图）", "先粗后细迭代", "训练从 1 到 N 的落地能力"],
  },
  "内省天赋": {
    type: "自我觉察型",
    summary: "你更能觉察自身情绪与需求，善于自我调节并找到内在驱动力。",
    strengths: ["情绪识别敏锐", "自我复盘能力强", "稳定与自驱"],
    pitfalls: ["容易想太多内耗", "过度自我批评"],
    suggestions: ["把反思变成行动清单", "设置小目标与反馈回路", "减少无效比较"],
  },
  "人际天赋": {
    type: "沟通协同型",
    summary: "你更擅长理解他人、协调关系，在团队中容易成为连接器与推动者。",
    strengths: ["共情与洞察", "沟通表达顺畅", "协调冲突能力强"],
    pitfalls: ["过度在意他人评价", "承担过多情绪劳动"],
    suggestions: ["学会设边界", "用流程替代情绪消耗", "把沟通落到行动清单"],
  },
  "身体-动觉天赋": {
    type: "行动执行型",
    summary: "你在动手实践与身体协同上更有优势，擅长把想法快速变成动作。",
    strengths: ["执行力与动手能力强", "节奏推进快", "适合实践型任务"],
    pitfalls: ["不爱长时间静坐", "规划不足导致返工"],
    suggestions: ["先做原型再优化", "把目标拆成训练计划", "每阶段做复盘提升稳定输出"],
  },
  "音乐天赋": {
    type: "节律感知型",
    summary: "你对节奏、声音模式更敏感，能更快捕捉差异与规律。",
    strengths: ["节奏与听觉辨识强", "模式识别能力好", "对细微变化敏感"],
    pitfalls: ["环境噪音易干扰", "沉迷细节忽视整体"],
    suggestions: ["用节奏训练专注", "把敏感性用于审校/质检", "做输入-输出闭环"],
  },
  "自然天赋": {
    type: "观察共生型",
    summary: "你更擅长观察环境变化与生命细节，能耐心照料并系统理解生态。",
    strengths: ["观察力强", "耐心与照料能力", "系统性理解"],
    pitfalls: ["在快节奏环境不适", "容易被琐事拖住"],
    suggestions: ["用清单管理日常", "选择更稳定节奏工作流", "把观察记录结构化"],
  },
  "创造天赋": {
    type: "创新突破型",
    summary: "你更容易产生新点子，喜欢跳出框架，在不确定中探索可能性。",
    strengths: ["发散思维强", "跨界联想能力", "敢于尝试新路径"],
    pitfalls: ["点子多但落地少", "容易分心切换"],
    suggestions: ["一个点子做到底训练", "设置截止时间与交付物", "先做原型再做完美"],
  },
  "美学天赋": {
    type: "美学感知型",
    summary: "你对色彩、排版与形式细节更敏锐，擅长用“好看且有秩序”的方式表达观点。",
    strengths: ["审美与形式感强", "信息可视化表达", "对细节一致性敏感"],
    pitfalls: ["过度追求完美拖慢进度", "把美感放在功能之前"],
    suggestions: ["先定结构再做美化", "建立自己的配色/字体组件库", "多做作品集沉淀风格"],
  },
};

function computeReport(list = []) {
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
    const score20 = clamp(Math.round((sum / n) * 4), 4, 20);
    return { dim, n, sum, score20 };
  });

  dims.sort((a, b) => b.score20 - a.score20);

  const top3 = dims.slice(0, 3).map((x) => x.dim);
  const primary = dims[0]?.dim || "未知";

  const bottom2 = [...dims].sort((a, b) => a.score20 - b.score20).slice(0, 2).map((x) => x.dim);

  const base = DIM_INFO[primary] || {
    type: "综合发展型",
    summary: "你的能力分布更均衡，适合用项目驱动逐步强化优势。",
    strengths: ["能力分布较均衡", "适应性较强", "可用项目驱动成长"],
    pitfalls: ["容易缺少明显主攻方向", "目标不清时推进变慢"],
    suggestions: ["先确定一个主攻方向", "用小项目快速迭代", "周期复盘形成方法论"],
  };

  // ✅ 丰富化：把 top3 的优势合并 + bottom2 的建议合并（避免“暂无”）
  const strengths = [];
  for (const d of top3) {
    const info = DIM_INFO[d];
    if (info?.strengths?.length) strengths.push(...info.strengths.slice(0, 2));
  }
  if (strengths.length < 3) strengths.push(...base.strengths);

  const pitfalls = [];
  for (const d of top3) {
    const info = DIM_INFO[d];
    if (info?.pitfalls?.length) pitfalls.push(...info.pitfalls.slice(0, 1));
  }
  if (pitfalls.length < 2) pitfalls.push(...base.pitfalls);

  const suggestions = [];
  for (const d of bottom2) {
    const info = DIM_INFO[d];
    if (info?.suggestions?.length) suggestions.push(...info.suggestions.slice(0, 2));
  }
  suggestions.push(...base.suggestions.slice(0, 2));

  // 去重
  const uniq = (arr) => Array.from(new Set(arr)).slice(0, 8);

  return {
    createdAt: new Date().toISOString(),
    primary,
    type: base.type,
    top3,
    dims: dims.map((d) => ({ ...d, level: scoreToLabel(d.score20) })), // 多加一个 level（前端用不用都行）
    narrative: {
      type: base.type,
      summary: `你的优势集中在：${top3.join("、")}。${base.summary}`,
      strengths: uniq(strengths),
      pitfalls: uniq(pitfalls),
      suggestions: uniq(suggestions),
    },
  };
}

export async function onRequestPost(ctx) {
  try {
    const { request, env } = ctx;

    if (!env?.TOKENS) return json({ ok: false, reason: "missing_kv_binding_TOKENS" }, 500);

    const body = await request.json().catch(() => ({}));
    const token = body.token || new URL(request.url).searchParams.get("token");
    const list = body?.answers?.list;

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

    await env.TOKENS.put(
      `r:${rid}`,
      JSON.stringify({ rid, token, usedAt, report }),
      { expirationTtl: 60 * 60 * 24 * 365 }
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