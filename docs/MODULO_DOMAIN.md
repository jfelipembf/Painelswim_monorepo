# 🧠 Guia: {module}.domain.ts

## 🎯 Responsabilidade

Implementar **TODA** a lógica de negócio do módulo. Este arquivo contém as regras, cálculos, transformações e validações de negócio.

---

## ✅ O que DEVE conter

- ✅ Cálculos e fórmulas de negócio
- ✅ Transformações de dados
- ✅ Validações de regras de negócio
- ✅ Máquinas de estado e transições
- ✅ Agregações e análises
- ✅ Funções puras sempre que possível
- ✅ Documentação detalhada

## ❌ O que NÃO deve conter

- ❌ Acesso direto ao banco de dados
- ❌ Queries SQL
- ❌ Lógica de UI/apresentação
- ❌ Chamadas HTTP diretas
- ❌ Side effects não controlados

---

## 📐 Estrutura Padrão

```typescript
import type { Entity, CreateEntityDto, EntityStatus } from './entity.types';
import { ValidationError, BusinessRuleError } from '@/shared/utils/errors';

// ============================================
// CÁLCULOS
// ============================================

/**
 * Calcula valores derivados
 */
export const calculateEntityTotals = (data: any): any => {
  // Implementação
};

// ============================================
// TRANSFORMAÇÕES
// ============================================

/**
 * Prepara dados para criação
 */
export const prepareEntityData = (dto: CreateEntityDto): Partial<Entity> => {
  // Implementação
};

/**
 * Normaliza dados para exibição
 */
export const normalizeEntity = (entity: Entity): any => {
  // Implementação
};

// ============================================
// VALIDAÇÕES DE NEGÓCIO
// ============================================

/**
 * Valida regra de negócio específica
 */
export const validateBusinessRule = (entity: Entity): void => {
  // Implementação
};

// ============================================
// MÁQUINA DE ESTADOS
// ============================================

/**
 * Verifica se transição de status é válida
 */
export const isValidStatusTransition = (
  current: EntityStatus,
  next: EntityStatus
): boolean => {
  // Implementação
};

// ============================================
// AGREGAÇÕES
// ============================================

/**
 * Calcula métricas agregadas
 */
export const calculateMetrics = (entities: Entity[]): any => {
  // Implementação
};

// ============================================
// HELPERS PRIVADOS
// ============================================

const helperFunction = (...args: any[]): any => {
  // Implementação
};
```

---

## 🎨 Padrões de Implementação

### 1. Cálculos de Negócio

```typescript
/**
 * Calcula o total bruto de itens
 * 
 * @param items - Array de itens da venda
 * @returns Total bruto em centavos
 * 
 * @example
 * ```typescript
 * const items = [
 *   { quantity: 2, unitPriceCents: 1000 },
 *   { quantity: 1, unitPriceCents: 500 }
 * ];
 * const total = calculateGrossTotal(items); // 2500
 * ```
 */
export const calculateGrossTotal = (items: SaleItem[]): number => {
  return items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPriceCents);
  }, 0);
};

/**
 * Calcula o total líquido (bruto - desconto)
 * 
 * @param grossTotalCents - Total bruto
 * @param discountCents - Desconto aplicado
 * @returns Total líquido em centavos
 */
export const calculateNetTotal = (
  grossTotalCents: number,
  discountCents: number
): number => {
  return Math.max(0, grossTotalCents - discountCents);
};

/**
 * Calcula o total pago
 */
export const calculatePaidTotal = (payments: Payment[]): number => {
  return payments.reduce((sum, payment) => sum + payment.amountCents, 0);
};

/**
 * Calcula o saldo restante
 */
export const calculateRemainingAmount = (
  netTotalCents: number,
  paidTotalCents: number
): number => {
  return Math.max(0, netTotalCents - paidTotalCents);
};

/**
 * Calcula TODOS os valores de uma venda
 * Função principal que orquestra todos os cálculos
 */
export const calculateSaleTotals = (
  items: SaleItem[],
  payments: Payment[],
  discountCents: number = 0
): {
  grossTotalCents: number;
  netTotalCents: number;
  paidTotalCents: number;
  remainingCents: number;
} => {
  const grossTotalCents = calculateGrossTotal(items);
  const netTotalCents = calculateNetTotal(grossTotalCents, discountCents);
  const paidTotalCents = calculatePaidTotal(payments);
  const remainingCents = calculateRemainingAmount(netTotalCents, paidTotalCents);
  
  return {
    grossTotalCents,
    netTotalCents,
    paidTotalCents,
    remainingCents
  };
};

/**
 * Calcula percentual de desconto
 */
export const calculateDiscountPercentage = (
  grossTotalCents: number,
  discountCents: number
): number => {
  if (grossTotalCents === 0) return 0;
  return Math.round((discountCents / grossTotalCents) * 100);
};

/**
 * Calcula desconto a partir de percentual
 */
export const calculateDiscountFromPercentage = (
  grossTotalCents: number,
  percentage: number
): number => {
  return Math.round((grossTotalCents * percentage) / 100);
};
```

