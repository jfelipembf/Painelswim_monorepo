# 🏊 Guia Completo do Projeto - Painel Swim

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Estrutura Atual vs Ideal](#estrutura-atual-vs-ideal)
3. [Organização de Pastas](#organização-de-pastas)
4. [Módulos Principais](#módulos-principais)
5. [Fluxos Completos](#fluxos-completos)
6. [Correções Necessárias](#correções-necessárias)
7. [Padrões e Boas Práticas](#padrões-e-boas-práticas)
8. [Plano de Implementação](#plano-de-implementação)

---

## 🎯 Visão Geral do Projeto

### O que é o Painel Swim?

Sistema de gestão para academias de natação que gerencia:
- ✅ **Clientes** (alunos)
- ✅ **Vendas** (matrículas e produtos)
- ✅ **Matrículas** (memberships)
- ✅ **Recebíveis** (pagamentos)
- ✅ **Presença** (check-in e frequência)
- ✅ **Avaliações** (progressão de alunos)
- ✅ **Turmas** (classes)
- ✅ **Colaboradores** (instrutores e staff)
- ✅ **Dashboard** (métricas e relatórios)

### Stack Tecnológica

```
Frontend:  React + JavaScript
Backend:   Firebase (Firestore + Functions)
Estado:    Hooks + Context (sem Redux)
Validação: Zod (obrigatório)
Estilo:    Material-UI / TailwindCSS
```

---

## 🔄 Estrutura Atual vs Ideal

### ❌ Problemas Atuais

1. **Sem validação com Zod** - Dados inválidos podem entrar
2. **Tipos com `unknown`** - Perde type-safety
3. **Estrutura inconsistente** - Alguns módulos têm subpastas, outros não
4. **Funções faltando** - CRUDs incompletos
5. **Sem arquivo `.schemas.js`** - Validações espalhadas
6. **Nomenclatura mista** - `clients` vs `students`

### ✅ Estrutura Ideal

```
src/
├── modules/                    # Módulos de negócio
│   ├── clients/               # ✅ Clientes (alunos)
│   │   ├── clients.schemas.js
│   │   ├── clients.db.js
│   │   ├── clients.domain.js
│   │   └── index.js
│   │
│   ├── sales/                 # ✅ Vendas
│   │   ├── sales.schemas.js
│   │   ├── sales.db.js
│   │   ├── sales.domain.js
│   │   └── index.js
│   │
│   ├── memberships/           # ✅ Matrículas
│   │   ├── memberships.schemas.js
│   │   ├── memberships.db.js
│   │   ├── memberships.domain.js
│   │   └── index.js
│   │
│   ├── receivables/           # ✅ Recebíveis
│   │   ├── receivables.schemas.js
│   │   ├── receivables.db.js
│   │   ├── receivables.domain.js
│   │   └── index.js
│   │
│   ├── attendance/            # ✅ Presença
│   │   ├── attendance.schemas.js
│   │   ├── attendance.db.js
│   │   ├── attendance.domain.js
│   │   └── index.js
│   │
│   ├── evaluations/           # ✅ Avaliações
│   │   ├── evaluations.schemas.js
│   │   ├── evaluations.db.js
│   │   ├── evaluations.domain.js
│   │   └── index.js
│   │
│   ├── contracts/             # ✅ Contratos/Planos
│   │   ├── contracts.schemas.js
│   │   ├── contracts.db.js
│   │   ├── contracts.domain.js
│   │   └── index.js
│   │
│   ├── classes/               # ✅ Turmas
│   │   ├── classes.schemas.js
│   │   ├── classes.db.js
│   │   ├── classes.domain.js
│   │   └── index.js
│   │
│   ├── collaborators/         # ✅ Colaboradores
│   │   ├── collaborators.schemas.js
│   │   ├── collaborators.db.js
│   │   ├── collaborators.domain.js
│   │   └── index.js
│   │
│   ├── dashboard/             # ✅ Dashboard
│   │   ├── dashboard.schemas.js
│   │   ├── dashboard.db.js
│   │   ├── dashboard.domain.js
│   │   └── index.js
│   │
│   ├── dailySummaries/        # ✅ Resumos Diários
│   │   ├── dailySummaries.schemas.js
│   │   ├── dailySummaries.db.js
│   │   ├── dailySummaries.domain.js
│   │   └── index.js
│   │
│   └── monthlySummaries/      # ✅ Resumos Mensais
│       ├── monthlySummaries.schemas.js
│       ├── monthlySummaries.db.js
│       ├── monthlySummaries.domain.js
│       └── index.js
│
├── hooks/                      # React Hooks
│   ├── clients/
│   │   ├── useClient.js
│   │   ├── useClientList.js
│   │   ├── useCreateClient.js
│   │   ├── useUpdateClient.js
│   │   └── index.js
│   │
│   ├── sales/
│   │   ├── useSale.js
│   │   ├── useSaleList.js
│   │   ├── useCreateSale.js
│   │   └── index.js
│   │
│   ├── memberships/
│   │   ├── useMembership.js
│   │   ├── useMembershipList.js
│   │   └── index.js
│   │
│   └── ui/                    # Hooks genéricos de UI
│       ├── useModal.js
│       ├── useAlert.js
│       ├── useForm.js
│       └── index.js
│
├── components/                 # Componentes React
│   ├── clients/
│   │   ├── ClientForm.jsx
│   │   ├── ClientList.jsx
│   │   ├── ClientCard.jsx
│   │   └── index.js
│   │
│   ├── sales/
│   │   ├── SaleForm.jsx
│   │   ├── SaleList.jsx
│   │   └── index.js
│   │
│   └── ui/                    # Componentes genéricos
│       ├── Button.jsx
│       ├── Modal.jsx
│       ├── Alert.jsx
│       └── index.js
│
├── pages/                      # Páginas (rotas)
│   ├── clients/
│   │   ├── ClientsPage.jsx
│   │   ├── ClientDetailPage.jsx
│   │   └── ClientFormPage.jsx
│   │
│   ├── sales/
│   │   ├── SalesPage.jsx
│   │   └── SaleDetailPage.jsx
│   │
│   └── dashboard/
│       └── DashboardPage.jsx
│
├── services/                   # Serviços externos
│   ├── firebase/
│   │   ├── index.js           # Config
│   │   ├── firestore.js       # Helpers
│   │   └── auth.js
│   │
│   └── helpers/
│       └── salesHelpers.js
│
├── constants/                  # Constantes globais
│   ├── status.js              # Status (active, inactive, etc)
│   ├── gender.js              # Gêneros
│   ├── roles.js               # Funções (admin, instructor, etc)
│   └── index.js
│
├── utils/                      # Utilitários
│   ├── formatters.js          # Formatação (CPF, telefone, etc)
│   ├── validators.js          # Validações genéricas
│   ├── dates.js               # Manipulação de datas
│   └── omitUndefined.js
│
└── context/                    # Context API
    ├── AuthContext.jsx
    ├── TenantContext.jsx
    └── BranchContext.jsx
```

---

## 📦 Módulos Principais

### 1. Módulo: Clients (Clientes/Alunos)

#### Estado Atual
```javascript
// ✅ Tem
clients/
├── clients.types.ts      // Tipos TypeScript
├── clients.db.ts         // CRUD básico
├── clients.domain.ts     // Lógica simples
└── index.ts

// ❌ Falta
- clients.schemas.js      // Validação Zod
- Funções completas
- Validações de negócio
```

#### Estado Ideal
```javascript
// clients.schemas.js
import { z } from 'zod';

export const ClientStatus = {
  LEAD: 'lead',
  PENDING: 'pending',
  ACTIVE: 'active',
  PAUSED: 'paused',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired',
  CANCELED: 'canceled'
};

export const CreateClientSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['male', 'female', 'other']),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15),
  address: z.object({
    zipCode: z.string().length(8),
    state: z.string().length(2),
    city: z.string().min(1),
    neighborhood: z.string().min(1),
    address: z.string().min(1),
    number: z.string().min(1)
  })
});

export const validateCreateClient = (data) => {
  return CreateClientSchema.parse(data);
};
```

```javascript
// clients.db.js
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase';
import { validateCreateClient, validateUpdateClient } from './clients.schemas.js';

export const createClient = async (idTenant, idBranch, payload, userId) => {
  // ✅ SEMPRE validar
  const validated = validateCreateClient(payload);
  
  const db = getFirebaseDb();
  const clientRef = doc(collection(db, 'tenants', idTenant, 'branches', idBranch, 'clients'));
  
  await setDoc(clientRef, {
    ...validated,
    status: 'lead',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdByUserId: userId
  });
  
  return clientRef.id;
};

export const fetchClients = async (idTenant, idBranch) => {
  const db = getFirebaseDb();
  const clientsRef = collection(db, 'tenants', idTenant, 'branches', idBranch, 'clients');
  const snapshot = await getDocs(clientsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const fetchClientById = async (idTenant, idBranch, clientId) => {
  const db = getFirebaseDb();
  const clientRef = doc(db, 'tenants', idTenant, 'branches', idBranch, 'clients', clientId);
  const snapshot = await getDoc(clientRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const updateClient = async (idTenant, idBranch, clientId, payload, userId) => {
  const validated = validateUpdateClient(payload);
  
  const db = getFirebaseDb();
  const clientRef = doc(db, 'tenants', idTenant, 'branches', idBranch, 'clients', clientId);
  
  await updateDoc(clientRef, {
    ...validated,
    updatedAt: serverTimestamp(),
    updatedBy: userId
  });
};
```

```javascript
// clients.domain.js
import { ClientStatus } from './clients.schemas.js';

export const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const isMinor = (birthDate) => {
  return calculateAge(birthDate) < 18;
};

export const formatFullName = (firstName, lastName) => {
  return `${firstName} ${lastName}`.trim();
};

export const canEnrollClient = (client) => {
  if (client.activeMembershipId) {
    return { canEnroll: false, reason: 'Cliente já possui matrícula ativa' };
  }
  
  if (client.status === ClientStatus.CANCELED) {
    return { canEnroll: false, reason: 'Cliente cancelado' };
  }
  
  if (client.debtCents > 0) {
    return { canEnroll: false, reason: 'Cliente possui débitos' };
  }
  
  return { canEnroll: true };
};

export const canCheckIn = (client) => {
  if (!client.activeMembershipId) {
    return { canCheckIn: false, reason: 'Sem matrícula ativa' };
  }
  
  if (client.status === ClientStatus.SUSPENDED) {
    return { canCheckIn: false, reason: 'Matrícula suspensa' };
  }
  
  if (client.status === ClientStatus.EXPIRED) {
    return { canCheckIn: false, reason: 'Matrícula expirada' };
  }
  
  return { canCheckIn: true };
};
```

---

### 2. Módulo: Sales (Vendas)

#### Responsabilidade
Gerenciar vendas de matrículas, produtos e serviços.

#### Estrutura Ideal

```javascript
// sales.schemas.js
import { z } from 'zod';

export const SaleStatus = {
  OPEN: 'open',
  PAID: 'paid',
  CANCELED: 'canceled'
};

export const PaymentMethod = {
  CASH: 'cash',
  PIX: 'pix',
  TRANSFER: 'transfer',
  CREDIT: 'credit',
  DEBIT: 'debit'
};

export const SaleItemSchema = z.object({
  type: z.enum(['membership', 'product', 'service']),
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
  membershipId: z.string().optional(),
  planId: z.string().optional()
});

export const PaymentSchema = z.object({
  method: z.enum(Object.values(PaymentMethod)),
  amountCents: z.number().int().positive(),
  pixTxid: z.string().optional(),
  cardBrand: z.string().optional(),
  cardInstallments: z.number().int().optional()
});

export const CreateSaleSchema = z.object({
  clientId: z.string().min(1),
  idBranch: z.string().min(1),
  consultantId: z.string().min(1),
  items: z.array(SaleItemSchema).min(1),
  grossTotalCents: z.number().int().nonnegative(),
  discountCents: z.number().int().nonnegative(),
  netTotalCents: z.number().int().nonnegative(),
  paidTotalCents: z.number().int().nonnegative(),
  remainingCents: z.number().int().nonnegative(),
  payments: z.array(PaymentSchema),
  dueDate: z.string().optional()
}).refine(
  (data) => data.discountCents <= data.grossTotalCents,
  'Desconto não pode ser maior que o total'
).refine(
  (data) => data.netTotalCents === data.grossTotalCents - data.discountCents,
  'Total líquido incorreto'
);
```

```javascript
// sales.db.js
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase';
import { validateCreateSale } from './sales.schemas.js';

export const createSale = async (idTenant, idBranch, payload, userId) => {
  const validated = validateCreateSale(payload);
  
  const db = getFirebaseDb();
  const saleRef = doc(collection(db, 'tenants', idTenant, 'branches', idBranch, 'sales'));
  
  const today = new Date();
  const dateKey = today.toISOString().split('T')[0];
  
  const status = validated.remainingCents === 0 ? 'paid' : 'open';
  
  await setDoc(saleRef, {
    ...validated,
    idTenant,
    status,
    dateKey,
    branchDateKey: `${idBranch}_${dateKey}`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return saleRef.id;
};

export const fetchSales = async (idTenant, idBranch, filters = {}) => {
  const db = getFirebaseDb();
  const salesRef = collection(db, 'tenants', idTenant, 'branches', idBranch, 'sales');
  
  let q = query(salesRef);
  
  if (filters.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  if (filters.clientId) {
    q = query(q, where('clientId', '==', filters.clientId));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

```javascript
// sales.domain.js
export const calculateSaleTotals = (items, discountCents = 0) => {
  const grossTotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
  const netTotalCents = grossTotalCents - discountCents;
  
  return {
    grossTotalCents,
    discountCents,
    netTotalCents
  };
};

export const calculateRemainingAmount = (netTotalCents, payments) => {
  const paidTotalCents = payments.reduce((sum, p) => sum + p.amountCents, 0);
  return Math.max(0, netTotalCents - paidTotalCents);
};

export const canApplyDiscount = (discountCents, grossTotalCents, maxDiscountPercent = 50) => {
  const discountPercent = (discountCents / grossTotalCents) * 100;
  
  if (discountPercent > maxDiscountPercent) {
    return {
      canApply: false,
      reason: `Desconto máximo permitido: ${maxDiscountPercent}%`
    };
  }
  
  return { canApply: true };
};
```

---

### 3. Módulo: Memberships (Matrículas)

#### Responsabilidade
Gerenciar matrículas dos clientes.

```javascript
// memberships.schemas.js
import { z } from 'zod';

export const MembershipStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  PAUSED: 'paused',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired',
  CANCELED: 'canceled'
};

export const CreateMembershipSchema = z.object({
  clientId: z.string().min(1),
  planId: z.string().min(1),
  planName: z.string().min(1),
  priceCents: z.number().int().positive(),
  startAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationType: z.enum(['day', 'week', 'month', 'year']),
  duration: z.number().int().positive(),
  allowCrossBranchAccess: z.boolean(),
  allowedBranchIds: z.array(z.string()).optional(),
  saleId: z.string().optional()
});
```

```javascript
// memberships.domain.js
export const calculateEndDate = (startAt, durationType, duration) => {
  const start = new Date(startAt);
  
  switch (durationType) {
    case 'day':
      start.setDate(start.getDate() + duration);
      break;
    case 'week':
      start.setDate(start.getDate() + (duration * 7));
      break;
    case 'month':
      start.setMonth(start.getMonth() + duration);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() + duration);
      break;
  }
  
  return start.toISOString().split('T')[0];
};

export const isExpired = (endAt) => {
  const today = new Date().toISOString().split('T')[0];
  return endAt < today;
};

export const daysUntilExpiration = (endAt) => {
  const today = new Date();
  const end = new Date(endAt);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
```

---

### 4. Módulo: Receivables (Recebíveis)

#### Responsabilidade
Gerenciar pagamentos e recebíveis.

```javascript
// receivables.schemas.js
import { z } from 'zod';

export const ReceivableStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELED: 'canceled'
};

export const CreateReceivableSchema = z.object({
  saleId: z.string().min(1),
  clientId: z.string().min(1),
  amountCents: z.number().int().positive(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum(['manual', 'card_installment']).optional(),
  installmentNumber: z.number().int().optional(),
  totalInstallments: z.number().int().optional()
});
```

```javascript
// receivables.domain.js
export const calculateLateFee = (amountCents, dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  
  if (today <= due) {
    return { lateFeesCents: 0, totalCents: amountCents };
  }
  
  const daysOverdue = Math.floor((today - due) / (1000 * 60 * 60 * 24));
  
  // Multa: 2% + juros de 1% ao mês (pro-rata)
  const penaltyCents = Math.round((amountCents * 2) / 100);
  const monthlyRate = 0.01;
  const dailyRate = monthlyRate / 30;
  const interestCents = Math.round(amountCents * dailyRate * daysOverdue);
  
  const lateFeesCents = penaltyCents + interestCents;
  const totalCents = amountCents + lateFeesCents;
  
  return { lateFeesCents, totalCents, daysOverdue };
};

export const isOverdue = (dueDate) => {
  const today = new Date().toISOString().split('T')[0];
  return dueDate < today;
};
```

---

### 5. Módulo: Attendance (Presença)

```javascript
// attendance.schemas.js
import { z } from 'zod';

export const AttendanceStatus = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  JUSTIFIED: 'justified'
};

export const CreateAttendanceSchema = z.object({
  sessionId: z.string().min(1),
  idClass: z.string().min(1),
  clientId: z.string().min(1),
  status: z.enum(Object.values(AttendanceStatus)),
  sessionDateKey: z.string().optional(),
  justification: z.string().optional()
});
```

```javascript
// attendance.domain.js
export const calculateAttendanceRate = (attendances) => {
  const total = attendances.length;
  if (total === 0) return 0;
  
  const present = attendances.filter(a => 
    a.status === 'present' || a.status === 'late'
  ).length;
  
  return Math.round((present / total) * 100);
};

export const getAttendanceSummary = (attendances) => {
  const summary = {
    total: attendances.length,
    present: 0,
    absent: 0,
    late: 0,
    justified: 0
  };
  
  attendances.forEach(a => {
    summary[a.status]++;
  });
  
  summary.rate = calculateAttendanceRate(attendances);
  
  return summary;
};
```

---

### 6. Módulo: Evaluations (Avaliações)

```javascript
// evaluations.schemas.js
import { z } from 'zod';

export const CreateEvaluationSchema = z.object({
  clientId: z.string().min(1),
  idClass: z.string().min(1),
  idActivity: z.string().min(1),
  eventPlanId: z.string().min(1),
  startAt: z.string(),
  endAt: z.string().optional(),
  levelsByTopicId: z.record(z.object({
    levelId: z.string(),
    levelName: z.string(),
    levelValue: z.number()
  })),
  overallScore: z.number().min(0).max(100).optional(),
  instructorNotes: z.string().optional(),
  strengths: z.array(z.string()).optional(),
  areasForImprovement: z.array(z.string()).optional()
});
```

---

## 🔄 Fluxos Completos

### Fluxo 1: Cadastro de Cliente → Venda → Matrícula

```javascript
// 1. Criar cliente
const clientId = await createClient(tenantId, branchId, {
  firstName: 'João',
  lastName: 'Silva',
  birthDate: '1990-01-01',
  gender: 'male',
  phone: '11999999999',
  email: 'joao@email.com',
  address: {
    zipCode: '12345678',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Centro',
    address: 'Rua A',
    number: '123'
  }
}, userId);

// 2. Criar venda
const saleId = await createSale(tenantId, branchId, {
  clientId,
  idBranch: branchId,
  consultantId: userId,
  items: [{
    type: 'membership',
    description: 'Plano Mensal',
    quantity: 1,
    unitPriceCents: 10000,
    totalCents: 10000,
    planId: 'plan-123'
  }],
  grossTotalCents: 10000,
  discountCents: 0,
  netTotalCents: 10000,
  paidTotalCents: 10000,
  remainingCents: 0,
  payments: [{
    method: 'pix',
    amountCents: 10000
  }]
}, userId);

// 3. Criar matrícula
const membershipId = await createMembership(tenantId, branchId, {
  clientId,
  planId: 'plan-123',
  planName: 'Plano Mensal',
  priceCents: 10000,
  startAt: '2024-01-01',
  durationType: 'month',
  duration: 1,
  allowCrossBranchAccess: false,
  saleId
}, userId);

// 4. Atualizar cliente com matrícula ativa
await updateClient(tenantId, branchId, clientId, {
  status: 'active',
  activeMembershipId: membershipId
}, userId);
```

### Fluxo 2: Check-in de Cliente

```javascript
// 1. Verificar se pode fazer check-in
const client = await fetchClientById(tenantId, branchId, clientId);
const { canCheckIn, reason } = canCheckIn(client);

if (!canCheckIn) {
  throw new Error(reason);
}

// 2. Registrar presença
const attendanceId = await createAttendance(tenantId, branchId, {
  sessionId: 'session-123',
  idClass: 'class-456',
  clientId,
  status: 'present',
  sessionDateKey: '2024-01-15'
}, userId);

// 3. Atualizar última presença do cliente
await updateClient(tenantId, branchId, clientId, {
  lastPresenceDateKey: '2024-01-15'
}, userId);
```

---

## 🔧 Correções Necessárias

### Prioridade ALTA

#### 1. Adicionar Validação com Zod em TODOS os Módulos

```javascript
// ❌ Atual (sem validação)
export const createClient = async (idTenant, idBranch, payload) => {
  await setDoc(clientRef, payload); // Aceita qualquer coisa!
};

// ✅ Correto (com validação)
export const createClient = async (idTenant, idBranch, payload) => {
  const validated = validateCreateClient(payload); // Valida SEMPRE
  await setDoc(clientRef, validated);
};
```

**Ação:** Criar `{module}.schemas.js` para cada módulo.

---

#### 2. Corrigir Tipos `unknown`

```javascript
// ❌ Atual
createdAt?: unknown;
updatedAt?: unknown;

// ✅ Correto
createdAt: any; // Firebase Timestamp
updatedAt: any; // Firebase Timestamp
```

**Ação:** Substituir `unknown` por tipos específicos ou `any` para Firebase Timestamps.

---

#### 3. Padronizar Estrutura de Módulos

```javascript
// ✅ Todos os módulos devem ter:
{module}/
├── {module}.schemas.js    # Validação Zod
├── {module}.db.js         # CRUD Firebase
├── {module}.domain.js     # Lógica de negócio
└── index.js               # Exports
```

**Ação:** Reorganizar módulos que têm subpastas (`sales/db/`, `sales/domain/`).

---

### Prioridade MÉDIA

#### 4. Adicionar Funções Faltantes

| Módulo | Funções Faltantes |
|--------|-------------------|
| **clients** | `deleteClient`, `getClientsByStatus`, `getClientFinancialSummary` |
| **sales** | `refundSale`, `getSalesByPeriod`, `cancelSale` |
| **memberships** | `renewMembership`, `pauseMembership`, `resumeMembership` |
| **receivables** | `negotiateDebt`, `installDebt` |
| **attendance** | `getAttendanceRate`, `getAttendanceReport` |

---

#### 5. Implementar Máquinas de Estado

```javascript
// Exemplo: Transições de status de matrícula
const STATUS_TRANSITIONS = {
  pending: ['active', 'canceled'],
  active: ['paused', 'suspended', 'expired', 'canceled'],
  paused: ['active', 'canceled'],
  suspended: ['active', 'canceled'],
  expired: ['active', 'canceled'],
  canceled: []
};

export const isValidStatusTransition = (currentStatus, newStatus) => {
  const allowed = STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
};
```

---

## 📐 Padrões e Boas Práticas

### 1. Nomenclatura

```javascript
// ✅ Arquivos: kebab-case
clients.schemas.js
clients.db.js

// ✅ Variáveis e funções: camelCase
const clientName = 'João';
const getClientById = () => {};

// ✅ Constantes: UPPER_SNAKE_CASE
const MAX_CLIENTS = 100;

// ✅ Schemas Zod: PascalCase + Schema
const ClientSchema = z.object({});

// ✅ Enums: PascalCase (objeto)
const ClientStatus = {
  ACTIVE: 'active'
};
```

---

### 2. Organização de Imports

```javascript
// 1. Bibliotecas externas
import { z } from 'zod';
import { collection, doc } from 'firebase/firestore';

// 2. Serviços internos
import { getFirebaseDb } from '@/services/firebase';

// 3. Módulos locais
import { ClientSchema } from './clients.schemas.js';

// 4. Constantes
import { CLIENT_STATUS } from '@/constants/status';
```

---

### 3. Validação SEMPRE

```javascript
// ✅ SEMPRE validar entradas
export const createClient = async (idTenant, idBranch, payload) => {
  const validated = validateCreateClient(payload); // ← OBRIGATÓRIO
  // ... resto do código
};

// ✅ SEMPRE validar regras de negócio
export const enrollClient = async (clientId) => {
  const client = await fetchClientById(clientId);
  const { canEnroll, reason } = canEnrollClient(client);
  
  if (!canEnroll) {
    throw new Error(reason);
  }
  
  // ... continuar
};
```

---

### 4. Separação de Responsabilidades

```javascript
// ❌ ERRADO - Mistura validação, banco e lógica
export const createClient = async (data) => {
  // Validação
  if (!data.firstName) throw new Error('Nome obrigatório');
  
  // Lógica de negócio
  const age = calculateAge(data.birthDate);
  
  // Banco de dados
  await setDoc(clientRef, data);
};

// ✅ CORRETO - Separado
// schemas.js - Validação
export const validateCreateClient = (data) => {
  return CreateClientSchema.parse(data);
};

// domain.js - Lógica
export const calculateAge = (birthDate) => {
  // ...
};

// db.js - Banco
export const createClient = async (idTenant, idBranch, payload) => {
  const validated = validateCreateClient(payload);
  await setDoc(clientRef, validated);
};
```

---

## 🚀 Plano de Implementação

### Fase 1: Validação (2-3 semanas)

```
Semana 1-2:
- [ ] Criar {module}.schemas.js para todos os módulos
- [ ] Adicionar validação Zod em todas as funções de entrada
- [ ] Testar validações

Semana 3:
- [ ] Revisar e ajustar schemas
- [ ] Documentar schemas
```

---

### Fase 2: Correção de Tipos (1 semana)

```
- [ ] Substituir unknown por tipos específicos
- [ ] Adicionar JSDoc em todas as funções
- [ ] Revisar tipos de retorno
```

---

### Fase 3: Padronização (2 semanas)

```
Semana 1:
- [ ] Reorganizar módulos com subpastas
- [ ] Consolidar arquivos
- [ ] Atualizar imports

Semana 2:
- [ ] Revisar estrutura
- [ ] Testar integrações
```

---

### Fase 4: Funções Faltantes (3-4 semanas)

```
Por módulo:
- [ ] Identificar gaps
- [ ] Implementar funções
- [ ] Adicionar testes
- [ ] Documentar
```

---

### Fase 5: Máquinas de Estado (1-2 semanas)

```
- [ ] Definir transições de status
- [ ] Implementar validações
- [ ] Testar fluxos
```

---

## ✅ Checklist Final

### Por Módulo

- [ ] Tem `{module}.schemas.js` com Zod
- [ ] Tem `{module}.db.js` com CRUD completo
- [ ] Tem `{module}.domain.js` com lógica de negócio
- [ ] Tem `index.js` com exports
- [ ] Validação em TODAS as entradas
- [ ] JSDoc em todas as funções
- [ ] Sem tipos `unknown`
- [ ] Máquina de estados (se aplicável)
- [ ] Testes unitários

### Geral

- [ ] Usa Firebase (não Supabase)
- [ ] Usa `clients` (não `students`)
- [ ] Estrutura consistente
- [ ] Sem código duplicado
- [ ] Constantes em arquivos separados
- [ ] Documentação atualizada

---

**Este é o guia completo para organizar e corrigir o projeto Painel Swim!** 🚀
