# Grupo: Pessoas e Permissoes

## Modulos

- clients
- collaborators
- roles
- tasks

## UI relacionada (layouts)

- `src/layouts/pages/clients/clientProfile/components/HeaderCard/index.tsx`
- `src/layouts/pages/clients/clientProfile/components/ProfileInfoCard/index.tsx`
- `src/layouts/pages/clients/clientProfile/components/MembershipStatusCard/index.tsx`
- `src/layouts/pages/clients/newClient/index.tsx`
- `src/layouts/pages/financial/cashier/index.tsx`
- `src/layouts/pages/financial/cashier/print.tsx`
- `src/layouts/pages/collaborators/collaboratorList/index.tsx`
- `src/layouts/pages/collaborators/collaboratorProfile/index.tsx`
- `src/layouts/pages/collaborators/collaboratorProfile/components/HeaderCard/index.tsx`
- `src/layouts/pages/collaborators/collaboratorProfile/components/BasicInfo/index.tsx`
- `src/layouts/pages/collaborators/newCollaborator/index.tsx`
- `src/layouts/pages/admin/roles/index.tsx`
- `src/layouts/pages/admin/roles/components/RoleForm.tsx`

## Hooks de dados

- `src/hooks/clients/useClient.ts`
- `src/hooks/clients/useClientsList.ts`
- `src/hooks/collaborators/useCollaborators.ts`
- `src/hooks/tasks/useTasks.ts`

## Padrao sugerido

- Criar `index.ts` em cada modulo com reexports padronizados.
- Remover `*.functions.ts` vazios em `clients`, `collaborators`, `roles`.
- Usar hooks para leitura e manter `db.ts` restrito a camada de dados.
- Centralizar logica de permissao/role em `roles.domain.ts` e tipar bem
  os contratos de permissao para evitar duplicacao na UI.

## Ajustes de posicionamento

- `tasks` hoje so tem hooks; manter dentro de `src/modules/tasks` com
  `index.ts` e consolidar regras no `domain.ts`.

## Status (comentado)

- [x] Criado `index.ts` em `clients`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `collaborators`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `roles`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Criado `index.ts` em `tasks`.
  - Comentario: reexports de `db`, `domain` e `types`.
- [x] Removidos `clients.functions.ts`, `collaborators.functions.ts`, `roles.functions.ts`.
  - Comentario: eram arquivos vazios (placeholders).
- [x] Hooks do grupo ajustados para importar via `index.ts`.
  - Comentario: imports agora usam `modules/<modulo>` em vez de arquivos diretos.
- [ ] Padronizar imports nos layouts para usar hooks/`index.ts`.
  - Comentario: requer refactor dos arquivos de UI.
