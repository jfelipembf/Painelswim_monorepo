import type { EvaluationDoc, EvaluationTopicLevel } from "./evaluations.types";

const toDateOnly = (value: string): string => String(value || "").slice(0, 10);

export const isDateWithinPeriod = (dateKey: string, startAt: string, endAt?: string): boolean => {
  const d = toDateOnly(dateKey);
  const start = toDateOnly(startAt);
  const end = endAt ? toDateOnly(endAt) : "";
  if (!d || !start) return false;
  if (d < start) return false;
  if (end && d > end) return false;
  return true;
};

export const normalizeEvaluationTopicLevel = (
  value: Partial<EvaluationTopicLevel>
): EvaluationTopicLevel => {
  return {
    levelId: String(value.levelId || "").trim(),
    levelName: String(value.levelName || "").trim(),
    levelValue: Number(value.levelValue || 0),
  };
};

export const normalizeLevelsByTopicId = (
  levelsByTopicId: Record<string, Partial<EvaluationTopicLevel>>
): Record<string, EvaluationTopicLevel> => {
  const next: Record<string, EvaluationTopicLevel> = {};
  Object.entries(levelsByTopicId || {}).forEach(([topicId, lvl]) => {
    const tid = String(topicId || "").trim();
    if (!tid) return;
    next[tid] = normalizeEvaluationTopicLevel(lvl);
  });
  return next;
};

export const getLatestEvaluationFromList = (list: EvaluationDoc[]): EvaluationDoc | null => {
  const arr = Array.isArray(list) ? list : [];
  if (!arr.length) return null;
  return arr[0] || null;
};
