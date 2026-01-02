export const parseNonNegativeNumber = (value: unknown): number => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, numeric);
};
