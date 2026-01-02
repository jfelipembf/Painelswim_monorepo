# Pasta: crm

## Estrutura atual (resumo)

- `crm/index.tsx`
- `crm/data/options.ts`
- `crm/tabs/*Tab.tsx`
- `crm/tabs/components/` (ClientFiltersForm, ClientFiltersTable)
- `crm/tabs/hooks/` (useClientFilters)
- `crm/fixtures/mock.ts`

## Inconsistencias percebidas

- `options.ts` poderia estar em `constants/` para reuso com outros filtros.
- `tabs/` nao esta dentro de `components/` (padrao varia entre paginas).
- `ClientFiltersTab` concentra filtros e logica de dados no mesmo arquivo.

## Padrao sugerido

- Usar `components/tabs/` para os tabs do CRM.
- Mover mocks para `__mocks__/` ou `fixtures/` e evitar uso em producao.
- Consolidar opcoes em `src/constants/` ou `crm/constants/`.
- Separar filtros em `components/filters/` e logica em `hooks/`.

## Reuso/centralizacao

- Filtros e opcoes devem ser reaproveitados em CRM e relatios.
- Utils de filtro e formatacao podem ficar em `src/utils/`.

## Arquivos longos (prioridade)

- `crm/tabs/ClientFiltersTab.tsx` (~801 linhas): extrair filtros e tabela para componentes.
- `crm/tabs/EvaluationsTab.tsx` (~191 linhas): separar fetch e tabela.
- `crm/data/mock.ts` (~189 linhas): isolar em fixtures.

## Status (comentado)

- [x] Isolar mocks do CRM.
  - Comentario: movido para `crm/fixtures/mock.ts`.
- [x] Separar filtros e tabela do CRM.
  - Comentario: `ClientFiltersTab` agora usa `tabs/components` e `tabs/hooks`.
- [ ] Padronizar estrutura de tabs.
  - Comentario: usar `components/tabs` para clareza.
