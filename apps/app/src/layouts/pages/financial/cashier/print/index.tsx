import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { useAppSelector } from "../../../../../redux/hooks";

import { fetchClientById } from "hooks/clients";
import { fetchCashMovementsRange } from "hooks/cashMovements";
import { fetchSalesRange } from "hooks/sales";

import { CASHFLOW_TYPE_BADGES, CASHFLOW_TYPE_SIGNS } from "constants/financial";
import { formatCentsBRL } from "utils/currency";

import { formatFirestoreTime, parseDateKey, toUtcDateKey } from "../utils";

type PrintRow = {
  time: string;
  description: string;
  type: "income" | "expense";
  value: string;
};

function CashierPrintPage(): JSX.Element {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const location = useLocation();

  const { startDateKey, endDateKey } = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    const start = parseDateKey(qs.get("start"));
    const end = parseDateKey(qs.get("end"));

    const now = new Date();
    return {
      startDateKey: start || toUtcDateKey(now),
      endDateKey: end || toUtcDateKey(now),
    };
  }, [location.search]);

  const [rows, setRows] = useState<PrintRow[]>([]);
  const [totalIncomeCents, setTotalIncomeCents] = useState(0);
  const [totalExpenseCents, setTotalExpenseCents] = useState(0);

  useEffect(() => {
    const run = async () => {
      if (!idTenant || !idBranch) return;

      const [sales, movements] = await Promise.all([
        fetchSalesRange(idTenant, idBranch, startDateKey, endDateKey),
        fetchCashMovementsRange(idTenant, idBranch, startDateKey, endDateKey),
      ]);

      const validSales = sales.filter((s) => s?.status !== "canceled");

      const clientIdsToResolve = Array.from(
        new Set(
          validSales
            .map((s: any) => String(s?.clientId || "").trim())
            .filter(Boolean)
            .filter((clientId: string) => {
              const snap = (validSales as any[]).find(
                (x) => String(x?.clientId || "") === clientId
              )?.clientSnapshot;
              return !snap?.name;
            })
        )
      );

      const clientById = new Map<string, { name: string; friendlyId?: string }>();
      await Promise.all(
        clientIdsToResolve.map(async (clientId) => {
          const client = await fetchClientById(idTenant, idBranch, clientId);
          if (!client) return;
          const name = `${String(client.firstName || "").trim()} ${String(
            client.lastName || ""
          ).trim()}`.trim();
          clientById.set(clientId, {
            name,
            friendlyId: client.friendlyId ? String(client.friendlyId) : undefined,
          });
        })
      );

      const saleRows: Array<{
        dateKey: string;
        createdAt: any;
        type: "income";
        amountCents: number;
        description: string;
      }> = validSales.map((s: any) => {
        const amountCents = Math.max(
          0,
          Math.round(Number(s.netPaidTotalCents ?? s.paidTotalCents ?? 0))
        );
        const base = `Venda - ${String(s.items?.[0]?.description || "Contrato")}`;

        const fromSnapshot = `${String(s.clientSnapshot?.friendlyId || "").trim()} ${String(
          s.clientSnapshot?.name || ""
        ).trim()}`.trim();

        const fromLookup = (() => {
          const clientId = String(s.clientId || "");
          const resolved = clientById.get(clientId);
          if (!resolved?.name) return "";
          const friendly = String(resolved.friendlyId || "").trim();
          return `${friendly} ${resolved.name}`.trim();
        })();

        const clientLabel = fromSnapshot || fromLookup;

        return {
          dateKey: String(s.dateKey || "").slice(0, 10),
          createdAt: s.createdAt,
          type: "income",
          amountCents,
          description: clientLabel ? `${base} — ${clientLabel}` : base,
        };
      });

      const movementRows: Array<{
        dateKey: string;
        createdAt: any;
        type: "income" | "expense";
        amountCents: number;
        description: string;
      }> = movements.map((m: any) => ({
        dateKey: String(m.dateKey || "").slice(0, 10),
        createdAt: m.createdAt,
        type: String(m.type || "expense") === "income" ? "income" : "expense",
        amountCents: Math.max(0, Math.round(Number(m.amountCents || 0))),
        description: String(m.description || (m.type === "income" ? "Entrada" : "Saída")),
      }));

      const all = [...saleRows, ...movementRows].sort((a, b) => {
        const aSec = Number(a?.createdAt?.seconds || 0);
        const bSec = Number(b?.createdAt?.seconds || 0);
        if (a.dateKey !== b.dateKey) return String(b.dateKey).localeCompare(String(a.dateKey));
        return bSec - aSec;
      });

      let income = 0;
      let expense = 0;

      const mapped: PrintRow[] = all.map((t) => {
        if (t.type === "income") income += t.amountCents;
        else expense += t.amountCents;

        const sec = Number(t?.createdAt?.seconds || 0);
        const time = formatFirestoreTime(t.createdAt);

        return {
          time,
          description: t.description,
          type: t.type,
          value: `${CASHFLOW_TYPE_SIGNS[t.type]} ${formatCentsBRL(t.amountCents)}`,
        };
      });

      setRows(mapped);
      setTotalIncomeCents(income);
      setTotalExpenseCents(expense);
    };

    void run();
  }, [endDateKey, idBranch, idTenant, startDateKey]);

  const printedAt = useMemo(() => new Date().toLocaleString("pt-BR"), []);
  const netCents = totalIncomeCents - totalExpenseCents;

  useEffect(() => {
    const id = window.setTimeout(() => {
      window.print();
    }, 300);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body { background: #fff; }
        }
        table { width: 100%; border-collapse: collapse; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 6px; font-size: 12px; vertical-align: top; }
        th { text-align: left; font-size: 12px; color: #111827; }
        .muted { color: #6b7280; }
        .right { text-align: right; }
        .section { margin-top: 16px; }
        .totals { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .totalBox { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
        .totalLabel { font-size: 11px; color: #6b7280; }
        .totalValue { font-size: 14px; font-weight: 700; color: #111827; margin-top: 4px; }
        .signGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 28px; }
        .signLine { border-bottom: 1px solid #111827; height: 26px; }
        .signLabel { font-size: 11px; color: #6b7280; margin-top: 6px; }
      `}</style>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Caixa Diário</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              Período: {startDateKey} até {endDateKey}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              Impresso em: {printedAt}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="muted" style={{ fontSize: 12 }}>
              Unidade: {idBranch || "—"}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              Tenant: {idTenant || "—"}
            </div>
          </div>
        </div>

        <div className="section totals">
          <div className="totalBox">
            <div className="totalLabel">Receitas</div>
            <div className="totalValue">{formatCentsBRL(totalIncomeCents)}</div>
          </div>
          <div className="totalBox">
            <div className="totalLabel">Despesas</div>
            <div className="totalValue">{formatCentsBRL(totalExpenseCents)}</div>
          </div>
          <div className="totalBox">
            <div className="totalLabel">Saldo Líquido</div>
            <div className="totalValue">{formatCentsBRL(netCents)}</div>
          </div>
        </div>

        <div className="section">
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
            Movimentações
          </div>
          <table>
            <thead>
              <tr>
                <th style={{ width: 90 }}>Horário</th>
                <th>Descrição</th>
                <th style={{ width: 90 }}>Tipo</th>
                <th style={{ width: 120 }} className="right">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={`${idx}_${r.time}_${r.type}`}>
                  <td>{r.time}</td>
                  <td>{r.description}</td>
                  <td>{CASHFLOW_TYPE_BADGES[r.type].label}</td>
                  <td className="right">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="signGrid">
          <div>
            <div className="signLine" />
            <div className="signLabel">Assinatura do Responsável</div>
          </div>
          <div>
            <div className="signLine" />
            <div className="signLabel">Assinatura do Conferente</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CashierPrintPage;
