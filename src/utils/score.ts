import type { Dimension, Question } from "../data/questions";

export type AnswerMap = Record<number, number>; // 1..5

export function calcScores(questions: Question[], answers: AnswerMap) {
  const sum: Record<Dimension, number> = {} as any;
  const cnt: Record<Dimension, number> = {} as any;

  for (const q of questions) {
    const v = answers[q.id];
    if (!v) continue;
    sum[q.dim] = (sum[q.dim] ?? 0) + v;
    cnt[q.dim] = (cnt[q.dim] ?? 0) + 1;
  }

  const result = Object.keys(sum).map((k) => {
    const dim = k as Dimension;
    const total = sum[dim];
    const count = cnt[dim] ?? 0;
    const avg = count ? total / count : 0;
    return { dim, total, count, avg };
  });

  result.sort((a, b) => b.avg - a.avg || b.total - a.total);
  return result;
}