# 📚 Documentação da Arquitetura de Módulos

## 🎯 Visão Geral

Esta documentação define a arquitetura padrão para desenvolvimento de módulos em projetos escaláveis. O objetivo é garantir **consistência**, **manutenibilidade** e **qualidade** em todo o código.

---

## 📖 Documentos Disponíveis

### 1. [Arquitetura de Módulos](./ARQUITETURA_MODULOS.md)
Documento principal que explica a estrutura geral, princípios e organização de pastas.

**Leia primeiro este documento para entender:**
- Estrutura completa de pastas
- Anatomia de um módulo
- Princípios fundamentais
- Padrões de nomenclatura
- Checklist de qualidade

---

### 2. [Guia: {module}.types.ts](./MODULO_TYPES.md)
Como definir tipos, interfaces e enums do módulo.

**Aprenda:**
- ✅ Estrutura de tipos e interfaces
- ✅ DTOs (Create, Update, Filters)
- ✅ Convenções de nomenclatura
- ✅ Documentação JSDoc
- ✅ Tipos de relacionamentos
- ✅ Utility types

**Exemplo:**
```typescript
export interface Sale {
  id: SaleId;
  status: SaleStatus;
  clientId: ClientId;
  items: SaleItem[];
  grossTotalCents: number;
  netTotalCents: number;
  createdAt: string;
}

export interface CreateSaleDto {
  clientId: ClientId;
  items: Omit<SaleItem, 'id'>[];
  discountCents?: number;
}
```

---

### 3. [Guia: {module}.db.ts](./MODULO_DB.md)
Como implementar operações de banco de dados.

**Aprenda:**
- ✅ Funções CRUD completas
- ✅ Queries com filtros e paginação
- ✅ Mapeamento de dados (snake_case ↔ camelCase)
- ✅ Tratamento de erros
- ✅ Transações
- ✅ Agregações
- ✅ Performance e otimização

**Exemplo:**
```typescript
export const getSales = async (
  tenantId: string,
  filters: SaleFilters = {},
  pagination: PaginationOptions = { page: 1, pageSize: 50 }
): Promise<PaginatedResult<Sale>> => {
  // Implementação com filtros, ordenação e paginação
};
```

---

### 4. [Guia: {module}.domain.ts](./MODULO_DOMAIN.md)
Como implementar lógica de negócio.

**Aprenda:**
- ✅ Cálculos e fórmulas
- ✅ Transformações de dados
- ✅ Validações de negócio
- ✅ Máquinas de estado
- ✅ Agregações e análises
- ✅ Funções puras

**Exemplo:**
```typescript
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
  // Implementação de cálculos
};
```

---

### 5. [Guia: {module}.validation.ts](./MODULO_VALIDATION.md)
Como validar dados de entrada com Zod.

**Aprenda:**
- ✅ Schemas Zod completos
- ✅ Validações de formato
- ✅ Validações customizadas
- ✅ Mensagens de erro em português
- ✅ Tratamento de erros
- ✅ Testes de validação

**Exemplo:**
```typescript
export const CreateSaleDtoSchema = z.object({
  clientId: z.string().uuid(),
  items: z.array(SaleItemSchema).min(1),
  discountCents: z.number().int().nonnegative().optional()
}).refine(
  (data) => {
    const total = calculateGrossTotal(data.items);
    return data.discountCents <= total;
  },
  { message: 'Desconto não pode ser maior que o total' }
);
```

---

### 6. [Guia: Integração entre Módulos](./MODULO_INTEGRACAO.md)
Como módulos devem se comunicar.

**Aprenda:**
- ✅ Dependências unidirecionais
- ✅ Padrões de comunicação
- ✅ Agregação de dados
- ✅ Eventos e notificações
- ✅ Anti-padrões a evitar
- ✅ Boas práticas

**Exemplo:**
```typescript
// ✅ CORRETO - Importar apenas o necessário
import type { Client } from '@/modules/clients';
import { getClientById } from '@/modules/clients';

export const getSaleWithClient = async (saleId: string) => {
  const sale = await getSaleById(saleId);
  const client = await getClientById(sale.clientId);
  return { ...sale, client };
};
```

---

## 🚀 Como Usar Esta Documentação

### Para Criar um Novo Módulo

1. **Leia** [ARQUITETURA_MODULOS.md](./ARQUITETURA_MODULOS.md) para entender a estrutura
2. **Crie** a pasta do módulo: `src/modules/{module}/`
3. **Implemente** os arquivos na ordem:
   - `{module}.types.ts` - Defina todos os tipos ([guia](./MODULO_TYPES.md))
   - `{module}.validation.ts` - Crie schemas de validação ([guia](./MODULO_VALIDATION.md))
   - `{module}.db.ts` - Implemente CRUD ([guia](./MODULO_DB.md))
   - `{module}.domain.ts` - Adicione lógica de negócio ([guia](./MODULO_DOMAIN.md))
   - `index.ts` - Exporte API pública
4. **Integre** com outros módulos seguindo [MODULO_INTEGRACAO.md](./MODULO_INTEGRACAO.md)
5. **Teste** todas as funções
6. **Revise** usando o checklist de qualidade

### Para Revisar Código

1. Verifique se segue a estrutura definida em [ARQUITETURA_MODULOS.md](./ARQUITETURA_MODULOS.md)
2. Valide cada arquivo usando seu guia específico
3. Verifique integrações usando [MODULO_INTEGRACAO.md](./MODULO_INTEGRACAO.md)
4. Use os checklists de qualidade de cada documento

### Para Refatorar Código Existente

