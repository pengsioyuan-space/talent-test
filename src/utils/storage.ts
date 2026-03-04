const K_TOKEN = "talent_token_v1";
const K_ANS = "talent_answers_v1";
const K_RID = "talent_rid_v1";

export function getToken() { return localStorage.getItem(K_TOKEN) || ""; }
export function setToken(t: string) { localStorage.setItem(K_TOKEN, t); }

export type AnswerItem = { id: number; dim: string; value: number };
export function getAnswers(): AnswerItem[] {
  try { return JSON.parse(localStorage.getItem(K_ANS) || "[]"); } catch { return []; }
}
export function setAnswers(list: AnswerItem[]) {
  localStorage.setItem(K_ANS, JSON.stringify(list));
}
export function upsertAnswer(item: AnswerItem) {
  const list = getAnswers();
  const i = list.findIndex((x) => x.id === item.id);
  if (i >= 0) list[i] = item; else list.push(item);
  setAnswers(list);
}
export function clearAll() {
  localStorage.removeItem(K_ANS);
//   localStorage.removeItem(K_RID);
}
export function setRid(rid: string) { localStorage.setItem(K_RID, rid); }
export function getRid() { return localStorage.getItem(K_RID) || ""; }