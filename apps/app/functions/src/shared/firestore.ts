import { FieldValue } from "firebase-admin/firestore";

export type BulkWriterErrorLike = {
  failedAttempts: number;
  code?: unknown;
  message?: unknown;
};

export const shouldRetryBulkWriter = (error: BulkWriterErrorLike): boolean =>
  error.failedAttempts < 3;

export const inc = (n: number) => FieldValue.increment(Number(n || 0));

export const expandFieldPaths = (updates: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  Object.entries(updates || {}).forEach(([key, value]) => {
    if (!key.includes(".")) {
      result[key] = value;
      return;
    }

    const parts = key.split(".");
    let cursor = result as Record<string, unknown>;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        cursor[part] = value;
        return;
      }

      if (!cursor[part] || typeof cursor[part] !== "object") {
        cursor[part] = {};
      }
      cursor = cursor[part] as Record<string, unknown>;
    });
  });
  return result;
};
