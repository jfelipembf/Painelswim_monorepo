import { CASHFLOW_TYPE_BADGES, CASHFLOW_TYPE_SIGNS } from "constants/financial";
import { formatCentsBRL, formatCurrencyBRL } from "utils/currency";

import type { CashierRow } from "../../types";

type CashierPrintSectionProps = {
  rows: CashierRow[];
  startLabel: string;
  endLabel: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  branchLabel?: string;
  printedAt?: string;
  logoSrc: string;
};

function CashierPrintSection({
  rows,
  startLabel,
  endLabel,
  incomeCents,
  expenseCents,
  netCents,
  branchLabel,
  printedAt,
  logoSrc,
}: CashierPrintSectionProps): JSX.Element {
  const printedLabel = printedAt || new Date().toLocaleString("pt-BR");

  return (
    <>
      <style>{`
        @media print {
          /* Esconde absolutamente tudo do app e mostra apenas o relatório */
          body * { visibility: hidden !important; }
          #cashier-print, #cashier-print * { visibility: visible !important; }
          #cashier-print { position: absolute; left: 0; top: 0; width: 100%; }
        }

        @media screen {
          #cashier-print { display: none; }
        }
      `}</style>

      <div id="cashier-print">
        <div style={{ padding: 24 }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <div>
              <div style={{ marginBottom: 10 }}>
                <img src={logoSrc} alt="Painel Swim" style={{ height: 44 }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Caixa Diário</div>
              <div style={{ fontSize: 12, marginTop: 4, color: "#6b7280" }}>
                Período: {startLabel} até {endLabel}
              </div>
              <div style={{ fontSize: 12, marginTop: 2, color: "#6b7280" }}>
                Impresso em: {printedLabel}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: "#6b7280" }}>
              <div>Unidade: {branchLabel || "—"}</div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
              marginTop: 16,
            }}
          >
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Receitas</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                {formatCentsBRL(incomeCents)}
              </div>
            </div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Despesas</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                {formatCentsBRL(expenseCents)}
              </div>
            </div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Saldo Líquido</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                {formatCentsBRL(netCents)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700 }}>Movimentações</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", fontSize: 12, padding: "8px 6px", width: 90 }}>
                  Horário
                </th>
                <th style={{ textAlign: "left", fontSize: 12, padding: "8px 6px" }}>Descrição</th>
                <th style={{ textAlign: "left", fontSize: 12, padding: "8px 6px", width: 90 }}>
                  Tipo
                </th>
                <th style={{ textAlign: "right", fontSize: 12, padding: "8px 6px", width: 120 }}>
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={String(t.id)}>
                  <td
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "8px 6px",
                      fontSize: 12,
                    }}
                  >
                    {t.time}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "8px 6px",
                      fontSize: 12,
                    }}
                  >
                    {t.clientLabel ? `${t.description} — ${t.clientLabel}` : t.description}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "8px 6px",
                      fontSize: 12,
                    }}
                  >
                    {CASHFLOW_TYPE_BADGES[t.type].label}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "8px 6px",
                      fontSize: 12,
                      textAlign: "right",
                    }}
                  >
                    {`${CASHFLOW_TYPE_SIGNS[t.type]} ${formatCurrencyBRL(Number(t.value || 0))}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 28 }}>
            <div>
              <div style={{ borderBottom: "1px solid #111827", height: 26 }} />
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                Assinatura do Responsável
              </div>
            </div>
            <div>
              <div style={{ borderBottom: "1px solid #111827", height: 26 }} />
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                Assinatura do Conferente
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CashierPrintSection;
