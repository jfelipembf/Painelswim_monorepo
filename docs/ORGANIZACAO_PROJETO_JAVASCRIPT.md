# 🟨 Organização do Projeto com JavaScript

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Módulos e Organização](#módulos-e-organização)
4. [Tipagem com JSDoc](#tipagem-com-jsdoc)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Validações e Schemas](#validações-e-schemas)
7. [Hooks e React](#hooks-e-react)
8. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

Ao usar JavaScript puro (sem TypeScript), é essencial manter uma organização rigorosa e usar **JSDoc** para documentação e type-checking. Isso garante:

- ✅ **Type safety** através do JSDoc + VS Code IntelliSense
- ✅ **Documentação inline** automática
- ✅ **Autocomplete** completo
- ✅ **Validação em tempo de desenvolvimento**
- ✅ **Sem necessidade de compilação**

---

## 📁 Estrutura de Pastas

```
src/
├── modules/                    # Módulos de domínio
│   ├── clients/               # Módulo de clientes
│   │   ├── clients.types.js   # Definições de tipos (JSDoc)
│   │   ├── clients.db.js      # Operações de banco de dados
│   │   ├── clients.domain.js  # Lógica de negócio
│   │   ├── clients.validation.js # Validações
│   │   └── index.js           # Exportações públicas
│   │
│   ├── sales/                 # Módulo de vendas
│   │   ├── sales.types.js
│   │   ├── sales.db.js
│   │   ├── sales.domain.js
│   │   ├── sales.validation.js
│   │   └── index.js
│   │
│   ├── memberships/           # Módulo de matrículas
│   │   ├── memberships.types.js
│   │   ├── memberships.db.js
│   │   ├── memberships.domain.js
│   │   └── index.js
│   │
│   └── receivables/           # Módulo de recebíveis
│       ├── receivables.types.js
│       ├── receivables.db.js
│       ├── receivables.domain.js
│       └── index.js
│
├── hooks/                     # React Hooks customizados
│   ├── clients/
│   │   ├── useClient.js
│   │   ├── useClientsList.js
│   │   ├── useCreateClient.js
│   │   └── index.js
│   │
│   ├── sales/
│   │   ├── useSale.js
│   │   ├── useCreateSale.js
│   │   └── index.js
│   │
│   └── memberships/
│       ├── useMembership.js
│       └── index.js
│
├── services/                  # Serviços externos
│   ├── firebase.js
│   ├── storage.js
│   └── api.js
│
├── utils/                     # Utilitários
│   ├── dates.js
│   ├── formatters.js
│   ├── validators.js
│   └── constants.js
│
└── components/                # Componentes React
    ├── clients/
    │   ├── ClientForm.jsx
    │   ├── ClientList.jsx
    │   └── ClientProfile.jsx
    └── sales/
        ├── SaleForm.jsx
        └── SalesList.jsx
```

---

## 🧩 Módulos e Organização

### Estrutura de um Módulo Completo

Cada módulo segue o padrão:

```
modules/clients/
├── clients.types.js       # Definições de tipos com JSDoc
├── clients.db.js          # Operações de banco de dados
├── clients.domain.js      # Lógica de negócio e transformações
├── clients.validation.js  # Validações de dados
└── index.js               # Exportações públicas
```

---

## 📝 Tipagem com JSDoc

### 1. Arquivo de Tipos (`clients.types.js`)

```javascript
/**
 * @fileoverview Definições de tipos para o módulo de clientes
 */

/**
 * @typedef {Object} ClientAddress
 * @property {string} zipCode - CEP
 * @property {string} state - Estado (UF)
 * @property {string} city - Cidade
 * @property {string} neighborhood - Bairro
 * @property {string} address - Logradouro
 * @property {string} number - Número
 */

/**
 * @typedef {Object} ClientPayload
 * @property {string} firstName - Nome
 * @property {string} lastName - Sobrenome
 * @property {string} gender - Gênero (male, female, other)
 * @property {string} birthDate - Data de nascimento (YYYY-MM-DD)
 * @property {string} email - Email
 * @property {string} [photoUrl] - URL da foto (opcional)
 * @property {string} [phone] - Telefone (opcional)
 * @property {string} [whatsapp] - WhatsApp (opcional)
 * @property {string} [responsibleName] - Nome do responsável (opcional)
 * @property {string} [responsiblePhone] - Telefone do responsável (opcional)
 * @property {ClientAddress} address - Endereço completo
 * @property {string} [notes] - Observações (opcional)
 * @property {string} [status] - Status do cliente
 * @property {string} [createdByUserId] - ID do usuário criador
 */

/**
 * @typedef {Object} Client
 * @property {string} id - ID único do cliente
 * @property {string} idTenant - ID da academia
 * @property {string} idBranch - ID da unidade
 * @property {string} firstName - Nome
 * @property {string} lastName - Sobrenome
 * @property {string} gender - Gênero
 * @property {string} birthDate - Data de nascimento
 * @property {string} email - Email
 * @property {string} [photoUrl] - URL da foto
 * @property {string} [phone] - Telefone
 * @property {string} [whatsapp] - WhatsApp
 * @property {string} [responsibleName] - Nome do responsável
 * @property {string} [responsiblePhone] - Telefone do responsável
 * @property {ClientAddress} address - Endereço
 * @property {string} [notes] - Observações
 * @property {string} status - Status (lead, active, pending, etc)
 * @property {string} [friendlyId] - ID amigável (CLI-0001)
 * @property {string} [activeMembershipId] - ID da matrícula ativa
 * @property {string} [scheduledMembershipId] - ID da matrícula agendada
 * @property {string} [activeSaleId] - ID da venda ativa
 * @property {number} [debtCents] - Saldo devedor em centavos
 * @property {Object} [access] - Configurações de acesso
 * @property {boolean} [access.allowCrossBranchAccess] - Permite acesso a outras unidades
 * @property {string[]} [access.allowedBranchIds] - IDs das unidades permitidas
 * @property {string} [lastPresenceDateKey] - Data da última presença
 * @property {boolean} [abandonmentRisk] - Risco de abandono
 * @property {*} [createdAt] - Data de criação
 * @property {*} [updatedAt] - Data de atualização
 */

/**
 * Status possíveis do cliente
 * @typedef {'lead' | 'pending' | 'active' | 'paused' | 'canceled' | 'expired' | 'inactive'} ClientStatus
 */

// Exportar para uso em outros arquivos
export {};
```

---

### 2. Arquivo de Banco de Dados (`clients.db.js`)

```javascript
/**
 * @fileoverview Operações de banco de dados para clientes
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { getFirebaseDb } from '../../services/firebase.js';

/**
 * Busca um cliente por ID
 * 
 * @param {string} tenantId - ID da academia
 * @param {string} branchId - ID da unidade
 * @param {string} clientId - ID do cliente
 * @returns {Promise<import('./clients.types.js').Client | null>}
 * @throws {Error} Se houver erro na busca
 */
export async function getClientById(tenantId, branchId, clientId) {
  if (!tenantId || !branchId || !clientId) {
    throw new Error('IDs são obrigatórios');
  }

  const db = getFirebaseDb();
  const clientRef = doc(db, 'tenants', tenantId, 'branches', branchId, 'clients', clientId);
  
  const snapshot = await getDoc(clientRef);
  
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

/**
 * Lista clientes com filtros opcionais
 * 
 * @param {string} tenantId - ID da academia
 * @param {string} branchId - ID da unidade
 * @param {Object} [filters] - Filtros opcionais
 * @param {import('./clients.types.js').ClientStatus} [filters.status] - Filtrar por status
 * @param {number} [filters.limit] - Limite de resultados
 * @returns {Promise<import('./clients.types.js').Client[]>}
 */
export async function listClients(tenantId, branchId, filters = {}) {
  const db = getFirebaseDb();
  const clientsRef = collection(db, 'tenants', tenantId, 'branches', branchId, 'clients');
  
  let q = query(clientsRef);
  
  if (filters.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Cria um novo cliente
 * 
 * @param {string} tenantId - ID da academia
 * @param {string} branchId - ID da unidade
 * @param {import('./clients.types.js').ClientPayload} payload - Dados do cliente
 * @returns {Promise<string>} ID do cliente criado
 * @throws {Error} Se houver erro na criação
 */
export async function createClient(tenantId, branchId, payload) {
  if (!tenantId || !branchId) {
    throw new Error('IDs da academia e unidade são obrigatórios');
  }

  const db = getFirebaseDb();
  const clientsRef = collection(db, 'tenants', tenantId, 'branches', branchId, 'clients');
  const clientRef = doc(clientsRef);

  const clientData = {
    idTenant: tenantId,
    idBranch: branchId,
    firstName: payload.firstName,
    lastName: payload.lastName,
    gender: payload.gender,
    birthDate: payload.birthDate,
    email: payload.email,
    photoUrl: payload.photoUrl || null,
    phone: payload.phone || null,
    whatsapp: payload.whatsapp || null,
    responsibleName: payload.responsibleName || null,
    responsiblePhone: payload.responsiblePhone || null,
    address: payload.address,
    notes: payload.notes || null,
    status: payload.status || 'lead',
    createdByUserId: payload.createdByUserId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(clientRef, clientData);

  return clientRef.id;
}

/**
 * Atualiza um cliente existente
 * 
 * @param {string} tenantId - ID da academia
 * @param {string} branchId - ID da unidade
 * @param {string} clientId - ID do cliente
 * @param {Partial<import('./clients.types.js').ClientPayload>} updates - Dados a atualizar
 * @returns {Promise<void>}
 */
export async function updateClient(tenantId, branchId, clientId, updates) {
  const db = getFirebaseDb();
  const clientRef = doc(db, 'tenants', tenantId, 'branches', branchId, 'clients', clientId);

  await updateDoc(clientRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}
```

---

### 3. Arquivo de Domínio (`clients.domain.js`)

```javascript
/**
 * @fileoverview Lógica de negócio para clientes
 */

/**
 * Normaliza os dados do cliente antes de salvar
 * 
 * @param {import('./clients.types.js').ClientPayload} payload - Dados brutos
 * @returns {import('./clients.types.js').ClientPayload} Dados normalizados
 */
export function normalizeClientPayload(payload) {
  return {
    firstName: String(payload.firstName || '').trim(),
    lastName: String(payload.lastName || '').trim(),
    gender: String(payload.gender || '').trim(),
    birthDate: String(payload.birthDate || '').trim(),
    email: String(payload.email || '').trim().toLowerCase(),
    photoUrl: payload.photoUrl ? String(payload.photoUrl).trim() : undefined,
    phone: payload.phone ? String(payload.phone).trim() : undefined,
    whatsapp: payload.whatsapp ? String(payload.whatsapp).trim() : undefined,
    responsibleName: payload.responsibleName ? String(payload.responsibleName).trim() : undefined,
    responsiblePhone: payload.responsiblePhone ? String(payload.responsiblePhone).trim() : undefined,
    address: {
      zipCode: String(payload.address.zipCode || '').trim(),
      state: String(payload.address.state || '').trim().toUpperCase(),
      city: String(payload.address.city || '').trim(),
      neighborhood: String(payload.address.neighborhood || '').trim(),
      address: String(payload.address.address || '').trim(),
      number: String(payload.address.number || '').trim()
    },
    notes: payload.notes ? String(payload.notes).trim() : undefined,
    status: payload.status || 'lead',
    createdByUserId: payload.createdByUserId
  };
}

/**
 * Calcula a idade do cliente
 * 
 * @param {string} birthDate - Data de nascimento (YYYY-MM-DD)
 * @returns {number} Idade em anos
 */
export function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Verifica se o cliente é menor de idade
 * 
 * @param {string} birthDate - Data de nascimento
 * @returns {boolean} True se menor de 18 anos
 */
export function isMinor(birthDate) {
  return calculateAge(birthDate) < 18;
}

/**
 * Formata o nome completo do cliente
 * 
 * @param {import('./clients.types.js').Client} client - Cliente
 * @returns {string} Nome completo formatado
 */
export function getFullName(client) {
  return `${client.firstName} ${client.lastName}`.trim();
}

/**
 * Verifica se o cliente tem matrícula ativa
 * 
 * @param {import('./clients.types.js').Client} client - Cliente
 * @returns {boolean} True se tem matrícula ativa
 */
export function hasActiveMembership(client) {
  return Boolean(client.activeMembershipId) && client.status === 'active';
}

/**
 * Verifica se o cliente está inadimplente
 * 
 * @param {import('./clients.types.js').Client} client - Cliente
 * @returns {boolean} True se tem dívida
 */
export function hasDebt(client) {
  return Boolean(client.debtCents) && client.debtCents > 0;
}
```

---

### 4. Arquivo de Validação (`clients.validation.js`)

```javascript
/**
 * @fileoverview Validações para clientes
 */

import * as Yup from 'yup';

/**
 * Schema de validação para endereço
 */
export const addressSchema = Yup.object().shape({
  zipCode: Yup.string()
    .required('CEP é obrigatório')
    .matches(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  state: Yup.string()
    .required('Estado é obrigatório')
    .length(2, 'Estado deve ter 2 caracteres'),
  city: Yup.string()
    .required('Cidade é obrigatória')
    .min(2, 'Cidade muito curta'),
  neighborhood: Yup.string()
    .required('Bairro é obrigatório')
    .min(2, 'Bairro muito curto'),
  address: Yup.string()
    .required('Logradouro é obrigatório')
    .min(3, 'Logradouro muito curto'),
  number: Yup.string()
    .required('Número é obrigatório')
});

/**
 * Schema de validação para criação de cliente
 */
export const createClientSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter no mínimo 2 caracteres'),
  lastName: Yup.string()
    .required('Sobrenome é obrigatório')
    .min(2, 'Sobrenome deve ter no mínimo 2 caracteres'),
  gender: Yup.string()
    .required('Gênero é obrigatório')
    .oneOf(['male', 'female', 'other'], 'Gênero inválido'),
  birthDate: Yup.date()
    .required('Data de nascimento é obrigatória')
    .max(new Date(), 'Data não pode ser futura'),
  email: Yup.string()
    .required('Email é obrigatório')
    .email('Email inválido'),
  phone: Yup.string()
    .nullable()
    .matches(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido'),
  whatsapp: Yup.string()
    .nullable()
    .matches(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'WhatsApp inválido'),
  address: addressSchema,
  notes: Yup.string().nullable()
});

/**
 * Valida os dados do cliente
 * 
 * @param {import('./clients.types.js').ClientPayload} data - Dados a validar
 * @returns {Promise<import('./clients.types.js').ClientPayload>} Dados validados
 * @throws {Yup.ValidationError} Se validação falhar
 */
export async function validateClientData(data) {
  return await createClientSchema.validate(data, { abortEarly: false });
}

/**
 * Valida se o cliente é menor e tem responsável
 * 
 * @param {import('./clients.types.js').ClientPayload} data - Dados do cliente
 * @throws {Error} Se menor sem responsável
 */
export function validateMinorWithGuardian(data) {
  const age = calculateAge(data.birthDate);
  
  if (age < 18 && !data.responsibleName) {
    throw new Error('Responsável é obrigatório para menores de 18 anos');
  }
}

/**
 * Calcula idade
 * @param {string} birthDate - Data de nascimento
 * @returns {number} Idade
 */
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}
```

---

### 5. Arquivo de Exportação (`index.js`)

```javascript
/**
 * @fileoverview Exportações públicas do módulo de clientes
 */

// Exportar tipos (apenas para referência em JSDoc)
export * from './clients.types.js';

// Exportar funções de banco de dados
export {
  getClientById,
  listClients,
  createClient,
  updateClient
} from './clients.db.js';

// Exportar funções de domínio
export {
  normalizeClientPayload,
  calculateAge,
  isMinor,
  getFullName,
  hasActiveMembership,
  hasDebt
} from './clients.domain.js';

// Exportar validações
export {
  createClientSchema,
  addressSchema,
  validateClientData,
  validateMinorWithGuardian
} from './clients.validation.js';
```

---

## 🪝 Hooks e React

### Hook Customizado (`hooks/clients/useClient.js`)

```javascript
/**
 * @fileoverview Hook para buscar um cliente
 */

import { useQuery } from '@tanstack/react-query';
import { getClientById } from '../../modules/clients/index.js';
import { useAppSelector } from '../../redux/hooks.js';

/**
 * Hook para buscar um cliente por ID
 * 
 * @param {string} clientId - ID do cliente
 * @returns {{
 *   data: import('../../modules/clients/clients.types.js').Client | undefined,
 *   isLoading: boolean,
 *   error: Error | null,
 *   refetch: () => void
 * }}
 */
export function useClient(clientId) {
  const { idTenant } = useAppSelector(state => state.tenant);
  const { idBranch } = useAppSelector(state => state.branch);

  return useQuery({
    queryKey: ['clients', clientId],
    queryFn: () => getClientById(idTenant, idBranch, clientId),
    enabled: Boolean(clientId && idTenant && idBranch),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

### Hook de Criação (`hooks/clients/useCreateClient.js`)

```javascript
/**
 * @fileoverview Hook para criar cliente
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../../modules/clients/index.js';
import { useAppSelector } from '../../redux/hooks.js';
import { useToast } from '../../context/ToastContext.js';

/**
 * Hook para criar um novo cliente
 * 
 * @returns {{
 *   mutate: (data: import('../../modules/clients/clients.types.js').ClientPayload) => void,
 *   mutateAsync: (data: import('../../modules/clients/clients.types.js').ClientPayload) => Promise<string>,
 *   isPending: boolean,
 *   error: Error | null
 * }}
 */
export function useCreateClient() {
  const { idTenant } = useAppSelector(state => state.tenant);
  const { idBranch } = useAppSelector(state => state.branch);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: (/** @type {import('../../modules/clients/clients.types.js').ClientPayload} */ data) => {
      return createClient(idTenant, idBranch, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      showSuccess('Cliente criado com sucesso!');
    },
    onError: (error) => {
      showError(error.message || 'Erro ao criar cliente');
    }
  });
}
```

---

## 🎨 Componente React

### Formulário de Cliente (`components/clients/ClientForm.jsx`)

```javascript
/**
 * @fileoverview Formulário de criação de cliente
 */

import React from 'react';
import { Formik, Form } from 'formik';
import { useNavigate } from 'react-router-dom';
import { useCreateClient } from '../../hooks/clients/index.js';
import { createClientSchema } from '../../modules/clients/index.js';

/**
 * Valores iniciais do formulário
 * @type {import('../../modules/clients/clients.types.js').ClientPayload}
 */
const initialValues = {
  firstName: '',
  lastName: '',
  gender: '',
  birthDate: '',
  email: '',
  photoUrl: '',
  phone: '',
  whatsapp: '',
  responsibleName: '',
  responsiblePhone: '',
  address: {
    zipCode: '',
    state: '',
    city: '',
    neighborhood: '',
    address: '',
    number: ''
  },
  notes: ''
};

/**
 * Componente de formulário de cliente
 * 
 * @returns {JSX.Element}
 */
export function ClientForm() {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useCreateClient();

  /**
   * Handler de submit do formulário
   * @param {import('../../modules/clients/clients.types.js').ClientPayload} values
   */
  const handleSubmit = async (values) => {
    try {
      const clientId = await mutateAsync({
        ...values,
        status: 'lead'
      });
      
      navigate(`/clients/profile/${clientId}`);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={createClientSchema}
      onSubmit={handleSubmit}
    >
      {({ values, errors, touched, isSubmitting }) => (
        <Form>
          {/* Campos do formulário */}
          <div>
            <label htmlFor="firstName">Nome</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={values.firstName}
              disabled={isPending}
            />
            {errors.firstName && touched.firstName && (
              <div className="error">{errors.firstName}</div>
            )}
          </div>

          {/* Mais campos... */}

          <button type="submit" disabled={isPending || isSubmitting}>
            {isPending ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </Form>
      )}
    </Formik>
  );
}
```

---

## ✅ Boas Práticas

### 1. Sempre Use JSDoc

```javascript
/**
 * Descrição clara da função
 * 
 * @param {string} param1 - Descrição do parâmetro
 * @param {number} [param2] - Parâmetro opcional
 * @returns {Promise<Object>} Descrição do retorno
 * @throws {Error} Quando ocorre erro
 */
export async function minhaFuncao(param1, param2) {
  // implementação
}
```

### 2. Use Imports Relativos com Extensão

```javascript
// ✅ Correto
import { getClientById } from './clients.db.js';
import { normalizeClientPayload } from './clients.domain.js';

// ❌ Errado
import { getClientById } from './clients.db';
```

### 3. Configure o jsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "checkJs": true,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

### 4. Use Validação com Yup ou Zod

```javascript
import * as Yup from 'yup';

export const schema = Yup.object().shape({
  firstName: Yup.string().required('Nome obrigatório'),
  email: Yup.string().email('Email inválido').required('Email obrigatório')
});
```

### 5. Mantenha Funções Puras

```javascript
// ✅ Função pura
export function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Função impura (modifica parâmetro)
export function addItem(cart, item) {
  cart.items.push(item); // Não faça isso!
  return cart;
}

// ✅ Função pura (retorna novo objeto)
export function addItem(cart, item) {
  return {
    ...cart,
    items: [...cart.items, item]
  };
}
```

### 6. Use Constantes para Valores Fixos

```javascript
/**
 * @fileoverview Constantes do sistema
 */

/**
 * Status possíveis do cliente
 * @readonly
 * @enum {string}
 */
export const CLIENT_STATUS = {
  LEAD: 'lead',
  PENDING: 'pending',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELED: 'canceled',
  EXPIRED: 'expired',
  INACTIVE: 'inactive'
};

/**
 * Métodos de pagamento
 * @readonly
 * @enum {string}
 */
export const PAYMENT_METHODS = {
  CASH: 'cash',
  PIX: 'pix',
  TRANSFER: 'transfer',
  CREDIT: 'credit',
  DEBIT: 'debit'
};
```

### 7. Tratamento de Erros Consistente

```javascript
/**
 * Cria um cliente
 * @param {string} tenantId
 * @param {string} branchId
 * @param {import('./clients.types.js').ClientPayload} payload
 * @returns {Promise<string>}
 * @throws {Error} Se validação falhar ou erro no banco
 */
export async function createClient(tenantId, branchId, payload) {
  // Validar parâmetros
  if (!tenantId || !branchId) {
    throw new Error('IDs da academia e unidade são obrigatórios');
  }

  try {
    // Validar dados
    await validateClientData(payload);
    
    // Normalizar dados
    const normalized = normalizeClientPayload(payload);
    
    // Salvar no banco
    const clientId = await saveToDatabase(tenantId, branchId, normalized);
    
    return clientId;
  } catch (error) {
    // Log do erro
    console.error('Erro ao criar cliente:', error);
    
    // Re-throw com mensagem amigável
    throw new Error(`Falha ao criar cliente: ${error.message}`);
  }
}
```

---

## 🎯 Vantagens do JavaScript com JSDoc

### ✅ Vantagens

1. **Sem compilação** - Código roda diretamente
2. **Type safety** - IntelliSense completo no VS Code
3. **Documentação inline** - JSDoc serve como documentação
4. **Flexibilidade** - Mais fácil para prototipagem
5. **Menos configuração** - Sem tsconfig.json complexo
6. **Compatibilidade** - Funciona em qualquer ambiente JS

### ⚠️ Desvantagens

1. **Verbosidade** - JSDoc pode ser extenso
2. **Validação em runtime** - Precisa validar dados manualmente
3. **Refatoração** - Menos segura que TypeScript
4. **Disciplina** - Requer mais disciplina da equipe

---

## 📚 Exemplo Completo: Módulo de Vendas

### `sales.types.js`

```javascript
/**
 * @typedef {'open' | 'paid' | 'canceled'} SaleStatus
 */

/**
 * @typedef {'membership' | 'product' | 'service'} SaleItemType
 */

/**
 * @typedef {Object} SaleItem
 * @property {SaleItemType} type
 * @property {string} description
 * @property {number} quantity
 * @property {number} unitPriceCents
 * @property {number} totalCents
 * @property {string} [membershipId]
 * @property {string} [planId]
 */

/**
 * @typedef {'cash' | 'pix' | 'transfer' | 'credit' | 'debit'} PaymentMethod
 */

/**
 * @typedef {Object} PaymentDraft
 * @property {PaymentMethod} method
 * @property {number} amountCents
 * @property {string} [pixTxid]
 * @property {string} [cardBrand]
 * @property {number} [cardInstallments]
 */

/**
 * @typedef {Object} CreateSalePayload
 * @property {string} clientId
 * @property {string} idBranch
 * @property {string} consultantId
 * @property {SaleItem[]} items
 * @property {number} grossTotalCents
 * @property {number} discountCents
 * @property {number} netTotalCents
 * @property {number} paidTotalCents
 * @property {number} remainingCents
 * @property {string} [dueDate]
 * @property {PaymentDraft[]} payments
 */

/**
 * @typedef {CreateSalePayload & {
 *   id: string,
 *   idTenant: string,
 *   status: SaleStatus,
 *   dateKey: string,
 *   createdAt: *,
 *   updatedAt: *
 * }} Sale
 */

export {};
```

### `sales.db.js`

```javascript
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../../services/firebase.js';

/**
 * Cria uma nova venda
 * 
 * @param {string} tenantId
 * @param {string} branchId
 * @param {import('./sales.types.js').CreateSalePayload} payload
 * @returns {Promise<string>}
 */
export async function createSale(tenantId, branchId, payload) {
  const db = getFirebaseDb();
  const salesRef = collection(db, 'tenants', tenantId, 'branches', branchId, 'sales');
  const saleRef = doc(salesRef);

  const status = payload.remainingCents > 0 ? 'open' : 'paid';
  const dateKey = new Date().toISOString().split('T')[0];

  const saleData = {
    idTenant: tenantId,
    idBranch: branchId,
    ...payload,
    status,
    dateKey,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(saleRef, saleData);

  return saleRef.id;
}
```

---

## 🎓 Conclusão

Usar JavaScript com JSDoc permite:

- ✅ **Type safety** similar ao TypeScript
- ✅ **Documentação automática**
- ✅ **IntelliSense completo**
- ✅ **Sem necessidade de compilação**
- ✅ **Organização modular clara**

A chave é **disciplina** e **consistência** na documentação JSDoc e na estrutura de módulos.
