# Grupo: Contratos e Assinaturas

## Modulos

- contracts
- memberships

## UI relacionada (layouts)

- `src/layouts/pages/admin/contracts/index.tsx`
- `src/layouts/pages/clients/clientProfile/components/MembershipStatusCard/index.tsx`
- `src/layouts/pages/grade/index.tsx`
- `src/layouts/pages/sales/purchase/components/ContractSection.tsx`

## Hooks de dados

- `src/hooks/contracts/useContracts.ts`
- `src/hooks/memberships/useClientMemberships.ts`

## Acoes (callable)

- `src/modules/memberships/memberships.actions.ts` (suspend/cancel)

## Padrao sugerido

- Criar `index.ts` em ambos os modulos para reexports.
- Remover `contracts.functions.ts` e `memberships.functions.ts` vazios.
- Manter `memberships.actions.ts` para callables e usar sempre essa camada
  no front ao inves de chamar direto do layout.

## Ajustes de posicionamento

- Verificar consistencia de nomes: `planId` vs `contractId` (padronizar).
- Centralizar regras de suspensao/cancelamento em `memberships.domain.ts`
  quando houver validacoes comuns ao front.

## Status (comentado)

- [x] Criado `index.ts` em `contracts`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `memberships`.
  - Comentario: reexports de `actions`, `db`, `domain` e `types`.
- [x] Removidos `contracts.functions.ts` e `memberships.functions.ts`.
  - Comentario: eram arquivos vazios (placeholders).
- [x] Hooks do grupo ajustados para importar via `index.ts`.
  - Comentario: imports agora usam `modules/<modulo>` em vez de arquivos diretos.
- [ ] Padronizar nomenclatura `planId` vs `contractId`.
  - Comentario: requer decisao e refactor em dados e UI.
