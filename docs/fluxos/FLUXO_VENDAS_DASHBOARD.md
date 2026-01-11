# 🔄 Fluxo Completo: Vendas → Dashboard

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Processo de Venda](#processo-de-venda)
3. [Cloud Functions (Triggers)](#cloud-functions-triggers)
4. [Agregação de Dados](#agregação-de-dados)
5. [Estrutura de Dados](#estrutura-de-dados)
6. [Fluxo Completo Passo a Passo](#fluxo-completo-passo-a-passo)
7. [Exemplos Práticos](#exemplos-práticos)

---

## 🎯 Visão Geral

Este documento explica **exatamente como funciona** o fluxo de vendas no sistema atual, desde a criação da venda até a exibição dos dados no dashboard.

### **Arquitetura Atual**

```
1. Frontend cria venda
   ↓
2. Transaction cria: Sale + Receivables + Membership
   ↓
3. Cloud Function detecta mudança (onDocumentWritten)
   ↓
4. Function atualiza DailySummary e MonthlySummary
   ↓
5. Dashboard lê summaries e exibe métricas
```

---

## 💰 Processo de Venda

### Arquivo: `sales/db/transactions.ts`

#### Função: `createSale`

**Responsabilidade:** Criar venda em uma **transação atômica** que:
1. ✅ Cria documento de venda
2. ✅ Cria recebíveis (parcelas de cartão + saldo devedor)
3. ✅ Cria matrícula (se aplicável)
4. ✅ Atualiza cliente

---

### 📊 Estrutura da Venda

```typescript
type CreateSalePayload = {
  clientId: string;
  consultantId: string;
  idBranch: string;
  
  // Itens da venda
  items: SaleItem[];
  
  // Valores
  grossTotalCents: number;      // Total bruto
  discountCents: number;         // Desconto
  netTotalCents: number;         // Total líquido
  paidTotalCents: number;        // Pago
  remainingCents: number;        // Saldo devedor
  
  // Pagamentos
  payments: Payment[];
  
  // Matrícula (opcional)
  membership?: {
    planId: string;
    planName: string;
    priceCents: number;
    startAt: string;
    durationType: 'day' | 'week' | 'month' | 'year';
    duration: number;
  };
  
  // Data prometida (se houver saldo)
  dueDate?: string;
};
```

---

### 🔄 Fluxo da Transação

```typescript
// Arquivo: sales/db/transactions.ts

export const createSale = async (
  idTenant: string,
  idBranch: string,
  payload: CreateSalePayload
): Promise<string> => {
  
  const db = getFirebaseDb();
  const saleRef = doc(collection(db, 'tenants', idTenant, 'branches', idBranch, 'sales'));
  
  await runTransaction(db, async (tx) => {
    
    // 1. Buscar dados do cliente
    const clientSnap = await tx.get(clientRef);
    const clientData = clientSnap.data();
    
    // 2. Verificar se cliente já tem matrícula ativa
    if (payload.membership && clientData.activeMembershipId) {
      // Se tem matrícula ativa, nova matrícula fica "pending"
      // e começa após o término da atual
      membershipStatus = 'pending';
      membershipStartAtIso = addDaysIsoDateKey(activeEndKey, 1);
    }
    
    // 3. Criar recebíveis de cartão (parcelas)
    if (payments.length > 0) {
      createCardReceivables({
        tx,
        receivablesRef,
        payments,
        context: { idTenant, saleId, clientId, idBranch, dateKey }
      });
    }
    
    // 4. Criar recebível manual (saldo devedor)
    if (payload.remainingCents > 0 && payload.dueDate) {
      createManualReceivable({
        tx,
        receivablesRef,
        clientRef,
        context: { idTenant, saleId, clientId, idBranch, dateKey },
        amountCents: payload.remainingCents,
        dueDate: payload.dueDate
      });
    }
    
    // 5. Criar matrícula
    if (membershipId && normalizedMembership) {
      createMembershipRecords({
        tx,
        db,
        idTenant,
        idBranch,
        clientId,
        membershipId,
        saleId,
        membership: normalizedMembership,
        status: membershipStatus,
        endAt: membershipEndAt,
        previousMembershipId,
        activateClient
      });
    }
    
    // 6. Criar documento de venda
    tx.set(saleRef, {
      idTenant,
      idBranch,
      clientId,
      consultantId,
      items,
      grossTotalCents,
      discountCents,
      netTotalCents,
      paidTotalCents,
      remainingCents,
      feesCents,
      netPaidTotalCents,
      status,
      dateKey,           // YYYY-MM-DD
      branchDateKey,     // {idBranch}_{YYYY-MM-DD}
      clientSnapshot: {
        id: clientId,
        name: 'João Silva',
        friendlyId: 'CLI-0001',
        photoUrl: '...'
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });
  
  return saleRef.id;
};
```

---

## ⚡ Cloud Functions (Triggers)

### Arquivo: `functions/src/summaries/index.ts`

#### **1. Function: `monthlySummaryFromSale`**

**Trigger:** `onDocumentWritten` em `sales/{saleId}`

**O que faz:**
- Detecta quando uma venda é criada, atualizada ou deletada
- Calcula o delta (diferença) entre before/after
- Atualiza `monthlySummaries/{monthKey}` com incrementos

```typescript
export const monthlySummaryFromSale = onDocumentWritten(
  { document: 'tenants/{idTenant}/branches/{idBranch}/sales/{saleId}' },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    // Calcular delta
    const delta = salesDelta(before, after);
    // delta = {
    //   count: +1 ou -1,
    //   net: diferença em netTotalCents,
    //   disc: diferença em discountCents,
    //   fees: diferença em feesCents,
    //   paid: diferença em paidTotalCents,
    //   rem: diferença em remainingCents
    // }
    
    // Extrair mês da venda
    const monthKey = toMonthKey(after.dateKey); // "2024-01"
    
    // Atualizar summary mensal
    await updateMonthlySummaryDelta({
      idTenant,
      idBranch,
      monthKey,
      updates: {
        'sales.count': inc(delta.count),
        'sales.netTotalCents': inc(delta.net),
        'sales.discountCents': inc(delta.disc),
        'sales.feesCents': inc(delta.fees),
        'sales.paidTotalCents': inc(delta.paid),
        'sales.remainingCents': inc(delta.rem)
      }
    });
  }
);
```

---

#### **2. Function: `dailySummaryFromSale`**

**Trigger:** `onDocumentWritten` em `sales/{saleId}`

**O que faz:**
- Mesma lógica do monthly, mas atualiza `dailySummaries/{dateKey}`

```typescript
export const dailySummaryFromSale = onDocumentWritten(
  { document: 'tenants/{idTenant}/branches/{idBranch}/sales/{saleId}' },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    const delta = salesDelta(before, after);
    const dateKey = toDayKey(after.dateKey); // "2024-01-15"
    
    await updateDailySummaryDelta({
      idTenant,
      idBranch,
      dateKey,
      updates: {
        'sales.count': inc(delta.count),
        'sales.netTotalCents': inc(delta.net),
        'sales.discountCents': inc(delta.disc),
        'sales.feesCents': inc(delta.fees),
        'sales.paidTotalCents': inc(delta.paid),
        'sales.remainingCents': inc(delta.rem)
      }
    });
  }
);
```

---

#### **3. Function: `dailySummaryFromMembership`**

**Trigger:** `onDocumentWritten` em `clients/{clientId}/memberships/{membershipId}`

**O que faz:**
- Detecta quando matrícula é criada/atualizada
- Incrementa contadores de matrículas novas/renovações/cancelamentos

```typescript
export const dailySummaryFromMembership = onDocumentWritten(
  { document: 'tenants/{idTenant}/branches/{idBranch}/clients/{clientId}/memberships/{membershipId}' },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    const afterIsRenewal = Boolean(after?.previousMembershipId);
    const afterStartKey = toDayKey(after?.startAt); // "2024-01-15"
    
    // Matrícula nova
    if (!before && after) {
      const field = afterIsRenewal 
        ? 'memberships.renewalCount' 
        : 'memberships.newCount';
      
      await updateDailySummaryDelta({
        idTenant,
        idBranch,
        dateKey: afterStartKey,
        updates: {
          [field]: inc(1)
        }
      });
    }
    
    // Cancelamento
    const afterCanceled = after?.status === 'canceled';
    if (afterCanceled) {
      const cancelKey = toDayKey(after?.statusDateKey);
      
      await updateDailySummaryDelta({
        idTenant,
        idBranch,
        dateKey: cancelKey,
        updates: {
          'memberships.cancellationCount': inc(1)
        }
      });
    }
  }
);
```

---

#### **4. Function: `dailySummaryFromAttendance`**

**Trigger:** `onDocumentWritten` em `classSessions/{sessionId}/attendance/{clientId}`

**O que faz:**
- Detecta presença de aluno
- Incrementa contador de presenças
- Atualiza `lastPresenceDateKey` no cliente

```typescript
export const dailySummaryFromAttendance = onDocumentWritten(
  { document: 'tenants/{idTenant}/branches/{idBranch}/classSessions/{sessionId}/attendance/{clientId}' },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    const beforePresent = before?.status === 'present';
    const afterPresent = after?.status === 'present';
    
    const delta = (afterPresent ? 1 : 0) - (beforePresent ? 1 : 0);
    
    // Atualizar última presença do cliente
    if (afterPresent && clientId) {
      await clientRef.set({
        lastPresenceDateKey: dateKey,
        abandonmentRisk: false,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
    
    // Atualizar summary
    await updateDailySummaryDelta({
      idTenant,
      idBranch,
      dateKey,
      updates: {
        'attendance.presentCount': inc(delta),
        [`attendance.byHour.${hourKey}`]: inc(delta)
      }
    });
  }
);
```

---

## 📊 Agregação de Dados

### Como Funciona o Incremento Atômico

```typescript
// Helper function
const inc = (value: number) => FieldValue.increment(value);

// Uso
await updateDailySummaryDelta({
  idTenant: 'tenant-123',
  idBranch: 'branch-456',
  dateKey: '2024-01-15',
  updates: {
    'sales.count': inc(1),              // +1
    'sales.netTotalCents': inc(10000),  // +R$ 100,00
    'sales.discountCents': inc(500)     // +R$ 5,00
  }
});
```

**O que acontece no Firestore:**

```javascript
// Antes
{
  dateKey: '2024-01-15',
  sales: {
    count: 5,
    netTotalCents: 50000,
    discountCents: 2500
  }
}

// Depois (após increment)
{
  dateKey: '2024-01-15',
  sales: {
    count: 6,           // 5 + 1
    netTotalCents: 60000,  // 50000 + 10000
    discountCents: 3000    // 2500 + 500
  }
}
```

---

### Função: `updateDailySummaryDelta`

```typescript
const updateDailySummaryDelta = async ({
  idTenant,
  idBranch,
  dateKey,
  updates
}: DailySummaryDeltaParams) => {
  
  const db = admin.firestore();
  const ref = db
    .collection('tenants')
    .doc(idTenant)
    .collection('branches')
    .doc(idBranch)
    .collection('dailySummaries')
    .doc(dateKey);  // ← Documento com ID = data (YYYY-MM-DD)
  
  // expandFieldPaths converte:
  // { 'sales.count': inc(1) }
  // em:
  // { sales: { count: inc(1) } }
  const normalizedUpdates = expandFieldPaths(updates);
  
  await ref.set({
    idTenant,
    idBranch,
    dateKey,
    ...normalizedUpdates,
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp()
  }, { merge: true });  // ← merge: true preserva campos existentes
};
```

---

## 📁 Estrutura de Dados

### DailySummary

**Caminho:** `tenants/{idTenant}/branches/{idBranch}/dailySummaries/{dateKey}`

```typescript
type DailySummary = {
  id: string;              // YYYY-MM-DD (ex: "2024-01-15")
  idTenant: string;
  idBranch: string;
  dateKey: string;         // YYYY-MM-DD
  
  // Vendas
  sales?: {
    count?: number;              // Quantidade de vendas
    netTotalCents?: number;      // Total líquido
    discountCents?: number;      // Descontos
    feesCents?: number;          // Taxas
    paidTotalCents?: number;     // Pago
    remainingCents?: number;     // Saldo devedor
  };
  
  // Matrículas
  memberships?: {
    newCount?: number;           // Matrículas novas
    renewalCount?: number;       // Renovações
    cancellationCount?: number;  // Cancelamentos
  };
  
  // Presença
  attendance?: {
    presentCount?: number;       // Total de presenças
    byHour?: Record<string, number>; // Presenças por hora
  };
  
  // Movimentações de caixa
  cashMovements?: {
    incomeCents?: number;        // Entradas
    expenseCents?: number;       // Saídas
  };
  
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
```

---

### MonthlySummary

**Caminho:** `tenants/{idTenant}/branches/{idBranch}/monthlySummaries/{monthKey}`

```typescript
type MonthlySummary = {
  id: string;              // YYYY-MM (ex: "2024-01")
  idTenant: string;
  idBranch: string;
  monthKey: string;        // YYYY-MM
  
  // Mesma estrutura do DailySummary
  sales?: { ... };
  memberships?: { ... };
  attendance?: { ... };
  cashMovements?: { ... };
  
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
```

---

## 🔄 Fluxo Completo Passo a Passo

### Cenário: Venda de Matrícula

```
Cliente: João Silva
Plano: Mensal - R$ 100,00
Pagamento: R$ 50,00 PIX + R$ 50,00 a prazo (vence em 10 dias)
Data: 15/01/2024
```

---

### **Passo 1: Frontend Chama `createSale`**

```typescript
const saleId = await createSale('tenant-123', 'branch-456', {
  clientId: 'client-789',
  consultantId: 'user-001',
  idBranch: 'branch-456',
  
  items: [{
    type: 'membership',
    description: 'Plano Mensal',
    quantity: 1,
    unitPriceCents: 10000,
    totalCents: 10000,
    planId: 'plan-mensal'
  }],
  
  grossTotalCents: 10000,
  discountCents: 0,
  netTotalCents: 10000,
  paidTotalCents: 5000,
  remainingCents: 5000,
  
  payments: [{
    method: 'pix',
    amountCents: 5000
  }],
  
  membership: {
    planId: 'plan-mensal',
    planName: 'Plano Mensal',
    priceCents: 10000,
    startAt: '2024-01-15T00:00:00.000Z',
    durationType: 'month',
    duration: 1
  },
  
  dueDate: '2024-01-25'
});
```

---

### **Passo 2: Transaction Executa**

```typescript
await runTransaction(db, async (tx) => {
  
  // 2.1 - Criar recebível PIX (R$ 50,00)
  tx.set(receivableRef1, {
    idTenant: 'tenant-123',
    idBranch: 'branch-456',
    saleId: saleId,
    clientId: 'client-789',
    amountCents: 5000,
    status: 'paid',
    kind: 'pix',
    dateKey: '2024-01-15',
    createdAt: serverTimestamp()
  });
  
  // 2.2 - Criar recebível manual (R$ 50,00 a prazo)
  tx.set(receivableRef2, {
    idTenant: 'tenant-123',
    idBranch: 'branch-456',
    saleId: saleId,
    clientId: 'client-789',
    amountCents: 5000,
    status: 'pending',
    kind: 'manual',
    dueDate: '2024-01-25',
    dateKey: '2024-01-15',
    createdAt: serverTimestamp()
  });
  
  // 2.3 - Criar matrícula
  tx.set(membershipRef, {
    idTenant: 'tenant-123',
    idBranch: 'branch-456',
    clientId: 'client-789',
    saleId: saleId,
    planId: 'plan-mensal',
    planName: 'Plano Mensal',
    priceCents: 10000,
    startAt: '2024-01-15T00:00:00.000Z',
    endAt: '2024-02-15T23:59:59.999Z',
    status: 'active',
    durationType: 'month',
    duration: 1,
    statusDateKey: '2024-01-15',
    createdAt: serverTimestamp()
  });
  
  // 2.4 - Atualizar cliente
  tx.update(clientRef, {
    status: 'active',
    activeMembershipId: membershipId,
    updatedAt: serverTimestamp()
  });
  
  // 2.5 - Criar venda
  tx.set(saleRef, {
    idTenant: 'tenant-123',
    idBranch: 'branch-456',
    clientId: 'client-789',
    consultantId: 'user-001',
    items: [...],
    grossTotalCents: 10000,
    discountCents: 0,
    netTotalCents: 10000,
    paidTotalCents: 5000,
    remainingCents: 5000,
    feesCents: 0,
    netPaidTotalCents: 5000,
    status: 'open',
    dateKey: '2024-01-15',
    branchDateKey: 'branch-456_2024-01-15',
    clientSnapshot: {
      id: 'client-789',
      name: 'João Silva',
      friendlyId: 'CLI-0001'
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
});
```

---

### **Passo 3: Cloud Functions Disparam**

#### **3.1 - `dailySummaryFromSale` Executa**

```typescript
// Detecta criação da venda
const after = {
  netTotalCents: 10000,
  discountCents: 0,
  feesCents: 0,
  paidTotalCents: 5000,
  remainingCents: 5000,
  dateKey: '2024-01-15'
};

const delta = salesDelta(undefined, after);
// delta = {
//   count: 1,
//   net: 10000,
//   disc: 0,
//   fees: 0,
//   paid: 5000,
//   rem: 5000
// }

// Atualiza dailySummary
await updateDailySummaryDelta({
  idTenant: 'tenant-123',
  idBranch: 'branch-456',
  dateKey: '2024-01-15',
  updates: {
    'sales.count': inc(1),
    'sales.netTotalCents': inc(10000),
    'sales.discountCents': inc(0),
    'sales.feesCents': inc(0),
    'sales.paidTotalCents': inc(5000),
    'sales.remainingCents': inc(5000)
  }
});
```

**Resultado no Firestore:**

```javascript
// dailySummaries/2024-01-15
{
  idTenant: 'tenant-123',
  idBranch: 'branch-456',
  dateKey: '2024-01-15',
  sales: {
    count: 1,              // ← +1
    netTotalCents: 10000,  // ← +10000
    paidTotalCents: 5000,  // ← +5000
    remainingCents: 5000   // ← +5000
  },
  updatedAt: Timestamp
}
```

---

#### **3.2 - `monthlySummaryFromSale` Executa**

```typescript
const monthKey = toMonthKey('2024-01-15'); // "2024-01"

await updateMonthlySummaryDelta({
  idTenant: 'tenant-123',
  idBranch: 'branch-456',
  monthKey: '2024-01',
  updates: {
    'sales.count': inc(1),
    'sales.netTotalCents': inc(10000),
    'sales.paidTotalCents': inc(5000),
    'sales.remainingCents': inc(5000)
  }
});
```

**Resultado no Firestore:**

```javascript
// monthlySummaries/2024-01
{
  idTenant: 'tenant-123',
  idBranch: 'branch-456',
  monthKey: '2024-01',
  sales: {
    count: 1,
    netTotalCents: 10000,
    paidTotalCents: 5000,
    remainingCents: 5000
  },
  updatedAt: Timestamp
}
```

---

#### **3.3 - `dailySummaryFromMembership` Executa**

```typescript
// Detecta criação da matrícula
const after = {
  startAt: '2024-01-15T00:00:00.000Z',
  previousMembershipId: undefined, // Não é renovação
  status: 'active'
};

const afterIsRenewal = false;
const field = 'memberships.newCount';

await updateDailySummaryDelta({
  idTenant: 'tenant-123',
  idBranch: 'branch-456',
  dateKey: '2024-01-15',
  updates: {
    'memberships.newCount': inc(1)
  }
});
```

**Resultado no Firestore:**

```javascript
// dailySummaries/2024-01-15
{
  idTenant: 'tenant-123',
  idBranch: 'branch-456',
  dateKey: '2024-01-15',
  sales: {
    count: 1,
    netTotalCents: 10000,
    paidTotalCents: 5000,
    remainingCents: 5000
  },
  memberships: {
    newCount: 1  // ← +1 matrícula nova
  },
  updatedAt: Timestamp
}
```

---

### **Passo 4: Dashboard Lê os Dados**

```typescript
// Arquivo: dashboard/dashboard.db.ts

// Buscar summary do dia
const dailySummary = await getDailySummary('tenant-123', 'branch-456', '2024-01-15');

console.log(dailySummary);
// {
//   dateKey: '2024-01-15',
//   sales: {
//     count: 1,
//     netTotalCents: 10000,
//     paidTotalCents: 5000,
//     remainingCents: 5000
//   },
//   memberships: {
//     newCount: 1
//   }
// }

// Buscar summary do mês
const monthlySummary = await getMonthlySummary('tenant-123', 'branch-456', '2024-01');

console.log(monthlySummary);
// {
//   monthKey: '2024-01',
//   sales: {
//     count: 1,
//     netTotalCents: 10000,
//     paidTotalCents: 5000,
//     remainingCents: 5000
//   }
// }
```

---

### **Passo 5: Dashboard Exibe**

```jsx
// Componente Dashboard
const DashboardPage = () => {
  const { data: dailySummary } = useDailySummary(dateKey);
  
  return (
    <div>
      <Card title="Vendas Hoje">
        <p>Quantidade: {dailySummary?.sales?.count || 0}</p>
        <p>Total: R$ {(dailySummary?.sales?.netTotalCents || 0) / 100}</p>
        <p>Pago: R$ {(dailySummary?.sales?.paidTotalCents || 0) / 100}</p>
        <p>A Receber: R$ {(dailySummary?.sales?.remainingCents || 0) / 100}</p>
      </Card>
      
      <Card title="Matrículas Hoje">
        <p>Novas: {dailySummary?.memberships?.newCount || 0}</p>
        <p>Renovações: {dailySummary?.memberships?.renewalCount || 0}</p>
      </Card>
    </div>
  );
};
```

---

## 📊 Exemplos Práticos

### Exemplo 1: Segunda Venda no Mesmo Dia

```typescript
// Venda 1 (já existe)
dailySummary = {
  dateKey: '2024-01-15',
  sales: {
    count: 1,
    netTotalCents: 10000
  }
};

// Criar venda 2
await createSale(..., {
  netTotalCents: 15000,
  // ...
});

// Function executa
await updateDailySummaryDelta({
  dateKey: '2024-01-15',
  updates: {
    'sales.count': inc(1),        // +1
    'sales.netTotalCents': inc(15000)  // +15000
  }
});

// Resultado
dailySummary = {
  dateKey: '2024-01-15',
  sales: {
    count: 2,           // 1 + 1
    netTotalCents: 25000   // 10000 + 15000
  }
};
```

---

### Exemplo 2: Cancelamento de Venda

```typescript
// Venda existente
sale = {
  id: 'sale-123',
  netTotalCents: 10000,
  status: 'paid'
};

// Deletar venda
await deleteSale('sale-123');

// Function detecta (before existe, after não)
const delta = salesDelta(before, undefined);
// delta = {
//   count: -1,
//   net: -10000
// }

// Atualiza summary
await updateDailySummaryDelta({
  dateKey: '2024-01-15',
  updates: {
    'sales.count': inc(-1),
    'sales.netTotalCents': inc(-10000)
  }
});

// Resultado
dailySummary = {
  sales: {
    count: 1,           // 2 - 1
    netTotalCents: 15000   // 25000 - 10000
  }
};
```

---

### Exemplo 3: Presença de Aluno

```typescript
// Marcar presença
await markAttendance('session-123', 'client-789', {
  status: 'present',
  sessionDateKey: '2024-01-15',
  markedAt: '2024-01-15T08:30:00.000Z'
});

// Function executa
const hourKey = '08'; // Hora da presença
await updateDailySummaryDelta({
  dateKey: '2024-01-15',
  updates: {
    'attendance.presentCount': inc(1),
    'attendance.byHour.08': inc(1)
  }
});

// Resultado
dailySummary = {
  attendance: {
    presentCount: 1,
    byHour: {
      '08': 1,
      '09': 0,
      '10': 0
    }
  }
};
```

---

## 🔍 Resumo do Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. FRONTEND                                                 │
│    createSale(payload)                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. TRANSACTION (Firestore)                                 │
│    ├─ Criar Sale                                           │
│    ├─ Criar Receivables                                    │
│    ├─ Criar Membership                                     │
│    └─ Atualizar Client                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CLOUD FUNCTIONS (Triggers)                              │
│    ├─ dailySummaryFromSale                                 │
│    ├─ monthlySummaryFromSale                               │
│    ├─ dailySummaryFromMembership                           │
│    └─ dailySummaryFromAttendance                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SUMMARIES (Firestore)                                   │
│    ├─ dailySummaries/{dateKey}                             │
│    │   └─ Incrementos atômicos (FieldValue.increment)      │
│    └─ monthlySummaries/{monthKey}                          │
│        └─ Incrementos atômicos (FieldValue.increment)      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. DASHBOARD                                                │
│    ├─ Lê dailySummaries                                    │
│    ├─ Lê monthlySummaries                                  │
│    └─ Exibe métricas agregadas                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Pontos Importantes

### **1. Incrementos Atômicos**
- ✅ Usa `FieldValue.increment()` para evitar race conditions
- ✅ Múltiplas vendas simultâneas não causam perda de dados

### **2. Separação de Responsabilidades**
- ✅ Transaction cria documentos
- ✅ Functions agregam dados
- ✅ Dashboard apenas lê summaries

### **3. Performance**
- ✅ Dashboard não precisa somar todas as vendas
- ✅ Lê apenas 1 documento (summary)
- ✅ Queries rápidas e escaláveis

### **4. Histórico**
- ✅ Vendas individuais preservadas
- ✅ Summaries são cache agregado
- ✅ Possível recalcular se necessário

---

**Este é o fluxo completo de vendas até o dashboard no sistema atual!** 🚀
