# 🗄️ Guia: {module}.db.ts

## 🎯 Responsabilidade

Realizar **APENAS** operações de leitura e escrita no banco de dados. Este arquivo é a **camada de acesso a dados** do módulo.

---

## ✅ O que DEVE conter

- ✅ Funções CRUD (Create, Read, Update, Delete)
- ✅ Queries complexas e agregações
- ✅ Mapeamento entre banco e entidades
- ✅ Tratamento de erros de banco
- ✅ Transações quando necessário
- ✅ Documentação de cada função

## ❌ O que NÃO deve conter

- ❌ Validações de negócio
- ❌ Cálculos ou transformações complexas
- ❌ Lógica de autorização
- ❌ Chamadas a outros módulos
- ❌ Lógica de cache (vai em `.cache.ts`)

---

## 📐 Estrutura Padrão

```typescript
import { getDatabase } from '@/services/database/client';
import { DatabaseError, NotFoundError } from '@/shared/utils/errors';
import type { Entity, EntityId, CreateEntityDto, UpdateEntityDto } from './entity.types';

// ============================================
// HELPERS PRIVADOS
// ============================================

/**
 * Mapeia documento do banco para entidade
 */
const mapDocToEntity = (doc: any): Entity => {
  // Transformação snake_case → camelCase
};

/**
 * Mapeia entidade para documento do banco
 */
const mapEntityToDoc = (entity: Partial<Entity>): Record<string, any> => {
  // Transformação camelCase → snake_case
};

// ============================================
// CREATE
// ============================================

export const createEntity = async (
  tenantId: string,
  data: CreateEntityDto
): Promise<Entity> => {
  // Implementação
};

// ============================================
// READ
// ============================================

export const getEntityById = async (
  tenantId: string,
  entityId: EntityId
): Promise<Entity | null> => {
  // Implementação
};

export const getEntities = async (
  tenantId: string,
  filters: EntityFilters,
  pagination: PaginationOptions
): Promise<PaginatedResult<Entity>> => {
  // Implementação
};

// ============================================
// UPDATE
// ============================================

export const updateEntity = async (
  tenantId: string,
  entityId: EntityId,
  data: UpdateEntityDto,
  userId: string
): Promise<Entity> => {
  // Implementação
};

// ============================================
// DELETE
// ============================================

export const deleteEntity = async (
  tenantId: string,
  entityId: EntityId,
  userId: string
): Promise<void> => {
  // Implementação (soft delete preferencial)
};

// ============================================
// AGGREGATIONS
// ============================================

export const getEntityTotals = async (
  tenantId: string,
  filters: EntityFilters
): Promise<EntitySummary> => {
  // Implementação
};
```

---

## 🎨 Padrões de Implementação

### 1. Mapeamento de Dados

```typescript
/**
 * Mapeia documento do banco para entidade TypeScript
 * Converte snake_case → camelCase
 */
const mapDocToSale = (doc: any): Sale => {
  return {
    id: doc.id,
    tenantId: doc.tenant_id,
    branchId: doc.branch_id,
    clientId: doc.client_id,
    status: doc.status,
    grossTotalCents: doc.gross_total_cents,
    discountCents: doc.discount_cents || 0,
    netTotalCents: doc.net_total_cents,
    items: doc.items || [],
    payments: doc.payments || [],
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    notes: doc.notes,
    tags: doc.tags || [],
    metadata: doc.metadata
  };
};

/**
 * Mapeia entidade TypeScript para documento do banco
 * Converte camelCase → snake_case
 */
const mapSaleToDoc = (sale: Partial<Sale>): Record<string, any> => {
  const doc: Record<string, any> = {};
  
  if (sale.tenantId !== undefined) doc.tenant_id = sale.tenantId;
  if (sale.branchId !== undefined) doc.branch_id = sale.branchId;
  if (sale.clientId !== undefined) doc.client_id = sale.clientId;
  if (sale.status !== undefined) doc.status = sale.status;
  if (sale.grossTotalCents !== undefined) doc.gross_total_cents = sale.grossTotalCents;
  if (sale.discountCents !== undefined) doc.discount_cents = sale.discountCents;
  if (sale.netTotalCents !== undefined) doc.net_total_cents = sale.netTotalCents;
  if (sale.items !== undefined) doc.items = sale.items;
  if (sale.payments !== undefined) doc.payments = sale.payments;
  if (sale.notes !== undefined) doc.notes = sale.notes;
  if (sale.tags !== undefined) doc.tags = sale.tags;
  if (sale.metadata !== undefined) doc.metadata = sale.metadata;
  
  return doc;
};
```