1. Identifique qual arquivo precisa ser refatorado
2. Leia o guia específico daquele tipo de arquivo
3. Compare o código atual com os padrões documentados
4. Refatore seguindo os exemplos e boas práticas
5. Execute testes para garantir que nada quebrou

---

## 📋 Checklists Rápidos

### ✅ Checklist: Novo Módulo Completo

- [ ] Pasta criada em `src/modules/{module}/`
- [ ] `{module}.types.ts` - Todos os tipos definidos
- [ ] `{module}.validation.ts` - Schemas Zod implementados
- [ ] `{module}.db.ts` - CRUD completo
- [ ] `{module}.domain.ts` - Lógica de negócio
- [ ] `index.ts` - Exports organizados
- [ ] Testes unitários criados
- [ ] Documentação JSDoc completa
- [ ] Sem dependências circulares
- [ ] Code review aprovado

### ✅ Checklist: Qualidade de Código

- [ ] Nomenclatura consistente
- [ ] Imports organizados
- [ ] Separação de responsabilidades clara
- [ ] Funções documentadas com JSDoc
- [ ] Erros tratados adequadamente
- [ ] Validações implementadas
- [ ] Performance otimizada
- [ ] Segurança validada
- [ ] Testes passando
- [ ] Sem código duplicado

---

## 🎯 Princípios Fundamentais

### 1. Separação de Responsabilidades
Cada arquivo tem um propósito único e bem definido.

### 2. Isolamento
Módulos não devem ter dependências circulares.

### 3. Testabilidade
Toda lógica deve ser testável isoladamente.

### 4. Consistência
Todos os módulos seguem a mesma estrutura.

### 5. Escalabilidade
Fácil adicionar novos módulos sem afetar existentes.

---

## 📊 Estrutura Visual

```
src/modules/{module}/
├── {module}.types.ts         # 📘 Tipos e interfaces
├── {module}.validation.ts    # ✅ Validações (Zod)
├── {module}.db.ts            # 🗄️ Operações de banco
├── {module}.domain.ts        # 🧠 Lógica de negócio
├── {module}.cache.ts         # 💾 Cache (opcional)
├── {module}.hooks.ts         # 🎣 React hooks (opcional)
├── {module}.functions.ts     # ⚡ Cloud Functions (opcional)
├── __tests__/                # 🧪 Testes
│   ├── {module}.db.test.ts
│   ├── {module}.domain.test.ts
│   └── {module}.validation.test.ts
└── index.ts                  # 📦 Exports públicos
```

---

## 🔗 Links Rápidos

| Documento | Descrição | Link |
|-----------|-----------|------|
| **Arquitetura Principal** | Visão geral e estrutura | [ARQUITETURA_MODULOS.md](./ARQUITETURA_MODULOS.md) |
| **Types** | Tipos e interfaces | [MODULO_TYPES.md](./MODULO_TYPES.md) |
| **Database** | Operações de banco | [MODULO_DB.md](./MODULO_DB.md) |
| **Domain** | Lógica de negócio | [MODULO_DOMAIN.md](./MODULO_DOMAIN.md) |
| **Validation** | Validações com Zod | [MODULO_VALIDATION.md](./MODULO_VALIDATION.md) |
| **Integration** | Integração entre módulos | [MODULO_INTEGRACAO.md](./MODULO_INTEGRACAO.md) |

---

## 💡 Exemplos Práticos

### Módulo Simples (Tags)
```
modules/tags/
├── tags.types.ts       # Tag, CreateTagDto
├── tags.validation.ts  # Schemas Zod
├── tags.db.ts          # CRUD básico
├── tags.domain.ts      # Normalização
└── index.ts
```

### Módulo Complexo (Sales)
```
modules/sales/
├── sales.types.ts         # Sale, DTOs, Filters
├── sales.validation.ts    # Validações complexas
├── sales.db.ts            # CRUD + Aggregations
├── sales.domain.ts        # Cálculos, transformações
├── sales.cache.ts         # Estratégias de cache
├── sales.hooks.ts         # useSale, useSales
├── sales.functions.ts     # Cloud Functions
├── __tests__/
└── index.ts
```

---

## 🆘 Suporte

### Dúvidas Frequentes

**P: Onde colocar validações de negócio?**  
R: Em `{module}.domain.ts`. Validações de formato vão em `{module}.validation.ts`.

**P: Como integrar dois módulos?**  
R: Leia [MODULO_INTEGRACAO.md](./MODULO_INTEGRACAO.md) para padrões corretos.

**P: Posso ter dependência circular?**  
R: Não. Use eventos ou módulo intermediário.

**P: Onde colocar cache?**  
R: Em `{module}.cache.ts` (opcional) ou use cache global em `services/cache/`.

**P: Como testar?**  
R: Crie testes em `__tests__/` para cada arquivo. Priorize `.domain.ts` e `.validation.ts`.

---

## 📝 Contribuindo

Ao adicionar novos padrões ou exemplos:

1. Atualize o documento relevante
2. Adicione exemplos práticos
3. Inclua no checklist se aplicável
4. Mantenha consistência com documentos existentes

---

## 🔄 Versionamento

**Versão Atual**: 1.0.0  
**Última Atualização**: Janeiro 2026

### Changelog

- **v1.0.0** (Jan 2026)
  - Documentação inicial completa
  - Guias para todos os tipos de arquivo
  - Padrões de integração
  - Exemplos práticos

---

## 📚 Recursos Adicionais

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Mantenha esta documentação atualizada conforme o projeto evolui!** 🚀
