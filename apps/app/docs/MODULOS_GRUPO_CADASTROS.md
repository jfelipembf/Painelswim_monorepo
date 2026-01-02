# Grupo: Cadastros

## Modulos

- activities
- areas
- services
- products
- evaluationLevels
- tests

## UI relacionada (layouts)

- `src/layouts/pages/admin/activity/new/index.tsx`
- `src/layouts/pages/clients/clientProfile/components/Evaluations/index.tsx`
- `src/layouts/pages/clients/clientProfile/components/Modals/EvaluationsModal.tsx`
- `src/layouts/pages/grade/components/evaluations/EvaluationsTab.tsx`
- `src/layouts/pages/touch/components/TouchEvaluationDialog.tsx`
- `src/layouts/pages/management/evaluation-levels/index.tsx`
- `src/layouts/pages/grade/components/tests/TestsTab.tsx`
- `src/layouts/pages/management/tests/index.tsx`
- `src/layouts/pages/management/tests/components/TestForm.tsx`
- `src/layouts/pages/sales/purchase/components/ProductSection.tsx`
- `src/layouts/pages/sales/purchase/components/ServiceSection.tsx`

## Hooks de dados

- `src/hooks/activities/useActivities.ts`
- `src/hooks/areas/useAreas.ts`
- `src/hooks/services/useServices.ts`
- `src/hooks/products/useProducts.ts`
- `src/hooks/evaluationLevels/useEvaluationLevels.ts`
- `src/hooks/tests/useTests.ts`

## Padrao sugerido

- Criar `index.ts` em cada modulo com reexports padronizados.
- Manter apenas `types.ts`, `domain.ts`, `db.ts` como base.
- Padronizar nomes de funcoes: `normalizeXPayload` e `validateXPayload`.
- Evitar imports diretos de `db.ts` nos layouts; usar hooks do modulo.

## Ajustes de posicionamento

- Avaliar se `tests` deve ficar no grupo de cadastros ou em operacional,
  mas manter o mesmo padrao de arquivos.

## Status (comentado)

- [x] Criado `index.ts` em `activities`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `areas`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `services`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `products`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `evaluationLevels`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `tests`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Hooks do grupo ajustados para importar via `index.ts`.
  - Comentario: imports agora usam `modules/<modulo>` em vez de arquivos diretos.
- [ ] Padronizar nomes de funcoes (`normalizeXPayload`, `validateXPayload`).
  - Comentario: requer revisao de cada modulo.
- [ ] Refatorar imports nos layouts para usar hooks/`index.ts`.
  - Comentario: exige alterar chamadas atuais nos arquivos de UI.
