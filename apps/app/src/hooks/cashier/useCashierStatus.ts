import { useEffect, useMemo, useState } from "react";

import { useAppSelector } from "../../redux/hooks";
import { fetchBranchSettings } from "hooks/settings";

const formatLocalDateKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

type CashierStatus = {
  isOpen: boolean;
  loading: boolean;
  autoCloseCashierAtMidnight: boolean;
  storageKey: string | null;
};

export const useCashierStatus = (): CashierStatus => {
  const idTenant = useAppSelector((state) => state.tenant.idTenant);
  const idBranch = useAppSelector((state) => state.branch.idBranch);

  const [loading, setLoading] = useState(true);
  const [autoCloseCashierAtMidnight, setAutoCloseCashierAtMidnight] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let active = true;

    if (!idTenant || !idBranch) {
      setLoading(false);
      setAutoCloseCashierAtMidnight(false);
      setIsOpen(false);
      return undefined;
    }

    setLoading(true);
    fetchBranchSettings(idTenant, idBranch)
      .then((settings) => {
        if (!active) return;
        setAutoCloseCashierAtMidnight(Boolean(settings.autoCloseCashierAtMidnight));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [idBranch, idTenant]);

  const storageKey = useMemo(() => {
    if (!idTenant || !idBranch) return null;
    const base = `cashier_open_${idTenant}_${idBranch}`;
    if (!autoCloseCashierAtMidnight) return base;
    return `${base}_${formatLocalDateKey(new Date())}`;
  }, [autoCloseCashierAtMidnight, idBranch, idTenant]);

  useEffect(() => {
    if (!storageKey) {
      setIsOpen(false);
      return;
    }
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    setIsOpen(stored === "true");
  }, [storageKey]);

  return {
    isOpen,
    loading,
    autoCloseCashierAtMidnight,
    storageKey,
  };
};
