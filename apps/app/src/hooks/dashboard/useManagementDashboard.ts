import { useCallback, useEffect, useState, useMemo, useRef } from "react";

import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { setSelectedDate, selectSelectedDate } from "../../redux/slices/dateSlice";
import { getManagementDashboardData } from "../../modules/dashboard";
import type { ManagementDashboardData } from "../../modules/dashboard";

export const useManagementDashboard = () => {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);
  const selectedDate = useAppSelector(selectSelectedDate) || new Date();
  const lastUpdated = useAppSelector((state) => state.date?.lastUpdated) || 0;
  const dispatch = useAppDispatch();

  const [data, setData] = useState<ManagementDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // Memoize the date key to prevent unnecessary fetches
  const dateKey = useMemo(() => {
    return selectedDate
      ? selectedDate.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
  }, [selectedDate]);

  const fetchDashboard = useCallback(async () => {
    if (!idTenant || !idBranch) return;

    const requestId = (requestIdRef.current += 1);

    setLoading(true);
    setError(null);

    try {
      const result = await getManagementDashboardData(idTenant, idBranch, selectedDate);
      if (requestIdRef.current !== requestId) return;
      setData(result);
    } catch (err: any) {
      if (requestIdRef.current !== requestId) return;
      setError(err.message || "Erro ao carregar dashboard gerencial");
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [idTenant, idBranch, selectedDate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    selectedDate,
    setSelectedDate: (date: Date) => dispatch(setSelectedDate(date)),
    refetch: fetchDashboard,
    dateKey, // Expose date key for additional optimization
  };
};