### 2. CREATE - Inserção

```typescript
/**
 * Cria uma nova venda no banco de dados
 * 
 * @param tenantId - ID do tenant (multi-tenancy)
 * @param data - Dados da venda
 * @returns Venda criada com ID gerado
 * @throws {DatabaseError} Se houver erro na criação
 * 
 * @example
 * ```typescript
 * const sale = await createSale('tenant-123', {
 *   branchId: 'branch-456',
 *   clientId: 'client-789',
 *   items: [...]
 * });
 * ```
 */
export const createSale = async (
  tenantId: string,
  data: CreateSaleDto
): Promise<Sale> => {
  try {
    const db = getDatabase();
    
    // Preparar documento
    const doc = {
      ...mapSaleToDoc(data as any),
      tenant_id: tenantId,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Inserir no banco
    const { data: created, error } = await db
      .from('sales')
      .insert(doc)
      .select()
      .single();
    
    if (error) throw error;
    
    // Retornar entidade mapeada
    return mapDocToSale(created);
  } catch (error) {
    throw new DatabaseError('Erro ao criar venda', { cause: error });
  }
};
```

### 3. READ - Busca por ID

```typescript
/**
 * Busca uma venda por ID
 * 
 * @param tenantId - ID do tenant
 * @param saleId - ID da venda
 * @returns Venda encontrada ou null se não existir
 * @throws {DatabaseError} Se houver erro na busca
 */
export const getSaleById = async (
  tenantId: string,
  saleId: SaleId
): Promise<Sale | null> => {
  try {
    const db = getDatabase();
    
    const { data, error } = await db
      .from('sales')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', saleId)
      .single();
    
    if (error) {
      // Erro PGRST116 = Not Found (Supabase/PostgREST)
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return data ? mapDocToSale(data) : null;
  } catch (error) {
    throw new DatabaseError('Erro ao buscar venda', { cause: error });
  }
};
```

### 4. READ - Busca com Filtros e Paginação

```typescript
/**
 * Busca vendas com filtros e paginação
 * 
 * @param tenantId - ID do tenant
 * @param filters - Filtros de busca
 * @param pagination - Opções de paginação
 * @returns Resultado paginado com vendas
 * @throws {DatabaseError} Se houver erro na busca
 */
export const getSales = async (
  tenantId: string,
  filters: SaleFilters = {},
  pagination: PaginationOptions = { page: 1, pageSize: 50 }
): Promise<PaginatedResult<Sale>> => {
  try {
    const db = getDatabase();
    
    // Query base com count
    let query = db
      .from('sales')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);
    
    // Aplicar filtros
    if (filters.branchId) {
      query = query.eq('branch_id', filters.branchId);
    }
    
    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }
    
    if (filters.startDate) {
      query = query.gte('date_key', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('date_key', filters.endDate);
    }
    
    if (filters.minAmount !== undefined) {
      query = query.gte('net_total_cents', filters.minAmount);
    }
    
    if (filters.maxAmount !== undefined) {
      query = query.lte('net_total_cents', filters.maxAmount);
    }
    
    if (filters.search) {
      // Busca textual (depende do banco)
      query = query.or(`notes.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
    }
    
    // Ordenação
    const orderBy = pagination.orderBy || 'created_at';
    const orderDirection = pagination.orderDirection || 'desc';
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });
    
    // Paginação
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);
    
    // Executar query
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Calcular metadados de paginação
    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / pagination.pageSize);
    
    return {
      data: (data || []).map(mapDocToSale),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPreviousPage: pagination.page > 1
      }
    };
  } catch (error) {
    throw new DatabaseError('Erro ao buscar vendas', { cause: error });
  }
};
```

### 5. UPDATE - Atualização

```typescript
/**
 * Atualiza uma venda existente
 * 
 * @param tenantId - ID do tenant
 * @param saleId - ID da venda
 * @param data - Dados para atualização (parcial)
 * @param userId - ID do usuário que está atualizando
 * @returns Venda atualizada
 * @throws {NotFoundError} Se venda não existir
 * @throws {DatabaseError} Se houver erro na atualização
 */
