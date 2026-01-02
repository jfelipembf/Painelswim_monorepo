# Firebase structure (multi-tenant + branch)

Este documento mapeia as rotas atuais e sugere uma estrutura de dados no
Firestore que seja organizada, eficiente, barata e escalavel.

## Principios

- Tudo fica abaixo de `tenants/{idTenant}`.
- Tudo que pertence a uma unidade vai em `branches/{idBranch}`.
- Sempre grave `idTenant` e `idBranch` nos documentos (facilita regras e debug).
- Evite `collectionGroup` em producao; prefira caminhos diretos e queries curtas.
- Dashboards devem ler agregados (nao dados crus).
- Informacoes sensiveis (stripe keys, tokens) nunca ficam no cliente.

## Colecoes base (ja usadas no app)

```
tenantsBySlug/{slug}
  idTenant

tenants/{idTenant}
  name
  slug
  status (active | inactive)
  branding { ... }
  createdAt
  updatedAt

tenants/{idTenant}/members/{uid}
  role (owner | manager | staff)
  roleId
  roleByBranch { [idBranch]: roleId }
  branchIds [idBranch]
  status (active | inactive)
  createdAt

Nota: `tenants/{idTenant}/members` sao usuarios do sistema (auth). Ja os clientes ficam em
`branches/{idBranch}/members`.

tenants/{idTenant}/branches/{idBranch}
  name
  status (active | inactive)
  billingStatus (active | past_due | canceled)
  timezone
  address { ... }
  createdAt
  updatedAt
```

## Mapa por rotas (src/routes.tsx)

Cada rota abaixo mostra as colecoes principais sugeridas.

Dashboards

- `/dashboards/management` -> `branches/{idBranch}/metrics/{period}` (agregados)
- `/dashboards/commercial` -> `branches/{idBranch}/metrics/{period}` (agregados)

Grade

- `/grade` -> `branches/{idBranch}/schedules`, `branches/{idBranch}/sessions`

Clientes

- `/members/list`, `/members/new`, `/members/profile`
  -> `branches/{idBranch}/opportunities`
  -> `branches/{idBranch}/members`

Colaboradores

- `/collaborators/list`, `/collaborators/new`, `/collaborators/profile`
  -> `tenants/{idTenant}/staff` (com `branchIds` + `roleByBranch`)

Administrativos

- `/admin/activity`, `/admin/activity/new`, `/admin/activity/:id`
  -> `tenants/{idTenant}/activities`
- `/admin/contracts`
  -> `tenants/{idTenant}/contracts`
- `/admin/schedules`
  -> `branches/{idBranch}/schedules`
- `/admin/areas`
  -> `branches/{idBranch}/areas`
- `/admin/catalog`
  -> `tenants/{idTenant}/products`, `tenants/{idTenant}/services`
  -> `branches/{idBranch}/inventory` (estoque por unidade)
- `/admin/roles`
  -> `tenants/{idTenant}/roles`

Financeiro

- `/financial/cashier`
  -> `branches/{idBranch}/transactions`
- `/financial/cashflow`
  -> `branches/{idBranch}/cashflow` (agregados)
- `/financial/acquirers`
  -> `tenants/{idTenant}/paymentProviders`

CRM

- `/crm` -> `branches/{idBranch}/crmLeads`, `branches/{idBranch}/crmStages`

Gerencial

- `/management/event-plan`
  -> `branches/{idBranch}/events`
- `/management/tests`
  -> `branches/{idBranch}/assessments`
- `/management/evaluation-levels`
  -> `tenants/{idTenant}/evaluationLevels`
- `/management/integrations`
  -> `tenants/{idTenant}/integrations` (apenas metadados)

Vendas

- `/sales/purchase/:id`
  -> `branches/{idBranch}/sales`, `branches/{idBranch}/payments`

Auth

- `/login`, `/forgot-password`
  -> Firebase Auth + `tenants/{idTenant}/members/{uid}`

## Estrutura recomendada (detalhe por dominio)

### Branch (unidade)

