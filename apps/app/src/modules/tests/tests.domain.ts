import type { TestDefinitionPayload, TestMode } from "./tests.types";

const parsePositiveNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) return undefined;
  return Math.round(parsed);
};

const clampInt = (value: unknown, min: number, max: number): number => {
  const n = Number(value);
  if (Number.isNaN(n) || !Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
};

export const parseTimeToSeconds = (raw: unknown): number | undefined => {
  if (raw === null || raw === undefined) return undefined;
  const value = String(raw).trim();
  if (!value) return undefined;

  if (/^\d+$/.test(value)) {
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
    return Math.round(seconds);
  }

  const parts = value
    .split(":")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0 || parts.length > 3) return undefined;

  const nums = parts.map((p) => (p && /^\d+$/.test(p) ? Number(p) : NaN));
  if (nums.some((n) => Number.isNaN(n))) return undefined;

  const [a, b, c] = nums;

  const [hh, mm, ss] = nums.length === 3 ? [a, b, c] : nums.length === 2 ? [0, a, b] : [0, 0, a];

  const total = clampInt(hh, 0, 9999) * 3600 + clampInt(mm, 0, 59) * 60 + clampInt(ss, 0, 59);
  if (!total) return undefined;
  return total;
};

export const secondsToTimeParts = (
  raw: unknown
): {
  hh: string;
  mm: string;
  ss: string;
  totalSeconds: number;
} => {
  const parsed = parseTimeToSeconds(raw);
  const totalSeconds = parsed ? Math.max(0, Math.floor(parsed)) : 0;
  const hhNum = Math.floor(totalSeconds / 3600);
  const mmNum = Math.floor((totalSeconds % 3600) / 60);
  const ssNum = totalSeconds % 60;

  return {
    hh: hhNum ? String(hhNum) : "",
    mm: mmNum ? String(mmNum) : "",
    ss: ssNum ? String(ssNum) : "",
    totalSeconds,
  };
};

export const timePartsToSecondsString = (parts: {
  hh?: unknown;
  mm?: unknown;
  ss?: unknown;
}): string => {
  const hh = clampInt(parts.hh, 0, 9999);
  const mm = clampInt(parts.mm, 0, 59);
  const ss = clampInt(parts.ss, 0, 59);
  const total = hh * 3600 + mm * 60 + ss;
  return total ? String(total) : "";
};

const sanitizeMode = (mode?: TestMode): TestMode => {
  return mode === "time" ? "time" : "distance";
};

export const normalizeTestDefinitionPayload = (
  payload: Partial<TestDefinitionPayload>
): TestDefinitionPayload => {
  const mode = sanitizeMode(payload.mode);
  const fixedDistanceMeters =
    mode === "distance" ? parsePositiveNumber(payload.fixedDistanceMeters) : undefined;
  const fixedTimeSeconds =
    mode === "time" ? parsePositiveNumber(payload.fixedTimeSeconds) : undefined;

  return {
    mode,
    name: String(payload.name || "").trim(),
    fixedDistanceMeters,
    fixedTimeSeconds,
    inactive: Boolean(payload.inactive),
  };
};

export const validateTestDefinitionPayload = (
  payload: Partial<TestDefinitionPayload>
): string[] => {
  const errors: string[] = [];
  const normalized = normalizeTestDefinitionPayload(payload);

  if (!normalized.name) errors.push("Nome do teste é obrigatório.");

  if (normalized.mode === "distance" && !normalized.fixedDistanceMeters) {
    errors.push("Informe a distância fixa em metros.");
  }

  if (normalized.mode === "time" && !normalized.fixedTimeSeconds) {
    errors.push("Informe o tempo fixo em segundos.");
  }

  return errors;
};
