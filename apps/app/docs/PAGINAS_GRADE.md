# Pasta: grade

## Estrutura atual (resumo)

- `components/` (grid, header, dialogs, tabs)
- `components/attendance/`, `components/evaluations/`, `components/tests/`
- `constants/` (grid.ts, turns.ts)
- `hooks/` (useGradeController.ts)
- `types/` (index.ts)
- `utils/` (date.ts, grid.ts, occupancy.ts)
- `index.tsx`

## Inconsistencias percebidas

- Estrutura esta bem organizada e pode servir de referencia.
- Pequena variacao: `ScheduleEnrollmentsDialog.*` fica direto em `components/`.

## Padrao sugerido

- Manter o padrao atual como referencia para outras pages.
- Se necessario, mover `ScheduleEnrollmentsDialog.*` para subpasta propria.

## Reuso/centralizacao

- `constants/` e `utils/` aqui podem inspirar outras areas (ex.: CRM e Touch).

## Arquivos longos (prioridade)

- `grade/components/evaluations/EvaluationsTab.tsx` (~581 linhas): separar UI de grid e fetch.
- `grade/index.tsx` (~503 linhas): extrair header, grid e tabs.
- `grade/components/tests/TestsTab.tsx` (~419 linhas): dividir em subcomponentes.

## Status (comentado)

- [ ] Validar se `ScheduleEnrollmentsDialog.*` deve ter subpasta.
  - Comentario: manter consistencia com outros dialogs.