### 2. Transformações de Dados

```typescript
/**
 * Prepara dados de venda para criação
 * Transforma DTO em entidade parcial com valores calculados
 * 
 * @param dto - Dados de entrada do usuário
 * @param userId - ID do usuário criando
 * @returns Entidade parcial pronta para persistência
 */
export const prepareSaleData = (
  dto: CreateSaleDto,
  userId: string
): Omit<Sale, 'id' | 'createdAt' | 'updatedAt'> => {
  // 1. Processar itens (adicionar IDs, calcular totais)
  const items: SaleItem[] = dto.items.map((item, index) => ({
    id: `item_${Date.now()}_${index}`,
    type: item.type,
    description: item.description,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    totalCents: item.quantity * item.unitPriceCents,
    discountCents: item.discountCents || 0,
    metadata: item.metadata
  }));
  
  // 2. Processar pagamentos (adicionar IDs, timestamps)
  const payments: Payment[] = (dto.payments || []).map((payment, index) => ({
    id: `payment_${Date.now()}_${index}`,
    method: payment.method,
    amountCents: payment.amountCents,
    paidAt: new Date().toISOString(),
    reference: payment.reference,
    metadata: payment.metadata
  }));
  
  // 3. Calcular totais
  const totals = calculateSaleTotals(items, payments, dto.discountCents);
  
  // 4. Determinar status inicial
  const status = determineSaleStatus(totals.netTotalCents, totals.paidTotalCents);
  
  // 5. Gerar date key (YYYY-MM-DD)
  const dateKey = new Date().toISOString().split('T')[0];
  
  // 6. Montar entidade
  return {
    tenantId: '', // Será preenchido na camada de DB
    branchId: dto.branchId,
    clientId: dto.clientId,
    consultantId: dto.consultantId,
    status,
    items,
    payments,
    ...totals,
    dateKey,
    createdBy: userId,
    notes: dto.notes,
    tags: dto.tags || [],
    metadata: dto.metadata
  };
};

/**
 * Normaliza venda para exibição
 * Adiciona campos formatados e derivados
 */
export const normalizeSaleForDisplay = (sale: Sale) => {
  return {
    ...sale,
    // Valores formatados
    formattedGrossTotal: formatCurrency(sale.grossTotalCents),
    formattedDiscount: formatCurrency(sale.discountCents),
    formattedNetTotal: formatCurrency(sale.netTotalCents),
    formattedPaid: formatCurrency(sale.paidTotalCents),
    formattedRemaining: formatCurrency(sale.remainingCents),
    
    // Flags booleanas
    isPaid: sale.status === 'paid',
    isPartiallyPaid: sale.paidTotalCents > 0 && sale.remainingCents > 0,
    hasDiscount: sale.discountCents > 0,
    
    // Dados derivados
    discountPercentage: calculateDiscountPercentage(
      sale.grossTotalCents,
      sale.discountCents
    ),
    paymentProgress: sale.netTotalCents > 0
      ? Math.round((sale.paidTotalCents / sale.netTotalCents) * 100)
      : 0,
    
    // Datas formatadas
    formattedDate: formatDate(sale.dateKey),
    formattedCreatedAt: formatDateTime(sale.createdAt),
    
    // Contadores
    itemCount: sale.items.length,
    paymentCount: sale.payments.length
  };
};

/**
 * Sanitiza dados de entrada
 * Remove campos inválidos e normaliza valores
 */
export const sanitizeSaleData = (data: any): Partial<Sale> => {
  const sanitized: any = {};
  
  // Copiar apenas campos válidos
  const validFields = [
    'status', 'items', 'payments', 'discountCents',
    'notes', 'tags', 'metadata'
  ];
  
  validFields.forEach(field => {
    if (data[field] !== undefined) {
      sanitized[field] = data[field];
    }
  });
  
  // Normalizar valores
  if (sanitized.discountCents !== undefined) {
    sanitized.discountCents = Math.max(0, Math.round(sanitized.discountCents));
  }
  
  if (sanitized.tags) {
    sanitized.tags = [...new Set(sanitized.tags)]; // Remove duplicatas
  }
  
  return sanitized;
};
```

