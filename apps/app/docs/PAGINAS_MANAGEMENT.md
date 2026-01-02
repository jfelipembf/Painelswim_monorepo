# Pasta: management

## Estrutura atual (resumo)

- `management/evaluation-levels/` (components/EvaluationLevelForm.tsx, index.tsx)
- `management/eventPlan/` (components/\*, index.tsx)
- `management/integracoes/index.tsx`
- `management/tests/` (components/TestForm.tsx, index.tsx)

## Inconsistencias percebidas

- `eventPlan` usa camelCase; outros usam kebab-case (`evaluation-levels`).
- `integracoes` esta em portugues e nao segue o mesmo padrao de nome.
- `eventPlan/components` esta grande e pode precisar de subpastas tematicas.
- `eventPlan` mistura dialogs, panels e palette no mesmo nivel.

## Padrao sugerido

- Padronizar nome de pastas (ex.: `event-plan`, `integrations`).
- Agrupar componentes do event plan por tema (`dialogs/`, `panels/`, `palette/`).
- Centralizar tipos de eventos em `src/constants/eventPlanTypes.ts`.

## Reuso/centralizacao

- Tipos e labels de eventos devem viver em `src/constants/`.
- Validacoes de event plan podem ir para `src/modules/eventPlan`.

## Arquivos longos (prioridade)

- `management/evaluation-levels/index.tsx` (~466 linhas): separar form, list e actions.
- `management/eventPlan/components/EventTypesDialog.tsx` (~374 linhas): extrair sections.
- `management/eventPlan/components/CalendarPlanDialog.tsx` (~297 linhas): dividir form e tabela.
- `management/eventPlan/components/EventPlanSidePanel.tsx` (~291 linhas): separar blocos.
- `management/tests/index.tsx` (~280 linhas): dividir em form e list.

## Status (comentado)

- [ ] Definir padrao de nomes de pastas (kebab-case).
  - Comentario: renomear `eventPlan` e `integracoes` se necessario.
- [ ] Refatorar `eventPlan/components` por subgrupos.
  - Comentario: reduzir sobrecarga de uma unica pasta.
