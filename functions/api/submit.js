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

const DIM_ORDER = [
  "语言天赋",
  "逻辑-算数天赋",
  "空间天赋",
  "内省天赋",
  "人际天赋",
  "身体-动觉天赋",
  "音乐天赋",
  "自然天赋",
  "创造天赋",
  "美学天赋",
];

function levelByScore(score20) {
  if (score20 >= 16) return { label: "非常擅长", tone: "high" };
  if (score20 >= 12) return { label: "较为突出", tone: "mid" };
  if (score20 >= 8) return { label: "可发展", tone: "low" };
  return { label: "需要加强", tone: "verylow" };
}

function pickN(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length && out.length < n; i++) out.push(arr[i]);
  return out;
}

const DIM_LIB = {
  "美学天赋": {
    slogan: "以形式与细节提升信任与转化效率。",
    intro:
      "你对“好不好看”有直觉判断力，并且在意事物的形式感和细节。这种能力让你在视觉表达、产品呈现、空间布置等场景中更敏锐。",
    traits: [
      "对颜色、字体、排版等视觉元素有感觉",
      "会注意到产品/广告/官网的设计细节",
      "对穿着、家居布置有追求",
      "擅长用视觉方式整理信息（做出来的PPT更好看）",
    ],
    scenes: ["品牌与视觉呈现", "PPT/提案美化", "空间与陈列布置", "产品界面打磨"],
    pitfalls: ["外观优先忽视功能", "过度追求完美拖慢进度", "对不协调的细节过度敏感"],
    actions: [
      "先定结构再做美化：先框架、后配色与细节",
      "建立个人组件库：配色/字体/版式可复用",
      "每周做一份作品沉淀：海报/页面/封面/简历",
    ],
    synergy: {
      with: [
        ["语言天赋", "用叙事和视觉双轮驱动影响力"],
        ["空间天赋", "在结构层面提升设计一致性"],
      ],
    },
    careers: [
      ["视觉设计师", "核心就是美学创作", ["学习设计软件与理论", "做作品集，形成个人风格"]],
      ["UI/UX设计", "需要界面与交互打磨能力", ["从组件与栅格系统入手", "多做真实产品改版练习"]],
      ["品牌设计", "需要视觉体系与表达", ["练习VI/海报/包装", "研究品牌案例拆解"]],
      ["内容策划", "需要文案+审美包装", ["用视觉方式包装观点", "做内容栏目化"]],
      ["陈列/空间", "需要空间美化能力", ["学习基础空间规划", "做小场景改造练习"]],
      ["活动/营销", "需要现场氛围与视觉物料", ["掌握物料制作流程", "做活动视觉方案模板"]],
    ],
  },

  "语言天赋": {
    slogan: "用表达把复杂变简单，用叙事影响他人。",
    intro:
      "你擅长用清晰、有说服力的语言组织信息。你能把复杂事讲明白，也更容易通过文字/口头表达建立信任。",
    traits: ["能快速抓住重点并总结", "写作/表达顺畅", "擅长说服与讲故事", "能把观点结构化输出"],
    scenes: ["内容创作", "演讲汇报", "销售沟通", "课程讲解"],
    pitfalls: ["输出过载导致疲惫", "表达太快忽略听众节奏", "过度包装忽略事实支撑"],
    actions: ["先列提纲再输出", "用例子+数据增强可信度", "训练‘一句话结论’能力"],
    synergy: { with: [["人际天赋", "共情+表达 = 强影响力"], ["创造天赋", "把点子讲成可传播的故事"]] },
    careers: [
      ["内容策划", "把信息变成可传播内容", ["建立选题库", "形成栏目与模板"]],
      ["新媒体运营", "需要持续输出与复盘", ["做数据复盘", "优化标题与结构"]],
      ["销售/BD", "需要沟通与说服", ["练习需求挖掘", "用案例提升成交"]],
      ["培训讲师", "需要讲解与结构", ["做课程大纲", "练习互动设计"]],
      ["记者/编辑", "需要信息采集与表达", ["多做采访练习", "训练写作节奏"]],
      ["产品经理", "需要写PRD与推动协作", ["写清楚目标与边界", "用文档对齐团队"]],
    ],
  },

  "逻辑-算数天赋": {
    slogan: "用结构化思考做出稳健决策。",
    intro:
      "你喜欢用模型、步骤与证据来拆解问题。你能在混乱信息中找出规律，并更擅长做可验证的判断。",
    traits: ["擅长拆解问题并列步骤", "对数字和逻辑关系敏感", "善于找规律与验证", "决策更理性"],
    scenes: ["数据分析", "策略制定", "流程优化", "产品规划"],
    pitfalls: ["陷入过度分析", "忽视体验与情绪", "表达过于理性导致沟通成本"],
    actions: ["用‘最小验证’快速试错", "把结论写成可执行规则", "每周复盘沉淀方法论"],
    synergy: { with: [["空间天赋", "把结构变成可视化"], ["创造天赋", "逻辑为创新兜底"]] },
    careers: [
      ["数据分析", "需要建模与洞察", ["练习SQL/表格", "做分析报告"]],
      ["商业分析", "需要推理与策略", ["练习假设-验证", "输出策略框架"]],
      ["产品经理", "需要结构化与决策", ["训练需求拆解", "做PRD模板"]],
      ["运营策略", "需要指标与实验", ["做A/B测试", "搭建指标体系"]],
      ["咨询", "需要结构化表达", ["练MECE", "做案例拆解"]],
      ["财务/风控", "需要严谨计算", ["练习报表", "建立风险清单"]],
    ],
  },

  "人际天赋": {
    slogan: "更懂人、更会协作，能把团队拉到同一方向。",
    intro:
      "你擅长理解他人的情绪与动机，能在协作中起到连接、推动和调和的作用。",
    traits: ["共情强、会照顾感受", "擅长沟通协调", "能化解冲突", "容易成为组织里的关键节点"],
    scenes: ["团队协作", "客户沟通", "运营社群", "组织管理"],
    pitfalls: ["过度在意他人评价", "承担过多情绪劳动", "边界感不足导致消耗"],
    actions: ["学会设边界", "用流程替代情绪消耗", "把沟通落到行动清单"],
    synergy: { with: [["语言天赋", "表达+共情更有影响力"], ["内省天赋", "自我稳定更能托住团队"]] },
    careers: [
      ["HR/招聘", "需要洞察与沟通", ["练习结构化面试", "建立人才画像"]],
      ["客户成功", "需要维护关系", ["做客户节奏管理", "用数据对齐价值"]],
      ["活动/运营", "需要协调资源", ["做SOP", "训练复盘能力"]],
      ["项目管理", "需要推进协作", ["明确目标-分工-节奏", "风险前置"]],
      ["销售管理", "需要带团队", ["做话术复盘", "提升激励与辅导"]],
      ["社区/社群", "需要氛围营造", ["内容+规则", "建立激励机制"]],
    ],
  },

  // 其他维度也给“基础模板”，避免空白
  "空间天赋": {
    slogan: "把结构装进脑海，用布局理解世界。",
    intro: "你更擅长空间想象、结构布局与视觉化表达，能在脑中快速构建模型和结构。",
    traits: ["空间感强", "喜欢画草图/做结构图", "擅长路径规划", "对布局与结构敏感"],
    scenes: ["产品结构/信息架构", "空间规划", "视觉化表达", "工程/制图"],
    pitfalls: ["细节执行不耐烦", "直觉难以言传", "容易跳步"],
    actions: ["把直觉画出来", "用流程图表达", "训练从1到N细化能力"],
    synergy: { with: [["美学天赋", "结构+审美 = 高质量呈现"], ["逻辑-算数天赋", "模型更严谨"]] },
    careers: [
      ["产品设计/信息架构", "需要结构能力", ["画流程图", "做竞品拆解"]],
      ["建筑/室内", "需要空间规划", ["练制图", "做案例复刻"]],
      ["3D/动画", "需要空间想象", ["练建模", "做作品集"]],
      ["工程规划", "需要结构与路径", ["练项目拆解", "做计划图"]],
      ["摄影/构图", "需要画面结构", ["练构图", "做主题拍摄"]],
      ["数据可视化", "需要结构呈现", ["学图表规范", "做仪表盘"]],
    ],
  },

  "内省天赋": {
    slogan: "更懂自己，能稳定输出与长期成长。",
    intro: "你更能觉察情绪与需求，善于自我调节并找到内在驱动力。",
    traits: ["能觉察情绪变化", "喜欢复盘与总结", "自我驱动强", "价值观清晰"],
    scenes: ["自我管理", "长期项目", "研究型工作", "咨询/辅导"],
    pitfalls: ["想太多内耗", "过度自我批评", "行动慢"],
    actions: ["把反思变成行动", "设小目标与反馈回路", "减少无效比较"],
    synergy: { with: [["人际天赋", "稳定的连接者"], ["逻辑-算数天赋", "复盘更系统"]] },
    careers: [
      ["研究/分析", "需要长期专注", ["做知识库", "输出研究笔记"]],
      ["心理/辅导", "需要觉察与陪伴", ["练倾听", "学基础方法"]],
      ["写作/创作", "需要自我表达", ["写日记", "做主题输出"]],
      ["产品/策略", "需要复盘", ["做复盘模板", "坚持迭代"]],
      ["咨询", "需要洞察", ["积累案例", "训练表达"]],
      ["教育", "需要稳定陪伴", ["设计课程", "做反馈闭环"]],
    ],
  },

  "身体-动觉天赋": {
    slogan: "把想法变成动作，靠执行赢得结果。",
    intro: "你在身体协调与动作执行上更有优势，能把想法快速变成行动。",
    traits: ["动手能力强", "执行力高", "喜欢边做边学", "对身体节奏敏感"],
    scenes: ["运动/训练", "手作/制作", "现场执行", "带教训练"],
    pitfalls: ["不爱久坐规划", "容易忽略复盘", "冲动推进"],
    actions: ["用‘先做再优化’", "把动作拆成训练计划", "加入阶段复盘提升稳定输出"],
    synergy: { with: [["人际天赋", "带动团队执行"], ["美学天赋", "手作+美感更出彩"]] },
    careers: [
      ["运动教练", "需要身体素质与教学", ["先考证", "练教学设计"]],
      ["手工/工艺", "需要精细操作", ["从一个门类深耕", "做作品集"]],
      ["活动执行", "需要现场统筹", ["做清单", "练应变"]],
      ["舞台/表演", "需要肢体表达", ["练基本功", "做输出"]],
      ["摄影助理/棚拍", "需要动手与协作", ["熟悉器材", "练流程"]],
      ["产品打样/制作", "需要动手能力", ["学工艺", "练稳定交付"]],
    ],
  },

  "音乐天赋": {
    slogan: "对节奏与模式敏感，能捕捉细微差异。",
    intro: "你对节奏、声音和模式识别更敏感，常能更快发现差异与规律。",
    traits: ["节奏感较强", "对声音细节敏感", "模式识别快", "适合精细校验"],
    scenes: ["音乐/音频", "语言发音", "质检审校", "节奏训练"],
    pitfalls: ["环境噪音干扰", "沉迷细节影响整体", "易分心"],
    actions: ["用节奏训练专注", "把敏感性用于审校/质检", "输入输出闭环：练→录→改"],
    synergy: { with: [["语言天赋", "发音与表达更强"], ["内省天赋", "用音乐调节状态"]] },
    careers: [
      ["音频剪辑", "需要听觉敏感", ["练软件", "做样片"]],
      ["配音", "需要表达与节奏", ["练发声", "录作品"]],
      ["音乐教育", "需要教学与节奏", ["练课程", "做示范"]],
      ["内容审校", "需要细节敏感", ["建立检查表", "练稳定性"]],
      ["播客运营", "需要内容+音频", ["做选题", "做剪辑模板"]],
      ["产品质检", "需要发现差异", ["做标准", "建立流程"]],
    ],
  },

  "自然天赋": {
    slogan: "善于观察生命与环境变化，耐心而系统。",
    intro: "你更擅长观察自然与环境，能捕捉细微变化并耐心照料。",
    traits: ["观察力强", "耐心", "喜欢分类整理", "在稳定节奏下发挥好"],
    scenes: ["生态/农业", "教育科普", "实验观察", "养护照料"],
    pitfalls: ["快节奏环境不适", "被琐事拖住", "不善自我营销"],
    actions: ["用清单管理照料任务", "把观察记录结构化", "选择稳定节奏的工作流"],
    synergy: { with: [["内省天赋", "稳定输出"], ["逻辑-算数天赋", "观察更科学"]] },
    careers: [
      ["科普教育", "需要观察与表达", ["做小课", "建立素材库"]],
      ["园艺/养护", "需要耐心与照料", ["做养护计划", "记录成长"]],
      ["实验助理", "需要细致观察", ["学记录规范", "练复盘"]],
      ["宠物行业", "需要照料与沟通", ["做流程", "练服务"]],
      ["环保项目", "需要组织与长期推进", ["做项目计划", "建立协作"]],
      ["内容创作", "需要素材与表达", ["写观察笔记", "做系列输出"]],
    ],
  },

  "创造天赋": {
    slogan: "不断产生新点子，在不确定中探索可能性。",
    intro: "你更容易跳出框架产生新想法，擅长在不确定里探索方向。",
    traits: ["点子多", "联想强", "喜欢尝试新事物", "对新鲜事敏感"],
    scenes: ["创意策划", "产品创新", "内容创作", "活动设计"],
    pitfalls: ["点子多落地少", "频繁切换分心", "缺少收尾习惯"],
    actions: ["一个点子做到底训练", "设截止时间与交付物", "先原型后完美"],
    synergy: { with: [["逻辑-算数天赋", "创新更可落地"], ["语言天赋", "更容易传播"]] },
    careers: [
      ["创意策划", "需要点子与执行", ["做提案模板", "练落地清单"]],
      ["产品经理", "需要探索与验证", ["做MVP", "用数据验证"]],
      ["广告/文案", "需要创意表达", ["做案例拆解", "练标题与脚本"]],
      ["内容创作", "需要持续产出", ["做栏目", "建立选题库"]],
      ["创业", "需要不确定探索", ["做用户访谈", "快速试错"]],
      ["品牌增长", "需要创意+数据", ["做增长实验", "复盘沉淀"]],
    ],
  },
};

