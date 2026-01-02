import { useMemo, useState } from "react";

import type { GradeTurn, GradeView } from "../types";
import { getStartOfWeekSunday } from "../utils/date";

type VisibleRange = {
  startDate: string;
  endDate: string;
};

const toIsoDate = (d: Date): string => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
};

export const useGradeController = () => {
  const [turn, setTurn] = useState<GradeTurn>("all");
  const [view, setView] = useState<GradeView>("week");
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());
  const [showOccupancy, setShowOccupancy] = useState<boolean>(false);

  const weekStart = useMemo(() => getStartOfWeekSunday(referenceDate), [referenceDate]);

  const visibleRange = useMemo<VisibleRange>(() => {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(end.getDate() + (view === "day" ? 0 : 6));
    return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
  }, [view, weekStart]);

  return {
    turn,
    setTurn,
    view,
    setView,
    referenceDate,
    setReferenceDate,
    showOccupancy,
    setShowOccupancy,
    weekStart,
    visibleRange,
  };
};