### 3. Máquina de Estados

```typescript
/**
 * Define transições válidas de status
 */
const STATUS_TRANSITIONS: Record<SaleStatus, SaleStatus[]> = {
  draft: ['open', 'canceled'],
  open: ['paid', 'canceled'],
  paid: ['refunded', 'canceled'],
  canceled: [], // Estado final
  refunded: []  // Estado final
};

/**
 * Verifica se transição de status é válida
 * 
 * @param currentStatus - Status atual
 * @param newStatus - Novo status desejado
 * @returns true se transição é válida
 */
export const isValidStatusTransition = (
  currentStatus: SaleStatus,
  newStatus: SaleStatus
): boolean => {
  // Mesma status é sempre válido (idempotente)
  if (currentStatus === newStatus) return true;
  
  // Verificar se transição está permitida
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

/**
 * Valida e lança erro se transição inválida
 */
export const validateStatusTransition = (
  currentStatus: SaleStatus,
  newStatus: SaleStatus
): void => {
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    throw new BusinessRuleError(
      `Transição de status inválida: ${currentStatus} → ${newStatus}`
    );
  }
};

/**
 * Determina o próximo status baseado em condições
 */
export const determineSaleStatus = (
  netTotalCents: number,
  paidTotalCents: number
): SaleStatus => {
  if (paidTotalCents === 0) return 'open';
  if (paidTotalCents >= netTotalCents) return 'paid';
  return 'open'; // Parcialmente pago ainda é "open"
};

/**
 * Retorna status disponíveis para transição
 */
export const getAvailableStatusTransitions = (
  currentStatus: SaleStatus
): SaleStatus[] => {
  return STATUS_TRANSITIONS[currentStatus] || [];
};
```

### 4. Validações de Negócio

```typescript
/**
 * Valida se venda pode ser cancelada
 * 
 * @param sale - Venda a validar
 * @returns true se pode cancelar
 */
export const canCancelSale = (sale: Sale): boolean => {
  // Não pode cancelar se já estiver cancelada ou reembolsada
  if (sale.status === 'canceled' || sale.status === 'refunded') {
    return false;
  }
  
  // Não pode cancelar se tiver pagamentos (precisa reembolsar)
  if (sale.paidTotalCents > 0) {
    return false;
  }
  
  return true;
};

/**
 * Valida se venda pode ser reembolsada
 */
export const canRefundSale = (sale: Sale): boolean => {
  // Só pode reembolsar se estiver paga
  if (sale.status !== 'paid') {
    return false;
  }
  
  // Verificar prazo de reembolso (ex: 30 dias)
  const daysSinceSale = getDaysSince(sale.createdAt);
  if (daysSinceSale > 30) {
    return false;
  }
  
  return true;
};

/**
 * Valida se pode adicionar pagamento
 */
export const canAddPayment = (sale: Sale, paymentAmount: number): boolean => {
  // Não pode adicionar pagamento se cancelada ou reembolsada
  if (sale.status === 'canceled' || sale.status === 'refunded') {
    return false;
  }
  
  // Não pode pagar mais que o restante
  if (paymentAmount > sale.remainingCents) {
    return false;
  }
  
  // Não pode adicionar pagamento negativo ou zero
  if (paymentAmount <= 0) {
    return false;
  }
  
  return true;
};

/**
 * Valida se desconto é válido
 */
export const validateDiscount = (
  grossTotalCents: number,
  discountCents: number
): void => {
  if (discountCents < 0) {
    throw new BusinessRuleError('Desconto não pode ser negativo');
  }
  
  if (discountCents > grossTotalCents) {
    throw new BusinessRuleError(
      `Desconto (${formatCurrency(discountCents)}) não pode ser maior que total (${formatCurrency(grossTotalCents)})`
    );
  }
  
  // Validar desconto máximo (ex: 50%)
  const maxDiscountPercentage = 50;
  const discountPercentage = calculateDiscountPercentage(grossTotalCents, discountCents);
  
  if (discountPercentage > maxDiscountPercentage) {
    throw new BusinessRuleError(
      `Desconto de ${discountPercentage}% excede o máximo permitido de ${maxDiscountPercentage}%`
    );
  }
};

/**
 * Valida quantidade mínima de itens
 */
export const validateMinimumItems = (items: SaleItem[]): void => {
  if (!items || items.length === 0) {
    throw new BusinessRuleError('Venda deve ter pelo menos 1 item');
  }
};

/**
 * Valida valor mínimo de venda
 */
export const validateMinimumSaleValue = (netTotalCents: number): void => {
  const MINIMUM_SALE_CENTS = 100; // R$ 1,00
  
  if (netTotalCents < MINIMUM_SALE_CENTS) {
    throw new BusinessRuleError(
      `Valor mínimo de venda é ${formatCurrency(MINIMUM_SALE_CENTS)}`
    );
  }
};

/**
 * Valida todas as regras de negócio para criação
 */
export const validateSaleCreation = (data: CreateSaleDto): void => {
  // Validar itens
  validateMinimumItems(data.items);
  
  // Calcular totais
  const totals = calculateSaleTotals(
    data.items as SaleItem[],
    [],
    data.discountCents
  );
  
  // Validar desconto
  if (data.discountCents) {
    validateDiscount(totals.grossTotalCents, data.discountCents);
  }
  
  // Validar valor mínimo
  validateMinimumSaleValue(totals.netTotalCents);
};
```

