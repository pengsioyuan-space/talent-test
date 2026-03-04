// functions/api/submit.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    },
  });
}

function computeReport(list = []) {
  // list: [{id, dim, value}]
  const byDim = new Map();
  for (const a of list) {
    const dim = a.dim;
    const v = Number(a.value || 0);
    if (!byDim.has(dim)) byDim.set(dim, []);
    byDim.get(dim).push(v);
  }

  const dims = Array.from(byDim.entries()).map(([dim, arr]) => {
    const sum = arr.reduce((s, x) => s + x, 0);
    const n = arr.length || 1;
    // 映射到 0~20（方便你做“x/20”的展示）
    const score20 = Math.round((sum / (n * 5)) * 20);
    return { dim, n, sum, score20 };
  });

  dims.sort((a, b) => b.score20 - a.score20);

  const top = dims.slice(0, 3).map((x) => x.dim);
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
    "空间天赋": {
      type: "空间想象型",
      summary: "你对空间关系与方向更敏感，能在脑中构建结构与布局。",
      strengths: ["空间想象", "结构规划", "路线/布局构建"],
      pitfalls: ["细节执行不耐烦", "难解释自己的直觉"],
      suggestions: ["把直觉画出来", "用草图/流程图表达", "训练从1到N的细化能力"],
    },
    "内省天赋": {
      type: "自我觉察型",
      summary: "你更能觉察情绪与需求，善于自我调节并找到内在驱动力。",
      strengths: ["情绪识别", "自我复盘", "自驱与稳定性"],
      pitfalls: ["想太多陷入内耗", "过度自我批评"],
      suggestions: ["把反思变成行动", "设置小目标与反馈回路", "减少无效比较"],
    },
    "创造天赋": {
      type: "创新突破型",
      summary: "你更容易产生新点子，喜欢跳出框架，擅长在不确定中探索可能性。",
      strengths: ["发散思维", "概念创新", "跨界联想"],
      pitfalls: ["点子多但落地少", "容易分心切换"],
      suggestions: ["用“一个点子做到底”训练", "设定截止时间与交付物", "先做原型再做完美"],
    },
    "音乐天赋": {
      type: "节律感知型",
      summary: "你对节奏与声音更敏感，能更快捕捉模式与差异。",
      strengths: ["节奏感", "听觉辨识", "模式识别"],
      pitfalls: ["环境噪音易干扰", "沉迷细节影响整体"],
      suggestions: ["用节奏训练专注", "把敏感性用于审校/质检", "多做输入输出闭环"],
    },
    "自然天赋": {
      type: "观察共生型",
      summary: "你更擅长观察生命与环境变化，能捕捉细微需求并耐心照料。",
      strengths: ["观察力", "耐心与照料", "系统性理解生态"],
      pitfalls: ["在快节奏环境不适", "容易被琐事拖住"],
      suggestions: ["选择节奏更稳定的工作流", "用清单管理照料任务", "把观察记录结构化"],
    },
    "身体-动觉天赋": {
      type: "行动执行型",
      summary: "你在身体协同与动作执行上更有优势，能把想法快速变成动作。",
      strengths: ["动手能力", "执行力", "身体协调"],
      pitfalls: ["不爱长时间静坐思考", "容易忽视规划"],
      suggestions: ["用“先做再优化”", "把动作拆成训练计划", "加入阶段复盘提升稳定输出"],
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
    top3: top,
    dims,
    narrative: t,
  };
}

export async function onRequestPost(ctx) {
  try {
    const { request, env } = ctx;

    if (!env.TOKENS) return json({ ok: false, reason: "missing_kv_binding_TOKENS" }, 500);

    const body = await request.json().catch(() => ({}));
    const token = body.token || new URL(request.url).searchParams.get("token");
    const payload = body.answers?.list || body.payload?.list || body.answers?.list || body.answers || body.payload || null;

    if (!token) return json({ ok: false, reason: "missing_token" }, 400);

    const raw = await env.TOKENS.get(`t:${token}`);
    if (!raw) return json({ ok: false, reason: "token_not_found" }, 404);

    const obj = JSON.parse(raw);

    if (obj.used === true) {
      return json({ ok: false, reason: "token_used", usedAt: obj.usedAt || null }, 409);
    }

    const usedAt = new Date().toISOString();
    obj.used = true;
    obj.usedAt = usedAt;
    obj.submission = payload;

    // 生成报告 rid
    const rid = crypto.randomUUID().replace(/-/g, "");
    const report = computeReport(Array.isArray(payload?.list) ? payload.list : payload);

    await env.TOKENS.put(`t:${token}`, JSON.stringify(obj));
    await env.TOKENS.put(`r:${rid}`, JSON.stringify({ rid, token, usedAt, report }), {
      expirationTtl: 60 * 60 * 24 * 30,
    });

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