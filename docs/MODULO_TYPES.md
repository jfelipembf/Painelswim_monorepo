# 📘 Guia: {module}.types.ts

## 🎯 Responsabilidade

Definir **TODOS** os tipos, interfaces e enums do módulo. Este arquivo é a **fonte única de verdade** para a estrutura de dados.

---

## ✅ O que DEVE conter

- ✅ Tipos e interfaces TypeScript
- ✅ Enums para valores fixos
- ✅ DTOs (Data Transfer Objects)
- ✅ Tipos de filtros e paginação
- ✅ Tipos de resposta e agregações
- ✅ Documentação JSDoc

## ❌ O que NÃO deve conter

- ❌ Lógica de negócio
- ❌ Funções ou métodos
- ❌ Validações
- ❌ Imports de outros módulos (exceto tipos)
- ❌ Valores default ou constantes

---

## 📐 Estrutura Padrão

```typescript
// ============================================
// ENUMS
// ============================================

export enum {Module}Status {
  // Valores possíveis
}

// ============================================
// BASE TYPES
// ============================================

export type {Module}Id = string;

// ============================================
// ENTITIES
// ============================================

/**
 * Entidade principal do módulo
 */
export interface {Module} {
  // Campos da entidade
}

// ============================================
// DTOs (Data Transfer Objects)
// ============================================

/**
 * Payload para criar
 */
export interface Create{Module}Dto {
  // Campos obrigatórios para criação
}

/**
 * Payload para atualizar
 */
export interface Update{Module}Dto {
  // Campos opcionais para atualização
}

/**
 * Filtros para busca
 */
export interface {Module}Filters {
  // Campos de filtro
}

// ============================================
// PAGINATION
// ============================================

export interface PaginationOptions {
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ============================================
// AGGREGATIONS
// ============================================

export interface {Module}Summary {
  // Campos agregados
}
```

---

## 🎨 Convenções de Nomenclatura

### Entidades
```typescript
// ✅ Singular, PascalCase
export interface Sale { }
export interface Client { }
export interface Membership { }

// ❌ Evitar
export interface sales { }  // Minúscula
export interface Sales { }  // Plural
```

### DTOs
```typescript
// ✅ Sufixo "Dto"
export interface CreateSaleDto { }
export interface UpdateSaleDto { }
export interface SaleFilters { }

// ❌ Evitar
export interface SaleCreate { }
export interface SaleInput { }
```

### IDs
```typescript
// ✅ Sufixo "Id"
export type SaleId = string;
export type ClientId = string;

// ❌ Evitar
export type SaleID = string;
export type sale_id = string;
```

### Enums
```typescript
// ✅ PascalCase, valores UPPER_SNAKE_CASE
export enum SaleStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid'
}

// ❌ Evitar
export enum saleStatus { }  // Minúscula
export enum SaleStatus {
  draft = 'draft'  // Minúscula
}
```

---

## 📝 Documentação JSDoc

### Entidades
```typescript
/**
 * Representa uma venda no sistema
 * 
 * @property id - Identificador único
 * @property status - Status atual da venda
 * @property createdAt - Data de criação
 */
export interface Sale {
  id: SaleId;
  status: SaleStatus;
  createdAt: string;
}
```

### DTOs
```typescript
/**
 * Payload para criar uma nova venda
 * 
 * @example
 * ```typescript
 * const dto: CreateSaleDto = {
 *   clientId: 'uuid',
 *   items: [{ type: 'product', quantity: 1, unitPriceCents: 1000 }]
 * };
 * ```
 */
export interface CreateSaleDto {
  clientId: ClientId;
  items: SaleItem[];
}
```

---

## 🔍 Tipos Comuns

### Timestamps
```typescript
// ✅ Usar string ISO 8601
export interface Entity {
  createdAt: string;  // "2024-01-01T00:00:00.000Z"
  updatedAt: string;
}

// ❌ Evitar
export interface Entity {
  createdAt: Date;    // Não serializa bem
  createdAt: number;  // Timestamp Unix - menos legível
}
```

### Valores Monetários
```typescript
// ✅ Usar centavos (inteiros)
export interface Sale {
  totalCents: number;  // 1000 = R$ 10,00
  discountCents: number;
}

// ❌ Evitar
export interface Sale {
  total: number;  // 10.00 - problemas de precisão
}
```

### IDs
```typescript
// ✅ Usar string (UUID)
export type SaleId = string;

// 🔶 Alternativa com branded types
export type SaleId = string & { readonly __brand: 'SaleId' };
```

