# Grupo: Financeiro e Vendas

## Modulos

- sales
- receivables
- cashMovements
- acquirers

## UI relacionada (layouts)

- `src/layouts/pages/sales/purchase/index.tsx`
- `src/layouts/pages/sales/purchase/components/ContractSection.tsx`
- `src/layouts/pages/sales/purchase/components/DiscountSection.tsx`
- `src/layouts/pages/sales/purchase/components/EditPaymentDialog.tsx`
- `src/layouts/pages/sales/purchase/components/PaymentSection.tsx`
- `src/layouts/pages/sales/purchase/components/ProductSection.tsx`
- `src/layouts/pages/sales/purchase/components/ServiceSection.tsx`
- `src/layouts/pages/sales/purchase/components/SummaryCard.tsx`
- `src/layouts/pages/sales/settleDebt/index.tsx`
- `src/layouts/pages/financial/cashier/index.tsx`
- `src/layouts/pages/financial/cashier/print.tsx`
- `src/layouts/pages/financial/acquirers/index.tsx`
- `src/layouts/pages/clients/clientProfile/components/Modals/FinancialModal.tsx`

## Hooks de dados

- `src/hooks/sales/useClientSales.ts`
- `src/hooks/receivables/useClientReceivables.ts`
- `src/hooks/receivables/useSaleReceivables.ts`
- `src/hooks/cashflow/useCashFlow.ts`
- `src/hooks/acquirers/useAcquirers.ts`

## Padrao sugerido

- Criar `index.ts` em cada modulo com reexports padronizados.
- Remover `*.functions.ts` vazios em `sales`, `receivables`, `cashMovements`,
  `acquirers`.
- Mover `src/services/helpers/salesHelpers.ts` para `src/modules/sales/`
  (ex.: `sales/utils/`) para manter encapsulamento do modulo.
- Padronizar subpastas em `sales` (ex.: `db/`, `domain/`, `utils/`) e expor
  tudo via `index.ts`.

## Ajustes de posicionamento

- Evitar imports diretos de `sales/*` em layouts; preferir hooks de venda e
  utils internos do modulo.

## Status (comentado)

- [x] Criado `index.ts` em `sales`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `receivables`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `cashMovements`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `acquirers`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Removidos `sales.functions.ts`, `receivables.functions.ts`,
      `cashMovements.functions.ts`, `acquirers.functions.ts`.
  - Comentario: eram arquivos vazios (placeholders).
- [x] Hooks do grupo ajustados para importar via `index.ts`.
  - Comentario: imports agora usam `modules/<modulo>` em vez de arquivos diretos.
- [ ] Mover `src/services/helpers/salesHelpers.ts` para `src/modules/sales/`.
  - Comentario: depende de refactor dos imports atuais.
