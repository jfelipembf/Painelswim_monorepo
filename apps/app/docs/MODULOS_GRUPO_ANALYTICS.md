# Grupo: Analytics e Dashboards

## Modulos

- dashboard
- dailySummaries
- monthlySummaries

## UI relacionada (layouts)

- `src/layouts/dashboards/operational/index.tsx`
- `src/layouts/dashboards/financial/index.tsx`
- `src/layouts/dashboards/management/index.tsx`
- `src/layouts/dashboards/commercial/index.tsx`

## Hooks de dados

- `src/hooks/dashboard/useDashboard.ts`
- `src/hooks/dashboard/useFinancialDashboard.ts`
- `src/hooks/dashboard/useManagementDashboard.ts`

## Padrao sugerido

- Criar `index.ts` em `dailySummaries` e `monthlySummaries`.
- Remover `dailySummaries.functions.ts` e `monthlySummaries.functions.ts` vazios.
- Manter `dashboard` como modulo composto (subpastas), mas expor via `index.ts`.
- Centralizar utilitarios de data e grafico dentro de `dashboard/utils`.

## Ajustes de posicionamento

- `dailySummaries` e `monthlySummaries` sao usados indiretamente por
  `dashboard`. Manter a regra: UI chama `dashboard`, nao acessa summaries
  direto.

## Status (comentado)

- [x] Criado `index.ts` em `dailySummaries`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `monthlySummaries`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `dashboard`.
  - Comentario: reexports de `dashboard.db`, `dashboard.domain`, `dashboard.types`.
- [x] Removidos arquivos vazios `dailySummaries.functions.ts` e `monthlySummaries.functions.ts`.
  - Comentario: sem uso no front; eram placeholders.
- [x] Hooks do grupo ajustados para importar via `index.ts`.
  - Comentario: imports agora usam `modules/<modulo>` em vez de arquivos diretos.
- [x] Padronizar imports para usar `modules/dashboard` via `index.ts`.
  - Comentario: aplicado nos hooks; layouts continuam consumindo via hooks.
