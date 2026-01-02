# Visao geral de modulos

Documento para dar uma visao ampla dos modulos em `src/modules`, apontar
divergencias de posicionamento e o que precisa ser uniformizado.

## Padrao alvo (proposto)

- `<modulo>.types.ts` para tipos e contratos.
- `<modulo>.domain.ts` para regras, normalizacao e validacoes.
- `<modulo>.db.ts` para acesso ao Firestore.
- `<modulo>.actions.ts` apenas quando existir callable (`httpsCallable`) usado no front.
- `index.ts` no modulo para reexportar o publico do modulo.

## Divergencias gerais de posicionamento

- Nao existe `index.ts` nos modulos; isso obriga imports diretos por arquivo.
- Varios modulos tem `*.functions.ts` vazio (placeholder). Decidir:
  - remover, ou
  - substituir por `actions.ts` quando houver callable no front.
- Modulos complexos usam subpastas (ex.: `sales`, `dashboard`), enquanto outros
  nao. Definir regra: "subpastas apenas quando o modulo crescer".
- `settings` usa arquivos `branchSettings.*` dentro do modulo, o que quebra o
  padrao de nome do modulo. Definir se vira `settings.*` ou `branchSettings/`.
- Logica de venda existe em `src/services/helpers/salesHelpers.ts`, fora do
  modulo `sales`. Isso quebra o encapsulamento do modulo.

## Mapa de modulos (estado atual + uniformizacao)

### acquirers

- Atual: `acquirers.db.ts`, `acquirers.domain.ts`, `acquirers.types.ts`,
  `acquirers.functions.ts` (vazio).
- Uniformizar: remover `acquirers.functions.ts` (ou trocar por `actions.ts` se
  houver callable) e adicionar `index.ts`.

### activities

- Atual: `activities.db.ts`, `activities.domain.ts`, `activities.types.ts`.
- Uniformizar: adicionar `index.ts`.

### areas

- Atual: `areas.db.ts`, `areas.domain.ts`, `areas.types.ts`.
- Uniformizar: adicionar `index.ts`.

### attendance

- Atual: `attendance.db.ts`, `attendance.domain.ts`, `attendance.types.ts`,
  `attendance.functions.ts` (vazio).
- Uniformizar: remover `attendance.functions.ts` e adicionar `index.ts`.

### cashMovements

- Atual: `cashMovements.db.ts`, `cashMovements.domain.ts`,
  `cashMovements.types.ts`, `cashMovements.functions.ts` (vazio).
- Uniformizar: remover `cashMovements.functions.ts` e adicionar `index.ts`.

### classes

- Atual: `classes.db.ts`, `classes.domain.ts`, `classes.types.ts`.
- Divergencia: callable `generateBranchSessions` e usado direto no hook.
- Uniformizar: criar `classes.actions.ts` para a callable e adicionar `index.ts`.

### clients

- Atual: `clients.db.ts`, `clients.domain.ts`, `clients.types.ts`,
  `clients.functions.ts` (vazio).
- Uniformizar: remover `clients.functions.ts` e adicionar `index.ts`.

### collaborators

- Atual: `collaborators.db.ts`, `collaborators.domain.ts`,
  `collaborators.types.ts`, `collaborators.functions.ts` (vazio).
- Uniformizar: remover `collaborators.functions.ts` e adicionar `index.ts`.

### contracts

- Atual: `contracts.db.ts`, `contracts.domain.ts`, `contracts.types.ts`,
  `contracts.functions.ts` (vazio).
- Uniformizar: remover `contracts.functions.ts` e adicionar `index.ts`.

### dailySummaries

- Atual: `dailySummaries.db.ts`, `dailySummaries.domain.ts`,
  `dailySummaries.types.ts`, `dailySummaries.functions.ts` (vazio).
- Uniformizar: remover `dailySummaries.functions.ts` e adicionar `index.ts`.

### dashboard

- Atual: `dashboard.db.ts`, `dashboard.domain.ts`, `dashboard.types.ts` +
  subpastas `dashboards/`, `aggregations/`, `utils/`.
- Divergencia: modulo complexo, estrutura diferente dos demais.
- Uniformizar: manter subpastas, mas expor via `index.ts` com reexports claros.

