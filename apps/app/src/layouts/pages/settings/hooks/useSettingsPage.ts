import { useCallback, useEffect, useMemo, useState } from "react";

import { useToast } from "context/ToastContext";

import { useAppSelector } from "../../../../redux/hooks";
import { useCepLookup } from "hooks/useCepLookup";
import { fetchBranchSettings, saveBranchSettings } from "hooks/settings";
import { formatCep } from "utils/cep";

import { parseNonNegativeNumber } from "../utils";
import type { SettingsTab } from "../types";

export const useSettingsPage = () => {
  useEffect(() => {
    document.title = "Configurações";
  }, []);

  const [tab, setTab] = useState<SettingsTab>("company");
  const tabValue = useMemo(() => (tab === "company" ? 0 : tab === "financial" ? 1 : 2), [tab]);

  const [zipCode, setZipCode] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [addressLine, setAddressLine] = useState("");

  const { address: cepAddress, loading: cepLoading, error: cepError } = useCepLookup(zipCode);

  const { showError, showSuccess } = useToast();
  const idTenant = useAppSelector((state) => state.tenant.idTenant);
  const idBranch = useAppSelector((state) => state.branch.idBranch);

  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [inactiveAfterRenewalDays, setInactiveAfterRenewalDays] = useState(0);
  const [attendanceSummaryAtMidnight, setAttendanceSummaryAtMidnight] = useState(false);
  const [abandonmentRiskEnabled, setAbandonmentRiskEnabled] = useState(false);
  const [abandonmentRiskDays, setAbandonmentRiskDays] = useState(0);
  const [autoCloseCashierAtMidnight, setAutoCloseCashierAtMidnight] = useState(false);
  const [cancelContractsAfterDaysWithoutPayment, setCancelContractsAfterDaysWithoutPayment] =
    useState(0);

  const handleTabChange = useCallback((_: unknown, value: number) => {
    setTab(value === 0 ? "company" : value === 1 ? "financial" : "sales");
  }, []);

  useEffect(() => {
    if (!cepAddress) {
      return;
    }

    if (!stateValue) {
      setStateValue(cepAddress.state);
    }
    if (!city) {
      setCity(cepAddress.city);
    }
    if (!neighborhood) {
      setNeighborhood(cepAddress.neighborhood);
    }
    if (!addressLine) {
      setAddressLine(cepAddress.address);
    }
  }, [addressLine, cepAddress, city, neighborhood, stateValue]);

  const handleZipChange = useCallback((event: any) => {
    const next = formatCep(event?.target?.value);
    setZipCode(next);
  }, []);

  const handleStateChange = useCallback((event: any) => {
    setStateValue(event?.target?.value ?? "");
  }, []);

  const handleCityChange = useCallback((event: any) => {
    setCity(event?.target?.value ?? "");
  }, []);

  const handleNeighborhoodChange = useCallback((event: any) => {
    setNeighborhood(event?.target?.value ?? "");
  }, []);

  const handleAddressLineChange = useCallback((event: any) => {
    setAddressLine(event?.target?.value ?? "");
  }, []);

  useEffect(() => {
    if (!idTenant || !idBranch) {
      return;
    }

    setSettingsLoading(true);
    fetchBranchSettings(idTenant, idBranch)
      .then((settings) => {
        setInactiveAfterRenewalDays(settings.inactiveAfterRenewalDays);
        setAttendanceSummaryAtMidnight(settings.attendanceSummaryAtMidnight);
        setAbandonmentRiskEnabled(settings.abandonmentRiskEnabled);
        setAbandonmentRiskDays(settings.abandonmentRiskDays);
        setAutoCloseCashierAtMidnight(settings.autoCloseCashierAtMidnight);
        setCancelContractsAfterDaysWithoutPayment(settings.cancelContractsAfterDaysWithoutPayment);
      })
      .catch((error: unknown) => {
        showError(error instanceof Error ? error.message : "Não foi possível carregar ajustes.");
      })
      .finally(() => setSettingsLoading(false));
  }, [idBranch, idTenant, showError]);

  const handleSave = useCallback(async () => {
    if (!idTenant || !idBranch) {
      showError("Tenant/unidade não identificados.");
      return;
    }

    setSettingsSaving(true);
    try {
      await saveBranchSettings(idTenant, idBranch, {
        inactiveAfterRenewalDays,
        attendanceSummaryAtMidnight,
        abandonmentRiskEnabled,
        abandonmentRiskDays,
        autoCloseCashierAtMidnight,
        cancelContractsAfterDaysWithoutPayment,
      });
      showSuccess("Configurações salvas.");
    } catch (error: unknown) {
      showError(
        error instanceof Error ? error.message : "Não foi possível salvar as configurações."
      );
    } finally {
      setSettingsSaving(false);
    }
  }, [
    abandonmentRiskDays,
    abandonmentRiskEnabled,
    attendanceSummaryAtMidnight,
    autoCloseCashierAtMidnight,
    cancelContractsAfterDaysWithoutPayment,
    idBranch,
    idTenant,
    inactiveAfterRenewalDays,
    showError,
    showSuccess,
  ]);

  const handleToggleAttendanceSummaryAtMidnight = useCallback(() => {
    setAttendanceSummaryAtMidnight((prev) => !prev);
  }, []);

  const handleToggleAutoCloseCashier = useCallback(() => {
    setAutoCloseCashierAtMidnight((prev) => !prev);
  }, []);

  const handleToggleAbandonmentRiskEnabled = useCallback(() => {
    setAbandonmentRiskEnabled((prev) => !prev);
  }, []);

  const handleInactiveAfterRenewalDaysChange = useCallback((event: any) => {
    setInactiveAfterRenewalDays(parseNonNegativeNumber(event?.target?.value));
  }, []);

  const handleAbandonmentRiskDaysChange = useCallback((event: any) => {
    setAbandonmentRiskDays(parseNonNegativeNumber(event?.target?.value));
  }, []);

  const handleCancelContractsAfterDaysWithoutPaymentChange = useCallback((event: any) => {
    setCancelContractsAfterDaysWithoutPayment(parseNonNegativeNumber(event?.target?.value));
  }, []);

  return {
    tab,
    tabValue,
    handleTabChange,
    settingsLoading,
    settingsSaving,
    handleSave,
    companyTabProps: {
      zipCode,
      stateValue,
      city,
      neighborhood,
      addressLine,
      cepLoading,
      cepError,
      attendanceSummaryAtMidnight,
      onZipChange: handleZipChange,
      onStateChange: handleStateChange,
      onCityChange: handleCityChange,
      onNeighborhoodChange: handleNeighborhoodChange,
      onAddressLineChange: handleAddressLineChange,
      onToggleAttendanceSummaryAtMidnight: handleToggleAttendanceSummaryAtMidnight,
    },
    financialTabProps: {
      autoCloseCashierAtMidnight,
      cancelContractsAfterDaysWithoutPayment,
      onToggleAutoCloseCashier: handleToggleAutoCloseCashier,
      onCancelContractsAfterDaysWithoutPaymentChange:
        handleCancelContractsAfterDaysWithoutPaymentChange,
    },
    salesTabProps: {
      inactiveAfterRenewalDays,
      abandonmentRiskEnabled,
      abandonmentRiskDays,
      onInactiveAfterRenewalDaysChange: handleInactiveAfterRenewalDaysChange,
      onAbandonmentRiskDaysChange: handleAbandonmentRiskDaysChange,
      onToggleAbandonmentRiskEnabled: handleToggleAbandonmentRiskEnabled,
    },
  };
};