### Campos Opcionais
```typescript
// ✅ Usar ? para opcionais
export interface Sale {
  id: string;
  notes?: string;      // Pode ser undefined
  tags?: string[];     // Pode ser undefined
}

// ❌ Evitar null explícito
export interface Sale {
  notes: string | null;  // Prefira undefined
}
```

---

## 🎯 Padrões de DTOs

### Create DTO
```typescript
/**
 * Remove campos gerados automaticamente:
 * - id (gerado pelo banco)
 * - timestamps (gerados pelo sistema)
 * - campos calculados
 */
export interface CreateSaleDto {
  // Apenas campos fornecidos pelo usuário
  clientId: ClientId;
  items: Omit<SaleItem, 'id'>[];
  discountCents?: number;
}
```

### Update DTO
```typescript
/**
 * Todos os campos opcionais
 * Permite atualização parcial
 */
export interface UpdateSaleDto {
  status?: SaleStatus;
  items?: SaleItem[];
  notes?: string;
}

// 🔶 Alternativa com Partial
export type UpdateSaleDto = Partial<Pick<Sale, 'status' | 'items' | 'notes'>>;
```

### Filters DTO
```typescript
/**
 * Todos os campos opcionais
 * Suporta múltiplos critérios
 */
export interface SaleFilters {
  clientId?: ClientId;
  status?: SaleStatus | SaleStatus[];  // Único ou múltiplos
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;  // Busca textual
}
```

---

## 🔗 Relacionamentos

### Com IDs (Normalizado)
```typescript
// ✅ Apenas IDs - Normalizado
export interface Sale {
  id: SaleId;
  clientId: ClientId;
  consultantId: string;
}
```

### Com Objetos Aninhados (Desnormalizado)
```typescript
// ✅ Para respostas de API
export interface SaleWithRelations extends Sale {
  client?: {
    id: ClientId;
    name: string;
    email?: string;
  };
  consultant?: {
    id: string;
    name: string;
  };
}
```

### Snapshots
```typescript
// ✅ Para dados históricos
export interface Sale {
  id: SaleId;
  clientId: ClientId;
  clientSnapshot?: {
    id: ClientId;
    name: string;
    email?: string;
    capturedAt: string;
  };
}
```

---

## 📊 Agregações e Sumários

```typescript
/**
 * Sumário de vendas por período
 */
export interface SalesSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalSales: number;
    totalRevenueCents: number;
    averageTicketCents: number;
    totalDiscountCents: number;
  };
  breakdown: {
    byStatus: Record<SaleStatus, number>;
    byPaymentMethod: Record<string, number>;
    byDay: Array<{
      date: string;
      count: number;
      revenueCents: number;
    }>;
  };
}
```

---

## 🛡️ Type Guards

```typescript
/**
 * Type guard para verificar se é uma venda válida
 */
export const isSale = (obj: unknown): obj is Sale => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'status' in obj &&
    'clientId' in obj
  );
};

/**
 * Type guard para verificar status
 */
export const isPaidSale = (sale: Sale): sale is Sale & { status: 'paid' } => {
  return sale.status === 'paid';
};
```

---

## 📦 Utility Types

```typescript
// Campos obrigatórios para criação
export type RequiredForCreate<T> = Required<Pick<T, 'field1' | 'field2'>>;

// Campos que podem ser atualizados
export type UpdatableFields<T> = Partial<Pick<T, 'field1' | 'field2'>>;

// Campos públicos (sem dados sensíveis)
export type PublicSale = Omit<Sale, 'internalNotes' | 'costCents'>;

// Campos para listagem (resumido)
export type SaleListItem = Pick<Sale, 'id' | 'clientId' | 'status' | 'totalCents' | 'createdAt'>;
```

---

## ✅ Checklist

Ao criar `{module}.types.ts`:

- [ ] Todos os enums definidos
- [ ] Entidade principal documentada
- [ ] DTOs criados (Create, Update, Filters)
- [ ] Tipos de paginação incluídos
- [ ] Relacionamentos definidos
- [ ] JSDoc em todas as interfaces públicas
- [ ] Nomenclatura consistente
- [ ] Sem imports de lógica
- [ ] Sem valores default
- [ ] Type guards criados (se necessário)

---

## 📚 Exemplos Completos

Ver exemplos em:
- `/examples/modules/sales/sales.types.ts`
- `/examples/modules/clients/clients.types.ts`
- `/examples/modules/memberships/memberships.types.ts`