function typeNameFromTop(top3) {
  const key = top3.slice(0, 3).join("|");
  const map = {
    "美学天赋|身体-动觉天赋|语言天赋": "美学感知型",
    "逻辑-算数天赋|空间天赋|创造天赋": "逻辑创新型",
    "人际天赋|语言天赋|创造天赋": "沟通创造型",
    "身体-动觉天赋|音乐天赋|美学天赋": "艺术表现型",
  };
  return map[key] || `${top3[0]}主导型`;
}

function computeDims(list) {
  const byDim = new Map();
  for (const dim of DIM_ORDER) byDim.set(dim, []);

  for (const a of list) {
    const dim = a?.dim;
    if (!dim) continue;
    const v = clamp(Number(a.value || 0), 1, 5);
    if (!byDim.has(dim)) byDim.set(dim, []);
    byDim.get(dim).push(v);
  }

  const dims = DIM_ORDER.map((dim) => {
    const arr = byDim.get(dim) || [];
    const sum = arr.reduce((s, x) => s + x, 0);
    const n = arr.length || 0;
    const avg = n ? sum / n : 1;
    const score20 = clamp(Math.round(avg * 4), 4, 20); // 1..5 => 4..20
    return { dim, n: n || 1, sum: sum || 1, score20 };
  });

  dims.sort((a, b) => b.score20 - a.score20);
  return dims;
}

