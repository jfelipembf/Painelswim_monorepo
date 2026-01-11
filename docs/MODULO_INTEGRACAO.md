# 🔗 Guia: Integração entre Módulos

## 🎯 Objetivo

Este guia define como módulos devem se comunicar e integrar entre si, mantendo baixo acoplamento e alta coesão.

---

## 📐 Princípios de Integração

### 1. Dependências Unidirecionais

```
✅ CORRETO - Fluxo unidirecional
modules/sales → modules/clients (buscar dados do cliente)
modules/sales → modules/products (buscar dados do produto)
modules/memberships → modules/clients (atualizar status)

❌ ERRADO - Dependência circular
modules/sales ↔ modules/invoices
modules/clients ↔ modules/memberships
```

### 2. Camadas de Dependência

```
┌─────────────────────────────────────┐
│         UI Components               │
│  (pages, components, layouts)       │
└──────────────┬──────────────────────┘
               │ usa
┌──────────────▼──────────────────────┐
│         Custom Hooks                │
│  (useEntity, useEntityList)         │
└──────────────┬──────────────────────┘
               │ usa
┌──────────────▼──────────────────────┐
│         Modules                     │
│  (entity.db, entity.domain)         │
└──────────────┬──────────────────────┘
               │ usa
┌──────────────▼──────────────────────┐
│         Services                    │
│  (database, cache, auth)            │
└─────────────────────────────────────┘
```

---

## 🎨 Padrões de Integração

### 1. Importar Apenas o Necessário

```typescript
// ✅ CORRETO - Importar apenas tipos e funções necessárias
import type { Client } from '@/modules/clients';
import { getClientById } from '@/modules/clients';

// ❌ ERRADO - Importar tudo
import * as Clients from '@/modules/clients';
```

### 2. Usar Tipos, Não Implementações

```typescript
// ✅ CORRETO - Depender de tipos
import type { Client, ClientId } from '@/modules/clients';

export interface Sale {
  id: string;
  clientId: ClientId;  // Tipo do módulo clients
  // ...
}

// ❌ ERRADO - Depender de implementação
import { Client } from '@/modules/clients';

export interface Sale {
  id: string;
  client: Client;  // Objeto completo - alto acoplamento
}
```

### 3. Composição ao Invés de Herança

```typescript
// ✅ CORRETO - Composição
export const getSaleWithClient = async (saleId: string) => {
  const sale = await getSaleById(saleId);
  const client = await getClientById(sale.clientId);
  
  return {
    ...sale,
    client
  };
};

// ❌ ERRADO - Herança/Mixagem
export interface SaleWithClient extends Sale, Client {
  // Mistura responsabilidades
}
```

---

## 🔄 Padrões de Comunicação

### 1. Agregação de Dados (Read)

**Cenário**: Buscar venda com dados do cliente

```typescript
// modules/sales/sales.db.ts
import type { Client } from '@/modules/clients';
import { getClientById } from '@/modules/clients';

/**
 * Busca venda com dados do cliente
 */
export const getSaleWithClient = async (
  tenantId: string,
  saleId: string
): Promise<Sale & { client: Client | null }> => {
  // 1. Buscar venda
  const sale = await getSaleById(tenantId, saleId);
  if (!sale) return null;
  
  // 2. Buscar cliente
  const client = await getClientById(tenantId, sale.clientId);
  
  // 3. Compor resultado
  return {
    ...sale,
    client
  };
};
```

### 2. Atualização em Cascata (Write)

**Cenário**: Criar venda e atualizar estoque

```typescript
// modules/sales/sales.db.ts
import { updateProductStock } from '@/modules/products';

/**
 * Cria venda e atualiza estoque
 */
export const createSaleWithStockUpdate = async (
  tenantId: string,
  data: CreateSaleDto,
  userId: string
): Promise<Sale> => {
  const db = getDatabase();
  
  try {
    // Iniciar transação
    await db.query('BEGIN');
    
    // 1. Criar venda
    const sale = await createSale(tenantId, data);
    
    // 2. Atualizar estoque de cada produto
    for (const item of data.items) {
      if (item.type === 'product' && item.productId) {
        await updateProductStock(
          tenantId,
          item.productId,
          -item.quantity, // Reduzir estoque
          userId
        );
      }
    }
    
    // Commit
    await db.query('COMMIT');
    
    return sale;
  } catch (error) {
    // Rollback em caso de erro
    await db.query('ROLLBACK');
    throw error;
  }
};
```

### 3. Eventos e Notificações

**Cenário**: Notificar quando venda é criada

```typescript
// modules/sales/sales.db.ts
import { publishEvent } from '@/services/events';

export const createSale = async (
  tenantId: string,
  data: CreateSaleDto
): Promise<Sale> => {
  // Criar venda
  const sale = await insertSale(tenantId, data);
  
  // Publicar evento
  await publishEvent({
    type: 'sale.created',
    tenantId,
    data: {
      saleId: sale.id,
      clientId: sale.clientId,
      totalCents: sale.netTotalCents
    }
  });
  
  return sale;
};

// modules/notifications/notifications.functions.ts
import { subscribeToEvent } from '@/services/events';

// Listener para evento de venda criada
subscribeToEvent('sale.created', async (event) => {
  // Enviar notificação ao cliente
  await sendNotification({
    userId: event.data.clientId,
    type: 'sale_confirmation',
    data: event.data
  });
});
```

