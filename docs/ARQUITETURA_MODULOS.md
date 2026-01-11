# 🏗️ Arquitetura de Módulos - Guia Completo

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Anatomia de um Módulo](#anatomia-de-um-módulo)
4. [Arquivos Obrigatórios](#arquivos-obrigatórios)
5. [Padrões e Convenções](#padrões-e-convenções)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Integração entre Módulos](#integração-entre-módulos)
8. [Checklist de Qualidade](#checklist-de-qualidade)

---

## 🎯 Visão Geral

Esta documentação define a **arquitetura padrão para módulos** em projetos escaláveis. Cada módulo representa uma **entidade de negócio** ou **domínio funcional** isolado, com responsabilidades bem definidas.

### Princípios Fundamentais

1. **Separação de Responsabilidades**: Cada arquivo tem um propósito único
2. **Isolamento**: Módulos não devem ter dependências circulares
3. **Testabilidade**: Toda lógica deve ser testável isoladamente
4. **Consistência**: Todos os módulos seguem a mesma estrutura
5. **Escalabilidade**: Fácil adicionar novos módulos sem afetar existentes

---

## 📁 Estrutura de Pastas

```
src/
├── modules/                    # Módulos de negócio
│   ├── {module}/              # Um módulo por entidade
│   │   ├── {module}.types.ts      # ✅ Tipos e interfaces
│   │   ├── {module}.db.ts         # ✅ Operações de banco de dados
│   │   ├── {module}.domain.ts     # ✅ Regras de negócio
│   │   ├── {module}.validation.ts # ✅ Validações
│   │   ├── {module}.cache.ts      # 🔶 Cache (opcional)
│   │   ├── {module}.hooks.ts      # 🔶 React hooks (opcional)
│   │   ├── {module}.functions.ts  # 🔶 Cloud/Edge Functions (opcional)
│   │   ├── __tests__/             # 🔶 Testes unitários
│   │   └── index.ts               # ✅ Export barrel
│   │
├── services/                   # Serviços externos e infraestrutura
│   ├── database/
│   ├── cache/
│   ├── auth/
│   └── monitoring/
│
├── shared/                     # Código compartilhado
│   ├── types/
│   ├── utils/
│   ├── constants/
│   └── hooks/
│
└── functions/                  # Cloud/Edge Functions
    ├── triggers/
    ├── scheduled/
    └── http/
```

---

## 🧩 Anatomia de um Módulo

Cada módulo é **autocontido** e segue esta estrutura:

```
modules/
└── sales/                     # Exemplo: Módulo de Vendas
    ├── sales.types.ts         # Tipos, interfaces, enums
    ├── sales.db.ts            # CRUD e queries
    ├── sales.domain.ts        # Lógica de negócio
    ├── sales.validation.ts    # Validações de dados
    ├── sales.cache.ts         # Estratégias de cache
    ├── sales.hooks.ts         # React hooks (frontend)
    ├── sales.functions.ts     # Cloud Functions (backend)
    ├── __tests__/             # Testes
    └── index.ts               # Exports públicos
```

---

## 📄 Arquivos Obrigatórios

Veja os arquivos detalhados em:
- [MODULO_TYPES.md](./MODULO_TYPES.md) - Estrutura de tipos
- [MODULO_DB.md](./MODULO_DB.md) - Operações de banco
- [MODULO_DOMAIN.md](./MODULO_DOMAIN.md) - Regras de negócio
- [MODULO_VALIDATION.md](./MODULO_VALIDATION.md) - Validações
- [MODULO_CACHE.md](./MODULO_CACHE.md) - Cache
- [MODULO_HOOKS.md](./MODULO_HOOKS.md) - React Hooks
- [MODULO_FUNCTIONS.md](./MODULO_FUNCTIONS.md) - Cloud Functions

---

## 🎨 Padrões e Convenções

### Nomenclatura

- **Módulos**: `camelCase` (ex: `sales`, `clients`, `memberships`)
- **Arquivos**: `{module}.{type}.ts` (ex: `sales.db.ts`)
- **Tipos**: `PascalCase` (ex: `Sale`, `CreateSaleDto`)
- **Funções**: `camelCase` (ex: `getSaleById`, `createSale`)
- **Constantes**: `UPPER_SNAKE_CASE` (ex: `MAX_ITEMS`, `DEFAULT_TTL`)

### Imports

```typescript
// ✅ Correto - Ordem de imports
import { external } from 'external-lib';           // 1. Externos
import { shared } from '@/shared/utils';           // 2. Shared
import { service } from '@/services/database';     // 3. Services
import { otherModule } from '@/modules/other';     // 4. Outros módulos
import type { Type } from './module.types';        // 5. Tipos locais
import { local } from './module.domain';           // 6. Funções locais
```

### Exports

```typescript
// index.ts - Export barrel
// ✅ Exportar apenas o necessário
export type { Sale, CreateSaleDto, UpdateSaleDto } from './sales.types';
export { getSaleById, getSales, createSale } from './sales.db';
export { calculateSaleTotals, prepareSaleData } from './sales.domain';
export { validateCreateSale } from './sales.validation';
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Módulo Simples (CRUD Básico)

```
modules/tags/
├── tags.types.ts       # Tag, CreateTagDto
├── tags.db.ts          # CRUD operations
├── tags.domain.ts      # Normalização, validações
├── tags.validation.ts  # Schemas Zod
└── index.ts            # Exports
```

### Exemplo 2: Módulo Complexo (Com Agregações)

```
modules/sales/
├── sales.types.ts         # Sale, DTOs, Filters
├── sales.db.ts            # CRUD + Aggregations
├── sales.domain.ts        # Cálculos, transformações
├── sales.validation.ts    # Validações complexas
├── sales.cache.ts         # Cache strategies
├── sales.hooks.ts         # useSale, useSales
├── sales.functions.ts     # Cloud Functions triggers
├── __tests__/
│   ├── sales.db.test.ts
│   ├── sales.domain.test.ts
│   └── sales.validation.test.ts
└── index.ts
```

### Exemplo 3: Módulo com Relacionamentos

```
modules/memberships/
├── memberships.types.ts
├── memberships.db.ts
├── memberships.domain.ts
├── memberships.validation.ts
├── memberships.cache.ts
├── memberships.lifecycle.ts    # Lógica de ciclo de vida
├── memberships.notifications.ts # Notificações
└── index.ts
```

---

## 🔗 Integração entre Módulos

### Regras de Dependência

```
✅ PERMITIDO:
modules/sales → modules/clients (buscar dados do cliente)
modules/sales → services/database (acessar banco)
modules/sales → shared/utils (usar utilitários)

❌ PROIBIDO:
modules/sales ↔ modules/invoices (dependência circular)
modules/sales → components/SaleCard (módulo não deve conhecer UI)
```

### Padrão de Integração

```typescript
// ✅ Correto - Importar apenas tipos e funções necessárias
import type { Client } from '@/modules/clients';
import { getClientById } from '@/modules/clients';

export const getSaleWithClient = async (saleId: string) => {
  const sale = await getSaleById(saleId);
  const client = await getClientById(sale.clientId);
  
  return { ...sale, client };
};
```

---

## ✅ Checklist de Qualidade

### Ao criar um novo módulo:

- [ ] Todos os arquivos obrigatórios criados (`.types`, `.db`, `.domain`, `.validation`)
- [ ] Export barrel (`index.ts`) configurado
- [ ] Tipos bem documentados com JSDoc
- [ ] Validações implementadas com Zod
- [ ] Funções de banco retornam tipos corretos
- [ ] Lógica de negócio separada de acesso a dados
- [ ] Testes unitários para `.domain` e `.validation`
- [ ] Testes de integração para `.db`
- [ ] Cache implementado para queries frequentes
- [ ] Documentação atualizada
- [ ] Sem dependências circulares
- [ ] Sem lógica de UI em módulos de backend

### Code Review:

- [ ] Nomenclatura consistente
- [ ] Imports organizados
- [ ] Erros tratados adequadamente
- [ ] Logs implementados
- [ ] Performance otimizada
- [ ] Segurança validada (permissões, sanitização)

---

## 📚 Próximos Passos

1. Leia os guias detalhados de cada arquivo
2. Veja exemplos completos na pasta `/examples`
3. Use os templates em `/templates` para criar novos módulos
4. Consulte o guia de testes em `/docs/TESTES.md`

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2026