```
tenants/{idTenant}/branches/{idBranch}
  name
  status
  billingStatus
  address { city, state, ... }
```

### Areas

```
tenants/{idTenant}/branches/{idBranch}/areas/{idArea}
  name
  lengthMeters
  widthMeters
  maxCapacity
  inactive
  createdAt
  updatedAt
```

### Activities (tipos de atividade)

```
tenants/{idTenant}/activities/{activityId}
  name
  description
  defaultDurationMinutes
  inactive
```

### Schedules + Sessions (grade)

```
tenants/{idTenant}/branches/{idBranch}/schedules/{scheduleId}
  activityId
  areaId
  instructorId
  weekdays [0..6]
  startTime
  endTime
  capacity
  active

tenants/{idTenant}/branches/{idBranch}/sessions/{sessionId}
  scheduleId
  date
  startTime
  endTime
  capacity
  enrolledCount
```

### Opportunities (leads)

```
tenants/{idTenant}/branches/{idBranch}/opportunities/{oppId}
  name
  email
  phone
  status (open | won | lost)
  source
  assignedTo
  convertedAt
  memberId
  createdAt
```

### Members (clientes)

```
tenants/{idTenant}/branches/{idBranch}/members/{memberId}
  name
  email
  phone
  status
  birthDate
  opportunityId
  createdAt
```

### Staff (colaboradores)

```
tenants/{idTenant}/staff/{staffId}
  idTenant
  name
  lastName
  email
  phone
  branchIds [idBranch]
  roleByBranch { [idBranch]: roleId }
  memberUid
  status
  createdAt
  updatedAt
```

### Cargos e permissoes

```
tenants/{idTenant}/roles/{roleId}
  name
  description
  permissions {
    dashboards: true
    members_manage: true
    financial_view: true
    ...
  }
  createdAt
  updatedAt
```

Notas:

- `roleId` vive no `members/{uid}` (auth) e pode variar por branch via `roleByBranch`.
- Em telas de colaboradores, use `roleId` para renderizar o nome do cargo.
- Regras podem usar `get()` no role para validar permissoes.

### Catalog + Inventory

```
tenants/{idTenant}/products/{productId}
  name
  description
  priceCents
  purchasePriceCents
  sku
  barcode
  inactive

tenants/{idTenant}/services/{serviceId}
  name
  description
  priceCents
  durationMinutes
  inactive

tenants/{idTenant}/branches/{idBranch}/inventory/{productId}
  stockQty
  minStockQty
```

### Financeiro

```
tenants/{idTenant}/branches/{idBranch}/transactions/{txId}
  type (sale | refund | fee)
  amountCents
  method (pix | card | cash)
  createdAt

tenants/{idTenant}/branches/{idBranch}/cashflow/{period}
  totals { incomeCents, expenseCents }
```

### CRM

```
tenants/{idTenant}/branches/{idBranch}/crmLeads/{leadId}
  name
  status
  source
  assignedTo
```

### Vendas

```
tenants/{idTenant}/branches/{idBranch}/sales/{saleId}
  clientId
  items [{ type, refId, qty, priceCents }]
  totalCents
  status
```

## Billing (Stripe futuramente)

- Manter `billingStatus` em `branches/{idBranch}` para bloqueio rapido.
- Quando integrar Stripe, salvar apenas IDs e status em:
  `branches/{idBranch}/billing/{billingId}`
  (ex.: stripeCustomerId, stripeSubscriptionId, status).
- Atualizacao de billing sempre via webhook/servidor, nunca no cliente.

## Indices e custo

- Para listas com filtro+ordenacao, criar indices (ex.: status + createdAt).
- Evitar salvar arrays enormes em um doc (ex.: clientes de uma turma).
- Dashboards: gravar agregados diarios/semanais para reduzir custo de leitura.

## Regras (direcao geral)

- Leitura somente se o usuario tiver `members/{uid}` no tenant.
- Para colecoes de branch, permitir apenas se `branchIds` contem `idBranch`.
- Escrita limitada por role (owner/manager) e por tenant/branch.
