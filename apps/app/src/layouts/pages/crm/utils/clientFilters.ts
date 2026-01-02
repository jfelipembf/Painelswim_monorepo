import * as XLSX from "xlsx";

import type { Client } from "hooks/clients";

import { GENDER_LABELS } from "constants/gender";
import { STATUS_LABELS } from "constants/status";

import type { ClientFilterRow, ClientFilterStatus, ClientFiltersState } from "../types";

type DateParts = {
  year: number;
  month: number;
  day: number;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const buildDateParts = (year: number, month: number, day: number): DateParts | null => {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  return { year, month, day };
};

const toClientStatus = (status?: string | null): ClientFilterStatus => {
  if (status === "active") return "active";
  if (status === "paused") return "paused";
  return "inactive";
};

const normalizeText = (value: string) => value.trim().toLowerCase();

const parseDateParts = (value?: string): DateParts | null => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return buildDateParts(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const brMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    return buildDateParts(Number(brMatch[3]), Number(brMatch[2]), Number(brMatch[1]));
  }

  const dashMatch = raw.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (dashMatch) {
    return buildDateParts(Number(dashMatch[3]), Number(dashMatch[2]), Number(dashMatch[1]));
  }

  return null;
};

const toDateKey = (parts: DateParts) => `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;

const getAge = (parts: DateParts, reference = new Date()): number => {
  const nowYear = reference.getFullYear();
  const nowMonth = reference.getMonth() + 1;
  const nowDay = reference.getDate();

  let age = nowYear - parts.year;
  if (nowMonth < parts.month || (nowMonth === parts.month && nowDay < parts.day)) {
    age -= 1;
  }
  return age;
};

const buildClientFilterRows = (clients: Client[]): ClientFilterRow[] =>
  (Array.isArray(clients) ? clients : []).map((client) => ({
    id: String(client.id || ""),
    image: client.photoUrl ? String(client.photoUrl) : undefined,
    name: `${client.firstName || ""} ${client.lastName || ""}`.trim() || "-",
    phone: client.phone ? String(client.phone) : "",
    email: client.email ? String(client.email) : "",
    city: String(client.address?.city || ""),
    neighborhood: String(client.address?.neighborhood || ""),
    gender: String(client.gender || ""),
    status: toClientStatus(client.status),
    consultant: "",
    instructor: "",
    activity: "",
    birthDate: client.birthDate ? String(client.birthDate) : "",
    debtCents: typeof client.debtCents === "number" ? client.debtCents : undefined,
  }));

const filterClientRows = (
  members: ClientFilterRow[],
  filters: ClientFiltersState
): ClientFilterRow[] => {
  const selectedStatuses: ClientFilterStatus[] = [];
  if (filters.active) selectedStatuses.push("active");
  if (filters.inactive) selectedStatuses.push("inactive");
  if (filters.paused) selectedStatuses.push("paused");

  return (Array.isArray(members) ? members : []).filter((m) => {
    if (selectedStatuses.length && !selectedStatuses.includes(m.status)) return false;

    const cityFilter = normalizeText(filters.city);
    if (cityFilter && !normalizeText(String(m.city || "")).includes(cityFilter)) return false;

    const neighborhoodFilter = normalizeText(filters.neighborhood);
    if (
      neighborhoodFilter &&
      !normalizeText(String(m.neighborhood || "")).includes(neighborhoodFilter)
    )
      return false;

    const genderFilter = normalizeText(filters.gender);
    if (genderFilter && normalizeText(String(m.gender || "")) !== genderFilter) return false;

    const birthParts = parseDateParts(m.birthDate);
    const birthMonthFilter = String(filters.birthMonth || "").trim();
    if (birthMonthFilter) {
      const monthValue = Number(birthMonthFilter);
      if (Number.isFinite(monthValue)) {
        if (!birthParts || birthParts.month !== monthValue) return false;
      }
    }

    const ageFilter = String(filters.age || "").trim();
    if (ageFilter) {
      const ageValue = Number(ageFilter);
      if (Number.isFinite(ageValue)) {
        const memberAge = birthParts ? getAge(birthParts) : null;
        if (memberAge === null || memberAge !== ageValue) return false;
      }
    }

    const birthDateFilter = String(filters.birthDate || "").trim();
    if (birthDateFilter) {
      const targetParts = parseDateParts(birthDateFilter);
      if (targetParts && birthParts) {
        if (toDateKey(targetParts) !== toDateKey(birthParts)) return false;
      } else if (normalizeText(String(m.birthDate || "")) !== normalizeText(birthDateFilter)) {
        return false;
      }
    }

    const requiresDebt = filters.hasDebt || filters.overdueDebt || filters.debtDueThisMonth;
    if (requiresDebt && !(typeof m.debtCents === "number" && m.debtCents > 0)) return false;

    const instructorFilter = normalizeText(filters.instructor);
    if (instructorFilter && normalizeText(String(m.instructor || "")) !== instructorFilter)
      return false;

    const consultantFilter = normalizeText(filters.consultant);
    if (consultantFilter && normalizeText(String(m.consultant || "")) !== consultantFilter)
      return false;

    const activityFilter = normalizeText(filters.activity);
    if (activityFilter && normalizeText(String(m.activity || "")) !== activityFilter) return false;

    return true;
  });
};

const buildClientExportRows = (members: ClientFilterRow[]) =>
  (Array.isArray(members) ? members : []).map((m) => {
    const genderKey = m.gender as keyof typeof GENDER_LABELS;
    const statusKey = m.status as keyof typeof STATUS_LABELS;

    return {
      Nome: String(m.name || ""),
      Telefone: String(m.phone || ""),
      Email: String(m.email || ""),
      Cidade: String(m.city || ""),
      Bairro: String(m.neighborhood || ""),
      Genero: GENDER_LABELS[genderKey] || String(m.gender || ""),
      Status: STATUS_LABELS[statusKey] || String(m.status || ""),
      Professor: String(m.instructor || ""),
      Consultor: String(m.consultant || ""),
      Atividade: String(m.activity || ""),
      Nascimento: m.birthDate ? String(m.birthDate || "").slice(0, 10) : "",
      Debito: Number(m.debtCents || 0) / 100,
    };
  });

const exportClientFiltersReport = (members: ClientFilterRow[]) => {
  const rows = buildClientExportRows(members);
  const nowKey = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

  const workbook = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: [
      "Nome",
      "Telefone",
      "Email",
      "Cidade",
      "Bairro",
      "Genero",
      "Status",
      "Professor",
      "Consultor",
      "Atividade",
      "Nascimento",
      "Debito",
    ],
  });

  XLSX.utils.book_append_sheet(workbook, ws, "Clientes");

  XLSX.writeFile(workbook, `clientes_filtrados_${nowKey}.xlsx`, {
    bookType: "xlsx",
    compression: true,
  });
};

export {
  buildClientFilterRows,
  exportClientFiltersReport,
  filterClientRows,
  getAge,
  normalizeText,
  parseDateParts,
  toDateKey,
  toClientStatus,
};