function enrichDimNarrative(dim, score20, top3, lows) {
  const base = DIM_LIB[dim] || {
    slogan: "持续练习，逐步提升你的能力表现。",
    intro: "这个维度反映你在相关能力上的倾向与表现。",
    traits: [],
    scenes: [],
    pitfalls: [],
    actions: [],
    synergy: { with: [] },
    careers: [],
  };

  const level = levelByScore(score20);

  // 低分维度增加“成长空间”提示
  const growthHint =
    lows.includes(dim)
      ? {
          title: "成长空间",
          text:
            "这一项分数相对偏低，建议用“小步快跑”的方式练习：每天 10 分钟，坚持 2 周就能看到变化。",
          tips: pickN(base.actions.length ? base.actions : ["从一个小练习开始，每天坚持。"], 2),
        }
      : null;

  // 与 top3 的协同：用库里 2 条，不够就补
  const synergy = base.synergy?.with?.length
    ? base.synergy.with
    : [
        [top3[0], "把你的优势用于协同提升这一项表现"],
        [top3[1] || top3[0], "用组合能力提高稳定输出"],
      ];

  return {
    dim,
    score20,
    level: level.label,
    slogan: base.slogan,
    intro: base.intro,
    traits: base.traits || [],
    scenes: base.scenes || [],
    pitfalls: base.pitfalls || [],
    synergy: synergy.map(([d, t]) => ({ dim: d, text: t })),
    actions: base.actions || [],
    growth: growthHint,
  };
}

