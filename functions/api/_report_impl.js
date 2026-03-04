// 这里用“规则+模板”生成个性化报告，不依赖外部AI，稳定可控
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

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function scoreLevel(score20) {
  if (score20 >= 16) return { label: "非常擅长", tag: "16-20" };
  if (score20 >= 12) return { label: "有些擅长", tag: "12-15" };
  return { label: "有待发展", tag: "4-11" };
}

function typeNameFromTop(topDims) {
  // 你可以随时扩展这张“组合->类型名”的表
  const key = topDims.slice(0, 3).join("|");
  const map = {
    "美学天赋|身体-动觉天赋|语言天赋": "美学感知型",
    "逻辑-算数天赋|空间天赋|创造天赋": "逻辑创新型",
    "人际天赋|语言天赋|创造天赋": "沟通创造型",
    "身体-动觉天赋|音乐天赋|美学天赋": "艺术表现型",
  };
  return map[key] || `${topDims[0]}主导型`;
}

function dimDesc(dim) {
  const m = {
    "语言天赋": "语言表达与文字驾驭",
    "逻辑-算数天赋": "数学计算与逻辑推理",
    "空间天赋": "空间想象与方向感知",
    "内省天赋": "自我认知与情绪管理",
    "人际天赋": "人际交往与共情协作",
    "身体-动觉天赋": "身体协调与动手能力",
    "音乐天赋": "节奏感知与音乐表达",
    "自然天赋": "自然观察与生态理解",
    "创造天赋": "创新思维与突破常规",
    "美学天赋": "审美感知与艺术表达",
  };
  return m[dim] || "";
}

function adviceForDim(dim, levelTag) {
  // levelTag: "16-20" / "12-15" / "4-11"
  const hi = {
    "美学天赋": ["把审美落到作品：做一套个人视觉风格（配色/字体/版式）", "用作品集沉淀：海报/网页/作品包装"],
    "逻辑-算数天赋": ["用结构化框架输出：问题拆解-假设-验证", "尝试把复杂问题做成可视化图解"],
    "人际天赋": ["在协作中担任“对齐者”：目标-分工-节奏", "练习高质量提问与复述确认"],
  };
  const lo = {
    "美学天赋": ["每天收藏 5 个好看的设计并写 1 句原因", "用 Canva/Figma 复刻一个组件练手"],
    "逻辑-算数天赋": ["用“步骤清单”解决问题：先列步骤再动手", "每天做 1 道小推理题/数独"],
    "人际天赋": ["对话时先复述对方核心观点再回应", "每周主动做一次“感谢/肯定”表达"],
  };
  if (levelTag === "16-20") return hi[dim] || ["把优势用在真实场景中，形成可复用的方法。"];
  if (levelTag === "12-15") return ["这是你的增长优势区：多做真实项目，能力会加速上升。"];
  return lo[dim] || ["从小练习开始，把能力拆成可执行的日常动作。"];
}

export function buildReportFromSubmission({ token, answers }) {
  // answers: { [questionId]: 1..5 } 或 { [index]: 1..5 } 都兼容
  // 你前端我会用 questionId 存，这里做两种兼容
  const byDim = new Map();
  for (const d of DIM_ORDER) byDim.set(d, []);

  // 题库：为了后端独立运行，这里写死一份 dim 映射（最稳的方法是：前端 submit 也把题库摘要带上来）
  // 为简单起见：后端直接从 answers 的 key 推断不了 dim，所以我们要求前端传：[{id,dim,value}]
  // ——我下面给的前端 submit 就会按这个格式传。
  const list = Array.isArray(answers) ? answers : answers.list;
  if (!Array.isArray(list)) {
    return {
      token,
      createdAt: new Date().toISOString(),
      error: "bad_answers_format",
      message: "answers must be an array of {id, dim, value}",
    };
  }

  for (const item of list) {
    if (!item?.dim) continue;
    const v = clamp(Number(item.value || 0), 1, 5);
    if (!byDim.has(item.dim)) byDim.set(item.dim, []);
    byDim.get(item.dim).push(v);
  }

  const scores = DIM_ORDER.map((dim) => {
    const arr = byDim.get(dim) || [];
    const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 1;
    const score20 = clamp(Math.round(avg * 4), 4, 20); // 1-5 -> 4-20
    const level = scoreLevel(score20);
    return { dim, score: score20, level: level.label, tag: level.tag, desc: dimDesc(dim) };
  });

  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3).map((x) => x.dim);
  const typeName = typeNameFromTop(top3);

  const strengths = top3.map((d) => ({
    title: d,
    bullets: adviceForDim(d, "16-20"),
  }));

  const lows = [...scores].sort((a, b) => a.score - b.score).slice(0, 3);
  const growth = lows.map((x) => ({
    title: x.dim,
    bullets: adviceForDim(x.dim, x.tag),
  }));

  return {
    version: 1,
    token,
    createdAt: new Date().toISOString(),
    type: {
      name: typeName,
      tags: top3,
      summary:
        `你的优势集中在：${top3.join("、")}。建议把这些能力用于真实项目场景，形成作品与方法论。`,
    },
    radar: scores.map((s) => ({ key: s.dim, value: s.score })),
    breakdown: scores,
    sections: {
      strengths,
      growth,
      careers: [
        { title: "内容策划", match: top3.includes("语言天赋") ? 0.9 : 0.6 },
        { title: "产品/设计", match: top3.includes("美学天赋") ? 0.9 : 0.6 },
        { title: "数据分析", match: top3.includes("逻辑-算数天赋") ? 0.9 : 0.6 },
        { title: "活动/运营", match: top3.includes("人际天赋") ? 0.9 : 0.6 },
      ],
    },
  };
}