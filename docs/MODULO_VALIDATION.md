# ✅ Guia: {module}.validation.ts

## 🎯 Responsabilidade

Validar **estrutura e formato** dos dados de entrada. Este arquivo garante que os dados estão no formato correto antes de serem processados.

---

## ✅ O que DEVE conter

- ✅ Schemas de validação (Zod, Yup, etc)
- ✅ Validações de formato e tipo
- ✅ Mensagens de erro descritivas
- ✅ Funções de validação exportáveis
- ✅ Validações de DTOs

## ❌ O que NÃO deve conter

- ❌ Lógica de negócio
- ❌ Cálculos
- ❌ Acesso ao banco de dados
- ❌ Validações que dependem de estado externo

---

## 📐 Estrutura Padrão

```typescript
import { z } from 'zod';
import type { CreateEntityDto, UpdateEntityDto } from './entity.types';
import { ValidationError } from '@/shared/utils/errors';

// ============================================
// SCHEMAS BASE
// ============================================

const BaseSchema = z.object({
  // Campos base
});

// ============================================
// SCHEMAS DE DTOs
// ============================================

export const CreateEntityDtoSchema = z.object({
  // Campos para criação
});

export const UpdateEntityDtoSchema = z.object({
  // Campos para atualização
});

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

export const validateCreateEntity = (data: unknown): CreateEntityDto => {
  // Implementação
};

export const validateUpdateEntity = (data: unknown): UpdateEntityDto => {
  // Implementação
};

// ============================================
// VALIDAÇÕES CUSTOMIZADAS
// ============================================

export const validateCustomRule = (value: any): void => {
  // Implementação
};
```

---

## 🎨 Usando Zod (Recomendado)

### 1. Schemas Básicos

```typescript
import { z } from 'zod';

// String
const nameSchema = z.string()
  .min(1, 'Nome é obrigatório')
  .max(100, 'Nome deve ter no máximo 100 caracteres')
  .trim();

// Number
const priceSchema = z.number()
  .int('Preço deve ser inteiro')
  .nonnegative('Preço não pode ser negativo')
  .max(1000000000, 'Preço muito alto');

// Boolean
const activeSchema = z.boolean();

// Date
const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD');

// UUID
const idSchema = z.string()
  .uuid('ID inválido');

// Email
const emailSchema = z.string()
  .email('Email inválido')
  .toLowerCase();

// Enum
const statusSchema = z.enum(['draft', 'open', 'paid', 'canceled']);

// Array
const tagsSchema = z.array(z.string())
  .min(1, 'Pelo menos uma tag é obrigatória')
  .max(10, 'Máximo de 10 tags');

// Optional
const notesSchema = z.string().optional();

// Nullable
const photoSchema = z.string().url().nullable();
```

### 2. Schemas Compostos

```typescript
/**
 * Schema para item de venda
 */
const SaleItemSchema = z.object({
  type: z.enum(['product', 'service', 'membership'], {
    errorMap: () => ({ message: 'Tipo inválido' })
  }),
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(200, 'Descrição muito longa'),
  quantity: z.number()
    .int('Quantidade deve ser inteira')
    .positive('Quantidade deve ser positiva')
    .max(1000, 'Quantidade máxima: 1000'),
  unitPriceCents: z.number()
    .int('Preço deve ser inteiro')
    .nonnegative('Preço não pode ser negativo'),
  discountCents: z.number()
    .int()
    .nonnegative()
    .optional()
    .default(0),
  metadata: z.record(z.unknown()).optional()
});

/**
 * Schema para pagamento
 */
const PaymentSchema = z.object({
  method: z.enum(['cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer']),
  amountCents: z.number()
    .int()
    .positive('Valor deve ser positivo'),
  reference: z.string()
    .max(100)
    .optional(),
  metadata: z.record(z.unknown()).optional()
});
```

### 3. Schema de Create DTO

