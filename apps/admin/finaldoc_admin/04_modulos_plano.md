# Módulos e como trabalhar neles

## Principais módulos atuais
- **Tenants/Branches** (`src/modules/tenants/*.db.js`, `.types.js`, `.domain.js`, `.functions.js`)
  - CRUD de tenants, mapeamento `tenantsBySlug`, criação de branch padrão e membro owner.
  - Atualização de status/billing da branch e do tenant.
  - Busca por branch via `collectionGroup`.
- **Users** (páginas em `src/pages/Users/*`, auth em `firebase_helper.js`)
  - `createUserWithDetails` cria auth user + doc em `users` + upload de foto.
  - `listUsers` lê `users` collection.
- **Dashboard/Profile**: telas de exibição, usam dados do store e dos serviços.

## Padrão recomendado por domínio
1) **Tipos/validação**: manter tipos em `*.types.js` e usar Yup para validar inputs (Formik já disponível).
2) **Serviços**: Firestore CRUD em `*.db.js` com guard que verifica `getFirebaseServices().db` inicializado.
3) **Hooks/containers**: construir hooks simples para orquestrar serviços e expor loading/erro; hoje a maior parte está embutida nas páginas.
4) **Permissões**: como o painel é só para system admins, uma checagem única (`systemAdmins/{uid}`) antes das operações já basta. Se precisar granularidade, criar um map simples em memória.
5) **UI**: reusar componentes do template (cards, tables) e manter loading/erro/empty states padrão.

## Dados esperados (resumo)
- `tenants/{tenantId}`: `name`, `slug`, `cnpj?`, `logoUrl?`, `status`, `branding`, `address`, timestamps.
- `tenantsBySlug/{slug}`: `idTenant`.
- `tenants/{tenantId}/branches/{branchId}`: `name`, `slug`, `status`, `billingStatus`, `timezone`, `address`, timestamps.
- `tenants/{tenantId}/members/{uid}`: `role`, `roleByBranch`, `branchIds`, `status`.
- `users/{uid}`: dados cadastrais, `photoUrl`, timestamps (criados em `createUserWithDetails`).

## Ajustes sugeridos
- Adicionar checagem de system admin nas operações de tenant/branch se ainda não estiver aplicada.
- Garantir que erros de Firebase sejam propagados e tratados com toasts (react-toastify).
- Se o volume crescer, considerar migrar para hooks com React Query para cache e loading unificado, mantendo Redux para layout/auth.