---

## 🎯 Casos de Uso Comuns

### 1. Buscar Entidade com Relacionamentos

```typescript
// modules/sales/sales.queries.ts
import type { Client } from '@/modules/clients';
import type { Product } from '@/modules/products';
import { getClientById } from '@/modules/clients';
import { getProductsByIds } from '@/modules/products';

export interface SaleWithRelations extends Sale {
  client?: Client;
  products?: Product[];
}

/**
 * Busca venda com todos os relacionamentos
 */
export const getSaleWithRelations = async (
  tenantId: string,
  saleId: string
): Promise<SaleWithRelations | null> => {
  // 1. Buscar venda
  const sale = await getSaleById(tenantId, saleId);
  if (!sale) return null;
  
  // 2. Buscar relacionamentos em paralelo
  const [client, products] = await Promise.all([
    getClientById(tenantId, sale.clientId),
    getProductsByIds(
      tenantId,
      sale.items
        .filter(item => item.type === 'product' && item.productId)
        .map(item => item.productId!)
    )
  ]);
  
  return {
    ...sale,
    client: client || undefined,
    products
  };
};
```

### 2. Validação Cross-Module

```typescript
// modules/sales/sales.domain.ts
import { getClientById } from '@/modules/clients';
import { getProductById } from '@/modules/products';

/**
 * Valida se venda pode ser criada
 */
export const validateSaleCreation = async (
  tenantId: string,
  data: CreateSaleDto
): Promise<void> => {
  // 1. Validar cliente existe e está ativo
  const client = await getClientById(tenantId, data.clientId);
  if (!client) {
    throw new ValidationError('Cliente não encontrado');
  }
  if (client.status !== 'active') {
    throw new ValidationError('Cliente não está ativo');
  }
  
  // 2. Validar produtos existem e têm estoque
  for (const item of data.items) {
    if (item.type === 'product' && item.productId) {
      const product = await getProductById(tenantId, item.productId);
      if (!product) {
        throw new ValidationError(`Produto ${item.productId} não encontrado`);
      }
      if (product.stock < item.quantity) {
        throw new ValidationError(
          `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}`
        );
      }
    }
  }
};
```

### 3. Agregação de Métricas

```typescript
// modules/dashboard/dashboard.domain.ts
import { getSales } from '@/modules/sales';
import { getClients } from '@/modules/clients';
import { getMemberships } from '@/modules/memberships';

/**
 * Calcula métricas do dashboard
 */
export const calculateDashboardMetrics = async (
  tenantId: string,
  branchId: string,
  startDate: string,
  endDate: string
): Promise<DashboardMetrics> => {
  // Buscar dados em paralelo
  const [sales, clients, memberships] = await Promise.all([
    getSales(tenantId, { branchId, startDate, endDate }),
    getClients(tenantId, { branchId, status: 'active' }),
    getMemberships(tenantId, { branchId, status: 'active' })
  ]);
  
  // Calcular métricas
  return {
    totalRevenue: sales.reduce((sum, s) => sum + s.netTotalCents, 0),
    totalSales: sales.length,
    activeClients: clients.length,
    activeMemberships: memberships.length,
    averageTicket: sales.length > 0 
      ? sales.reduce((sum, s) => sum + s.netTotalCents, 0) / sales.length 
      : 0
  };
};
```

### 4. Sincronização de Status

```typescript
// modules/memberships/memberships.domain.ts
import { updateClient } from '@/modules/clients';

/**
 * Ativa membership e atualiza status do cliente
 */
export const activateMembership = async (
  tenantId: string,
  membershipId: string,
  userId: string
): Promise<void> => {
  // 1. Buscar membership
  const membership = await getMembershipById(tenantId, membershipId);
  if (!membership) {
    throw new NotFoundError('Membership não encontrada');
  }
  
  // 2. Atualizar membership
  await updateMembership(
    tenantId,
    membershipId,
    { status: 'active' },
    userId
  );
  
  // 3. Atualizar cliente
  await updateClient(
    tenantId,
    membership.clientId,
    { 
      status: 'active',
      activeMembershipId: membershipId
    },
    userId
  );
};
```

---

## 🚫 Anti-Padrões

### ❌ 1. Dependência Circular

```typescript
// ❌ ERRADO
// modules/sales/sales.db.ts
import { updateInvoice } from '@/modules/invoices';

// modules/invoices/invoices.db.ts
import { getSaleById } from '@/modules/sales';

// Solução: Criar módulo intermediário ou usar eventos
```

### ❌ 2. God Module