```typescript
/**
 * Schema para criar venda
 */
export const CreateSaleDtoSchema = z.object({
  branchId: z.string().uuid('Branch ID inválido'),
  clientId: z.string().uuid('Client ID inválido'),
  consultantId: z.string().uuid('Consultant ID inválido'),
  
  items: z.array(SaleItemSchema)
    .min(1, 'Venda deve ter pelo menos 1 item')
    .max(100, 'Máximo de 100 itens por venda'),
  
  payments: z.array(PaymentSchema)
    .optional()
    .default([]),
  
  discountCents: z.number()
    .int()
    .nonnegative()
    .optional()
    .default(0),
  
  notes: z.string()
    .max(1000, 'Notas muito longas')
    .optional(),
  
  tags: z.array(z.string())
    .max(20, 'Máximo de 20 tags')
    .optional()
    .default([])
})
// Validações customizadas com refine
.refine(
  (data) => {
    // Validar que desconto não é maior que total
    const grossTotal = data.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPriceCents),
      0
    );
    return data.discountCents <= grossTotal;
  },
  {
    message: 'Desconto não pode ser maior que o total',
    path: ['discountCents']
  }
)
.refine(
  (data) => {
    // Validar que pagamentos não excedem total
    const grossTotal = data.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPriceCents),
      0
    );
    const netTotal = grossTotal - data.discountCents;
    const paidTotal = data.payments.reduce(
      (sum, payment) => sum + payment.amountCents,
      0
    );
    return paidTotal <= netTotal;
  },
  {
    message: 'Pagamentos não podem exceder o total',
    path: ['payments']
  }
);
```

### 4. Schema de Update DTO

```typescript
/**
 * Schema para atualizar venda
 */
export const UpdateSaleDtoSchema = z.object({
  status: z.enum(['draft', 'open', 'paid', 'canceled', 'refunded']).optional(),
  items: z.array(SaleItemSchema).optional(),
  payments: z.array(PaymentSchema).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(20).optional()
})
.refine(
  (data) => Object.keys(data).length > 0,
  'Pelo menos um campo deve ser fornecido para atualização'
);
```

### 5. Schema de Filtros

```typescript
/**
 * Schema para filtros de busca
 */
export const SaleFiltersSchema = z.object({
  branchId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  consultantId: z.string().uuid().optional(),
  
  status: z.union([
    z.enum(['draft', 'open', 'paid', 'canceled', 'refunded']),
    z.array(z.enum(['draft', 'open', 'paid', 'canceled', 'refunded']))
  ]).optional(),
  
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)')
    .optional(),
  
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)')
    .optional(),
  
  minAmount: z.number().int().nonnegative().optional(),
  maxAmount: z.number().int().nonnegative().optional(),
  
  search: z.string().max(100).optional(),
  
  tags: z.array(z.string()).optional()
})
// Validar range de datas
.refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: 'Data inicial deve ser menor ou igual à data final',
    path: ['startDate']
  }
)
// Validar range de valores
.refine(
  (data) => {
    if (data.minAmount !== undefined && data.maxAmount !== undefined) {
      return data.minAmount <= data.maxAmount;
    }
    return true;
  },
  {
    message: 'Valor mínimo deve ser menor ou igual ao valor máximo',
    path: ['minAmount']
  }
);
```

---

## 🔧 Funções de Validação

### 1. Validação com Try-Catch

```typescript
/**
 * Valida dados para criação de venda
 * 
 * @param data - Dados a validar
 * @returns Dados validados e tipados
 * @throws {ValidationError} Se dados inválidos
 */
export const validateCreateSale = (data: unknown): CreateSaleDto => {
  try {
    return CreateSaleDtoSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => 
        `${e.path.join('.')}: ${e.message}`
      );
      throw new ValidationError('Dados inválidos para criação de venda', {
        errors: messages
      });
    }
    throw error;
  }
};
```

### 2. Validação com SafeParse

```typescript
/**
 * Valida dados com retorno seguro (sem throw)
 * 
 * @param data - Dados a validar
 * @returns Resultado com sucesso ou erro
 */
export const validateCreateSaleSafe = (data: unknown): {
  success: boolean;
  data?: CreateSaleDto;
  errors?: string[];
} => {
  const result = CreateSaleDtoSchema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  }
  
  return {
    success: false,
    errors: result.error.errors.map(e => 
      `${e.path.join('.')}: ${e.message}`
    )
  };
};
```

### 3. Validação Parcial

```typescript
/**
 * Valida apenas campos fornecidos (útil para PATCH)
 */
export const validatePartialUpdate = (data: unknown): Partial<UpdateSaleDto> => {
  const PartialSchema = UpdateSaleDtoSchema.partial();
  
  try {
    return PartialSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError('Dados inválidos', { errors: messages });
    }
    throw error;
  }
};
```