### 5. Agregações e Análises

```typescript
/**
 * Agrupa vendas por status
 */
export const groupSalesByStatus = (sales: Sale[]): Record<SaleStatus, Sale[]> => {
  return sales.reduce((acc, sale) => {
    if (!acc[sale.status]) {
      acc[sale.status] = [];
    }
    acc[sale.status].push(sale);
    return acc;
  }, {} as Record<SaleStatus, Sale[]>);
};

/**
 * Agrupa vendas por período (dia, semana, mês)
 */
export const groupSalesByPeriod = (
  sales: Sale[],
  period: 'day' | 'week' | 'month'
): Map<string, Sale[]> => {
  const grouped = new Map<string, Sale[]>();
  
  sales.forEach(sale => {
    let key: string;
    
    switch (period) {
      case 'day':
        key = sale.dateKey; // YYYY-MM-DD
        break;
      case 'week':
        key = getWeekKey(sale.dateKey); // YYYY-Www
        break;
      case 'month':
        key = sale.dateKey.substring(0, 7); // YYYY-MM
        break;
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(sale);
  });
  
  return grouped;
};

/**
 * Calcula métricas agregadas de vendas
 */
export const calculateSalesMetrics = (sales: Sale[]): {
  totalSales: number;
  totalRevenueCents: number;
  averageTicketCents: number;
  totalDiscountCents: number;
  conversionRate: number;
  byStatus: Record<SaleStatus, number>;
} => {
  const activeSales = sales.filter(s => s.status !== 'canceled');
  
  const totalSales = activeSales.length;
  const totalRevenueCents = activeSales.reduce((sum, s) => sum + s.netTotalCents, 0);
  const averageTicketCents = totalSales > 0 ? Math.round(totalRevenueCents / totalSales) : 0;
  const totalDiscountCents = activeSales.reduce((sum, s) => sum + s.discountCents, 0);
  const conversionRate = sales.length > 0 ? (activeSales.length / sales.length) * 100 : 0;
  
  // Contar por status
  const byStatus = sales.reduce((acc, sale) => {
    acc[sale.status] = (acc[sale.status] || 0) + 1;
    return acc;
  }, {} as Record<SaleStatus, number>);
  
  return {
    totalSales,
    totalRevenueCents,
    averageTicketCents,
    totalDiscountCents,
    conversionRate,
    byStatus
  };
};

/**
 * Calcula top produtos/serviços vendidos
 */
export const calculateTopItems = (
  sales: Sale[],
  limit: number = 10
): Array<{
  description: string;
  quantity: number;
  revenueCents: number;
}> => {
  const itemMap = new Map<string, { quantity: number; revenueCents: number }>();
  
  sales.forEach(sale => {
    if (sale.status === 'canceled') return;
    
    sale.items.forEach(item => {
      const current = itemMap.get(item.description) || { quantity: 0, revenueCents: 0 };
      itemMap.set(item.description, {
        quantity: current.quantity + item.quantity,
        revenueCents: current.revenueCents + item.totalCents
      });
    });
  });
  
  return Array.from(itemMap.entries())
    .map(([description, data]) => ({ description, ...data }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, limit);
};

/**
 * Calcula taxa de conversão por consultor
 */
export const calculateConsultantConversion = (
  sales: Sale[]
): Map<string, { total: number; converted: number; rate: number }> => {
  const consultantMap = new Map<string, { total: number; converted: number }>();
  
  sales.forEach(sale => {
    const current = consultantMap.get(sale.consultantId) || { total: 0, converted: 0 };
    current.total++;
    if (sale.status !== 'canceled') {
      current.converted++;
    }
    consultantMap.set(sale.consultantId, current);
  });
  
  // Calcular taxa
  const result = new Map<string, { total: number; converted: number; rate: number }>();
  consultantMap.forEach((data, consultantId) => {
    result.set(consultantId, {
      ...data,
      rate: data.total > 0 ? (data.converted / data.total) * 100 : 0
    });
  });
  
  return result;
};
```

