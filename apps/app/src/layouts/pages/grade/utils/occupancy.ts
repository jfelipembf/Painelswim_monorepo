export const parseMaxCapacity = (maxCapacityRaw: unknown): number | "-" => {
  const maxCapacityNumber = Number(maxCapacityRaw);
  return Number.isFinite(maxCapacityNumber) ? maxCapacityNumber : "-";
};

export const getOccupancyPct = (enrolledCount: number, maxCapacityRaw: unknown): number | null => {
  const maxCapacityNumber = Number(maxCapacityRaw);
  if (!Number.isFinite(maxCapacityNumber) || maxCapacityNumber <= 0) return null;
  return enrolledCount / maxCapacityNumber;
};
