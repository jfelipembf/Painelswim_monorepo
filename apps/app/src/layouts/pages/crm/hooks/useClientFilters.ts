import { useMemo, useState } from "react";

import type { ClientFiltersActions, ClientFiltersState } from "../types";

export const useClientFilters = () => {
  const [active, setActive] = useState(true);
  const [inactive, setInactive] = useState(false);
  const [paused, setPaused] = useState(false);

  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [gender, setGender] = useState("");

  const [birthMonth, setBirthMonth] = useState("");
  const [age, setAge] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const [hasDebt, setHasDebt] = useState(false);
  const [overdueDebt, setOverdueDebt] = useState(false);
  const [debtDueThisMonth, setDebtDueThisMonth] = useState(false);

  const [instructor, setInstructor] = useState("");
  const [consultant, setConsultant] = useState("");
  const [activity, setActivity] = useState("");

  const [boughtBetweenEnabled, setBoughtBetweenEnabled] = useState(false);
  const [boughtBetweenStart, setBoughtBetweenStart] = useState("");
  const [boughtBetweenEnd, setBoughtBetweenEnd] = useState("");

  const [withValueEnabled, setWithValueEnabled] = useState(false);
  const [minValue, setMinValue] = useState("0");
  const [maxValue, setMaxValue] = useState("0");

  const [startEnabled, setStartEnabled] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startEndDate, setStartEndDate] = useState("");

  const [dueEnabled, setDueEnabled] = useState(false);
  const [dueStart, setDueStart] = useState("");
  const [dueEnd, setDueEnd] = useState("");

  const [cancelEnabled, setCancelEnabled] = useState(false);
  const [cancelStart, setCancelStart] = useState("");
  const [cancelEnd, setCancelEnd] = useState("");

  const [contractActiveEnabled, setContractActiveEnabled] = useState(false);
  const [contractActive, setContractActive] = useState("");
  const [contractInactiveEnabled, setContractInactiveEnabled] = useState(false);
  const [contractInactive, setContractInactive] = useState("");

  const filters = useMemo<ClientFiltersState>(
    () => ({
      active,
      inactive,
      paused,
      city,
      neighborhood,
      gender,
      birthMonth,
      age,
      birthDate,
      hasDebt,
      overdueDebt,
      debtDueThisMonth,
      instructor,
      consultant,
      activity,
      boughtBetweenEnabled,
      boughtBetweenStart,
      boughtBetweenEnd,
      withValueEnabled,
      minValue,
      maxValue,
      startEnabled,
      startDate,
      startEndDate,
      dueEnabled,
      dueStart,
      dueEnd,
      cancelEnabled,
      cancelStart,
      cancelEnd,
      contractActiveEnabled,
      contractActive,
      contractInactiveEnabled,
      contractInactive,
    }),
    [
      active,
      inactive,
      paused,
      city,
      neighborhood,
      gender,
      birthMonth,
      age,
      birthDate,
      hasDebt,
      overdueDebt,
      debtDueThisMonth,
      instructor,
      consultant,
      activity,
      boughtBetweenEnabled,
      boughtBetweenStart,
      boughtBetweenEnd,
      withValueEnabled,
      minValue,
      maxValue,
      startEnabled,
      startDate,
      startEndDate,
      dueEnabled,
      dueStart,
      dueEnd,
      cancelEnabled,
      cancelStart,
      cancelEnd,
      contractActiveEnabled,
      contractActive,
      contractInactiveEnabled,
      contractInactive,
    ]
  );

  const resetFilters = () => {
    setActive(true);
    setInactive(false);
    setPaused(false);

    setCity("");
    setNeighborhood("");
    setGender("");

    setBirthMonth("");
    setAge("");
    setBirthDate("");

    setHasDebt(false);
    setOverdueDebt(false);
    setDebtDueThisMonth(false);

    setInstructor("");
    setConsultant("");
    setActivity("");

    setBoughtBetweenEnabled(false);
    setBoughtBetweenStart("");
    setBoughtBetweenEnd("");

    setWithValueEnabled(false);
    setMinValue("0");
    setMaxValue("0");

    setStartEnabled(false);
    setStartDate("");
    setStartEndDate("");

    setDueEnabled(false);
    setDueStart("");
    setDueEnd("");

    setCancelEnabled(false);
    setCancelStart("");
    setCancelEnd("");

    setContractActiveEnabled(false);
    setContractActive("");
    setContractInactiveEnabled(false);
    setContractInactive("");
  };

  const actions: ClientFiltersActions = {
    setActive,
    setInactive,
    setPaused,
    setCity,
    setNeighborhood,
    setGender,
    setBirthMonth,
    setAge,
    setBirthDate,
    setHasDebt,
    setOverdueDebt,
    setDebtDueThisMonth,
    setInstructor,
    setConsultant,
    setActivity,
    setBoughtBetweenEnabled,
    setBoughtBetweenStart,
    setBoughtBetweenEnd,
    setWithValueEnabled,
    setMinValue,
    setMaxValue,
    setStartEnabled,
    setStartDate,
    setStartEndDate,
    setDueEnabled,
    setDueStart,
    setDueEnd,
    setCancelEnabled,
    setCancelStart,
    setCancelEnd,
    setContractActiveEnabled,
    setContractActive,
    setContractInactiveEnabled,
    setContractInactive,
  };

  return { filters, actions, resetFilters };
};