---

## 🎯 Validações Customizadas

### 1. Validação de ID

```typescript
/**
 * Valida ID único
 */
export const validateSaleId = (id: unknown): string => {
  const schema = z.string().uuid('ID de venda inválido');
  
  try {
    return schema.parse(id);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0].message);
    }
    throw error;
  }
};

/**
 * Valida múltiplos IDs
 */
export const validateSaleIds = (ids: unknown): string[] => {
  const schema = z.array(z.string().uuid())
    .min(1, 'Pelo menos um ID deve ser fornecido')
    .max(100, 'Máximo de 100 IDs por vez');
  
  try {
    return schema.parse(ids);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message);
      throw new ValidationError('IDs inválidos', { errors: messages });
    }
    throw error;
  }
};
```

### 2. Validação de Range de Datas

```typescript
/**
 * Valida range de datas
 */
export const validateDateRange = (startDate: string, endDate: string): void => {
  const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
  
  // Validar formato
  try {
    dateSchema.parse(startDate);
    dateSchema.parse(endDate);
  } catch {
    throw new ValidationError('Formato de data inválido (YYYY-MM-DD)');
  }
  
  // Validar range
  if (startDate > endDate) {
    throw new ValidationError('Data inicial deve ser menor ou igual à data final');
  }
  
  // Validar que não é muito grande (ex: máximo 1 ano)
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  
  if (diffDays > 365) {
    throw new ValidationError('Range de datas não pode exceder 1 ano');
  }
};
```

### 3. Validação de Valores Monetários

```typescript
/**
 * Valida valor em centavos
 */
export const validateAmountCents = (amount: unknown): number => {
  const schema = z.number()
    .int('Valor deve ser inteiro (em centavos)')
    .nonnegative('Valor não pode ser negativo')
    .max(1000000000, 'Valor muito alto'); // R$ 10.000.000,00
  
  try {
    return schema.parse(amount);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0].message);
    }
    throw error;
  }
};

/**
 * Valida percentual
 */
export const validatePercentage = (percentage: unknown): number => {
  const schema = z.number()
    .min(0, 'Percentual não pode ser negativo')
    .max(100, 'Percentual não pode exceder 100%');
  
  try {
    return schema.parse(percentage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0].message);
    }
    throw error;
  }
};
```

### 4. Validação de Paginação

```typescript
/**
 * Schema de paginação
 */
export const PaginationOptionsSchema = z.object({
  page: z.number()
    .int()
    .positive('Página deve ser positiva')
    .default(1),
  
  pageSize: z.number()
    .int()
    .positive('Tamanho da página deve ser positivo')
    .min(1, 'Mínimo de 1 item por página')
    .max(100, 'Máximo de 100 itens por página')
    .default(50),
  
  orderBy: z.string().optional(),
  
  orderDirection: z.enum(['asc', 'desc'])
    .optional()
    .default('desc')
});

/**
 * Valida opções de paginação
 */
export const validatePaginationOptions = (options: unknown) => {
  try {
    return PaginationOptionsSchema.parse(options);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError('Opções de paginação inválidas', { errors: messages });
    }
    throw error;
  }
};
```

---

## 🔍 Validações Avançadas com Zod

### 1. Transform

```typescript
/**
 * Transforma dados durante validação
 */
const EmailSchema = z.string()
  .email()
  .transform(email => email.toLowerCase().trim());

const TagsSchema = z.array(z.string())
  .transform(tags => [...new Set(tags)]); // Remove duplicatas
```

### 2. Preprocess

```typescript
/**
 * Pré-processa dados antes de validar
 */
const DateSchema = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      return val.split('T')[0]; // Extrai apenas data de ISO
    }
    return val;
  },
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
);
```

### 3. Discriminated Unions

```typescript
/**
 * Validação baseada em discriminador
 */
const PaymentSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('cash'),
    amountCents: z.number().int().positive()
  }),
  z.object({
    method: z.literal('pix'),
    amountCents: z.number().int().positive(),
    pixTxid: z.string().min(1, 'TXID do PIX é obrigatório')
  }),
  z.object({
    method: z.literal('credit_card'),
    amountCents: z.number().int().positive(),
    cardBrand: z.string(),
    cardLast4: z.string().length(4),
    installments: z.number().int().min(1).max(12)
  })
]);
```

### 4. Async Validation