function buildCareers(top3) {
  // 按 top3 合并职业池（去重后取 6）
  const pool = [];
  for (const d of top3) {
    const lib = DIM_LIB[d];
    if (!lib?.careers) continue;
    for (const c of lib.careers) {
      pool.push({
        title: c[0],
        reason: c[1],
        tips: c[2] || [],
        tags: [d.replace("天赋", "")],
      });
    }
  }

  // 去重
  const seen = new Set();
  const uniq = [];
  for (const x of pool) {
    if (seen.has(x.title)) continue;
    seen.add(x.title);
    uniq.push(x);
  }

  // 打分：与 top3 越相关越高（简单规则）
  const scored = uniq.map((x) => {
    const match = top3.some((d) => x.tags.includes(d.replace("天赋", ""))) ? 1 : 0.8;
    return { ...x, match };
  });

  scored.sort((a, b) => b.match - a.match);
  return scored.slice(0, 6).map((x, i) => ({
    rank: i + 1,
    title: x.title,
    match: Math.round(x.match * 100),
    tags: x.tags,
    reason: x.reason,
    tips: x.tips,
  }));
}

function buildActionPlan(primaryDim) {
  const lib = DIM_LIB[primaryDim] || { actions: [] };
  const short = [
    "建立一个“美图收藏夹/案例库”，每天存 5 个你觉得好的作品并写一句原因",
    "开始一个可以坚持的训练项目（哪怕只是走路/基础练习），保持节奏",
    "在工作/学习中主动接一次“总结/整理”的任务，训练结构化表达",
  ];
  const mid = [
    "完成一个有质感的作品（PPT/海报/页面/空间小改造），并公开展示/存档",
    "挑战一个更高难度的目标（例如完成一次完整提案/完整作品集）",
    "建立个人作品集/案例库，记录成长与复盘",
  ];
  const long = [
    "持续思考：你希望被别人记住的能力标签是什么？写下 3 句话并定期更新",
    "选择一个长期方向做深耕：每季度交付一个可展示成果",
  ];

  // 如果库里有 actions，就替换短期部分更贴近主导维度
  const libShort = pickN(lib.actions || [], 3);
  return {
    shortTitle: "短期目标 1-3 个月",
    short: libShort.length ? libShort : short,
    midTitle: "中期发展 6-12 个月",
    mid,
    longTitle: "长期愿景 持续思考",
    long,
  };
}

