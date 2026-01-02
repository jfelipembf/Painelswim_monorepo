export const MINUTES_IN_DAY = 24 * 60;

export type TurnKey = "all" | "morning" | "afternoon" | "night";

export const TURN_LABELS: Record<TurnKey, string> = {
  all: "Todos",
  morning: "Manhã",
  afternoon: "Tarde",
  night: "Noite",
};

// Minute ranges are inclusive on start, exclusive on end.
export const TURN_RANGES: Record<TurnKey, { start: number; end: number }> = {
  all: { start: 0, end: MINUTES_IN_DAY },
  morning: { start: 5 * 60, end: 12 * 60 },
  afternoon: { start: 12 * 60, end: 18 * 60 },
  night: { start: 18 * 60, end: MINUTES_IN_DAY },
};

export const isMinutesInTurn = (turn: TurnKey, minutes: number): boolean => {
  const range = TURN_RANGES[turn] || TURN_RANGES.all;
  return minutes >= range.start && minutes < range.end;
};