### 6. Filtros e Ordenação

```typescript
/**
 * Filtra vendas por critério customizado
 */
export const filterSales = (
  sales: Sale[],
  predicate: (sale: Sale) => boolean
): Sale[] => {
  return sales.filter(predicate);
};

/**
 * Filtra vendas ativas (não canceladas)
 */
export const filterActiveSales = (sales: Sale[]): Sale[] => {
  return sales.filter(sale => sale.status !== 'canceled');
};

/**
 * Filtra vendas pagas
 */
export const filterPaidSales = (sales: Sale[]): Sale[] => {
  return sales.filter(sale => sale.status === 'paid');
};

/**
 * Filtra vendas com saldo pendente
 */
export const filterPendingSales = (sales: Sale[]): Sale[] => {
  return sales.filter(sale => sale.remainingCents > 0 && sale.status !== 'canceled');
};

/**
 * Ordena vendas por campo
 */
export const sortSales = (
  sales: Sale[],
  field: keyof Sale,
  direction: 'asc' | 'desc' = 'desc'
): Sale[] => {
  return [...sales].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Ordena vendas por múltiplos campos
 */
export const sortSalesMultiple = (
  sales: Sale[],
  sorts: Array<{ field: keyof Sale; direction: 'asc' | 'desc' }>
): Sale[] => {
  return [...sales].sort((a, b) => {
    for (const sort of sorts) {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};
```

---

## 🛠️ Helpers Privados

```typescript
/**
 * Formata valor em centavos para moeda
 */
const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100);
};

/**
 * Formata data (YYYY-MM-DD → DD/MM/YYYY)
 */
const formatDate = (dateKey: string): string => {
  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Formata data e hora
 */
const formatDateTime = (isoDate: string): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(isoDate));
};

/**
 * Calcula dias desde uma data
 */
const getDaysSince = (isoDate: string): number => {
  const date = new Date(isoDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Retorna chave da semana (YYYY-Www)
 */
const getWeekKey = (dateKey: string): string => {
  const date = new Date(dateKey);
  const weekNumber = getWeekNumber(date);
  return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
};

/**
 * Calcula número da semana no ano
 */
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};
```

---

## 🧪 Testabilidade

```typescript
// ✅ Funções puras - fáceis de testar
export const calculateGrossTotal = (items: SaleItem[]): number => {
  return items.reduce((sum, item) => sum + (item.quantity * item.unitPriceCents), 0);
};

// ✅ Sem side effects
export const validateDiscount = (gross: number, discount: number): void => {
  if (discount > gross) {
    throw new BusinessRuleError('Desconto inválido');
  }
};

// ❌ Evitar side effects não controlados
export const badFunction = (sale: Sale): void => {
  // ❌ Não fazer isso
  console.log('Processing sale...'); // Side effect
  fetch('/api/log', { body: JSON.stringify(sale) }); // Side effect
};
```

---

## ✅ Checklist

Ao criar `{module}.domain.ts`:

- [ ] Todas as regras de negócio implementadas
- [ ] Cálculos documentados com exemplos
- [ ] Funções puras sempre que possível
- [ ] Validações de negócio separadas de validações de schema
- [ ] Máquina de estados definida
- [ ] Agregações e métricas implementadas
- [ ] Helpers privados para código reutilizável
- [ ] Sem acesso direto ao banco
- [ ] Sem lógica de UI
- [ ] Testável isoladamente

---

## 📚 Exemplos Completos

Ver exemplos em:
- `/examples/modules/sales/sales.domain.ts`
- `/examples/modules/memberships/memberships.domain.ts`