export const updateSale = async (
  tenantId: string,
  saleId: SaleId,
  data: UpdateSaleDto,
  userId: string
): Promise<Sale> => {
  try {
    const db = getDatabase();
    
    // Preparar documento de atualização
    const doc = {
      ...mapSaleToDoc(data as any),
      updated_at: new Date().toISOString(),
      updated_by: userId
    };
    
    // Atualizar no banco
    const { data: updated, error } = await db
      .from('sales')
      .update(doc)
      .eq('tenant_id', tenantId)
      .eq('id', saleId)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Venda não encontrada');
      }
      throw error;
    }
    
    return mapDocToSale(updated);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new DatabaseError('Erro ao atualizar venda', { cause: error });
  }
};
```

### 6. DELETE - Remoção (Soft Delete)

```typescript
/**
 * Remove uma venda (soft delete)
 * Marca como cancelada ao invés de deletar fisicamente
 * 
 * @param tenantId - ID do tenant
 * @param saleId - ID da venda
 * @param userId - ID do usuário que está deletando
 * @throws {NotFoundError} Se venda não existir
 * @throws {DatabaseError} Se houver erro na deleção
 */
export const deleteSale = async (
  tenantId: string,
  saleId: SaleId,
  userId: string
): Promise<void> => {
  try {
    const db = getDatabase();
    
    // Soft delete - marcar como cancelada
    const { error } = await db
      .from('sales')
      .update({
        status: 'canceled',
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .eq('id', saleId);
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Venda não encontrada');
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new DatabaseError('Erro ao deletar venda', { cause: error });
  }
};

/**
 * Remove permanentemente uma venda (hard delete)
 * ⚠️ Use com cautela - dados não podem ser recuperados
 */
export const hardDeleteSale = async (
  tenantId: string,
  saleId: SaleId
): Promise<void> => {
  try {
    const db = getDatabase();
    
    const { error } = await db
      .from('sales')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', saleId);
    
    if (error) throw error;
  } catch (error) {
    throw new DatabaseError('Erro ao deletar venda permanentemente', { cause: error });
  }
};
```

### 7. AGGREGATIONS - Agregações

```typescript
/**
 * Calcula totais de vendas por período
 * 
 * @param tenantId - ID do tenant
 * @param branchId - ID da branch
 * @param startDate - Data inicial (YYYY-MM-DD)
 * @param endDate - Data final (YYYY-MM-DD)
 * @returns Totais calculados
 * @throws {DatabaseError} Se houver erro no cálculo
 */
export const getSalesTotals = async (
  tenantId: string,
  branchId: string,
  startDate: string,
  endDate: string
): Promise<{
  totalSales: number;
  totalRevenueCents: number;
  totalDiscountCents: number;
  averageTicketCents: number;
}> => {
  try {
    const db = getDatabase();
    
    // Buscar vendas do período
    const { data, error } = await db
      .from('sales')
      .select('net_total_cents, discount_cents')
      .eq('tenant_id', tenantId)
      .eq('branch_id', branchId)
      .gte('date_key', startDate)
      .lte('date_key', endDate)
      .neq('status', 'canceled');
    
    if (error) throw error;
    
    // Calcular agregações
    const totalSales = data?.length || 0;
    const totalRevenueCents = data?.reduce((sum, sale) => 
      sum + (sale.net_total_cents || 0), 0
    ) || 0;
    const totalDiscountCents = data?.reduce((sum, sale) => 
      sum + (sale.discount_cents || 0), 0
    ) || 0;
    const averageTicketCents = totalSales > 0 
      ? Math.round(totalRevenueCents / totalSales) 
      : 0;
    
    return {
      totalSales,
      totalRevenueCents,
      totalDiscountCents,
      averageTicketCents
    };
  } catch (error) {
    throw new DatabaseError('Erro ao calcular totais', { cause: error });
  }
};

/**
 * Agrupa vendas por status
 */
export const getSalesByStatus = async (
  tenantId: string,
  branchId: string,
  startDate: string,
  endDate: string
): Promise<Record<SaleStatus, number>> => {
  try {
    const db = getDatabase();
    
    const { data, error } = await db
      .from('sales')
      .select('status')
      .eq('tenant_id', tenantId)
      .eq('branch_id', branchId)
      .gte('date_key', startDate)
      .lte('date_key', endDate);
    
    if (error) throw error;
    
    // Agrupar por status
    const grouped: Record<string, number> = {};
    data?.forEach(sale => {
      grouped[sale.status] = (grouped[sale.status] || 0) + 1;
    });
    
    return grouped as Record<SaleStatus, number>;
  } catch (error) {
    throw new DatabaseError('Erro ao agrupar vendas', { cause: error });
  }
};
```

### 8. TRANSACTIONS - Transações

```typescript
/**
 * Cria uma venda com transação
 * Garante atomicidade ao criar venda + receivables + memberships
 * 
 * @param tenantId - ID do tenant
 * @param data - Dados da venda
 * @param userId - ID do usuário
 * @returns Venda criada
 * @throws {DatabaseError} Se houver erro na transação
 */
export const createSaleTransaction = async (
  tenantId: string,
  data: CreateSaleDto,
  userId: string
): Promise<Sale> => {
  const db = getDatabase();
  
  try {
    // Iniciar transação usando RPC (Supabase)
    const { data: result, error } = await db.rpc('create_sale_with_transaction', {
      p_tenant_id: tenantId,
      p_branch_id: data.branchId,
      p_client_id: data.clientId,
      p_data: JSON.stringify(data),
      p_user_id: userId
    });
    
    if (error) throw error;
    
    return mapDocToSale(result);
  } catch (error) {
    throw new DatabaseError('Erro ao criar venda com transação', { cause: error });
  }
};

// Alternativa para bancos que suportam transações nativas
export const createSaleWithTransaction = async (
  tenantId: string,
  data: CreateSaleDto,
  userId: string
): Promise<Sale> => {
  const db = getDatabase();
  
  try {
    // Iniciar transação
    await db.query('BEGIN');
    
    try {
      // 1. Criar venda
      const sale = await createSale(tenantId, data);
      
      // 2. Criar receivables
      if (data.payments) {
        // ... criar receivables
      }
      
      // 3. Atualizar estoque
      // ... atualizar estoque
      
      // Commit
      await db.query('COMMIT');
      
      return sale;
    } catch (error) {
      // Rollback em caso de erro
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    throw new DatabaseError('Erro na transação', { cause: error });
  }
};
```

---

## 🔍 Queries Especializadas

### Busca com Relacionamentos (JOIN)

```typescript
/**
 * Busca vendas com dados do cliente
 */
export const getSalesWithClients = async (
  tenantId: string,
  filters: SaleFilters
): Promise<SaleWithRelations[]> => {
  try {
    const db = getDatabase();
    
    const { data, error } = await db
      .from('sales')
      .select(`
        *,
        client:clients!client_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('tenant_id', tenantId);
    
    if (error) throw error;
    
    return (data || []).map(doc => ({
      ...mapDocToSale(doc),
      client: doc.client ? {
        id: doc.client.id,
        name: `${doc.client.first_name} ${doc.client.last_name}`,
        email: doc.client.email
      } : undefined
    }));
  } catch (error) {
    throw new DatabaseError('Erro ao buscar vendas com clientes', { cause: error });
  }
};
```

### Busca com Cursor (Infinite Scroll)

```typescript
/**
 * Busca vendas com cursor para infinite scroll
 */
export const getSalesWithCursor = async (
  tenantId: string,
  filters: SaleFilters,
  cursor?: string,
  limit: number = 50
): Promise<{
  data: Sale[];
  nextCursor: string | null;
}> => {
  try {
    const db = getDatabase();
    
    let query = db
      .from('sales')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // +1 para saber se tem próxima página
    
    if (cursor) {
      query = query.lt('created_at', cursor);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const hasMore = (data?.length || 0) > limit;
    const sales = hasMore ? data!.slice(0, -1) : data || [];
    const nextCursor = hasMore ? sales[sales.length - 1].created_at : null;
    
    return {
      data: sales.map(mapDocToSale),
      nextCursor
    };
  } catch (error) {
    throw new DatabaseError('Erro ao buscar vendas', { cause: error });
  }
};
```

### Full-Text Search

```typescript
/**
 * Busca vendas por texto completo
 */
export const searchSales = async (
  tenantId: string,
  searchTerm: string,
  limit: number = 50
): Promise<Sale[]> => {
  try {
    const db = getDatabase();
    
    const { data, error } = await db
      .from('sales')
      .select('*')
      .eq('tenant_id', tenantId)
      .textSearch('search_vector', searchTerm, {
        type: 'websearch',
        config: 'portuguese'
      })
      .limit(limit);
    
    if (error) throw error;
    
    return (data || []).map(mapDocToSale);
  } catch (error) {
    throw new DatabaseError('Erro na busca', { cause: error });
  }
};
```

---

## 🛡️ Tratamento de Erros

```typescript
import { 
  DatabaseError, 
  NotFoundError, 
  ConflictError,
  ValidationError 
} from '@/shared/utils/errors';

/**
 * Wrapper para tratamento consistente de erros
 */
const handleDatabaseError = (error: any, operation: string): never => {
  // Not Found
  if (error.code === 'PGRST116') {
    throw new NotFoundError(`Registro não encontrado: ${operation}`);
  }
  
  // Unique Violation
  if (error.code === '23505') {
    throw new ConflictError(`Registro duplicado: ${operation}`);
  }
  
  // Foreign Key Violation
  if (error.code === '23503') {
    throw new ValidationError(`Referência inválida: ${operation}`);
  }
  
  // Check Violation
  if (error.code === '23514') {
    throw new ValidationError(`Dados inválidos: ${operation}`);
  }
  
  // Erro genérico
  throw new DatabaseError(`Erro no banco de dados: ${operation}`, { cause: error });
};

// Uso
export const getSaleById = async (
  tenantId: string,
  saleId: SaleId
): Promise<Sale | null> => {
  try {
    // ... query
  } catch (error) {
    handleDatabaseError(error, 'buscar venda');
  }
};
```

---

## ⚡ Performance e Otimização

### 1. Índices
```sql
-- Criar índices para queries frequentes
CREATE INDEX idx_sales_tenant_branch ON sales(tenant_id, branch_id);
CREATE INDEX idx_sales_client ON sales(client_id);
CREATE INDEX idx_sales_date_key ON sales(date_key);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
```

### 2. Select Específico
```typescript
// ❌ Evitar select *
const { data } = await db.from('sales').select('*');

// ✅ Selecionar apenas campos necessários
const { data } = await db
  .from('sales')
  .select('id, client_id, status, net_total_cents, created_at');
```

### 3. Batch Operations
```typescript
/**
 * Cria múltiplas vendas em batch
 */
export const createSalesBatch = async (
  tenantId: string,
  sales: CreateSaleDto[]
): Promise<Sale[]> => {
  try {
    const db = getDatabase();
    
    const docs = sales.map(sale => ({
      ...mapSaleToDoc(sale as any),
      tenant_id: tenantId,
      created_at: new Date().toISOString()
    }));
    
    const { data, error } = await db
      .from('sales')
      .insert(docs)
      .select();
    
    if (error) throw error;
    
    return (data || []).map(mapDocToSale);
  } catch (error) {
    throw new DatabaseError('Erro ao criar vendas em lote', { cause: error });
  }
};
```

---

## ✅ Checklist

Ao criar `{module}.db.ts`:

- [ ] Funções CRUD implementadas
- [ ] Mapeamento entre banco e entidades
- [ ] Tratamento de erros adequado
- [ ] Documentação JSDoc completa
- [ ] Validação de tenantId em todas as queries
- [ ] Paginação implementada
- [ ] Soft delete ao invés de hard delete
- [ ] Queries otimizadas (índices, select específico)
- [ ] Transações para operações críticas
- [ ] Sem lógica de negócio
- [ ] Sem validações (apenas de tipos)

---

## 📚 Exemplos Completos

Ver exemplos em:
- `/examples/modules/sales/sales.db.ts`
- `/examples/modules/clients/clients.db.ts`
