import { useMemo } from "react";

type StudentBase = {
  id: string;
  name?: string;
  photoUrl?: string | null;
};

export const useStudentsFromEnrollments = <T extends StudentBase>(enrollments: T[]) => {
  const students = useMemo(() => {
    return (Array.isArray(enrollments) ? enrollments : [])
      .map((s: any) => ({ ...s, id: String(s?.id || "").trim() }))
      .filter((s: any) => Boolean(s.id));
  }, [enrollments]);

  const studentIdsKey = useMemo(() => {
    return students
      .map((s: any) => String(s.id))
      .sort()
      .join("|");
  }, [students]);

  return { students, studentIdsKey };
};
