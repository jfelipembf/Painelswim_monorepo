# Pasta: admin

## Estrutura atual (resumo)

- `admin/activity/` (index.tsx, new/, data/dataTableData.tsx, types.ts, types/index.ts)
- `admin/areas/` (components/AreaForm.tsx, index.tsx)
- `admin/catalog/` (components/ProductForm.tsx, components/ServiceForm.tsx, index.tsx)
- `admin/contracts/index.tsx`
- `admin/roles/` (components/RoleForm.tsx, index.tsx)
- `admin/schedules/` (components/ScheduleForm.tsx, types/index.ts, validation.ts, index.tsx)
- `admin/settings/index.tsx`

## Inconsistencias percebidas

- `admin/activity` tem `types.ts` e `types/index.ts` (duplicidade vs outros modulos).
- `data/` aparece apenas em activity; outros usam `validation.ts` ou nada parecido.
- Apenas `activity` tem subrota `new/`; os demais seguem padroes diferentes.
- `settings` aparece dentro de admin, mas tambem existe o modulo `settings` em `src/modules`.
- Imports de hooks em admin usam `hooks/clients` (agregador), misturando dominios.
- `FormField` vem de `pages/account`, indicando componente compartilhado fora do lugar.
- `admin/roles/index.tsx` guarda `PERMISSION_GROUPS` no arquivo de pagina.

## Padrao geral (referencia)

- Ver `docs/PAGINAS_PADRAO.md` para regras de estrutura e nomenclatura.

## Arquivos longos (prioridade)

- `admin/activity/new/index.tsx` (~660 linhas): dividir em `components/` + `hooks/`.
- `admin/activity/components/ObjectivesTopicsManager/index.tsx` (~584 linhas): extrair `utils` e subcomponentes.
- `admin/settings/index.tsx` (~415 linhas): separar cards/sections.
- `admin/schedules/index.tsx` (~368 linhas): mover formulario para `components/` e validacoes para `validation.ts`.
- `admin/contracts/components/ContractForm/index.tsx` (~347 linhas): quebrar em subcomponentes de seções.

## Padrao sugerido

- Estrutura por entidade: `components/`, `constants/`, `types.ts`, `validation.ts`, `utils/`.
- Se houver subrotas (`new`, `edit`), aplicar o mesmo padrao em todas as entidades.
- `data/` apenas para mocks/fixtures; dados reais ficam em `constants/`.
- Usar `hooks/<modulo>` direto em vez de `hooks/clients` para evitar acoplamento.
- `types.ts` na raiz em vez de `types/index.ts`.

## Reuso/centralizacao

- Colunas de DataTable e opcoes padrao podem ir para `src/constants/`.
- Validacoes compartilhadas devem ir para `src/utils/validation` ou para o modulo.

## Reuso de tipos (modulos)

- `activity`: usar `Activity`, `Objective`, `Topic`, `ActivityStatus`, `ActivityPayload`
  de `hooks/activities` e remover `types.ts`/`types/index.ts` locais.
- `areas`: usar `Area` e `AreaPayload` de `hooks/areas`.
- `catalog`: usar `Product`, `ProductPayload`, `Service`, `ServicePayload` de `hooks/products`
  e `hooks/services`.
- `contracts`: usar `Contract`, `ContractPayload`, `ContractDurationType` de `hooks/contracts`.
  Manter um `ContractFormValues` apenas como view-model (convertendo para payload).
- `schedules`: usar `Weekday` e `ClassPayload` de `hooks/classes`.
  `ScheduleFormValues` pode continuar como view-model, mas tipar `weekDays` com `Weekday[]`.
- `roles`: ja usa `Role`/`RolePermissions` de `hooks/roles` (ok).
- `settings`: usar `BranchAutomationSettings` e `BranchAutomationSettingsInput`
  de `hooks/settings` para tipar fetch/save.

## Status (comentado)

- [x] Unificar tipos de `activity` usando `hooks/activities`.
  - Comentario: removidos `types.ts`/`types/index.ts` locais.
- [ ] Definir padrao oficial de subrotas (`index`, `new`, `edit`).
  - Comentario: aplicar em activity, areas, catalog, schedules.
- [ ] Revisar `settings` dentro de admin.
  - Comentario: alinhar com `docs/MODULOS_GRUPO_CONFIGURACOES.md`.
- [x] Padronizar imports de hooks para `hooks/<modulo>`.
  - Comentario: `admin` agora usa `hooks/activities`, `hooks/areas`, `hooks/products`, etc.
- [ ] Substituir `FormField` quando ele for movido para `components`.
  - Comentario: reduzir dependencia de `pages/account`.
- [x] Alinhar `schedules/types.ts` ao padrao.
  - Comentario: removido `types/index.ts`.
- [ ] Extrair `PERMISSION_GROUPS` para `roles/constants/`.
  - Comentario: pagina fica menor e reutilizavel.
