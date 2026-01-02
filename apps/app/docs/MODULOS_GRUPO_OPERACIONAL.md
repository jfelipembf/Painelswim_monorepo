# Grupo: Operacional e Agenda

## Modulos

- classes
- enrollments
- attendance
- eventPlan

## UI relacionada (layouts)

- `src/layouts/pages/grade/index.tsx`
- `src/layouts/pages/clients/clientProfile/components/Enrollments/index.tsx`
- `src/layouts/pages/clients/clientProfile/components/Modals/EnrollmentsModal.tsx`
- `src/layouts/pages/management/eventPlan/components/CalendarPlanDialog.tsx`
- `src/layouts/pages/management/eventPlan/components/EventPlanSidePanel.tsx`
- `src/layouts/pages/management/eventPlan/components/EventTypesDialog.tsx`

## Hooks de dados

- `src/hooks/classes/useClasses.ts`
- `src/hooks/classes/useScheduleAttendanceDialog.ts`
- `src/hooks/eventPlan/useEventPlan.ts`

## Padrao sugerido

- Criar `index.ts` em cada modulo com reexports padronizados.
- Criar `classes.actions.ts` para a callable `generateBranchSessions` e
  usar essa camada nos hooks (evita logica duplicada no hook).
- Remover `*.functions.ts` vazios em `attendance` e `enrollments`.
- Centralizar regras de matricula e presenca em `domain.ts` para evitar
  regras espalhadas em layouts.

## Ajustes de posicionamento

- Componentes de grade (UI) estao em `src/layouts/pages/grade` e usam
  modulos operacionais. Padronizar imports via hooks do modulo.

## Status (comentado)

- [x] Criado `index.ts` em `classes`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `enrollments`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `attendance`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `eventPlan`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Removidos `attendance.functions.ts` e `enrollments.functions.ts`.
  - Comentario: eram arquivos vazios (placeholders).
- [x] Hooks do grupo ajustados para importar via `index.ts`.
  - Comentario: imports agora usam `modules/<modulo>` em vez de arquivos diretos.
- [ ] Criar `classes.actions.ts` para `generateBranchSessions`.
  - Comentario: callable ainda esta no hook `useClasses`.