```typescript
// ❌ ERRADO - Módulo que conhece tudo
// modules/sales/sales.db.ts
import { getClient } from '@/modules/clients';
import { getProduct } from '@/modules/products';
import { getMembership } from '@/modules/memberships';
import { getInvoice } from '@/modules/invoices';
import { getPayment } from '@/modules/payments';
// ... muitas dependências

// Solução: Criar queries específicas ou usar camada de agregação
```

### ❌ 3. Acoplamento por Implementação

```typescript
// ❌ ERRADO - Depender de detalhes de implementação
import { ClientsCache } from '@/modules/clients/clients.cache';

// ✅ CORRETO - Depender de interface pública
import { getClientById } from '@/modules/clients';
```

### ❌ 4. Modificação Direta de Outro Módulo

```typescript
// ❌ ERRADO - Modificar dados de outro módulo diretamente
const client = await getClientById(tenantId, clientId);
client.status = 'active'; // Modificação direta
await saveClient(client);

// ✅ CORRETO - Usar função pública do módulo
await updateClient(tenantId, clientId, { status: 'active' }, userId);
```

---

## 🎯 Boas Práticas

### 1. Interface de Serviço

```typescript
// modules/sales/sales.service.ts
/**
 * Interface pública do módulo Sales
 * Outros módulos devem usar apenas estas funções
 */
export const SalesService = {
  // Queries
  getById: getSaleById,
  list: getSales,
  getByClient: getSalesByClient,
  
  // Commands
  create: createSale,
  update: updateSale,
  cancel: cancelSale,
  
  // Business Logic
  calculateTotals: calculateSaleTotals,
  validateCreation: validateSaleCreation
};
```

### 2. DTOs para Comunicação

```typescript
// modules/sales/sales.types.ts
/**
 * DTO para criar venda a partir de outro módulo
 */
export interface CreateSaleFromMembershipDto {
  membershipId: string;
  clientId: string;
  planId: string;
  priceCents: number;
}

// modules/memberships/memberships.domain.ts
import type { CreateSaleFromMembershipDto } from '@/modules/sales';
import { createSale } from '@/modules/sales';

export const createMembershipSale = async (
  tenantId: string,
  membershipData: MembershipData
): Promise<Sale> => {
  const saleDto: CreateSaleFromMembershipDto = {
    membershipId: membershipData.id,
    clientId: membershipData.clientId,
    planId: membershipData.planId,
    priceCents: membershipData.priceCents
  };
  
  return createSale(tenantId, saleDto);
};
```

### 3. Eventos para Desacoplamento

```typescript
// services/events/eventBus.ts
type EventHandler<T = any> = (event: Event<T>) => Promise<void>;

interface Event<T = any> {
  type: string;
  tenantId: string;
  data: T;
  timestamp: string;
}

class EventBus {
  private handlers = new Map<string, EventHandler[]>();
  
  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }
  
  async publish(event: Event): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(handlers.map(handler => handler(event)));
  }
}

export const eventBus = new EventBus();

// modules/sales/sales.db.ts
import { eventBus } from '@/services/events';

export const createSale = async (
  tenantId: string,
  data: CreateSaleDto
): Promise<Sale> => {
  const sale = await insertSale(tenantId, data);
  
  // Publicar evento
  await eventBus.publish({
    type: 'sale.created',
    tenantId,
    data: sale,
    timestamp: new Date().toISOString()
  });
  
  return sale;
};

// modules/inventory/inventory.listeners.ts
import { eventBus } from '@/services/events';

// Listener desacoplado
eventBus.subscribe('sale.created', async (event) => {
  // Atualizar estoque quando venda é criada
  await updateInventoryFromSale(event.data);
});
```

---

## 📊 Diagrama de Dependências

```
┌─────────────────────────────────────────────────────────┐
│                     UI Layer                            │
│  (Components, Pages, Layouts)                           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Hooks Layer                            │
│  (useEntity, useEntityList, useEntityForm)              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                 Modules Layer                           │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Sales   │─▶│ Clients  │  │ Products │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│       │             ▲              ▲                    │
│       │             │              │                    │
│       ▼             │              │                    │
│  ┌──────────┐      │              │                    │
│  │Invoices  │──────┘              │                    │
│  └──────────┘                     │                    │
│       │                           │                    │
│       ▼                           │                    │
│  ┌──────────┐                    │                    │
│  │Payments  │────────────────────┘                    │
│  └──────────┘                                          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                Services Layer                           │
│  (Database, Cache, Auth, Events, Monitoring)            │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Integração

Ao integrar módulos:

- [ ] Dependências são unidirecionais
- [ ] Importar apenas tipos e funções necessárias
- [ ] Usar tipos ao invés de implementações
- [ ] Validar dados antes de passar para outro módulo
- [ ] Tratar erros de outros módulos
- [ ] Documentar dependências
- [ ] Evitar dependências circulares
- [ ] Usar eventos para desacoplamento quando apropriado
- [ ] Criar DTOs específicos para comunicação
- [ ] Testar integração

---

## 📚 Exemplos Completos

Ver exemplos em:
- `/examples/integration/sales-with-clients.ts`
- `/examples/integration/membership-activation.ts`
- `/examples/integration/dashboard-aggregation.ts`
