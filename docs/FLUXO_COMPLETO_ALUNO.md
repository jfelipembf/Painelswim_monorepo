# 🏊 Fluxo Completo: Cadastro de Aluno até Dashboard

## 📋 Índice

1. [Visão Geral do Fluxo](#visão-geral-do-fluxo)
2. [Fase 1: Cadastro do Aluno](#fase-1-cadastro-do-aluno)
3. [Fase 2: Seleção de Contrato](#fase-2-seleção-de-contrato)
4. [Fase 3: Compra e Pagamento](#fase-3-compra-e-pagamento)
5. [Fase 4: Geração de Recebíveis](#fase-4-geração-de-recebíveis)
6. [Fase 5: Ativação da Matrícula](#fase-5-ativação-da-matrícula)
7. [Fase 6: Impacto no Dashboard](#fase-6-impacto-no-dashboard)
8. [Automações: Functions vs Cron Jobs](#automações-functions-vs-cron-jobs)
9. [Estados e Transições](#estados-e-transições)
10. [Regras de Negócio](#regras-de-negócio)
11. [Casos Especiais](#casos-especiais)

---

## 🎯 Visão Geral do Fluxo

### Fluxo Principal

```
┌─────────────────┐
│ 1. Cadastro     │
│    do Aluno     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Seleção de   │
│    Contrato     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Criação da   │
│    Venda        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Pagamento    │
│    (Parcial/    │
│     Total)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. Geração de   │
│    Recebíveis   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. Criação da   │
│    Matrícula    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 7. Ativação     │
│    do Aluno     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 8. Atualização  │
│    Dashboard    │
└─────────────────┘
```

### Entidades Envolvidas

- **Student** (Aluno)
- **Contract** (Plano/Contrato)
- **Sale** (Venda)
- **Payment** (Pagamento)
- **Receivable** (Recebível/Saldo Devedor)
- **Membership** (Matrícula)
- **DailySummary** (Resumo Diário)
- **MonthlySummary** (Resumo Mensal)

---

## 📝 Fase 1: Cadastro do Aluno

### 1.1 Dados Obrigatórios

```typescript
interface CreateStudentDto {
  // Dados Pessoais
  firstName: string;           // Nome
  lastName: string;            // Sobrenome
  birthDate: string;           // Data de nascimento (YYYY-MM-DD)
  gender: 'male' | 'female' | 'other';
  cpf?: string;                // CPF (opcional para menores)
  
  // Contato
  email?: string;              // Email
  phone: string;               // Telefone principal
  alternativePhone?: string;   // Telefone alternativo
  
  // Endereço
  address: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  
  // Responsável (se menor de idade)
  guardian?: {
    name: string;
    cpf: string;
    phone: string;
    email?: string;
    relationship: 'father' | 'mother' | 'other';
  };
  
  // Saúde
  healthInfo?: {
    bloodType?: string;
    allergies?: string[];
    medications?: string[];
    medicalConditions?: string[];
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  
  // Metadados
  branchId: string;            // Unidade de cadastro
  notes?: string;              // Observações
  tags?: string[];             // Tags para segmentação
}
```

### 1.2 Status Inicial do Aluno

```typescript
enum StudentStatus {
  LEAD = 'lead',                    // Apenas cadastrado, sem matrícula
  PENDING = 'pending',              // Aguardando ativação de matrícula
  ACTIVE = 'active',                // Matrícula ativa
  PAUSED = 'paused',                // Matrícula pausada
  EXPIRED = 'expired',              // Matrícula expirada
  CANCELED = 'canceled',            // Matrícula cancelada
  INACTIVE = 'inactive'             // Inativo (sem matrícula ativa)
}
```

**Status após cadastro**: `LEAD`

### 1.3 Validações

```typescript
/**
 * Valida dados do aluno
 */
export const validateStudentData = (data: CreateStudentDto): void => {
  // Idade mínima (ex: 3 anos)
  const age = calculateAge(data.birthDate);
  if (age < 3) {
    throw new ValidationError('Idade mínima: 3 anos');
  }
  
  // Se menor de 18, responsável é obrigatório
  if (age < 18 && !data.guardian) {
    throw new ValidationError('Responsável é obrigatório para menores de 18 anos');
  }
  
  // CPF único (se fornecido)
  if (data.cpf) {
    const exists = await checkCpfExists(data.cpf);
    if (exists) {
      throw new ValidationError('CPF já cadastrado');
    }
  }
  
  // Email único (se fornecido)
  if (data.email) {
    const exists = await checkEmailExists(data.email);
    if (exists) {
      throw new ValidationError('Email já cadastrado');
    }
  }
};
```

### 1.4 Criação do Aluno

```typescript
/**
 * Cria novo aluno no sistema
 */
export const createStudent = async (
  tenantId: string,
  data: CreateStudentDto,
  userId: string
): Promise<Student> => {
  // 1. Validar dados
  await validateStudentData(data);
  
  // 2. Gerar ID amigável (ex: ALU-0001)
  const friendlyId = await generateStudentFriendlyId(tenantId, data.branchId);
  
  // 3. Criar registro
  const student = await db.students.create({
    tenantId,
    branchId: data.branchId,
    friendlyId,
    status: StudentStatus.LEAD,
    ...data,
    createdBy: userId,
    createdAt: new Date().toISOString()
  });
  
  // 4. Publicar evento
  await eventBus.publish({
    type: 'student.created',
    tenantId,
    data: { studentId: student.id }
  });
  
  return student;
};
```

---

## 📋 Fase 2: Seleção de Contrato

### 2.1 Estrutura de Contratos

```typescript
interface Contract {
  id: string;
  tenantId: string;
  branchId: string;
  
  // Identificação
  name: string;                    // Ex: "Plano Mensal"
  description?: string;
  category: 'membership' | 'package' | 'class';
  
  // Valores
  priceCents: number;              // Preço em centavos
  setupFeeCents?: number;          // Taxa de matrícula
  
  // Duração
  durationType: 'day' | 'week' | 'month' | 'year';
  duration: number;                // Ex: 1 mês, 3 meses, 1 ano
  
  // Recorrência
  isRecurring: boolean;            // Se renova automaticamente
  renewalPriceCents?: number;      // Preço na renovação
  
  // Acesso
  allowCrossBranchAccess: boolean; // Acesso a outras unidades
  allowedBranchIds?: string[];     // Unidades permitidas
  
  // Limites
  maxClassesPerWeek?: number;      // Limite de aulas por semana
  maxClassesPerMonth?: number;     // Limite de aulas por mês
  allowedClassTypes?: string[];    // Tipos de aula permitidos
  
  // Pagamento
  allowInstallments: boolean;      // Permite parcelamento
  maxInstallments?: number;        // Máximo de parcelas
  minDownPaymentPercent?: number;  // Entrada mínima (%)
  
  // Status
  status: 'active' | 'inactive' | 'archived';
  
  // Metadados
  displayOrder: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}
```

### 2.2 Busca de Contratos Disponíveis

```typescript
/**
 * Lista contratos disponíveis para venda
 */
export const getAvailableContracts = async (
  tenantId: string,
  branchId: string,
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
  }
): Promise<Contract[]> => {
  return db.contracts.findMany({
    where: {
      tenantId,
      branchId,
      status: 'active',
      ...filters
    },
    orderBy: {
      displayOrder: 'asc'
    }
  });
};
```

### 2.3 Cálculo de Valores

```typescript
/**
 * Calcula valores do contrato com descontos
 */
export const calculateContractValues = (
  contract: Contract,
  options: {
    discountPercent?: number;
    discountCents?: number;
    installments?: number;
  }
): {
  grossTotalCents: number;
  setupFeeCents: number;
  discountCents: number;
  netTotalCents: number;
  installmentValue?: number;
} => {
  const grossTotalCents = contract.priceCents + (contract.setupFeeCents || 0);
  
  // Calcular desconto
  let discountCents = options.discountCents || 0;
  if (options.discountPercent) {
    discountCents = Math.round((grossTotalCents * options.discountPercent) / 100);
  }
  
  const netTotalCents = grossTotalCents - discountCents;
  
  // Calcular parcelas
  let installmentValue: number | undefined;
  if (options.installments && options.installments > 1) {
    installmentValue = Math.round(netTotalCents / options.installments);
  }
  
  return {
    grossTotalCents,
    setupFeeCents: contract.setupFeeCents || 0,
    discountCents,
    netTotalCents,
    installmentValue
  };
};
```

---

## 💰 Fase 3: Compra e Pagamento

### 3.1 Criação da Venda

```typescript
interface CreateMembershipSaleDto {
  // Identificação
  studentId: string;
  contractId: string;
  branchId: string;
  consultantId: string;          // Vendedor/Consultor
  
  // Valores
  discountCents?: number;
  discountReason?: string;
  
  // Pagamento
  payments: PaymentInput[];      // Pagamentos imediatos
  
  // Matrícula
  membershipStartDate: string;   // Data de início (YYYY-MM-DD)
  
  // Observações
  notes?: string;
  tags?: string[];
}

interface PaymentInput {
  method: PaymentMethod;
  amountCents: number;
  
  // Dados específicos por método
  pix?: {
    txid: string;
    qrCode?: string;
  };
  card?: {
    brand: string;
    last4: string;
    installments: number;
    authCode?: string;
    nsu?: string;
  };
  cash?: {
    receivedCents?: number;      // Valor recebido
    changeCents?: number;        // Troco
  };
  transfer?: {
    bankName: string;
    reference: string;
  };
}

enum PaymentMethod {
  CASH = 'cash',
  PIX = 'pix',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer'
}
```

### 3.2 Processo de Venda

```typescript
/**
 * Cria venda de matrícula
 */
export const createMembershipSale = async (
  tenantId: string,
  data: CreateMembershipSaleDto,
  userId: string
): Promise<{
  sale: Sale;
  membership: Membership;
  receivables: Receivable[];
}> => {
  // 1. Validar dados
  await validateMembershipSale(tenantId, data);
  
  // 2. Buscar contrato
  const contract = await getContractById(tenantId, data.contractId);
  if (!contract) {
    throw new NotFoundError('Contrato não encontrado');
  }
  
  // 3. Calcular valores
  const values = calculateContractValues(contract, {
    discountCents: data.discountCents
  });
  
  // 4. Calcular totais de pagamento
  const paidTotalCents = data.payments.reduce(
    (sum, p) => sum + p.amountCents,
    0
  );
  const remainingCents = values.netTotalCents - paidTotalCents;
  
  // 5. Determinar status da venda
  const saleStatus = remainingCents === 0 ? 'paid' : 'open';
  
  // 6. Calcular data de término da matrícula
  const membershipEndDate = calculateMembershipEndDate(
    data.membershipStartDate,
    contract.durationType,
    contract.duration
  );
  
  // 7. Iniciar transação
  return await db.transaction(async (tx) => {
    // 7.1 Criar venda
    const sale = await tx.sales.create({
      tenantId,
      branchId: data.branchId,
      studentId: data.studentId,
      consultantId: data.consultantId,
      status: saleStatus,
      
      items: [{
        type: 'membership',
        description: contract.name,
        quantity: 1,
        unitPriceCents: contract.priceCents,
        totalCents: contract.priceCents,
        contractId: contract.id,
        metadata: {
          durationType: contract.durationType,
          duration: contract.duration
        }
      }],
      
      grossTotalCents: values.grossTotalCents,
      discountCents: values.discountCents,
      netTotalCents: values.netTotalCents,
      paidTotalCents,
      remainingCents,
      
      payments: data.payments.map(p => ({
        ...p,
        paidAt: new Date().toISOString()
      })),
      
      dateKey: new Date().toISOString().split('T')[0],
      notes: data.notes,
      tags: data.tags,
      createdBy: userId
    });
    
    // 7.2 Criar matrícula
    const membership = await tx.memberships.create({
      tenantId,
      branchId: data.branchId,
      studentId: data.studentId,
      contractId: contract.id,
      saleId: sale.id,
      
      status: remainingCents === 0 ? 'active' : 'pending',
      
      startDate: data.membershipStartDate,
      endDate: membershipEndDate,
      
      priceCents: contract.priceCents,
      
      allowCrossBranchAccess: contract.allowCrossBranchAccess,
      allowedBranchIds: contract.allowedBranchIds,
      
      maxClassesPerWeek: contract.maxClassesPerWeek,
      maxClassesPerMonth: contract.maxClassesPerMonth,
      
      createdBy: userId
    });
    
    // 7.3 Criar recebíveis (se houver saldo)
    const receivables: Receivable[] = [];
    
    if (remainingCents > 0) {
      // Criar recebível para saldo restante
      const receivable = await tx.receivables.create({
        tenantId,
        branchId: data.branchId,
        studentId: data.studentId,
        saleId: sale.id,
        membershipId: membership.id,
        
        type: 'membership_balance',
        amountCents: remainingCents,
        amountPaidCents: 0,
        
        dueDate: data.membershipStartDate, // Vence no início
        status: 'pending',
        
        createdBy: userId
      });
      
      receivables.push(receivable);
    }
    
    // 7.4 Criar recebíveis de parcelas de cartão
    for (const payment of data.payments) {
      if (payment.method === 'credit_card' && payment.card?.installments > 1) {
        const installmentAmount = Math.round(
          payment.amountCents / payment.card.installments
        );
        
        for (let i = 1; i <= payment.card.installments; i++) {
          const dueDate = addMonths(new Date(), i - 1)
            .toISOString()
            .split('T')[0];
          
          const receivable = await tx.receivables.create({
            tenantId,
            branchId: data.branchId,
            studentId: data.studentId,
            saleId: sale.id,
            
            type: 'card_installment',
            amountCents: installmentAmount,
            amountPaidCents: i === 1 ? installmentAmount : 0,
            
            dueDate,
            status: i === 1 ? 'paid' : 'pending',
            paidAt: i === 1 ? new Date().toISOString() : undefined,
            
            installmentNumber: i,
            totalInstallments: payment.card.installments,
            
            paymentMethod: 'credit_card',
            paymentMetadata: payment.card,
            
            createdBy: userId
          });
          
          receivables.push(receivable);
        }
      }
    }
    
    // 7.5 Atualizar status do aluno
    if (remainingCents === 0) {
      await tx.students.update({
        where: { id: data.studentId },
        data: {
          status: 'active',
          activeMembershipId: membership.id,
          updatedBy: userId
        }
      });
    } else {
      await tx.students.update({
        where: { id: data.studentId },
        data: {
          status: 'pending',
          pendingMembershipId: membership.id,
          updatedBy: userId
        }
      });
    }
    
    return { sale, membership, receivables };
  });
};
```

---

## 📊 Fase 4: Geração de Recebíveis

### 4.1 Tipos de Recebíveis

```typescript
enum ReceivableType {
  MEMBERSHIP_BALANCE = 'membership_balance',     // Saldo de matrícula
  CARD_INSTALLMENT = 'card_installment',         // Parcela de cartão
  RENEWAL = 'renewal',                           // Renovação
  ADDITIONAL_SERVICE = 'additional_service',     // Serviço adicional
  LATE_FEE = 'late_fee',                        // Multa por atraso
  ADJUSTMENT = 'adjustment'                      // Ajuste manual
}

enum ReceivableStatus {
  PENDING = 'pending',       // Aguardando pagamento
  PAID = 'paid',            // Pago
  OVERDUE = 'overdue',      // Vencido
  CANCELED = 'canceled',    // Cancelado
  REFUNDED = 'refunded'     // Reembolsado
}

interface Receivable {
  id: string;
  tenantId: string;
  branchId: string;
  
  // Relacionamentos
  studentId: string;
  saleId: string;
  membershipId?: string;
  
  // Tipo e status
  type: ReceivableType;
  status: ReceivableStatus;
  
  // Valores
  amountCents: number;           // Valor total
  amountPaidCents: number;       // Valor pago
  lateFeesCents?: number;        // Multa
  discountCents?: number;        // Desconto
  
  // Datas
  dueDate: string;               // Vencimento (YYYY-MM-DD)
  paidAt?: string;               // Data do pagamento
  
  // Parcelas (se aplicável)
  installmentNumber?: number;
  totalInstallments?: number;
  
  // Pagamento
  paymentMethod?: PaymentMethod;
  paymentMetadata?: Record<string, unknown>;
  
  // Metadados
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}
```

### 4.2 Cálculo de Multas e Juros

```typescript
/**
 * Calcula multa por atraso
 */
export const calculateLateFee = (
  amountCents: number,
  dueDate: string,
  paymentDate: string = new Date().toISOString()
): {
  daysOverdue: number;
  lateFeesCents: number;
  totalCents: number;
} => {
  const due = new Date(dueDate);
  const payment = new Date(paymentDate);
  
  // Calcular dias de atraso
  const daysOverdue = Math.max(
    0,
    Math.floor((payment.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  );
  
  if (daysOverdue === 0) {
    return {
      daysOverdue: 0,
      lateFeesCents: 0,
      totalCents: amountCents
    };
  }
  
  // Multa: 2% + 0.033% ao dia (1% ao mês)
  const penaltyPercent = 2; // 2% de multa
  const interestPercentPerDay = 0.033; // 0.033% ao dia (1% ao mês)
  
  const penaltyCents = Math.round((amountCents * penaltyPercent) / 100);
  const interestCents = Math.round(
    (amountCents * interestPercentPerDay * daysOverdue) / 100
  );
  
  const lateFeesCents = penaltyCents + interestCents;
  const totalCents = amountCents + lateFeesCents;
  
  return {
    daysOverdue,
    lateFeesCents,
    totalCents
  };
};
```

### 4.3 Atualização de Status de Recebíveis

```typescript
/**
 * Atualiza status de recebíveis vencidos
 * Executado diariamente via cron
 */
export const updateOverdueReceivables = async (
  tenantId: string
): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];
  
  const updated = await db.receivables.updateMany({
    where: {
      tenantId,
      status: 'pending',
      dueDate: { lt: today }
    },
    data: {
      status: 'overdue',
      updatedAt: new Date().toISOString()
    }
  });
  
  return updated.count;
};
```

---

## 🎓 Fase 5: Ativação da Matrícula

### 5.1 Estados da Matrícula

```typescript
enum MembershipStatus {
  PENDING = 'pending',       // Aguardando pagamento/ativação
  ACTIVE = 'active',         // Ativa e válida
  PAUSED = 'paused',         // Pausada temporariamente
  EXPIRED = 'expired',       // Expirada (fim do período)
  CANCELED = 'canceled',     // Cancelada
  SUSPENDED = 'suspended'    // Suspensa (inadimplência)
}
```

### 5.2 Ativação Automática

```typescript
/**
 * Ativa matrícula quando pagamento é confirmado
 */
export const activateMembershipOnPayment = async (
  tenantId: string,
  membershipId: string,
  userId: string
): Promise<void> => {
  await db.transaction(async (tx) => {
    // 1. Buscar matrícula
    const membership = await tx.memberships.findUnique({
      where: { id: membershipId }
    });
    
    if (!membership) {
      throw new NotFoundError('Matrícula não encontrada');
    }
    
    // 2. Verificar se pode ativar
    if (membership.status !== 'pending') {
      throw new BusinessRuleError('Matrícula não está pendente');
    }
    
    // 3. Verificar se venda está paga
    const sale = await tx.sales.findUnique({
      where: { id: membership.saleId }
    });
    
    if (sale.remainingCents > 0) {
      throw new BusinessRuleError('Venda possui saldo pendente');
    }
    
    // 4. Ativar matrícula
    await tx.memberships.update({
      where: { id: membershipId },
      data: {
        status: 'active',
        activatedAt: new Date().toISOString(),
        updatedBy: userId
      }
    });
    
    // 5. Atualizar aluno
    await tx.students.update({
      where: { id: membership.studentId },
      data: {
        status: 'active',
        activeMembershipId: membershipId,
        pendingMembershipId: null,
        updatedBy: userId
      }
    });
    
    // 6. Publicar evento
    await eventBus.publish({
      type: 'membership.activated',
      tenantId,
      data: {
        membershipId,
        studentId: membership.studentId,
        startDate: membership.startDate,
        endDate: membership.endDate
      }
    });
  });
};
```

### 5.3 Verificação Diária de Matrículas

```typescript
/**
 * Verifica e atualiza status de matrículas
 * Executado diariamente via cron
 */
export const updateMembershipStatuses = async (
  tenantId: string
): Promise<{
  activated: number;
  expired: number;
  suspended: number;
}> => {
  const today = new Date().toISOString().split('T')[0];
  
  // 1. Ativar matrículas que começam hoje
  const activated = await db.memberships.updateMany({
    where: {
      tenantId,
      status: 'pending',
      startDate: { lte: today },
      // Verificar se está paga
      sale: {
        remainingCents: 0
      }
    },
    data: {
      status: 'active',
      activatedAt: new Date().toISOString()
    }
  });
  
  // 2. Expirar matrículas que terminaram
  const expired = await db.memberships.updateMany({
    where: {
      tenantId,
      status: 'active',
      endDate: { lt: today }
    },
    data: {
      status: 'expired',
      expiredAt: new Date().toISOString()
    }
  });
  
  // 3. Suspender matrículas com inadimplência
  const suspended = await db.memberships.updateMany({
    where: {
      tenantId,
      status: 'active',
      receivables: {
        some: {
          status: 'overdue',
          dueDate: { lt: addDays(today, -30) } // 30 dias de atraso
        }
      }
    },
    data: {
      status: 'suspended',
      suspendedAt: new Date().toISOString()
    }
  });
  
  return {
    activated: activated.count,
    expired: expired.count,
    suspended: suspended.count
  };
};
```

---

## 📈 Fase 6: Impacto no Dashboard

### 6.1 Estrutura de Sumários

```typescript
interface DailySummary {
  id: string;
  tenantId: string;
  branchId: string;
  dateKey: string;              // YYYY-MM-DD
  
  // Vendas
  sales: {
    count: number;              // Total de vendas
    grossTotalCents: number;    // Total bruto
    discountCents: number;      // Total de descontos
    netTotalCents: number;      // Total líquido
    paidTotalCents: number;     // Total pago
    remainingCents: number;     // Saldo pendente
  };
  
  // Matrículas
  memberships: {
    newCount: number;           // Novas matrículas
    renewalCount: number;       // Renovações
    cancellationCount: number;  // Cancelamentos
    activeCount: number;        // Total ativas
    pausedCount: number;        // Total pausadas
    expiredCount: number;       // Total expiradas
  };
  
  // Recebíveis
  receivables: {
    paidCount: number;          // Recebíveis pagos
    paidTotalCents: number;     // Total recebido
    overdueCount: number;       // Recebíveis vencidos
    overdueTotalCents: number;  // Total vencido
  };
  
  // Frequência
  attendance: {
    presentCount: number;       // Presenças
    absentCount: number;        // Faltas
    byHour: Record<string, number>; // Por horário
  };
  
  // Movimentações de caixa
  cashMovements: {
    incomeCents: number;        // Entradas
    expenseCents: number;       // Saídas
    balanceCents: number;       // Saldo
  };
  
  createdAt: string;
  updatedAt: string;
}

interface MonthlySummary {
  id: string;
  tenantId: string;
  branchId: string;
  monthKey: string;             // YYYY-MM
  
  // Agregações mensais (mesma estrutura do diário)
  sales: { /* ... */ };
  memberships: { /* ... */ };
  receivables: { /* ... */ };
  attendance: { /* ... */ };
  cashMovements: { /* ... */ };
  
  // Métricas calculadas
  metrics: {
    averageTicketCents: number;
    conversionRate: number;
    churnRate: number;
    retentionRate: number;
    revenueGrowth: number;
  };
  
  createdAt: string;
  updatedAt: string;
}
```

### 6.2 Atualização via Cloud Functions

```typescript
/**
 * Cloud Function: Atualiza sumário diário quando venda é criada
 */
export const onSaleCreated = onDocumentWritten(
  'tenants/{tenantId}/branches/{branchId}/sales/{saleId}',
  async (event) => {
    const { tenantId, branchId } = event.params;
    const after = event.data?.after.data();
    
    if (!after) return;
    
    const dateKey = after.dateKey;
    
    // Calcular delta
    const delta = {
      'sales.count': 1,
      'sales.grossTotalCents': after.grossTotalCents,
      'sales.discountCents': after.discountCents,
      'sales.netTotalCents': after.netTotalCents,
      'sales.paidTotalCents': after.paidTotalCents,
      'sales.remainingCents': after.remainingCents
    };
    
    // Atualizar sumário diário
    await updateDailySummary(tenantId, branchId, dateKey, delta);
    
    // Atualizar sumário mensal
    const monthKey = dateKey.substring(0, 7);
    await updateMonthlySummary(tenantId, branchId, monthKey, delta);
  }
);

/**
 * Cloud Function: Atualiza sumário quando matrícula é criada
 */
export const onMembershipCreated = onDocumentWritten(
  'tenants/{tenantId}/branches/{branchId}/students/{studentId}/memberships/{membershipId}',
  async (event) => {
    const { tenantId, branchId } = event.params;
    const after = event.data?.after.data();
    
    if (!after) return;
    
    const dateKey = after.startDate.split('T')[0];
    const isRenewal = Boolean(after.previousMembershipId);
    
    // Calcular delta
    const delta = {
      [`memberships.${isRenewal ? 'renewalCount' : 'newCount'}`]: 1,
      'memberships.activeCount': after.status === 'active' ? 1 : 0
    };
    
    // Atualizar sumários
    await updateDailySummary(tenantId, branchId, dateKey, delta);
    
    const monthKey = dateKey.substring(0, 7);
    await updateMonthlySummary(tenantId, branchId, monthKey, delta);
  }
);

/**
 * Cloud Function: Atualiza sumário quando recebível é pago
 */
export const onReceivablePaid = onDocumentWritten(
  'tenants/{tenantId}/branches/{branchId}/receivables/{receivableId}',
  async (event) => {
    const { tenantId, branchId } = event.params;
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    // Verificar se mudou de pending/overdue para paid
    if (
      before &&
      (before.status === 'pending' || before.status === 'overdue') &&
      after?.status === 'paid'
    ) {
      const dateKey = new Date().toISOString().split('T')[0];
      
      const delta = {
        'receivables.paidCount': 1,
        'receivables.paidTotalCents': after.amountCents,
        'receivables.overdueCount': before.status === 'overdue' ? -1 : 0,
        'receivables.overdueTotalCents': before.status === 'overdue' ? -after.amountCents : 0
      };
      
      await updateDailySummary(tenantId, branchId, dateKey, delta);
      
      const monthKey = dateKey.substring(0, 7);
      await updateMonthlySummary(tenantId, branchId, monthKey, delta);
    }
  }
);
```

### 6.3 Função de Atualização de Sumário

```typescript
/**
 * Atualiza sumário diário com incrementos
 */
const updateDailySummary = async (
  tenantId: string,
  branchId: string,
  dateKey: string,
  updates: Record<string, number>
): Promise<void> => {
  const summaryRef = db
    .collection('tenants').doc(tenantId)
    .collection('branches').doc(branchId)
    .collection('dailySummaries').doc(dateKey);
  
  // Expandir campos aninhados para incremento
  const incrementUpdates: Record<string, any> = {};
  
  for (const [path, value] of Object.entries(updates)) {
    incrementUpdates[path] = FieldValue.increment(value);
  }
  
  await summaryRef.set(
    {
      tenantId,
      branchId,
      dateKey,
      ...incrementUpdates,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
};
```

### 6.4 Queries do Dashboard

```typescript
/**
 * Busca dados do dashboard operacional
 */
export const getOperationalDashboard = async (
  tenantId: string,
  branchId: string,
  selectedDate: Date
): Promise<DashboardData> => {
  const dateKey = formatDateKey(selectedDate);
  const monthKey = dateKey.substring(0, 7);
  
  // Buscar sumários em paralelo
  const [dailySummary, monthlySummary, activeStudents] = await Promise.all([
    getDailySummary(tenantId, branchId, dateKey),
    getMonthlySummary(tenantId, branchId, monthKey),
    getActiveStudentsCount(tenantId, branchId)
  ]);
  
  return {
    date: dateKey,
    month: monthKey,
    
    // Métricas do dia
    today: {
      sales: dailySummary?.sales.count || 0,
      revenue: dailySummary?.sales.netTotalCents || 0,
      newMemberships: dailySummary?.memberships.newCount || 0,
      attendance: dailySummary?.attendance.presentCount || 0
    },
    
    // Métricas do mês
    month: {
      sales: monthlySummary?.sales.count || 0,
      revenue: monthlySummary?.sales.netTotalCents || 0,
      newMemberships: monthlySummary?.memberships.newCount || 0,
      renewals: monthlySummary?.memberships.renewalCount || 0,
      cancellations: monthlySummary?.memberships.cancellationCount || 0,
      activeStudents
    },
    
    // Métricas calculadas
    metrics: {
      averageTicket: monthlySummary?.metrics.averageTicketCents || 0,
      conversionRate: monthlySummary?.metrics.conversionRate || 0,
      churnRate: monthlySummary?.metrics.churnRate || 0
    }
  };
};
```

---

## ⚙️ Automações: Functions vs Cron Jobs

### 🎯 Quando Usar Cada Abordagem

#### ✅ **Funções Síncronas (Código Normal)**

**Use para:** Cálculos simples e transformações de dados

```typescript
// ✅ CORRETO - Cálculo síncrono
export const calculateMembershipEndDate = (
  startDate: string,
  durationType: 'day' | 'week' | 'month' | 'year',
  duration: number
): string => {
  const start = new Date(startDate);
  
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

// ✅ CORRETO - Cálculo de multa
export const calculateLateFee = (
  amountCents: number,
  dueDate: string
): { lateFeesCents: number; totalCents: number } => {
  const daysOverdue = daysBetween(dueDate, new Date());
  const penaltyCents = Math.round((amountCents * 2) / 100);
  const interestCents = Math.round((amountCents * 0.033 * daysOverdue) / 100);
  
  return {
    lateFeesCents: penaltyCents + interestCents,
    totalCents: amountCents + penaltyCents + interestCents
  };
};
```

**Exemplos:**
- ✅ Calcular fim de contrato
- ✅ Calcular multas e juros
- ✅ Validar dados
- ✅ Transformar objetos
- ✅ Formatar valores

---

#### ✅ **Cron Jobs (Scheduled Functions)**

**Use para:** Automações em lote executadas periodicamente

```typescript
// ✅ CORRETO - Cron job diário às 00:00
export const dailyMembershipMaintenance = onSchedule(
  'every day 00:00',
  async (context) => {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('🔄 Iniciando manutenção diária de matrículas...');
    
    // 1. Ativar matrículas que começam hoje
    const activated = await activatePendingMemberships(today);
    console.log(`✅ ${activated} matrículas ativadas`);
    
    // 2. Expirar matrículas que terminaram
    const expired = await expireMemberships(today);
    console.log(`⏰ ${expired} matrículas expiradas`);
    
    // 3. Atualizar recebíveis vencidos
    const overdue = await updateOverdueReceivables(today);
    console.log(`⚠️ ${overdue} recebíveis marcados como vencidos`);
    
    // 4. Suspender por inadimplência (30+ dias)
    const suspended = await suspendOverdueMemberships(today);
    console.log(`🚫 ${suspended} matrículas suspensas por inadimplência`);
    
    // 5. Enviar notificações de vencimento próximo
    const notified = await notifyUpcomingExpirations(today);
    console.log(`📧 ${notified} notificações enviadas`);
    
    console.log('✅ Manutenção diária concluída!');
  }
);

// Implementação das funções auxiliares
const activatePendingMemberships = async (today: string): Promise<number> => {
  const result = await db.memberships.updateMany({
    where: {
      status: 'pending',
      startDate: { lte: today },
      sale: { remainingCents: 0 } // Apenas se estiver paga
    },
    data: {
      status: 'active',
      activatedAt: new Date().toISOString()
    }
  });
  
  return result.count;
};

const expireMemberships = async (today: string): Promise<number> => {
  const result = await db.memberships.updateMany({
    where: {
      status: 'active',
      endDate: { lt: today }
    },
    data: {
      status: 'expired',
      expiredAt: new Date().toISOString()
    }
  });
  
  return result.count;
};

const updateOverdueReceivables = async (today: string): Promise<number> => {
  const result = await db.receivables.updateMany({
    where: {
      status: 'pending',
      dueDate: { lt: today }
    },
    data: {
      status: 'overdue',
      updatedAt: new Date().toISOString()
    }
  });
  
  return result.count;
};

const suspendOverdueMemberships = async (today: string): Promise<number> => {
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];
  
  const memberships = await db.memberships.findMany({
    where: {
      status: 'active',
      receivables: {
        some: {
          status: 'overdue',
          dueDate: { lt: thirtyDaysAgo }
        }
      }
    }
  });
  
  for (const membership of memberships) {
    await db.memberships.update({
      where: { id: membership.id },
      data: {
        status: 'suspended',
        suspendedAt: new Date().toISOString()
      }
    });
  }
  
  return memberships.length;
};
```

**Exemplos:**
- ✅ Ativar matrículas que começam hoje
- ✅ Expirar matrículas que terminaram
- ✅ Marcar recebíveis como vencidos
- ✅ Suspender por inadimplência
- ✅ Enviar notificações automáticas
- ✅ Gerar relatórios diários

**Por quê Cron é melhor que Functions individuais?**
- ✅ Processa em lote (batch) - mais eficiente
- ✅ Menos custos (1 execução vs N execuções)
- ✅ Mais simples de debugar
- ✅ Controle centralizado

---

#### ✅ **Cloud Functions (Event Triggers)**

**Use para:** Reagir a eventos específicos e atualizar dados relacionados

```typescript
// ✅ CORRETO - Atualizar dashboard quando venda é criada
export const onSaleCreated = onDocumentWritten(
  'tenants/{tenantId}/branches/{branchId}/sales/{saleId}',
  async (event) => {
    const { tenantId, branchId } = event.params;
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    // Ignorar se foi deletado
    if (!after) return;
    
    // Se é criação (não existia antes)
    if (!before) {
      const dateKey = after.dateKey;
      const monthKey = dateKey.substring(0, 7);
      
      // Calcular deltas
      const delta = {
        'sales.count': 1,
        'sales.grossTotalCents': after.grossTotalCents,
        'sales.discountCents': after.discountCents,
        'sales.netTotalCents': after.netTotalCents,
        'sales.paidTotalCents': after.paidTotalCents,
        'sales.remainingCents': after.remainingCents
      };
      
      // Atualizar sumários
      await updateDailySummary(tenantId, branchId, dateKey, delta);
      await updateMonthlySummary(tenantId, branchId, monthKey, delta);
    }
  }
);

// ✅ CORRETO - Atualizar quando matrícula muda de status
export const onMembershipStatusChanged = onDocumentWritten(
  'tenants/{tenantId}/branches/{branchId}/students/{studentId}/memberships/{membershipId}',
  async (event) => {
    const { tenantId, branchId } = event.params;
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    if (!before || !after) return;
    
    // Verificar se status mudou
    if (before.status !== after.status) {
      const dateKey = new Date().toISOString().split('T')[0];
      const monthKey = dateKey.substring(0, 7);
      
      // Calcular deltas baseado na mudança
      const delta: Record<string, number> = {};
      
      // Saiu de active
      if (before.status === 'active') {
        delta['memberships.activeCount'] = -1;
      }
      
      // Entrou em active
      if (after.status === 'active') {
        delta['memberships.activeCount'] = 1;
      }
      
      // Cancelamento
      if (after.status === 'canceled') {
        delta['memberships.cancellationCount'] = 1;
      }
      
      // Atualizar sumários
      if (Object.keys(delta).length > 0) {
        await updateDailySummary(tenantId, branchId, dateKey, delta);
        await updateMonthlySummary(tenantId, branchId, monthKey, delta);
      }
    }
  }
);

// ✅ CORRETO - Atualizar quando recebível é pago
export const onReceivablePaid = onDocumentWritten(
  'tenants/{tenantId}/branches/{branchId}/receivables/{receivableId}',
  async (event) => {
    const { tenantId, branchId } = event.params;
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    // Verificar se mudou para pago
    if (
      before &&
      (before.status === 'pending' || before.status === 'overdue') &&
      after?.status === 'paid'
    ) {
      const dateKey = new Date().toISOString().split('T')[0];
      const monthKey = dateKey.substring(0, 7);
      
      const delta = {
        'receivables.paidCount': 1,
        'receivables.paidTotalCents': after.amountCents,
        'receivables.overdueCount': before.status === 'overdue' ? -1 : 0,
        'receivables.overdueTotalCents': before.status === 'overdue' ? -after.amountCents : 0
      };
      
      await updateDailySummary(tenantId, branchId, dateKey, delta);
      await updateMonthlySummary(tenantId, branchId, monthKey, delta);
    }
  }
);
```

**Exemplos:**
- ✅ Atualizar dashboard quando venda é criada
- ✅ Atualizar métricas quando matrícula muda
- ✅ Atualizar recebíveis quando pagamento é feito
- ✅ Enviar notificação quando status muda
- ✅ Sincronizar dados entre entidades

**Por quê Functions para eventos?**
- ✅ Atualização em tempo real
- ✅ Dados sempre consistentes
- ✅ Desacoplamento (módulos não se conhecem)
- ✅ Auditoria automática

---

#### ❌ **APIs REST (Ações Manuais)**

**Use para:** Operações iniciadas pelo usuário

```typescript
// ✅ CORRETO - Cancelamento é ação manual
export const cancelMembership = async (
  tenantId: string,
  membershipId: string,
  reason: string,
  userId: string
): Promise<void> => {
  await db.transaction(async (tx) => {
    // 1. Cancelar matrícula
    await tx.memberships.update({
      where: { id: membershipId },
      data: {
        status: 'canceled',
        canceledAt: new Date().toISOString(),
        cancelReason: reason,
        updatedBy: userId
      }
    });
    
    // 2. Cancelar recebíveis pendentes
    await tx.receivables.updateMany({
      where: {
        membershipId,
        status: { in: ['pending', 'overdue'] }
      },
      data: {
        status: 'canceled',
        canceledAt: new Date().toISOString()
      }
    });
    
    // 3. Atualizar aluno
    const membership = await tx.memberships.findUnique({
      where: { id: membershipId }
    });
    
    await tx.students.update({
      where: { id: membership.studentId },
      data: {
        status: 'inactive',
        activeMembershipId: null,
        updatedBy: userId
      }
    });
  });
};

// ✅ CORRETO - Pausar matrícula é ação manual
export const pauseMembership = async (
  tenantId: string,
  membershipId: string,
  reason: string,
  userId: string
): Promise<void> => {
  await db.memberships.update({
    where: { id: membershipId },
    data: {
      status: 'paused',
      pausedAt: new Date().toISOString(),
      pauseReason: reason,
      updatedBy: userId
    }
  });
};
```

**Exemplos:**
- ✅ Cancelar matrícula
- ✅ Pausar matrícula
- ✅ Aplicar desconto
- ✅ Fazer reembolso
- ✅ Transferir aluno de unidade

---

### 📊 Resumo: Quando Usar Cada Um

| Operação | Tipo | Motivo |
|----------|------|--------|
| **Calcular fim de contrato** | Função Síncrona | É só matemática |
| **Calcular multa** | Função Síncrona | É só matemática |
| **Validar dados** | Função Síncrona | Validação imediata |
| **Ativar matrículas** | Cron Job | Batch diário |
| **Expirar matrículas** | Cron Job | Batch diário |
| **Marcar vencidos** | Cron Job | Batch diário |
| **Suspender inadimplentes** | Cron Job | Batch diário |
| **Atualizar dashboard** | Cloud Function | Tempo real |
| **Sincronizar dados** | Cloud Function | Tempo real |
| **Cancelar matrícula** | API REST | Ação manual |
| **Pausar matrícula** | API REST | Ação manual |
| **Fazer reembolso** | API REST | Ação manual |

---

### 🏗️ Estrutura de Arquivos Recomendada

```
functions/
├── scheduled/
│   └── daily-maintenance.ts        # ✅ Cron job diário
│
├── triggers/
│   ├── on-sale-written.ts          # ✅ Atualizar dashboard
│   ├── on-membership-written.ts    # ✅ Atualizar dashboard
│   └── on-receivable-written.ts    # ✅ Atualizar dashboard
│
└── http/
    └── manual-operations.ts         # ✅ APIs para ações manuais

modules/
└── memberships/
    ├── memberships.domain.ts        # ✅ Cálculos síncronos
    ├── memberships.db.ts            # ✅ CRUD
    └── memberships.validation.ts    # ✅ Validações
```

---

### 💰 Comparação de Custos

**Cenário:** 1000 matrículas expirando

#### ❌ **Com Functions Individuais**
```
1000 matrículas × 1 function cada = 1000 execuções
Custo: ~$0.40 por dia
Custo mensal: ~$12.00
```

#### ✅ **Com Cron Job**
```
1 cron job processando 1000 matrículas = 1 execução
Custo: ~$0.0004 por dia
Custo mensal: ~$0.012
```

**Economia: 99.9%** 🎉

---

### ✅ Checklist de Decisão

Ao implementar uma nova funcionalidade, pergunte:

- [ ] É um cálculo simples? → **Função Síncrona**
- [ ] Precisa processar muitos registros? → **Cron Job**
- [ ] Precisa reagir a um evento? → **Cloud Function**
- [ ] É ação iniciada pelo usuário? → **API REST**

---

## 🔄 Estados e Transições

### Diagrama de Estados do Aluno

```
┌──────┐
│ LEAD │ (Cadastrado, sem matrícula)
└───┬──┘
    │ Compra matrícula
    ▼
┌─────────┐
│ PENDING │ (Matrícula pendente de pagamento)
└────┬────┘
     │ Pagamento confirmado
     ▼
┌────────┐
│ ACTIVE │ (Matrícula ativa)
└───┬────┘
    │
    ├─► PAUSED (Pausado temporariamente)
    │   └─► ACTIVE (Retorna)
    │
    ├─► SUSPENDED (Suspenso por inadimplência)
    │   └─► ACTIVE (Regulariza pagamento)
    │
    ├─► EXPIRED (Matrícula expirou)
    │   └─► ACTIVE (Renova)
    │
    └─► CANCELED (Cancelado)
        └─► INACTIVE (Estado final)
```

### Diagrama de Estados da Matrícula

```
┌─────────┐
│ PENDING │ (Aguardando pagamento/ativação)
└────┬────┘
     │ Pagamento + Data início
     ▼
┌────────┐
│ ACTIVE │ (Ativa e válida)
└───┬────┘
    │
    ├─► PAUSED (Pausada)
    │   └─► ACTIVE (Retorna)
    │
    ├─► SUSPENDED (Suspensa por inadimplência)
    │   └─► ACTIVE (Regulariza)
    │
    ├─► EXPIRED (Fim do período)
    │   └─► ACTIVE (Renova)
    │
    └─► CANCELED (Cancelada)
```

### Diagrama de Estados do Recebível

```
┌─────────┐
│ PENDING │ (Aguardando pagamento)
└────┬────┘
     │
     ├─► PAID (Pago)
     │
     ├─► OVERDUE (Vencido)
     │   └─► PAID (Pago com atraso)
     │
     ├─► CANCELED (Cancelado)
     │
     └─► REFUNDED (Reembolsado)
```

---

## 📋 Regras de Negócio

### 1. Cadastro de Aluno

- ✅ Idade mínima: 3 anos
- ✅ Menores de 18 anos: responsável obrigatório
- ✅ CPF único no sistema (se fornecido)
- ✅ Email único no sistema (se fornecido)
- ✅ Telefone obrigatório

### 2. Seleção de Contrato

- ✅ Apenas contratos ativos podem ser vendidos
- ✅ Contrato deve estar disponível na unidade
- ✅ Desconto máximo: 50% do valor
- ✅ Desconto requer justificativa se > 20%

### 3. Pagamento

- ✅ Valor mínimo de entrada: 30% (se parcelado)
- ✅ Máximo de parcelas: definido no contrato
- ✅ Soma dos pagamentos ≤ valor total
- ✅ Pagamento em cartão: criar recebíveis para cada parcela

### 4. Ativação de Matrícula

- ✅ Matrícula ativa apenas se venda paga integralmente
- ✅ Se pagamento parcial: matrícula fica pendente
- ✅ Data de início pode ser futura
- ✅ Matrícula ativa automaticamente na data de início

### 5. Recebíveis

- ✅ Recebível vencido após data de vencimento
- ✅ Multa: 2% + 1% ao mês (pro-rata)
- ✅ Suspensão após 30 dias de atraso
- ✅ Cancelamento após 90 dias de atraso

### 6. Renovação

- ✅ Renovação permitida 30 dias antes do vencimento
- ✅ Nova matrícula inicia no dia seguinte ao término da anterior
- ✅ Renovação mantém histórico (previousMembershipId)

### 7. Cancelamento

- ✅ Cancelamento com reembolso: até 7 dias da compra
- ✅ Cancelamento sem reembolso: após 7 dias
- ✅ Recebíveis pendentes são cancelados
- ✅ Aluno volta para status LEAD

---

## 🎯 Casos Especiais

### 1. Pagamento Parcial

```typescript
// Aluno paga apenas parte do valor
const sale = await createMembershipSale(tenantId, {
  studentId: 'student-123',
  contractId: 'contract-456',
  payments: [
    { method: 'pix', amountCents: 50000 } // R$ 500 de R$ 1000
  ]
});

// Resultado:
// - Venda: status = 'open', remainingCents = 50000
// - Matrícula: status = 'pending'
// - Aluno: status = 'pending'
// - Recebível: criado para R$ 500 restantes
```

### 2. Parcelamento no Cartão

```typescript
// Aluno parcela em 3x no cartão
const sale = await createMembershipSale(tenantId, {
  studentId: 'student-123',
  contractId: 'contract-456',
  payments: [
    {
      method: 'credit_card',
      amountCents: 100000, // R$ 1000
      card: {
        brand: 'visa',
        last4: '1234',
        installments: 3
      }
    }
  ]
});

// Resultado:
// - Venda: status = 'paid', remainingCents = 0
// - Matrícula: status = 'active' (se data de início já passou)
// - Aluno: status = 'active'
// - Recebíveis: 3 recebíveis criados
//   - Parcela 1: paga (R$ 333,33)
//   - Parcela 2: pendente, vence em 30 dias
//   - Parcela 3: pendente, vence em 60 dias
```

### 3. Renovação Antecipada

```typescript
// Aluno renova 15 dias antes do vencimento
const renewal = await renewMembership(tenantId, {
  studentId: 'student-123',
  currentMembershipId: 'membership-456',
  newContractId: 'contract-789',
  payments: [
    { method: 'pix', amountCents: 100000 }
  ]
});

// Resultado:
// - Nova matrícula criada
// - startDate = endDate da matrícula anterior + 1 dia
// - status = 'pending' (até a data de início)
// - Matrícula anterior: continua ativa até o fim
// - Aluno: mantém status 'active'
```

### 4. Inadimplência e Suspensão

```typescript
// Recebível vencido há 30 dias
// Cron job diário executa:
await updateMembershipStatuses(tenantId);

// Resultado:
// - Matrícula: status = 'suspended'
// - Aluno: status = 'suspended'
// - Acesso bloqueado às aulas
// - Notificação enviada ao aluno

// Quando aluno paga:
await payReceivable(tenantId, receivableId, payment);

// Resultado:
// - Recebível: status = 'paid'
// - Matrícula: status = 'active' (reativada)
// - Aluno: status = 'active'
```

### 5. Cancelamento com Reembolso

```typescript
// Aluno cancela dentro de 7 dias
const refund = await cancelMembershipWithRefund(tenantId, {
  membershipId: 'membership-123',
  reason: 'Desistência',
  refundMethod: 'pix'
});

// Resultado:
// - Matrícula: status = 'canceled'
// - Venda: status = 'refunded'
// - Recebíveis: status = 'canceled'
// - Aluno: status = 'lead'
// - Reembolso: criado e processado
// - Dashboard: métricas atualizadas (venda cancelada)
```

---

## 📊 Resumo do Impacto no Dashboard

### Quando Aluno é Cadastrado
- ✅ Contador de leads aumenta
- ✅ Nenhum impacto em receita

### Quando Venda é Criada
- ✅ `sales.count` +1
- ✅ `sales.grossTotalCents` + valor bruto
- ✅ `sales.discountCents` + desconto
- ✅ `sales.netTotalCents` + valor líquido
- ✅ `sales.paidTotalCents` + valor pago
- ✅ `sales.remainingCents` + saldo pendente

### Quando Matrícula é Ativada
- ✅ `memberships.newCount` +1 (ou renewalCount)
- ✅ `memberships.activeCount` +1
- ✅ Contador de alunos ativos +1

### Quando Recebível é Pago
- ✅ `receivables.paidCount` +1
- ✅ `receivables.paidTotalCents` + valor
- ✅ Se estava vencido: `receivables.overdueCount` -1

### Quando Matrícula é Cancelada
- ✅ `memberships.cancellationCount` +1
- ✅ `memberships.activeCount` -1
- ✅ Contador de alunos ativos -1
- ✅ Taxa de churn aumenta

---

**Esta é a estrutura ideal para um sistema robusto, escalável e com dados consistentes!** 🚀