```typescript
/**
 * Validação assíncrona (ex: verificar se existe no banco)
 */
const ClientIdSchema = z.string().uuid().refine(
  async (clientId) => {
    // Verificar se cliente existe
    const exists = await checkClientExists(clientId);
    return exists;
  },
  {
    message: 'Cliente não encontrado'
  }
);
```

---

## 🛡️ Mensagens de Erro Customizadas

### 1. Error Map Global

```typescript
import { z } from 'zod';

/**
 * Mapa de erros customizado em português
 */
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === 'string') {
      return { message: 'Deve ser um texto' };
    }
    if (issue.expected === 'number') {
      return { message: 'Deve ser um número' };
    }
  }
  
  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === 'string') {
      return { message: `Mínimo de ${issue.minimum} caracteres` };
    }
    if (issue.type === 'array') {
      return { message: `Mínimo de ${issue.minimum} itens` };
    }
  }
  
  if (issue.code === z.ZodIssueCode.too_big) {
    if (issue.type === 'string') {
      return { message: `Máximo de ${issue.maximum} caracteres` };
    }
    if (issue.type === 'array') {
      return { message: `Máximo de ${issue.maximum} itens` };
    }
  }
  
  return { message: ctx.defaultError };
};

// Aplicar globalmente
z.setErrorMap(customErrorMap);
```

### 2. Mensagens por Campo

```typescript
const CreateSaleDtoSchema = z.object({
  clientId: z.string().uuid({
    message: 'ID do cliente inválido'
  }),
  
  items: z.array(SaleItemSchema, {
    required_error: 'Itens são obrigatórios',
    invalid_type_error: 'Itens devem ser um array'
  }).min(1, {
    message: 'Adicione pelo menos um item à venda'
  })
});
```

---

## 🧪 Testando Validações

```typescript
import { describe, it, expect } from 'vitest';
import { validateCreateSale } from './sales.validation';

describe('validateCreateSale', () => {
  it('deve validar dados corretos', () => {
    const validData = {
      branchId: '123e4567-e89b-12d3-a456-426614174000',
      clientId: '123e4567-e89b-12d3-a456-426614174001',
      consultantId: '123e4567-e89b-12d3-a456-426614174002',
      items: [
        {
          type: 'product',
          description: 'Produto Teste',
          quantity: 1,
          unitPriceCents: 1000
        }
      ]
    };
    
    expect(() => validateCreateSale(validData)).not.toThrow();
  });
  
  it('deve rejeitar dados sem items', () => {
    const invalidData = {
      branchId: '123e4567-e89b-12d3-a456-426614174000',
      clientId: '123e4567-e89b-12d3-a456-426614174001',
      consultantId: '123e4567-e89b-12d3-a456-426614174002',
      items: []
    };
    
    expect(() => validateCreateSale(invalidData)).toThrow('pelo menos 1 item');
  });
  
  it('deve rejeitar desconto maior que total', () => {
    const invalidData = {
      branchId: '123e4567-e89b-12d3-a456-426614174000',
      clientId: '123e4567-e89b-12d3-a456-426614174001',
      consultantId: '123e4567-e89b-12d3-a456-426614174002',
      items: [
        {
          type: 'product',
          description: 'Produto',
          quantity: 1,
          unitPriceCents: 1000
        }
      ],
      discountCents: 2000
    };
    
    expect(() => validateCreateSale(invalidData)).toThrow('maior que o total');
  });
});
```

---

## ✅ Checklist

Ao criar `{module}.validation.ts`:

- [ ] Biblioteca de validação escolhida (Zod recomendado)
- [ ] Schemas para todos os DTOs
- [ ] Mensagens de erro em português
- [ ] Validações de formato (UUID, email, data, etc)
- [ ] Validações de range (min, max)
- [ ] Validações customizadas com refine
- [ ] Funções de validação exportadas
- [ ] Tratamento de erros consistente
- [ ] Sem lógica de negócio
- [ ] Testes unitários

---

## 📚 Exemplos Completos

Ver exemplos em:
- `/examples/modules/sales/sales.validation.ts`
- `/examples/modules/clients/clients.validation.ts`

---

## 🔗 Recursos

- [Zod Documentation](https://zod.dev/)
- [Zod Error Handling](https://zod.dev/ERROR_HANDLING)
- [Zod Advanced](https://zod.dev/ADVANCED)
