# 🏗️ Arquitetura de Módulos - JavaScript + Firebase

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Anatomia de um Módulo](#anatomia-de-um-módulo)
4. [Arquivos Obrigatórios](#arquivos-obrigatórios)
5. [Validação com Zod](#validação-com-zod)
6. [JSDoc e Documentação](#jsdoc-e-documentação)
7. [Firebase Firestore](#firebase-firestore)
8. [Padrões e Convenções](#padrões-e-convenções)
9. [Exemplos Práticos](#exemplos-práticos)
10. [Checklist de Qualidade](#checklist-de-qualidade)

---

## 🎯 Visão Geral

Esta documentação define a **arquitetura padrão para módulos JavaScript** em projetos escaláveis com **Firebase Firestore**.

### ⚠️ Importante para JavaScript

Como JavaScript **não tem validação de tipos em compile-time**, seguir esta arquitetura é **CRÍTICO** para garantir qualidade e segurança.

**Pilares fundamentais:**
1. ✅ **Validação com Zod** - OBRIGATÓRIA em todas as entradas
2. ✅ **JSDoc completo** - Documentação de tipos e funções
3. ✅ **Schemas como fonte de verdade** - Substituem tipos TypeScript
4. ✅ **Firebase Firestore** - Banco de dados NoSQL
5. ✅ **Testes unitários** - Única forma de pegar erros cedo

---

## 📁 Estrutura de Pastas

```
src/
├── modules/
│   ├── clients/
│   │   ├── clients.schemas.js      # ✅ Schemas Zod (substitui .types.ts)
│   │   ├── clients.db.js           # ✅ Operações de banco (Firebase)
│   │   ├── clients.domain.js       # ✅ Lógica de negócio
│   │   └── index.js                # ✅ Exports
│   │
│   ├── sales/
│   │   ├── sales.schemas.js
│   │   ├── sales.db.js
│   │   ├── sales.domain.js
│   │   └── index.js
│   │
│   └── memberships/
│       ├── memberships.schemas.js
│       ├── memberships.db.js
│       ├── memberships.domain.js
│       └── index.js
│
├── hooks/
│   ├── clients/
│   │   ├── useClient.js
│   │   ├── useClientList.js
│   │   └── index.js
│   │
│   └── ui/
│       ├── useModal.js
│       └── useAlert.js
│
├── services/
│   └── firebase/
│       ├── index.js              # Firebase config
│       └── firestore.js          # Firestore helpers
│
├── constants/
│   ├── status.js
│   ├── gender.js
│   └── roles.js
│
└── utils/
    ├── formatters.js
    └── validators.js
```

---

## 📦 Anatomia de um Módulo

### Estrutura Padrão

```
{module}/
├── {module}.schemas.js    # Schemas Zod + JSDoc types
├── {module}.db.js         # CRUD operations (Firebase)
├── {module}.domain.js     # Business logic
└── index.js               # Exports
```

### Responsabilidades

| Arquivo | Responsabilidade | O que TEM | O que NÃO TEM |
|---------|------------------|-----------|---------------|
| **schemas.js** | Validação e "tipos" | Schemas Zod, JSDoc types | Lógica de negócio |
| **db.js** | Banco de dados | CRUD Firebase, queries | Validações, cálculos |
| **domain.js** | Lógica de negócio | Cálculos, transformações | Queries, validações |
| **index.js** | Exports | Re-exports organizados | Implementações |

---

## 📋 Arquivos Obrigatórios

### 1. `{module}.schemas.js` - Schemas e Validação

**Responsabilidade:** Definir schemas Zod que servem como "tipos" e validação

```javascript
// clients.schemas.js

import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

export const ClientStatus = {
  LEAD: 'lead',
  PENDING: 'pending',
  ACTIVE: 'active',
  PAUSED: 'paused',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired',
  CANCELED: 'canceled'
};

export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
};

// ============================================
// SCHEMAS BASE
// ============================================

/**
 * Schema de endereço
 */
export const AddressSchema = z.object({
  zipCode: z.string().length(8, 'CEP deve ter 8 dígitos'),
  state: z.string().length(2, 'Estado deve ter 2 letras'),
  city: z.string().min(1, 'Cidade obrigatória'),
  neighborhood: z.string().min(1, 'Bairro obrigatório'),
  address: z.string().min(1, 'Rua obrigatória'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional()
});

/**
 * Schema de responsável (para menores de idade)
 */
export const GuardianSchema = z.object({
  name: z.string().min(1, 'Nome do responsável obrigatório'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional(),
  relationship: z.enum(['father', 'mother', 'guardian', 'other'])
});

/**
 * Schema de informações de saúde
 */
export const HealthInfoSchema = z.object({
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  restrictions: z.array(z.string()).optional(),
  emergencyContact: z.object({
    name: z.string().min(1),
    phone: z.string().min(10),
    relationship: z.string().min(1)
  })
});

// ============================================
// SCHEMA PRINCIPAL
// ============================================

/**
 * Schema para criar cliente
 */
export const CreateClientSchema = z.object({
  // Dados pessoais
  firstName: z.string().min(1, 'Nome obrigatório').max(50),
  lastName: z.string().min(1, 'Sobrenome obrigatório').max(50),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
  cpf: z.string().regex(/^\d{11}$/, 'CPF inválido').optional(),
  rg: z.string().optional(),
  
  // Contato
  email: z.string().email('Email inválido').optional(),
  phone: z.string().min(10, 'Telefone inválido').max(15),
  whatsapp: z.string().min(10).max(15).optional(),
  
  // Endereço
  address: AddressSchema,
  
  // Responsável (se menor)
  responsibleName: z.string().optional(),
  responsiblePhone: z.string().optional(),
  
  // Saúde
  healthInfo: HealthInfoSchema.optional(),
  
  // Metadados
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(Object.values(ClientStatus)).optional()
});

/**
 * Schema para atualizar cliente
 */
export const UpdateClientSchema = CreateClientSchema.partial();

/**
 * Schema do cliente completo (com campos do banco)
 */
export const ClientSchema = CreateClientSchema.extend({
  id: z.string(),
  idTenant: z.string(),
  idBranch: z.string(),
  friendlyId: z.string().optional(),
  status: z.enum(Object.values(ClientStatus)),
  debtCents: z.number().int().nonnegative().optional(),
  activeMembershipId: z.string().optional(),
  scheduledMembershipId: z.string().optional(),
  activeSaleId: z.string().optional(),
  lastPresenceDateKey: z.string().optional(),
  abandonmentRisk: z.boolean().optional(),
  createdAt: z.any(), // Firebase Timestamp
  updatedAt: z.any(), // Firebase Timestamp
  createdByUserId: z.string().optional()
});

// ============================================
// JSDOC TYPES (para autocompletar)
// ============================================

/**
 * @typedef {z.infer<typeof AddressSchema>} Address
 */

/**
 * @typedef {z.infer<typeof GuardianSchema>} Guardian
 */

/**
 * @typedef {z.infer<typeof HealthInfoSchema>} HealthInfo
 */

/**
 * @typedef {z.infer<typeof CreateClientSchema>} CreateClientDto
 */

/**
 * @typedef {z.infer<typeof UpdateClientSchema>} UpdateClientDto
 */

/**
 * @typedef {z.infer<typeof ClientSchema>} Client
 */

// ============================================
// VALIDADORES
// ============================================

/**
 * Valida dados para criar cliente
 * @param {unknown} data - Dados a validar
 * @returns {CreateClientDto} Dados validados
 * @throws {z.ZodError} Se validação falhar
 */
export const validateCreateClient = (data) => {
  return CreateClientSchema.parse(data);
};

/**
 * Valida dados para criar cliente (modo seguro)
 * @param {unknown} data - Dados a validar
 * @returns {{success: true, data: CreateClientDto} | {success: false, error: z.ZodError}}
 */
export const validateCreateClientSafe = (data) => {
  return CreateClientSchema.safeParse(data);
};

/**
 * Valida dados para atualizar cliente
 * @param {unknown} data - Dados a validar
 * @returns {UpdateClientDto} Dados validados
 * @throws {z.ZodError} Se validação falhar
 */
export const validateUpdateClient = (data) => {
  return UpdateClientSchema.parse(data);
};

// ============================================
// VALIDAÇÕES CUSTOMIZADAS
// ============================================

/**
 * Valida se cliente é menor de idade
 * @param {string} birthDate - Data de nascimento (YYYY-MM-DD)
 * @returns {boolean}
 */
export const isMinor = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 < 18;
  }
  
  return age < 18;
};

/**
 * Valida CPF
 * @param {string} cpf - CPF (apenas números)
 * @returns {boolean}
 */
export const isValidCPF = (cpf) => {
  if (!cpf || cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(10))) return false;
  
  return true;
};
```

---

### 2. `{module}.db.js` - Operações de Banco (Firebase)

**Responsabilidade:** APENAS operações CRUD e queries com Firebase Firestore

```javascript
// clients.db.js

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';

import { getFirebaseDb } from '@/services/firebase';
import { omitUndefined } from '@/utils/omitUndefined';
import { normalizeClientPayload } from './clients.domain.js';
import { validateCreateClient, validateUpdateClient } from './clients.schemas.js';

// ============================================
// HELPERS PRIVADOS
// ============================================

/**
 * Mapeia documento do Firestore para entidade
 * @param {import('firebase/firestore').DocumentSnapshot} snapshot - Snapshot do Firestore
 * @returns {Client}
 * @private
 */
const mapDocToClient = (snapshot) => {
  const data = snapshot.data();
  if (!data) {
    throw new Error('Cliente inválido.');
  }

  return {
    id: snapshot.id,
    idTenant: String(data.idTenant || ''),
    idBranch: String(data.idBranch || ''),
    friendlyId: data.friendlyId,
    firstName: String(data.firstName || ''),
    lastName: String(data.lastName || ''),
    birthDate: String(data.birthDate || ''),
    gender: String(data.gender || ''),
    cpf: data.cpf,
    rg: data.rg,
    email: data.email,
    phone: data.phone,
    whatsapp: data.whatsapp,
    responsibleName: data.responsibleName,
    responsiblePhone: data.responsiblePhone,
    address: data.address || {},
    healthInfo: data.healthInfo,
    notes: data.notes,
    tags: data.tags || [],
    status: data.status || 'lead',
    debtCents: typeof data.debtCents === 'number' ? data.debtCents : undefined,
    activeMembershipId: data.activeMembershipId,
    scheduledMembershipId: data.scheduledMembershipId,
    activeSaleId: data.activeSaleId,
    lastPresenceDateKey: data.lastPresenceDateKey,
    abandonmentRisk: typeof data.abandonmentRisk === 'boolean' ? data.abandonmentRisk : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    createdByUserId: data.createdByUserId
  };
};

/**
 * Gera friendly ID
 * @param {number} value - Número sequencial
 * @returns {string} ID formatado (CLI-0001)
 * @private
 */
const toFriendlyId = (value) => {
  return `CLI-${String(Math.max(0, value)).padStart(4, '0')}`;
};

// ============================================
// CRUD BÁSICO
// ============================================

/**
 * Cria um novo cliente
 * @param {string} idTenant - ID do tenant
 * @param {string} idBranch - ID da unidade
 * @param {CreateClientDto} payload - Dados do cliente
 * @param {string} [userId] - ID do usuário criador
 * @returns {Promise<string>} ID do cliente criado
 * @throws {Error} Se validação falhar ou erro no banco
 */
export const createClient = async (idTenant, idBranch, payload, userId) => {
  if (!idTenant || !idBranch) {
    throw new Error('Academia/unidade não identificadas.');
  }

  // ✅ VALIDAR SEMPRE
  const normalized = normalizeClientPayload(payload);
  const validated = validateCreateClient(normalized);

  if (!validated.firstName || !validated.lastName) {
    throw new Error('Nome e sobrenome são obrigatórios.');
  }

  const db = getFirebaseDb();
  const clientsRef = collection(db, 'tenants', idTenant, 'branches', idBranch, 'clients');
  const counterRef = doc(db, 'tenants', idTenant, 'branches', idBranch, 'counters', 'clients');
  const clientRef = doc(clientsRef);

  await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const nextRaw = counterSnap.exists()
      ? counterSnap.data().nextFriendlyId
      : undefined;
    const next = typeof nextRaw === 'number' && Number.isFinite(nextRaw) ? nextRaw : 1;
    const friendlyId = toFriendlyId(next);

    tx.set(
      counterRef,
      {
        nextFriendlyId: next + 1,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    const clientData = omitUndefined({
      idTenant,
      idBranch,
      friendlyId,
      ...validated,
      status: validated.status || 'lead',
      createdByUserId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    tx.set(clientRef, clientData);
  });

  return clientRef.id;
};

/**
 * Busca todos os clientes
 * @param {string} idTenant - ID do tenant
 * @param {string} idBranch - ID da unidade
 * @param {Object} [options] - Opções de busca
 * @param {number} [options.limit] - Limite de resultados
 * @param {string} [options.status] - Filtrar por status
 * @returns {Promise<Client[]>}
 */
export const fetchClients = async (idTenant, idBranch, options = {}) => {
  if (!idTenant || !idBranch) return [];

  const db = getFirebaseDb();
  const clientsRef = collection(db, 'tenants', idTenant, 'branches', idBranch, 'clients');
  
  let q = query(clientsRef, orderBy('createdAt', 'desc'));
  
  if (options.status) {
    q = query(q, where('status', '==', options.status));
  }
  
  if (options.limit) {
    q = query(q, limit(options.limit));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDocToClient);
};

/**
 * Busca cliente por ID
 * @param {string} idTenant - ID do tenant
 * @param {string} idBranch - ID da unidade
 * @param {string} clientId - ID do cliente
 * @returns {Promise<Client | null>}
 */
export const fetchClientById = async (idTenant, idBranch, clientId) => {
  if (!idTenant || !idBranch || !clientId) return null;

  const db = getFirebaseDb();
  const clientRef = doc(db, 'tenants', idTenant, 'branches', idBranch, 'clients', clientId);
  const snapshot = await getDoc(clientRef);

  if (!snapshot.exists()) return null;

  return mapDocToClient(snapshot);
};

/**
 * Atualiza cliente
 * @param {string} idTenant - ID do tenant
 * @param {string} idBranch - ID da unidade
 * @param {string} clientId - ID do cliente
 * @param {UpdateClientDto} payload - Dados a atualizar
 * @param {string} [userId] - ID do usuário que está atualizando
 * @returns {Promise<void>}
 */
export const updateClient = async (idTenant, idBranch, clientId, payload, userId) => {
  if (!idTenant || !idBranch || !clientId) {
    throw new Error('Cliente não identificado.');
  }

  // ✅ VALIDAR SEMPRE
  const validated = validateUpdateClient(payload);

  const db = getFirebaseDb();
  const clientRef = doc(db, 'tenants', idTenant, 'branches', idBranch, 'clients', clientId);

  const sanitizeString = (value) =>
    value !== undefined ? String(value).trim() : undefined;

  const sanitized = {
    firstName: sanitizeString(validated.firstName),
    lastName: sanitizeString(validated.lastName),
    gender: sanitizeString(validated.gender),
    birthDate: sanitizeString(validated.birthDate),
    email: sanitizeString(validated.email),
    phone: sanitizeString(validated.phone),
    whatsapp: sanitizeString(validated.whatsapp),
    responsibleName: sanitizeString(validated.responsibleName),
    responsiblePhone: sanitizeString(validated.responsiblePhone),
    notes: validated.notes ?? undefined,
    status: validated.status,
    address: validated.address
      ? {
          zipCode: sanitizeString(validated.address.zipCode) || '',
          state: sanitizeString(validated.address.state) || '',
          city: sanitizeString(validated.address.city) || '',
          neighborhood: sanitizeString(validated.address.neighborhood) || '',
          address: sanitizeString(validated.address.address) || '',
          number: sanitizeString(validated.address.number) || ''
        }
      : undefined,
    updatedAt: serverTimestamp()
  };

  await updateDoc(clientRef, omitUndefined(sanitized));
};

/**
 * Busca clientes por nome
 * @param {string} idTenant - ID do tenant
 * @param {string} idBranch - ID da unidade
 * @param {string} namePrefix - Prefixo do nome
 * @returns {Promise<Client[]>}
 */
export const searchClientsByName = async (idTenant, idBranch, namePrefix) => {
  if (!idTenant || !idBranch) return [];
  
  const prefix = String(namePrefix || '').trim();
  if (!prefix) return [];

  const db = getFirebaseDb();
  const clientsRef = collection(db, 'tenants', idTenant, 'branches', idBranch, 'clients');

  const q = query(
    clientsRef,
    where('firstName', '>=', prefix),
    where('firstName', '<=', `${prefix}\uf8ff`)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDocToClient);
};

/**
 * Verifica se CPF já existe
 * @param {string} idTenant - ID do tenant
 * @param {string} cpf - CPF a verificar
 * @param {string} [excludeClientId] - ID do cliente a excluir da busca
 * @returns {Promise<boolean>}
 */
export const checkDuplicateCPF = async (idTenant, cpf, excludeClientId) => {
  if (!idTenant || !cpf) return false;

  const db = getFirebaseDb();
  
  // Buscar em todas as branches do tenant
  const tenantsRef = collection(db, 'tenants', idTenant, 'branches');
  const branchesSnapshot = await getDocs(tenantsRef);
  
  for (const branchDoc of branchesSnapshot.docs) {
    const clientsRef = collection(db, 'tenants', idTenant, 'branches', branchDoc.id, 'clients');
    const q = query(clientsRef, where('cpf', '==', cpf));
    const snapshot = await getDocs(q);
    
    for (const doc of snapshot.docs) {
      if (excludeClientId && doc.id === excludeClientId) continue;
      return true; // CPF já existe
    }
  }
  
  return false;
};

/**
 * Conta clientes por status
 * @param {string} idTenant - ID do tenant
 * @param {string} idBranch - ID da unidade
 * @returns {Promise<Record<string, number>>}
 */
export const countClientsByStatus = async (idTenant, idBranch) => {
  if (!idTenant || !idBranch) return {};

  const clients = await fetchClients(idTenant, idBranch);
  
  const counts = {};
  clients.forEach(client => {
    counts[client.status] = (counts[client.status] || 0) + 1;
  });
  
  return counts;
};
```

---

### 3. `{module}.domain.js` - Lógica de Negócio

**Responsabilidade:** Cálculos, transformações e regras de negócio

```javascript
// clients.domain.js

import { ClientStatus } from './clients.schemas.js';

// ============================================
// CÁLCULOS
// ============================================

/**
 * Calcula idade do cliente
 * @param {string} birthDate - Data de nascimento (YYYY-MM-DD)
 * @returns {number} Idade em anos
 */
export const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Verifica se cliente é menor de idade
 * @param {string} birthDate - Data de nascimento (YYYY-MM-DD)
 * @returns {boolean}
 */
export const isMinor = (birthDate) => {
  return calculateAge(birthDate) < 18;
};

/**
 * Calcula dias como cliente
 * @param {any} createdAt - Firebase Timestamp
 * @returns {number} Dias desde criação
 */
export const calculateDaysAsClient = (createdAt) => {
  if (!createdAt || !createdAt.toDate) return 0;
  
  const created = createdAt.toDate();
  const today = new Date();
  const diffTime = Math.abs(today - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// ============================================
// TRANSFORMAÇÕES
// ============================================

/**
 * Normaliza payload do cliente
 * @param {any} payload - Dados brutos
 * @returns {CreateClientDto} Dados normalizados
 */
export const normalizeClientPayload = (payload) => {
  return {
    ...payload,
    firstName: String(payload.firstName || '').trim(),
    lastName: String(payload.lastName || '').trim(),
    email: String(payload.email || '').trim().toLowerCase(),
    phone: String(payload.phone || '').replace(/\D/g, ''),
    whatsapp: payload.whatsapp ? String(payload.whatsapp).replace(/\D/g, '') : undefined,
    cpf: payload.cpf ? String(payload.cpf).replace(/\D/g, '') : undefined
  };
};

/**
 * Formata nome completo
 * @param {string} firstName - Nome
 * @param {string} lastName - Sobrenome
 * @returns {string} Nome completo formatado
 */
export const formatFullName = (firstName, lastName) => {
  return `${firstName} ${lastName}`.trim();
};

/**
 * Formata CPF
 * @param {string} cpf - CPF (apenas números)
 * @returns {string} CPF formatado (XXX.XXX.XXX-XX)
 */
export const formatCPF = (cpf) => {
  if (!cpf || cpf.length !== 11) return cpf;
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata telefone
 * @param {string} phone - Telefone (apenas números)
 * @returns {string} Telefone formatado
 */
export const formatPhone = (phone) => {
  if (!phone) return phone;
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

/**
 * Extrai iniciais do nome
 * @param {string} firstName - Nome
 * @param {string} lastName - Sobrenome
 * @returns {string} Iniciais (ex: "JS")
 */
export const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
};

/**
 * Cria endereço vazio
 * @returns {Address}
 */
export const emptyAddress = () => ({
  zipCode: '',
  state: '',
  city: '',
  neighborhood: '',
  address: '',
  number: ''
});

// ============================================
// VALIDAÇÕES DE NEGÓCIO
// ============================================

/**
 * Verifica se cliente pode ser matriculado
 * @param {Client} client - Cliente
 * @returns {{canEnroll: boolean, reason?: string}}
 */
export const canEnrollClient = (client) => {
  // Já tem matrícula ativa
  if (client.activeMembershipId) {
    return {
      canEnroll: false,
      reason: 'Cliente já possui matrícula ativa'
    };
  }
  
  // Status não permite
  if (client.status === ClientStatus.CANCELED) {
    return {
      canEnroll: false,
      reason: 'Cliente cancelado não pode ser matriculado'
    };
  }
  
  // Tem dívida
  if (client.debtCents && client.debtCents > 0) {
    return {
      canEnroll: false,
      reason: 'Cliente possui débitos pendentes'
    };
  }
  
  return { canEnroll: true };
};

/**
 * Verifica se cliente pode fazer check-in
 * @param {Client} client - Cliente
 * @returns {{canCheckIn: boolean, reason?: string}}
 */
export const canCheckIn = (client) => {
  // Sem matrícula ativa
  if (!client.activeMembershipId) {
    return {
      canCheckIn: false,
      reason: 'Cliente sem matrícula ativa'
    };
  }
  
  // Status suspenso
  if (client.status === ClientStatus.SUSPENDED) {
    return {
      canCheckIn: false,
      reason: 'Matrícula suspensa por inadimplência'
    };
  }
  
  // Status pausado
  if (client.status === ClientStatus.PAUSED) {
    return {
      canCheckIn: false,
      reason: 'Matrícula pausada'
    };
  }
  
  // Status expirado
  if (client.status === ClientStatus.EXPIRED) {
    return {
      canCheckIn: false,
      reason: 'Matrícula expirada'
    };
  }
  
  // Status cancelado
  if (client.status === ClientStatus.CANCELED) {
    return {
      canCheckIn: false,
      reason: 'Matrícula cancelada'
    };
  }
  
  return { canCheckIn: true };
};

/**
 * Verifica se cliente está em risco de abandono
 * @param {Client} client - Cliente
 * @param {number} daysThreshold - Dias sem presença para considerar risco
 * @returns {boolean}
 */
export const isAtRiskOfAbandonment = (client, daysThreshold = 15) => {
  if (!client.lastPresenceDateKey) return false;
  
  const lastPresence = new Date(client.lastPresenceDateKey);
  const today = new Date();
  const daysSinceLastPresence = Math.floor((today - lastPresence) / (1000 * 60 * 60 * 24));
  
  return daysSinceLastPresence >= daysThreshold;
};

// ============================================
// MÁQUINA DE ESTADOS
// ============================================

/**
 * Transições de status permitidas
 */
const STATUS_TRANSITIONS = {
  [ClientStatus.LEAD]: [ClientStatus.PENDING, ClientStatus.CANCELED],
  [ClientStatus.PENDING]: [ClientStatus.ACTIVE, ClientStatus.CANCELED],
  [ClientStatus.ACTIVE]: [ClientStatus.PAUSED, ClientStatus.SUSPENDED, ClientStatus.EXPIRED, ClientStatus.CANCELED],
  [ClientStatus.PAUSED]: [ClientStatus.ACTIVE, ClientStatus.CANCELED],
  [ClientStatus.SUSPENDED]: [ClientStatus.ACTIVE, ClientStatus.CANCELED],
  [ClientStatus.EXPIRED]: [ClientStatus.ACTIVE, ClientStatus.CANCELED],
  [ClientStatus.CANCELED]: []
};

/**
 * Verifica se transição de status é válida
 * @param {string} currentStatus - Status atual
 * @param {string} newStatus - Novo status
 * @returns {boolean}
 */
export const isValidStatusTransition = (currentStatus, newStatus) => {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

/**
 * Obtém próximos status possíveis
 * @param {string} currentStatus - Status atual
 * @returns {string[]}
 */
export const getNextPossibleStatuses = (currentStatus) => {
  return STATUS_TRANSITIONS[currentStatus] || [];
};
```

---

### 4. `index.js` - Exports

```javascript
// clients/index.js

// Schemas e validações
export * from './clients.schemas.js';

// Operações de banco
export * from './clients.db.js';

// Lógica de negócio
export * from './clients.domain.js';
```

---

## ✅ Validação com Zod (OBRIGATÓRIA)

### Por que Zod é CRÍTICO em JavaScript?

```javascript
// ❌ SEM Zod - PERIGOSO
export const createClient = async (idTenant, idBranch, data) => {
  // data pode ser QUALQUER COISA
  // { firstName: 123, email: "invalid" } ← Aceita!
  await setDoc(clientRef, data);
};

// ✅ COM Zod - SEGURO
export const createClient = async (idTenant, idBranch, data) => {
  const validated = CreateClientSchema.parse(data);
  // validated é GARANTIDO ser válido
  await setDoc(clientRef, validated);
};
```

### Padrões de Validação

```javascript
// 1. Parse (throw em erro)
try {
  const validated = CreateClientSchema.parse(data);
  // usar validated
} catch (error) {
  console.error('Validação falhou:', error.errors);
}

// 2. SafeParse (retorna resultado)
const result = CreateClientSchema.safeParse(data);
if (result.success) {
  const validated = result.data;
  // usar validated
} else {
  console.error('Validação falhou:', result.error.errors);
}

// 3. Validação parcial
const PartialSchema = CreateClientSchema.partial();
const validated = PartialSchema.parse(partialData);
```

---

## 📝 JSDoc e Documentação

### Padrões de JSDoc

```javascript
/**
 * Descrição breve da função
 * 
 * Descrição detalhada (opcional)
 * 
 * @param {tipo} nomeParam - Descrição do parâmetro
 * @param {tipo} [nomeParamOpcional] - Parâmetro opcional
 * @param {Object} options - Objeto de opções
 * @param {string} options.prop1 - Propriedade 1
 * @param {number} [options.prop2] - Propriedade 2 (opcional)
 * @returns {tipo} Descrição do retorno
 * @throws {Error} Quando ocorre erro
 * 
 * @example
 * const result = minhaFuncao('param1', { prop1: 'valor' });
 */
```

### Tipos Complexos

```javascript
/**
 * @typedef {Object} Client
 * @property {string} id
 * @property {string} idTenant
 * @property {string} firstName
 * @property {string} lastName
 * @property {'male'|'female'|'other'} gender
 * @property {Address} address
 * @property {Guardian} [guardian]
 */

/**
 * @typedef {Object} Address
 * @property {string} zipCode
 * @property {string} state
 * @property {string} city
 */
```

---

## 🔥 Firebase Firestore

### Configuração

```javascript
// services/firebase/index.js

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const getFirebaseDb = () => db;
```

### Padrões Firebase

```javascript
// ✅ Usar serverTimestamp() para timestamps
import { serverTimestamp } from 'firebase/firestore';

const data = {
  ...clientData,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};

// ✅ Usar transações para operações atômicas
import { runTransaction } from 'firebase/firestore';

await runTransaction(db, async (tx) => {
  const doc1 = await tx.get(ref1);
  tx.update(ref2, { value: doc1.data().value });
});

// ✅ Usar batch para múltiplas escritas
import { writeBatch } from 'firebase/firestore';

const batch = writeBatch(db);
batch.set(ref1, data1);
batch.update(ref2, data2);
await batch.commit();
```

---

## 🎯 Padrões e Convenções

### Nomenclatura

```javascript
// ✅ Arquivos: kebab-case
clients.schemas.js
clients.db.js
clients.domain.js

// ✅ Variáveis e funções: camelCase
const clientName = 'João';
const getClientById = () => {};

// ✅ Constantes: UPPER_SNAKE_CASE
const MAX_CLIENTS = 100;
const DEFAULT_STATUS = 'active';

// ✅ Schemas Zod: PascalCase + Schema
const ClientSchema = z.object({});
const CreateClientSchema = z.object({});

// ✅ Enums: PascalCase (objeto)
const ClientStatus = {
  LEAD: 'lead',
  ACTIVE: 'active'
};
```

### Organização de Imports

```javascript
// 1. Bibliotecas externas
import { z } from 'zod';
import { collection, doc } from 'firebase/firestore';

// 2. Serviços internos
import { getFirebaseDb } from '@/services/firebase';
import { formatDate } from '@/utils/formatters';

// 3. Módulos locais
import { ClientSchema } from './clients.schemas.js';
import { getClientById } from './clients.db.js';

// 4. Constantes
import { CLIENT_STATUS } from '@/constants/status';
```

---

## 📋 Checklist de Qualidade

### Por Módulo

- [ ] **Schemas (`{module}.schemas.js`)**
  - [ ] Todos os schemas Zod definidos
  - [ ] JSDoc types com `@typedef`
  - [ ] Validadores exportados
  - [ ] Enums definidos como objetos
  - [ ] Validações customizadas documentadas

- [ ] **Database (`{module}.db.js`)**
  - [ ] CRUD completo (create, read, update, delete)
  - [ ] Validação com Zod em TODAS as entradas
  - [ ] Usa Firebase Firestore corretamente
  - [ ] serverTimestamp() para timestamps
  - [ ] Tratamento de erros
  - [ ] JSDoc em todas as funções

- [ ] **Domain (`{module}.domain.js`)**
  - [ ] Cálculos puros (sem side-effects)
  - [ ] Transformações de dados
  - [ ] Validações de negócio
  - [ ] Máquina de estados (se aplicável)
  - [ ] JSDoc em todas as funções
  - [ ] Funções testáveis

- [ ] **Index (`index.js`)**
  - [ ] Exports organizados
  - [ ] Re-exports de todos os arquivos
  - [ ] Sem implementações

### Geral

- [ ] Sem código duplicado
- [ ] Sem magic numbers
- [ ] Constantes em arquivos separados
- [ ] Testes unitários
- [ ] Documentação atualizada
- [ ] Usa Firebase (não Supabase)
- [ ] Usa nomenclatura `clients` (não `students`)

---

**Esta é a arquitetura ideal para projetos JavaScript com Firebase Firestore!** 🚀
