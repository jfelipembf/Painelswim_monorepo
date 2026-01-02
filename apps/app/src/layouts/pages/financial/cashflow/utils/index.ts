import * as XLSX from "xlsx";

import { CASHFLOW_TYPE_LABELS } from "constants/financial";

import type { CashflowChartPoint, CashflowData, CashflowTransaction } from "../types";

const formatChartLabel = (dateKey: string): string =>
  String(dateKey || "")
    .slice(5)
    .replace("-", "/");

const buildChartData = (chart: CashflowChartPoint[] = []) => ({
  labels: chart.map((d) => formatChartLabel(String(d.dateKey || ""))),
  datasets: [
    {
      label: "Receita",
      color: "success" as const,
      data: chart.map((d) => Number(d.incomeCents || 0) / 100),
    },
    {
      label: "Despesa",
      color: "error" as const,
      data: chart.map((d) => Number(d.expenseCents || 0) / 100),
    },
    {
      label: "Resultado",
      color: "info" as const,
      data: chart.map((d) => (Number(d.incomeCents || 0) - Number(d.expenseCents || 0)) / 100),
    },
  ],
});

const buildDailyExportRows = (chart: CashflowChartPoint[] = []) =>
  chart.map((row) => {
    const incomeCents = Math.max(0, Number(row.incomeCents || 0));
    const expenseCents = Math.max(0, Number(row.expenseCents || 0));
    const netCents = incomeCents - expenseCents;
    return {
      Data: String(row.dateKey || ""),
      Entrada: incomeCents / 100,
      Saída: expenseCents / 100,
      Resultado: netCents / 100,
    };
  });

const buildTransactionsExportRows = (transactions: CashflowTransaction[] = []) =>
  transactions.map((t) => {
    const typeLabel =
      t.type === "income" ? CASHFLOW_TYPE_LABELS.income : CASHFLOW_TYPE_LABELS.expense;
    const signedCents =
      t.type === "income" ? Number(t.amountCents || 0) : -Number(t.amountCents || 0);

    return {
      Data: String(t.dateKey || ""),
      Tipo: typeLabel,
      Categoria: String(t.category || ""),
      Descrição: String(t.description || ""),
      Valor: signedCents / 100,
    };
  });

const exportCashflowReport = (data: CashflowData) => {
  const start = String(data?.startDateKey || "");
  const end = String(data?.endDateKey || "");
  const nowKey = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

  const dailyRows = buildDailyExportRows(data?.chart || []);
  const totalsRow = {
    Data: "Totais",
    Entrada: Number(data?.totals?.incomeCents || 0) / 100,
    Saída: Number(data?.totals?.expenseCents || 0) / 100,
    Resultado: Number(data?.totals?.netCents || 0) / 100,
  };

  const transactionsRows = buildTransactionsExportRows(data?.transactions || []);

  const workbook = XLSX.utils.book_new();
  const wsDaily = XLSX.utils.json_to_sheet([...dailyRows, totalsRow], {
    header: ["Data", "Entrada", "Saída", "Resultado"],
  });
  const wsTransactions = XLSX.utils.json_to_sheet(transactionsRows, {
    header: ["Data", "Tipo", "Categoria", "Descrição", "Valor"],
  });

  XLSX.utils.book_append_sheet(workbook, wsDaily, "Resumo diário");
  XLSX.utils.book_append_sheet(workbook, wsTransactions, "Transações");

  XLSX.writeFile(workbook, `fluxo-de-caixa_${start}_a_${end}_${nowKey}.xlsx`, {
    bookType: "xlsx",
    compression: true,
  });
};

export { buildChartData, exportCashflowReport };
