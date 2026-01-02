# Pasta: touch

## Estrutura atual (resumo)

- `touch/index.tsx`
- `touch/components/` (ClassCardsGrid, DayScheduleColumn, SelectActionDialog, TouchEvaluationDialog, TouchHeader)
- `touch/styles.ts`

## Inconsistencias percebidas

- `styles.ts` fica na raiz, enquanto os componentes estao em `components/`.
- Componentes de agenda podem ser semelhantes aos de `grade`.
- `TouchEvaluationDialog.tsx` concentra logica, fetch e UI.

## Padrao sugerido

- Mover `styles.ts` para `components/` ou criar `styles/`.
- Centralizar estilos e tipos para reuso com `grade`.
- Extrair logica do dialog para `hooks/`.

## Reuso/centralizacao

- Se os cards de agenda forem compartilhados, criar `components/schedule/` global.

## Arquivos longos (prioridade)

- `touch/components/TouchEvaluationDialog.tsx` (~596 linhas): separar form e lista.
- `touch/index.tsx` (~202 linhas): extrair grid e header.

## Status (comentado)

- [ ] Definir destino para `styles.ts`.
  - Comentario: manter consistencia com outras pages.
- [ ] Avaliar reuso com `grade`.
  - Comentario: evitar duplicacao de UI.