function computeReport(list = []) {
  const dims = computeDims(list);
  const top3 = dims.slice(0, 3).map((x) => x.dim);
  const primary = top3[0] || "未知";
  const lows = dims.slice(-3).map((x) => x.dim);

  const type = typeNameFromTop(top3);
  const primaryLib = DIM_LIB[primary] || {};

  // 每个维度都生成一套解读（你要的“维度对应结果”）
  const dimNarratives = dims.map((d) => enrichDimNarrative(d.dim, d.score20, top3, lows));

  return {
    createdAt: new Date().toISOString(),

    // 头部
    primary,
    type,
    top3,

    // 分数
    dims,

    // 类型解读（更丰富）
    narrative: {
      type,
      summary:
        primaryLib?.intro ||
        `你的优势集中在：${top3.join("、")}。建议把优势用于真实项目，形成作品与方法论。`,
      strengths: pickN(primaryLib?.traits || [], 3),
      pitfalls: pickN(primaryLib?.pitfalls || [], 3),
      suggestions: pickN(primaryLib?.actions || [], 3),
    },

    // ✅ 新增：每维度深度解读
    dimNarratives,

    // ✅ 新增：职业推荐
    careers: buildCareers(top3),

    // ✅ 新增：行动计划（分阶段）
    actionPlan: buildActionPlan(primary),
  };
}

export async function onRequestPost(ctx) {
  try {
    const { request, env } = ctx;

    // 只用 TOKENS 一个 KV
    if (!env?.TOKENS) return json({ ok: false, reason: "missing_kv_binding_TOKENS" }, 500);

    const body = await request.json().catch(() => ({}));
    const token = body.token || new URL(request.url).searchParams.get("token");
    const list = body?.answers?.list; // { token, answers: { list } }

    if (!token) return json({ ok: false, reason: "missing_token" }, 400);
    if (!Array.isArray(list) || list.length === 0) return json({ ok: false, reason: "missing_answers" }, 400);

    const raw = await env.TOKENS.get(`t:${token}`);
    if (!raw) return json({ ok: false, reason: "token_not_found" }, 404);

    const obj = JSON.parse(raw);
    if (obj.used === true) {
      return json({ ok: false, reason: "token_used", usedAt: obj.usedAt || null }, 409);
    }

    // 标记 used：提交才消耗（满足你的规则）
    const usedAt = new Date().toISOString();
    obj.used = true;
    obj.usedAt = usedAt;

    const rid = crypto.randomUUID().replace(/-/g, "");
    const report = computeReport(list);

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