### enrollments

- Atual: `enrollments.db.ts`, `enrollments.domain.ts`, `enrollments.types.ts`,
  `enrollments.functions.ts` (vazio).
- Uniformizar: remover `enrollments.functions.ts` e adicionar `index.ts`.

### evaluationLevels

- Atual: `evaluationLevels.db.ts`, `evaluationLevels.domain.ts`,
  `evaluationLevels.types.ts`.
- Uniformizar: adicionar `index.ts`.

### evaluations

- Atual: `evaluations.db.ts`, `evaluations.domain.ts`, `evaluations.types.ts`,
  `evaluations.functions.ts` (vazio).
- Uniformizar: remover `evaluations.functions.ts` e adicionar `index.ts`.

### eventPlan

- Atual: `eventPlan.db.ts`, `eventPlan.domain.ts`, `eventPlan.types.ts`.
- Uniformizar: adicionar `index.ts`.

### memberships

- Atual: `memberships.db.ts`, `memberships.domain.ts`, `memberships.types.ts`,
  `memberships.actions.ts`, `memberships.functions.ts` (vazio).
- Uniformizar: manter `actions.ts`, remover `memberships.functions.ts`,
  adicionar `index.ts`.

### monthlySummaries

- Atual: `monthlySummaries.db.ts`, `monthlySummaries.domain.ts`,
  `monthlySummaries.types.ts`, `monthlySummaries.functions.ts` (vazio).
- Uniformizar: remover `monthlySummaries.functions.ts` e adicionar `index.ts`.

### products

- Atual: `products.db.ts`, `products.domain.ts`, `products.types.ts`.
- Uniformizar: adicionar `index.ts`.

### receivables

- Atual: `receivables.db.ts`, `receivables.domain.ts`, `receivables.types.ts`,
  `receivables.functions.ts` (vazio).
- Uniformizar: remover `receivables.functions.ts` e adicionar `index.ts`.

### roles

- Atual: `roles.db.ts`, `roles.domain.ts`, `roles.types.ts`, `roles.functions.ts`
  (vazio).
- Uniformizar: remover `roles.functions.ts` e adicionar `index.ts`.

### sales

- Atual: `sales.db.ts`, `sales.domain.ts`, `sales.types.ts`,
  `sales.functions.ts` (vazio) + subpastas `db/`, `domain/`, `utils/`.
- Divergencia: logica em `src/services/helpers/salesHelpers.ts` fora do modulo.
- Uniformizar: consolidar tudo em `src/modules/sales` (dominio e utils),
  adicionar `index.ts` e definir regra de subpastas para modulos complexos.

### services

- Atual: `services.db.ts`, `services.domain.ts`, `services.types.ts`.
- Uniformizar: adicionar `index.ts`.

### settings

- Atual: `branchSettings.db.ts`, `branchSettings.domain.ts`,
  `branchSettings.types.ts`.
- Divergencia: nome do arquivo nao casa com nome do modulo.
- Uniformizar: escolher `settings.*` ou mover para `settings/branchSettings/`
  com `index.ts` no modulo.

### tasks

- Atual: `tasks.db.ts`, `tasks.domain.ts`, `tasks.types.ts`.
- Uniformizar: adicionar `index.ts`.

### tests

- Atual: `tests.db.ts`, `tests.domain.ts`, `tests.types.ts`.
- Uniformizar: adicionar `index.ts`.

## Callables (backend) e onde mapear no front

- `generateBranchSessions` -> `classes.actions.ts`
- `recomputeBranchEnrollmentCounts` -> `enrollments.actions.ts` (se usado pela UI)
- `suspendMembership` / `cancelMembership` -> `memberships.actions.ts` (ja feito)

## Proximo passo recomendado (sequencia)

1. Criar `index.ts` em todos os modulos com reexports padronizados.
2. Remover `*.functions.ts` vazios ou substituir por `actions.ts` quando houver callable.
3. Definir regra para modulos complexos (`sales` e `dashboard`) e ajustar imports.
4. Trazer `salesHelpers.ts` para `src/modules/sales` (domain ou utils).
