# 📋 Processo Completo: Cadastro de Cliente até Venda

## 📑 Índice

1. [Visão Geral do Processo](#visão-geral-do-processo)
2. [Fase 1: Cadastro do Cliente](#fase-1-cadastro-do-cliente)
3. [Fase 2: Status do Cliente](#fase-2-status-do-cliente)
4. [Fase 3: Criação da Venda](#fase-3-criação-da-venda)
5. [Fase 4: Criação da Matrícula](#fase-4-criação-da-matrícula)
6. [Fase 5: Geração de Recebíveis](#fase-5-geração-de-recebíveis)
7. [Fase 6: Ativação e Atualização de Status](#fase-6-ativação-e-atualização-de-status)
8. [Fluxo Completo de Status](#fluxo-completo-de-status)
9. [Regras de Negócio](#regras-de-negócio)

---

## 🎯 Visão Geral do Processo

### Fluxo Principal

```
┌─────────────────────┐
│  1. CADASTRO        │
│     DO CLIENTE      │
│  Status: "lead"     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  2. SELEÇÃO DE      │
│     PLANO           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  3. CRIAÇÃO DA      │
│     VENDA           │
│  Status: "open" ou  │
│         "paid"      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  4. CRIAÇÃO DA      │
│     MATRÍCULA       │
│  Status: "pending"  │
│      ou "active"    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  5. GERAÇÃO DE      │
│     RECEBÍVEIS      │
│  (se houver saldo)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  6. ATUALIZAÇÃO     │
│     CLIENTE         │
│  Status: "active"   │
│  activeMembershipId │
└─────────────────────┘
```

### Entidades Envolvidas

- **Client** (Cliente/Aluno)
- **Sale** (Venda)
- **Membership** (Matrícula)
- **Receivable** (Recebível/Conta a Receber)
- **Payment** (Pagamento)

---

## 📝 Fase 1: Cadastro do Cliente

### 1.1 Campos do Formulário de Cadastro

O formulário de cadastro é dividido em **4 etapas**:

#### **Etapa 1: Dados Pessoais**

```typescript
interface DadosPessoais {
  firstName: string;           // ✅ OBRIGATÓRIO - Nome
  lastName: string;            // ✅ OBRIGATÓRIO - Sobrenome
  gender: string;              // ✅ OBRIGATÓRIO - Gênero (male, female, other)
  birthDate: string;           // ✅ OBRIGATÓRIO - Data de nascimento (YYYY-MM-DD)
  photoUrl?: string;           // ⚪ OPCIONAL - URL da foto do perfil
}
```

**Validações:**
- `firstName`: Mínimo 2 caracteres
- `lastName`: Mínimo 2 caracteres
- `gender`: Deve ser um dos valores: "male", "female", "other"
- `birthDate`: Formato de data válido (YYYY-MM-DD)

---

#### **Etapa 2: Contato**

```typescript
interface Contato {
  email: string;               // ✅ OBRIGATÓRIO - Email
  phone?: string;              // ⚪ OPCIONAL - Telefone principal
  whatsapp?: string;           // ⚪ OPCIONAL - WhatsApp
  responsibleName?: string;    // ⚪ OPCIONAL - Nome do responsável (se menor)
  responsiblePhone?: string;   // ⚪ OPCIONAL - Telefone do responsável
}
```

**Validações:**
- `email`: Formato de email válido
- `phone`: Formato de telefone válido (se preenchido)
- `whatsapp`: Formato de telefone válido (se preenchido)

---

#### **Etapa 3: Endereço**

```typescript
interface Endereco {
  zipCode: string;             // ✅ OBRIGATÓRIO - CEP
  state: string;               // ✅ OBRIGATÓRIO - Estado (UF)
  city: string;                // ✅ OBRIGATÓRIO - Cidade
  neighborhood: string;        // ✅ OBRIGATÓRIO - Bairro
  address: string;             // ✅ OBRIGATÓRIO - Logradouro (Rua/Av)
  number: string;              // ✅ OBRIGATÓRIO - Número
}
```

**Validações:**
- `zipCode`: Formato de CEP válido (XXXXX-XXX)
- Todos os campos de endereço são obrigatórios

---

#### **Etapa 4: Observações**

```typescript
interface Observacoes {
  notes?: string;              // ⚪ OPCIONAL - Observações gerais
}
```

---

### 1.2 Estrutura Completa do Cliente

```typescript
interface ClientPayload {
  // Dados Pessoais
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  photoUrl?: string;
  
  // Contato
  email: string;
  phone?: string;
  whatsapp?: string;
  responsibleName?: string;
  responsiblePhone?: string;
  
  // Endereço
  address: {
    zipCode: string;
    state: string;
    city: string;
    neighborhood: string;
    address: string;
    number: string;
  };
  
  // Observações
  notes?: string;
  
  // Status e Metadados (preenchidos automaticamente)
  status?: string;              // Padrão: "lead"
  createdByUserId?: string;     // ID do usuário que criou
}

interface Client extends ClientPayload {
  id: string;                   // ID único do cliente
  idTenant: string;             // ID da academia
  idBranch: string;             // ID da unidade
  friendlyId?: string;          // ID amigável (ex: CLI-0001)
  
  // Relacionamentos
  activeMembershipId?: string;  // ID da matrícula ativa
  scheduledMembershipId?: string; // ID da matrícula agendada
  activeSaleId?: string;        // ID da venda ativa
  
  // Financeiro
  debtCents?: number;           // Saldo devedor em centavos
  
  // Acesso
  access?: {
    allowCrossBranchAccess?: boolean;
    allowedBranchIds?: string[];
  };
  
  // Metadados
  lastPresenceDateKey?: string; // Data da última presença
  abandonmentRisk?: boolean;    // Risco de abandono
  createdAt?: unknown;
  updatedAt?: unknown;
}
```

---

### 1.3 Processo de Criação

```typescript
// Arquivo: apps/app/src/layouts/pages/clients/newClient/index.tsx

const handleSubmit = async (values: any) => {
  const clientId = await createClient(idTenant, idBranch, {
    firstName: values.firstName,
    lastName: values.lastName,
    gender: values.gender,
    birthDate: values.birthDate,
    email: values.email,
    photoUrl: values.photoUrl,
    phone: values.phone,
    whatsapp: values.whatsapp,
    responsibleName: values.responsibleName,
    responsiblePhone: values.responsiblePhone,
    address: {
      zipCode: values.zipCode,
      state: values.state,
      city: values.city,
      neighborhood: values.neighborhood,
      address: values.address,
      number: values.number,
    },
    notes: values.notes,
    status: "lead",                    // ✅ STATUS INICIAL
    createdByUserId: user?.uid,
  });
};
```

---

## 🔄 Fase 2: Status do Cliente

### 2.1 Status Possíveis (Inferidos do Sistema)

Embora não haja um enum explícito no código, os status identificados são:

```typescript
type ClientStatus = 
  | "lead"        // Cliente cadastrado, sem matrícula
  | "active"      // Cliente com matrícula ativa
  | "pending"     // Cliente com matrícula pendente
  | "paused"      // Cliente com matrícula pausada
  | "canceled"    // Cliente com matrícula cancelada
  | "expired"     // Cliente com matrícula expirada
  | "inactive";   // Cliente inativo
```

### 2.2 Transições de Status

```
LEAD (inicial)
  │
  ├─→ PENDING (venda criada, aguardando pagamento completo)
  │
  └─→ ACTIVE (venda paga, matrícula ativada)
        │
        ├─→ PAUSED (matrícula pausada)
        │     └─→ ACTIVE (matrícula reativada)
        │
        ├─→ EXPIRED (matrícula expirada)
        │
        ├─→ CANCELED (matrícula cancelada)
        │
        └─→ INACTIVE (sem matrícula ativa)
```

---

## 💰 Fase 3: Criação da Venda

### 3.1 Estrutura da Venda

```typescript
interface CreateSalePayload {
  // Identificação
  clientId: string;              // ✅ OBRIGATÓRIO - ID do cliente
  idBranch: string;              // ✅ OBRIGATÓRIO - ID da unidade
  consultantId: string;          // ✅ OBRIGATÓRIO - ID do consultor/vendedor
  consultantName?: string;       // Nome do consultor
  
  // Snapshot do Cliente (para histórico)
  clientSnapshot?: {
    id: string;
    name: string;
    friendlyId?: string;
    photoUrl?: string;
  };
  
  // Itens da Venda
  items: SaleItem[];             // ✅ OBRIGATÓRIO - Mínimo 1 item
  
  // Valores Financeiros
  grossTotalCents: number;       // Total bruto (em centavos)
  discountCents: number;         // Desconto aplicado
  netTotalCents: number;         // Total líquido (bruto - desconto)
  feesCents?: number;            // Taxas (cartão, etc)
  netPaidTotalCents?: number;    // Total líquido pago (após taxas)
  paidTotalCents: number;        // Total pago
  remainingCents: number;        // Saldo restante
  
  // Pagamento
  dueDate?: string;              // ✅ OBRIGATÓRIO se remainingCents > 0
  payments: PaymentDraft[];      // Pagamentos realizados
  
  // Matrícula (se item for membership)
  membership?: {
    planId: string;
    planName: string;
    priceCents: number;
    startAt: string;             // Data de início (ISO)
    durationType: "day" | "week" | "month" | "year";
    duration: number;
    allowCrossBranchAccess: boolean;
    allowedBranchIds?: string[];
  };
}
```

### 3.2 Item da Venda

```typescript
interface SaleItem {
  type: "membership" | "product" | "service";
  description: string;           // Nome do item
  quantity: number;              // Quantidade
  unitPriceCents: number;        // Preço unitário (centavos)
  totalCents: number;            // Total do item (centavos)
  membershipId?: string;         // ID da matrícula (se type = membership)
  planId?: string;               // ID do plano (se type = membership)
}
```

### 3.3 Métodos de Pagamento

```typescript
type PaymentMethod = 
  | "cash"      // Dinheiro
  | "pix"       // PIX
  | "transfer"  // Transferência
  | "credit"    // Cartão de crédito
  | "debit";    // Cartão de débito

interface PaymentDraft {
  method: PaymentMethod;
  amountCents: number;           // Valor pago (centavos)
  
  // PIX
  pixTxid?: string;              // ID da transação PIX
  
  // Transferência
  transferBankName?: string;
  transferReference?: string;
  
  // Cartão
  cardAcquirerId?: string;       // ID da adquirente
  cardAcquirer?: string;         // Nome da adquirente
  cardBrand?: string;            // Bandeira (Visa, Master, etc)
  cardInstallments?: number;     // Número de parcelas
  cardAuthCode?: string;         // Código de autorização
  cardFeeCents?: number;         // Taxa do cartão
  cardAnticipated?: boolean;     // Se foi antecipado
  cardAnticipationFeeCents?: number; // Taxa de antecipação
}
```

### 3.4 Status da Venda

```typescript
type SaleStatus = 
  | "open"      // Venda em aberto (remainingCents > 0)
  | "paid"      // Venda paga (remainingCents = 0)
  | "canceled"; // Venda cancelada
```

**Regra de Status:**
```typescript
const saleStatus = remainingCents > 0 ? "open" : "paid";
```

---

## 🎓 Fase 4: Criação da Matrícula

### 4.1 Estrutura da Matrícula

```typescript
interface Membership {
  id: string;
  idTenant: string;
  idBranch: string;
  clientId: string;
  
  // Plano
  planId: string;
  planName: string;
  priceCents: number;
  
  // Período
  startAt: string;               // Data de início (ISO)
  endAt?: string;                // Data de término (ISO)
  durationType?: "day" | "week" | "month" | "year";
  duration?: number;
  
  // Status
  status: MembershipStatus;
  statusDateKey?: string;
  
  // Pausas
  pauseStartAt?: string;
  pauseUntil?: string;
  suspensionCount?: number;
  suspensionDaysUsed?: number;
  suspensionDaysCurrent?: number;
  
  // Acesso
  allowCrossBranchAccess: boolean;
  allowedBranchIds?: string[];
  
  // Relacionamentos
  saleId?: string;               // ID da venda que gerou a matrícula
  
  // Cancelamento
  cancellationReason?: string;
  
  // Metadados
  createdAt?: unknown;
  updatedAt?: unknown;
}
```

### 4.2 Status da Matrícula

```typescript
type MembershipStatus = 
  | "pending"   // Aguardando ativação (pagamento pendente)
  | "active"    // Ativa e válida
  | "paused"    // Pausada temporariamente
  | "canceled"  // Cancelada
  | "expired";  // Expirada (término do período)
```

### 4.3 Lógica de Criação da Matrícula

```typescript
// Arquivo: apps/app/src/modules/sales/db/transactions.ts

// 1. Verificar se cliente já tem matrícula ativa
const activeMembershipId = clientData?.activeMembershipId;

let membershipStatus: "active" | "pending" = "active";
let membershipStartAtIso = payload.membership?.startAt;
let activateClient = true;

// 2. Se já tem matrícula ativa, agendar a nova
if (payload.membership && activeMembershipId) {
  const activeMembershipData = await getActiveMembership();
  
  if (activeMembershipData.status === "active" || 
      activeMembershipData.status === "paused") {
    // Nova matrícula começa após o término da atual
    const nextStartKey = addDaysIsoDateKey(activeMembershipData.endAt, 1);
    membershipStartAtIso = `${nextStartKey}T00:00:00.000Z`;
    membershipStatus = "pending";
    activateClient = false;
  }
}

// 3. Calcular data de término
const membershipEndAt = computeMembershipEndAtDateKey(
  membershipStartAtIso,
  payload.membership.durationType,
  payload.membership.duration
);

// 4. Criar matrícula
const membership = {
  id: membershipId,
  idTenant,
  idBranch,
  clientId: payload.clientId,
  planId: payload.membership.planId,
  planName: payload.membership.planName,
  priceCents: payload.membership.priceCents,
  startAt: membershipStartAtIso,
  endAt: membershipEndAt,
  durationType: payload.membership.durationType,
  duration: payload.membership.duration,
  status: membershipStatus,              // "active" ou "pending"
  allowCrossBranchAccess: payload.membership.allowCrossBranchAccess,
  allowedBranchIds: payload.membership.allowedBranchIds,
  saleId: saleId,
  createdAt: serverTimestamp(),
};
```

---

## 💳 Fase 5: Geração de Recebíveis

### 5.1 Estrutura do Recebível

```typescript
interface Receivable {
  id: string;
  idTenant: string;
  idBranch: string;
  
  // Relacionamentos
  saleId: string;
  clientId: string;
  consultantId: string;
  
  // Valores
  amountCents: number;           // Valor total (centavos)
  amountPaidCents?: number;      // Valor pago (centavos)
  grossCents?: number;           // Valor bruto
  feesCents?: number;            // Taxas
  netCents?: number;             // Valor líquido
  
  // Vencimento
  dueDate: string;               // Data de vencimento (YYYY-MM-DD)
  
  // Status
  status: ReceivableStatus;
  paidAt?: string;               // Data do pagamento
  
  // Pagamento
  payment?: PaymentDraft;
  
  // Tipo
  kind?: "manual" | "card_installment";
  
  // Parcelas (se cartão)
  installmentNumber?: number;    // Número da parcela
  totalInstallments?: number;    // Total de parcelas
  
  // Antecipação
  anticipated?: boolean;
  anticipatedAt?: string;
  
  // Metadados
  createdAt?: unknown;
  updatedAt?: unknown;
}
```

### 5.2 Status do Recebível

```typescript
type ReceivableStatus = 
  | "pending"   // Aguardando pagamento
  | "paid"      // Pago
  | "overdue"   // Vencido
  | "canceled"; // Cancelado
```

### 5.3 Tipos de Recebíveis Gerados

#### **A) Recebível Manual (Saldo Restante)**

Criado quando `remainingCents > 0`:

```typescript
const manualReceivable = {
  id: receivableId,
  idTenant,
  idBranch,
  saleId,
  clientId: payload.clientId,
  consultantId: payload.consultantId,
  amountCents: payload.remainingCents,
  amountPaidCents: 0,
  dueDate: payload.dueDate,          // Data prometida
  status: "pending",
  kind: "manual",
  createdAt: serverTimestamp(),
};
```

#### **B) Recebíveis de Parcelas de Cartão**

Criado para cada parcela quando `cardInstallments > 1`:

```typescript
// Para cada parcela
for (let i = 1; i <= payment.cardInstallments; i++) {
  const installmentReceivable = {
    id: receivableId,
    idTenant,
    idBranch,
    saleId,
    clientId: payload.clientId,
    consultantId: payload.consultantId,
    amountCents: installmentAmount,
    amountPaidCents: i === 1 ? installmentAmount : 0,
    dueDate: addMonths(today, i - 1),  // Vence mensalmente
    status: i === 1 ? "paid" : "pending",
    paidAt: i === 1 ? now : undefined,
    payment: payment,
    kind: "card_installment",
    installmentNumber: i,
    totalInstallments: payment.cardInstallments,
    grossCents: installmentAmount,
    feesCents: payment.cardFeeCents,
    netCents: installmentAmount - payment.cardFeeCents,
    anticipated: payment.cardAnticipated,
    createdAt: serverTimestamp(),
  };
}
```

---

## ✅ Fase 6: Ativação e Atualização de Status

### 6.1 Atualização do Cliente

Após criar venda e matrícula, o cliente é atualizado:

```typescript
// Se venda está paga (remainingCents = 0)
if (remainingCents === 0 && activateClient) {
  await updateClient({
    activeMembershipId: membershipId,
    activeSaleId: saleId,
    status: "active",                    // ✅ CLIENTE ATIVO
  });
}

// Se venda tem saldo (remainingCents > 0)
if (remainingCents > 0) {
  await updateClient({
    scheduledMembershipId: membershipId,
    activeSaleId: saleId,
    status: "pending",                   // ✅ CLIENTE PENDENTE
    debtCents: remainingCents,
  });
}

// Se já tem matrícula ativa, agendar nova
if (!activateClient) {
  await updateClient({
    scheduledMembershipId: membershipId,
    activeSaleId: saleId,
    // status permanece "active" (matrícula atual)
  });
}
```

---

## 📊 Fluxo Completo de Status

### Cenário 1: Venda à Vista (Pagamento Total)

```
1. Cliente Cadastrado
   └─ status: "lead"
   └─ activeMembershipId: null

2. Venda Criada (pago 100%)
   └─ Sale.status: "paid"
   └─ Sale.remainingCents: 0

3. Matrícula Criada
   └─ Membership.status: "active"
   └─ Membership.startAt: hoje ou data escolhida

4. Cliente Atualizado
   └─ status: "active"
   └─ activeMembershipId: [ID da matrícula]
   └─ activeSaleId: [ID da venda]

5. Recebíveis
   └─ Nenhum recebível manual criado
   └─ Apenas parcelas de cartão (se parcelado)
```

---

### Cenário 2: Venda com Saldo (Pagamento Parcial)

```
1. Cliente Cadastrado
   └─ status: "lead"
   └─ activeMembershipId: null

2. Venda Criada (pago 50%, resta 50%)
   └─ Sale.status: "open"
   └─ Sale.remainingCents: 5000 (R$ 50,00)
   └─ Sale.dueDate: "2024-02-15"

3. Matrícula Criada
   └─ Membership.status: "pending"
   └─ Membership.startAt: data escolhida

4. Cliente Atualizado
   └─ status: "pending"
   └─ scheduledMembershipId: [ID da matrícula]
   └─ activeSaleId: [ID da venda]
   └─ debtCents: 5000

5. Recebível Manual Criado
   └─ Receivable.status: "pending"
   └─ Receivable.amountCents: 5000
   └─ Receivable.dueDate: "2024-02-15"
   └─ Receivable.kind: "manual"

6. Quando Pagar o Saldo
   └─ Receivable.status: "paid"
   └─ Sale.status: "paid"
   └─ Sale.remainingCents: 0
   └─ Membership.status: "active"
   └─ Cliente.status: "active"
   └─ Cliente.activeMembershipId: [ID da matrícula]
```

---

### Cenário 3: Renovação (Cliente já tem Matrícula Ativa)

```
1. Cliente com Matrícula Ativa
   └─ status: "active"
   └─ activeMembershipId: "membership-001"
   └─ Membership-001.status: "active"
   └─ Membership-001.endAt: "2024-02-28"

2. Nova Venda Criada (renovação)
   └─ Sale.status: "paid"
   └─ Sale.remainingCents: 0

3. Nova Matrícula Criada (agendada)
   └─ Membership-002.status: "pending"
   └─ Membership-002.startAt: "2024-03-01" (dia seguinte ao término)
   └─ Membership-002.endAt: "2024-03-31"

4. Cliente Atualizado
   └─ status: "active" (mantém)
   └─ activeMembershipId: "membership-001" (mantém)
   └─ scheduledMembershipId: "membership-002" (nova)

5. Quando Matrícula Atual Expirar (2024-02-28)
   └─ Membership-001.status: "expired"
   └─ Membership-002.status: "active"
   └─ Cliente.activeMembershipId: "membership-002"
   └─ Cliente.scheduledMembershipId: null
```

---

## 📋 Regras de Negócio

### 1. Validações Obrigatórias

```typescript
// Cliente
✅ firstName (mínimo 2 caracteres)
✅ lastName (mínimo 2 caracteres)
✅ gender (male, female, other)
✅ birthDate (formato YYYY-MM-DD)
✅ email (formato válido)
✅ address.zipCode
✅ address.state
✅ address.city
✅ address.neighborhood
✅ address.address
✅ address.number

// Venda
✅ clientId
✅ consultantId
✅ items (mínimo 1 item)
✅ dueDate (se remainingCents > 0)
```

### 2. Cálculos Financeiros

```typescript
// Total Bruto
grossTotalCents = sum(items.totalCents)

// Total Líquido
netTotalCents = grossTotalCents - discountCents

// Saldo Restante
remainingCents = netTotalCents - paidTotalCents

// Status da Venda
status = remainingCents > 0 ? "open" : "paid"

// Valor Líquido Pago (após taxas)
netPaidTotalCents = paidTotalCents - feesCents
```

### 3. Lógica de Status da Matrícula

```typescript
// Matrícula Imediata (sem matrícula ativa anterior)
if (!activeMembershipId) {
  membershipStatus = "active";
  activateClient = true;
}

// Matrícula Agendada (já tem matrícula ativa)
if (activeMembershipId && activeMembershipStatus === "active") {
  membershipStatus = "pending";
  membershipStartAt = activeMembershipEndAt + 1 dia;
  activateClient = false;
}
```

### 4. Cálculo de Data de Término

```typescript
function computeMembershipEndAt(
  startAt: string,
  durationType: "day" | "week" | "month" | "year",
  duration: number
): string {
  const start = new Date(startAt);
  
  switch (durationType) {
    case "day":
      return addDays(start, duration);
    case "week":
      return addDays(start, duration * 7);
    case "month":
      return addMonths(start, duration);
    case "year":
      return addYears(start, duration);
  }
}
```

### 5. Geração de Recebíveis

```typescript
// Recebível Manual
if (remainingCents > 0) {
  createReceivable({
    amountCents: remainingCents,
    dueDate: payload.dueDate,
    status: "pending",
    kind: "manual"
  });
}

// Recebíveis de Cartão Parcelado
if (payment.method === "credit" && payment.cardInstallments > 1) {
  for (let i = 1; i <= payment.cardInstallments; i++) {
    createReceivable({
      amountCents: installmentAmount,
      dueDate: addMonths(today, i - 1),
      status: i === 1 ? "paid" : "pending",
      kind: "card_installment",
      installmentNumber: i,
      totalInstallments: payment.cardInstallments
    });
  }
}
```

---

## 📝 Resumo dos Campos por Entidade

### Cliente (Client)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `firstName` | string | ✅ | Nome |
| `lastName` | string | ✅ | Sobrenome |
| `gender` | string | ✅ | Gênero (male/female/other) |
| `birthDate` | string | ✅ | Data de nascimento |
| `email` | string | ✅ | Email |
| `photoUrl` | string | ⚪ | URL da foto |
| `phone` | string | ⚪ | Telefone |
| `whatsapp` | string | ⚪ | WhatsApp |
| `responsibleName` | string | ⚪ | Nome do responsável |
| `responsiblePhone` | string | ⚪ | Telefone do responsável |
| `address.zipCode` | string | ✅ | CEP |
| `address.state` | string | ✅ | Estado |
| `address.city` | string | ✅ | Cidade |
| `address.neighborhood` | string | ✅ | Bairro |
| `address.address` | string | ✅ | Logradouro |
| `address.number` | string | ✅ | Número |
| `notes` | string | ⚪ | Observações |
| `status` | string | ✅ | Status (lead/active/pending/etc) |
| `activeMembershipId` | string | ⚪ | ID da matrícula ativa |
| `scheduledMembershipId` | string | ⚪ | ID da matrícula agendada |
| `debtCents` | number | ⚪ | Saldo devedor (centavos) |

### Venda (Sale)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `clientId` | string | ✅ | ID do cliente |
| `consultantId` | string | ✅ | ID do consultor |
| `items` | array | ✅ | Itens da venda |
| `grossTotalCents` | number | ✅ | Total bruto (centavos) |
| `discountCents` | number | ✅ | Desconto (centavos) |
| `netTotalCents` | number | ✅ | Total líquido (centavos) |
| `paidTotalCents` | number | ✅ | Total pago (centavos) |
| `remainingCents` | number | ✅ | Saldo restante (centavos) |
| `dueDate` | string | ⚠️ | Data prometida (se remainingCents > 0) |
| `payments` | array | ✅ | Pagamentos realizados |
| `status` | string | ✅ | Status (open/paid/canceled) |
| `membership` | object | ⚠️ | Dados da matrícula (se item for membership) |

### Matrícula (Membership)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `clientId` | string | ✅ | ID do cliente |
| `planId` | string | ✅ | ID do plano |
| `planName` | string | ✅ | Nome do plano |
| `priceCents` | number | ✅ | Preço (centavos) |
| `startAt` | string | ✅ | Data de início (ISO) |
| `endAt` | string | ✅ | Data de término (ISO) |
| `durationType` | string | ✅ | Tipo de duração (day/week/month/year) |
| `duration` | number | ✅ | Duração |
| `status` | string | ✅ | Status (pending/active/paused/canceled/expired) |
| `allowCrossBranchAccess` | boolean | ✅ | Permite acesso a outras unidades |
| `saleId` | string | ⚪ | ID da venda |

### Recebível (Receivable)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `saleId` | string | ✅ | ID da venda |
| `clientId` | string | ✅ | ID do cliente |
| `consultantId` | string | ✅ | ID do consultor |
| `amountCents` | number | ✅ | Valor total (centavos) |
| `dueDate` | string | ✅ | Data de vencimento |
| `status` | string | ✅ | Status (pending/paid/overdue/canceled) |
| `kind` | string | ⚪ | Tipo (manual/card_installment) |
| `installmentNumber` | number | ⚪ | Número da parcela |
| `totalInstallments` | number | ⚪ | Total de parcelas |

---

## 🎯 Conclusão

Este documento detalha todo o processo de cadastro de cliente até a venda, incluindo:

1. **Cadastro**: 4 etapas com 17 campos (7 obrigatórios no mínimo)
2. **Status**: 7 status possíveis com transições bem definidas
3. **Venda**: Criação com cálculos financeiros e validações
4. **Matrícula**: Lógica de ativação imediata ou agendada
5. **Recebíveis**: Geração automática de contas a receber
6. **Ativação**: Atualização de status do cliente baseado no pagamento

O sistema garante integridade dos dados através de validações e transações atômicas no Firestore.
