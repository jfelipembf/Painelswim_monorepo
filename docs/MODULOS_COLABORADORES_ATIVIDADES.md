# 👥 Módulos: Colaboradores e Atividades

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Módulo: Collaborators (Colaboradores)](#módulo-collaborators-colaboradores)
3. [Módulo: Activities (Atividades)](#módulo-activities-atividades)
4. [Integração entre Módulos](#integração-entre-módulos)
5. [Fluxos Completos](#fluxos-completos)
6. [Estrutura de Arquivos](#estrutura-de-arquivos)
7. [Exemplos Práticos](#exemplos-práticos)

---

## 🎯 Visão Geral

### Colaboradores (Collaborators)

**Responsabilidade:** Gerenciar todos os colaboradores da academia (instrutores, coordenadores, recepcionistas, etc).

**Funcionalidades:**
- ✅ Cadastro de colaboradores
- ✅ Gestão de funções (roles)
- ✅ Controle de horários
- ✅ Gestão de turmas atribuídas
- ✅ Controle de permissões
- ✅ Histórico de atividades

### Atividades (Activities)

**Responsabilidade:** Gerenciar atividades/modalidades oferecidas pela academia.

**Funcionalidades:**
- ✅ Cadastro de atividades (natação, hidroginástica, etc)
- ✅ Níveis de proficiência
- ✅ Tópicos de avaliação
- ✅ Planos de ensino
- ✅ Materiais necessários

---

## 👥 Módulo: Collaborators (Colaboradores)

### Estrutura de Arquivos

```
modules/collaborators/
├── collaborators.schemas.js    # Validação Zod + tipos
├── collaborators.db.js         # CRUD Firebase
├── collaborators.domain.js     # Lógica de negócio
└── index.js                    # Exports
```

---

### 1. collaborators.schemas.js

```javascript
import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

/**
 * Funções/Cargos dos colaboradores
 */
export const CollaboratorRole = {
  ADMIN: 'admin',              // Administrador
  COORDINATOR: 'coordinator',  // Coordenador
  INSTRUCTOR: 'instructor',    // Instrutor
  RECEPTIONIST: 'receptionist',// Recepcionista
  STAFF: 'staff'              // Auxiliar
};

/**
 * Status do colaborador
 */
export const CollaboratorStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on_leave',       // Afastado
  SUSPENDED: 'suspended'
};

/**
 * Tipo de contrato
 */
export const ContractType = {
  CLT: 'clt',
  PJ: 'pj',
  FREELANCER: 'freelancer',
  INTERN: 'intern'
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
  street: z.string().min(1, 'Rua obrigatória'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional()
});

/**
 * Schema de documentos
 */
export const DocumentsSchema = z.object({
  cpf: z.string().regex(/^\d{11}$/, 'CPF inválido'),
  rg: z.string().optional(),
  ctps: z.string().optional(),        // Carteira de Trabalho
  pis: z.string().optional(),
  cref: z.string().optional()         // Registro profissional (para instrutores)
});

/**
 * Schema de dados bancários
 */
export const BankDataSchema = z.object({
  bankCode: z.string().min(1),
  bankName: z.string().min(1),
  agencyNumber: z.string().min(1),
  accountNumber: z.string().min(1),
  accountType: z.enum(['checking', 'savings']),
  pixKey: z.string().optional()
});

/**
 * Schema de horário de trabalho
 */
export const WorkScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6), // 0 = Domingo, 6 = Sábado
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  breakEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional()
});

/**
 * Schema de permissões
 */
export const PermissionsSchema = z.object({
  canManageClients: z.boolean().default(false),
  canManageSales: z.boolean().default(false),
  canManageClasses: z.boolean().default(false),
  canManageCollaborators: z.boolean().default(false),
  canViewReports: z.boolean().default(false),
  canManageFinances: z.boolean().default(false),
  canCheckInClients: z.boolean().default(true),
  canEvaluateClients: z.boolean().default(false)
});

// ============================================
// SCHEMA PRINCIPAL
// ============================================

/**
 * Schema para criar colaborador
 */
export const CreateCollaboratorSchema = z.object({
  // Dados pessoais
  firstName: z.string().min(1, 'Nome obrigatório').max(50),
  lastName: z.string().min(1, 'Sobrenome obrigatório').max(50),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female', 'other']),
  photoUrl: z.string().url().optional(),
  
  // Contato
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido').max(15),
  alternativePhone: z.string().min(10).max(15).optional(),
  
  // Endereço
  address: AddressSchema,
  
  // Documentos
  documents: DocumentsSchema,
  
  // Dados bancários
  bankData: BankDataSchema.optional(),
  
  // Profissional
  role: z.enum(Object.values(CollaboratorRole)),
  contractType: z.enum(Object.values(ContractType)),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  salaryCents: z.number().int().nonnegative().optional(),
  
  // Horários
  workSchedule: z.array(WorkScheduleSchema).optional(),
  
  // Permissões
  permissions: PermissionsSchema.optional(),
  
  // Metadados
  notes: z.string().optional(),
  status: z.enum(Object.values(CollaboratorStatus)).optional()
});

/**
 * Schema para atualizar colaborador
 */
export const UpdateCollaboratorSchema = CreateCollaboratorSchema.partial();

/**
 * Schema do colaborador completo (com campos do banco)
 */
export const CollaboratorSchema = CreateCollaboratorSchema.extend({
  id: z.string(),
  idTenant: z.string(),
  idBranch: z.string(),
  friendlyId: z.string().optional(),
  status: z.enum(Object.values(CollaboratorStatus)),
  userId: z.string().optional(), // ID do usuário no Firebase Auth
  lastLoginAt: z.any().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
  createdByUserId: z.string().optional()
});

// ============================================
// JSDOC TYPES
// ============================================

/**
 * @typedef {z.infer<typeof AddressSchema>} Address
 */

/**
 * @typedef {z.infer<typeof DocumentsSchema>} Documents
 */

/**
 * @typedef {z.infer<typeof BankDataSchema>} BankData
 */

/**
 * @typedef {z.infer<typeof WorkScheduleSchema>} WorkSchedule
 */

/**
 * @typedef {z.infer<typeof PermissionsSchema>} Permissions
 */

/**
 * @typedef {z.infer<typeof CreateCollaboratorSchema>} CreateCollaboratorDto
 */

/**
 * @typedef {z.infer<typeof UpdateCollaboratorSchema>} UpdateCollaboratorDto
 */

/**
 * @typedef {z.infer<typeof CollaboratorSchema>} Collaborator
 */

// ============================================
// VALIDADORES
// ============================================

/**
 * Valida dados para criar colaborador
 * @param {unknown} data - Dados a validar
 * @returns {CreateCollaboratorDto} Dados validados
 * @throws {z.ZodError} Se validação falhar
 */
export const validateCreateCollaborator = (data) => {
  return CreateCollaboratorSchema.parse(data);
};

/**
 * Valida dados para atualizar colaborador
 * @param {unknown} data - Dados a validar
 * @returns {UpdateCollaboratorDto} Dados validados
 * @throws {z.ZodError} Se validação falhar
 */
export const validateUpdateCollaborator = (data) => {
  return UpdateCollaboratorSchema.parse(data);
};
```

---

### 2. collaborators.db.js

```javascript
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
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';

import { getFirebaseDb } from '@/services/firebase';
import { omitUndefined } from '@/utils/omitUndefined';
import { validateCreateCollaborator, validateUpdateCollaborator } from './collaborators.schemas.js';

// ============================================
// HELPERS PRIVADOS
// ============================================

/**
 * Mapeia documento do Firestore para entidade
 * @param {import('firebase/firestore').DocumentSnapshot} snapshot
 * @returns {Collaborator}
 * @private
 */
const mapDocToCollaborator = (snapshot) => {
  const data = snapshot.data();
  if (!data) throw new Error('Colaborador inválido.');

  return {
    id: snapshot.id,
    idTenant: String(data.idTenant || ''),
    idBranch: String(data.idBranch || ''),
    friendlyId: data.friendlyId,
    firstName: String(data.firstName || ''),
    lastName: String(data.lastName || ''),
    birthDate: String(data.birthDate || ''),
    gender: String(data.gender || ''),
    photoUrl: data.photoUrl,
    email: String(data.email || ''),
    phone: data.phone,
    alternativePhone: data.alternativePhone,
    address: data.address || {},
    documents: data.documents || {},
    bankData: data.bankData,
    role: data.role,
    contractType: data.contractType,
    hireDate: data.hireDate,
    salaryCents: data.salaryCents,
    workSchedule: data.workSchedule || [],
    permissions: data.permissions || {},
    notes: data.notes,
    status: data.status || 'active',
    userId: data.userId,
    lastLoginAt: data.lastLoginAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    createdByUserId: data.createdByUserId
  };
};

/**
 * Gera friendly ID
 * @param {number} value
 * @returns {string}
 * @private
 */
const toFriendlyId = (value) => {
  return `COL-${String(Math.max(0, value)).padStart(4, '0')}`;
};

// ============================================
// CRUD BÁSICO
// ============================================

/**
 * Cria um novo colaborador
 * @param {string} idTenant
 * @param {string} idBranch
 * @param {CreateCollaboratorDto} payload
 * @param {string} [userId]
 * @returns {Promise<string>} ID do colaborador criado
 */
export const createCollaborator = async (idTenant, idBranch, payload, userId) => {
  if (!idTenant || !idBranch) {
    throw new Error('Academia/unidade não identificadas.');
  }

  // ✅ VALIDAR SEMPRE
  const validated = validateCreateCollaborator(payload);

  const db = getFirebaseDb();
  const collaboratorsRef = collection(db, 'tenants', idTenant, 'branches', idBranch, 'collaborators');
  const counterRef = doc(db, 'tenants', idTenant, 'branches', idBranch, 'counters', 'collaborators');
  const collaboratorRef = doc(collaboratorsRef);

  await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const nextRaw = counterSnap.exists() ? counterSnap.data().nextFriendlyId : undefined;
    const next = typeof nextRaw === 'number' && Number.isFinite(nextRaw) ? nextRaw : 1;
    const friendlyId = toFriendlyId(next);

    tx.set(counterRef, {
      nextFriendlyId: next + 1,
      updatedAt: serverTimestamp()
    }, { merge: true });

    const collaboratorData = omitUndefined({
      idTenant,
      idBranch,
      friendlyId,
      ...validated,
      status: validated.status || 'active',
      createdByUserId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    tx.set(collaboratorRef, collaboratorData);
  });

  return collaboratorRef.id;
};

/**
 * Busca todos os colaboradores
 * @param {string} idTenant
 * @param {string} idBranch
 * @param {Object} [options]
 * @param {string} [options.role] - Filtrar por função
 * @param {string} [options.status] - Filtrar por status
 * @returns {Promise<Collaborator[]>}
 */
export const fetchCollaborators = async (idTenant, idBranch, options = {}) => {
  if (!idTenant || !idBranch) return [];

  const db = getFirebaseDb();
  const collaboratorsRef = collection(db, 'tenants', idTenant, 'branches', idBranch, 'collaborators');
  
  let q = query(collaboratorsRef, orderBy('createdAt', 'desc'));
  
  if (options.role) {
    q = query(q, where('role', '==', options.role));
  }
  
  if (options.status) {
    q = query(q, where('status', '==', options.status));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDocToCollaborator);
};

/**
 * Busca colaborador por ID
 * @param {string} idTenant
 * @param {string} idBranch
 * @param {string} collaboratorId
 * @returns {Promise<Collaborator | null>}
 */
export const fetchCollaboratorById = async (idTenant, idBranch, collaboratorId) => {
  if (!idTenant || !idBranch || !collaboratorId) return null;

  const db = getFirebaseDb();
  const collaboratorRef = doc(db, 'tenants', idTenant, 'branches', idBranch, 'collaborators', collaboratorId);
  const snapshot = await getDoc(collaboratorRef);

  if (!snapshot.exists()) return null;

  return mapDocToCollaborator(snapshot);
};

/**
 * Atualiza colaborador
 * @param {string} idTenant
 * @param {string} idBranch
 * @param {string} collaboratorId
 * @param {UpdateCollaboratorDto} payload
 * @param {string} [userId]
 * @returns {Promise<void>}
 */
export const updateCollaborator = async (idTenant, idBranch, collaboratorId, payload, userId) => {
  if (!idTenant || !idBranch || !collaboratorId) {
    throw new Error('Colaborador não identificado.');
  }

  // ✅ VALIDAR SEMPRE
  const validated = validateUpdateCollaborator(payload);

  const db = getFirebaseDb();
  const collaboratorRef = doc(db, 'tenants', idTenant, 'branches', idBranch, 'collaborators', collaboratorId);

  await updateDoc(collaboratorRef, omitUndefined({
    ...validated,
    updatedAt: serverTimestamp(),
    updatedBy: userId
  }));
};

/**
 * Busca instrutores disponíveis
 * @param {string} idTenant
 * @param {string} idBranch
 * @returns {Promise<Collaborator[]>}
 */
export const fetchInstructors = async (idTenant, idBranch) => {
  return fetchCollaborators(idTenant, idBranch, { 
    role: 'instructor',
    status: 'active'
  });
};

/**
 * Busca colaborador de uma turma específica
 * @param {string} idTenant
 * @param {string} idBranch
 * @param {string} employeeId - ID do colaborador (instrutor)
 * @returns {Promise<Collaborator | null>}
 */
export const fetchCollaboratorForClass = async (idTenant, idBranch, employeeId) => {
  if (!idTenant || !idBranch || !employeeId) return null;

  return fetchCollaboratorById(idTenant, idBranch, employeeId);
};
```

---

### 3. collaborators.domain.js

```javascript
import { CollaboratorRole, CollaboratorStatus } from './collaborators.schemas.js';

// ============================================
// CÁLCULOS
// ============================================

/**
 * Calcula tempo de casa em meses
 * @param {string} hireDate - Data de contratação (YYYY-MM-DD)
 * @returns {number} Meses de casa
 */
export const calculateTenureMonths = (hireDate) => {
  const today = new Date();
  const hire = new Date(hireDate);
  
  const months = (today.getFullYear() - hire.getFullYear()) * 12 + 
                 (today.getMonth() - hire.getMonth());
  
  return Math.max(0, months);
};

/**
 * Calcula idade do colaborador
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

// ============================================
// TRANSFORMAÇÕES
// ============================================

/**
 * Formata nome completo
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string}
 */
export const formatFullName = (firstName, lastName) => {
  return `${firstName} ${lastName}`.trim();
};

/**
 * Formata CPF
 * @param {string} cpf - CPF (apenas números)
 * @returns {string} CPF formatado
 */
export const formatCPF = (cpf) => {
  if (!cpf || cpf.length !== 11) return cpf;
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Obtém label da função
 * @param {string} role
 * @returns {string}
 */
export const getRoleLabel = (role) => {
  const labels = {
    [CollaboratorRole.ADMIN]: 'Administrador',
    [CollaboratorRole.COORDINATOR]: 'Coordenador',
    [CollaboratorRole.INSTRUCTOR]: 'Instrutor',
    [CollaboratorRole.RECEPTIONIST]: 'Recepcionista',
    [CollaboratorRole.STAFF]: 'Auxiliar'
  };
  
  return labels[role] || role;
};

// ============================================
// VALIDAÇÕES DE NEGÓCIO
// ============================================

/**
 * Verifica se colaborador pode dar aulas
 * @param {Collaborator} collaborator
 * @returns {{canTeach: boolean, reason?: string}}
 */
export const canTeach = (collaborator) => {
  if (collaborator.role !== CollaboratorRole.INSTRUCTOR) {
    return {
      canTeach: false,
      reason: 'Apenas instrutores podem dar aulas'
    };
  }
  
  if (collaborator.status !== CollaboratorStatus.ACTIVE) {
    return {
      canTeach: false,
      reason: 'Colaborador não está ativo'
    };
  }
  
  if (!collaborator.documents?.cref) {
    return {
      canTeach: false,
      reason: 'CREF não cadastrado'
    };
  }
  
  return { canTeach: true };
};

/**
 * Verifica se colaborador tem permissão
 * @param {Collaborator} collaborator
 * @param {string} permission - Nome da permissão
 * @returns {boolean}
 */
export const hasPermission = (collaborator, permission) => {
  // Admin tem todas as permissões
  if (collaborator.role === CollaboratorRole.ADMIN) {
    return true;
  }
  
  return collaborator.permissions?.[permission] === true;
};

/**
 * Verifica se colaborador está disponível em um horário
 * @param {Collaborator} collaborator
 * @param {number} dayOfWeek - 0-6 (0 = Domingo)
 * @param {string} time - HH:MM
 * @returns {boolean}
 */
export const isAvailableAt = (collaborator, dayOfWeek, time) => {
  if (!collaborator.workSchedule || collaborator.workSchedule.length === 0) {
    return false;
  }
  
  const schedule = collaborator.workSchedule.find(s => s.dayOfWeek === dayOfWeek);
  if (!schedule) return false;
  
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(schedule.startTime);
  const endMinutes = timeToMinutes(schedule.endTime);
  
  // Verificar se está no horário de trabalho
  if (timeMinutes < startMinutes || timeMinutes > endMinutes) {
    return false;
  }
  
  // Verificar se não está no horário de intervalo
  if (schedule.breakStartTime && schedule.breakEndTime) {
    const breakStartMinutes = timeToMinutes(schedule.breakStartTime);
    const breakEndMinutes = timeToMinutes(schedule.breakEndTime);
    
    if (timeMinutes >= breakStartMinutes && timeMinutes <= breakEndMinutes) {
      return false;
    }
  }
  
  return true;
};

/**
 * Converte horário HH:MM para minutos
 * @param {string} time - HH:MM
 * @returns {number}
 * @private
 */
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// ============================================
// PERMISSÕES PADRÃO POR FUNÇÃO
// ============================================

/**
 * Obtém permissões padrão para uma função
 * @param {string} role
 * @returns {Permissions}
 */
export const getDefaultPermissions = (role) => {
  const defaults = {
    [CollaboratorRole.ADMIN]: {
      canManageClients: true,
      canManageSales: true,
      canManageClasses: true,
      canManageCollaborators: true,
      canViewReports: true,
      canManageFinances: true,
      canCheckInClients: true,
      canEvaluateClients: true
    },
    [CollaboratorRole.COORDINATOR]: {
      canManageClients: true,
      canManageSales: true,
      canManageClasses: true,
      canManageCollaborators: false,
      canViewReports: true,
      canManageFinances: false,
      canCheckInClients: true,
      canEvaluateClients: true
    },
    [CollaboratorRole.INSTRUCTOR]: {
      canManageClients: false,
      canManageSales: false,
      canManageClasses: false,
      canManageCollaborators: false,
      canViewReports: false,
      canManageFinances: false,
      canCheckInClients: true,
      canEvaluateClients: true
    },
    [CollaboratorRole.RECEPTIONIST]: {
      canManageClients: true,
      canManageSales: true,
      canManageClasses: false,
      canManageCollaborators: false,
      canViewReports: false,
      canManageFinances: false,
      canCheckInClients: true,
      canEvaluateClients: false
    },
    [CollaboratorRole.STAFF]: {
      canManageClients: false,
      canManageSales: false,
      canManageClasses: false,
      canManageCollaborators: false,
      canViewReports: false,
      canManageFinances: false,
      canCheckInClients: true,
      canEvaluateClients: false
    }
  };
  
  return defaults[role] || {};
};
```

---

## 🎯 Módulo: Activities (Atividades)

### Estrutura de Arquivos

```
modules/activities/
├── activities.schemas.js
├── activities.db.js
├── activities.domain.js
└── index.js
```

---

### 1. activities.schemas.js

```javascript
import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

/**
 * Status da atividade
 */
export const ActivityStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
};

/**
 * Tipo de atividade
 */
export const ActivityType = {
  SWIMMING: 'swimming',           // Natação
  WATER_AEROBICS: 'water_aerobics', // Hidroginástica
  AQUA_FITNESS: 'aqua_fitness',   // Fitness aquático
  BABY_SWIMMING: 'baby_swimming', // Natação para bebês
  SYNCHRONIZED: 'synchronized',    // Nado sincronizado
  WATER_POLO: 'water_polo',       // Polo aquático
  OTHER: 'other'
};

// ============================================
// SCHEMAS BASE
// ============================================

/**
 * Schema de nível de proficiência
 */
export const ProficiencyLevelSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  order: z.number().int().nonnegative(),
  description: z.string().optional(),
  color: z.string().optional() // Cor para UI (hex)
});

/**
 * Schema de tópico de avaliação
 */
export const EvaluationTopicSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().nonnegative(),
  levels: z.array(ProficiencyLevelSchema)
});

/**
 * Schema de material necessário
 */
export const MaterialSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().positive().optional(),
  isOptional: z.boolean().default(false)
});

// ============================================
// SCHEMA PRINCIPAL
// ============================================

/**
 * Schema para criar atividade
 */
export const CreateActivitySchema = z.object({
  // Básico
  name: z.string().min(1, 'Nome obrigatório').max(100),
  type: z.enum(Object.values(ActivityType)),
  description: z.string().optional(),
  iconUrl: z.string().url().optional(),
  color: z.string().optional(), // Cor para UI
  
  // Níveis de proficiência
  proficiencyLevels: z.array(ProficiencyLevelSchema).optional(),
  
  // Tópicos de avaliação
  evaluationTopics: z.array(EvaluationTopicSchema).optional(),
  
  // Materiais necessários
  materials: z.array(MaterialSchema).optional(),
  
  // Configurações
  minAge: z.number().int().nonnegative().optional(),
  maxAge: z.number().int().nonnegative().optional(),
  maxStudentsPerClass: z.number().int().positive().optional(),
  durationMinutes: z.number().int().positive().optional(),
  
  // Requisitos
  requiresMedicalCertificate: z.boolean().default(false),
  requiresSwimmingExperience: z.boolean().default(false),
  
  // Metadados
  notes: z.string().optional(),
  status: z.enum(Object.values(ActivityStatus)).optional()
});

/**
 * Schema para atualizar atividade
 */
export const UpdateActivitySchema = CreateActivitySchema.partial();

/**
 * Schema da atividade completa
 */
export const ActivitySchema = CreateActivitySchema.extend({
  id: z.string(),
  idTenant: z.string(),
  status: z.enum(Object.values(ActivityStatus)),
  createdAt: z.any(),
  updatedAt: z.any(),
  createdByUserId: z.string().optional()
});

// ============================================
// JSDOC TYPES
// ============================================

/**
 * @typedef {z.infer<typeof ProficiencyLevelSchema>} ProficiencyLevel
 */

/**
 * @typedef {z.infer<typeof EvaluationTopicSchema>} EvaluationTopic
 */

/**
 * @typedef {z.infer<typeof MaterialSchema>} Material
 */

/**
 * @typedef {z.infer<typeof CreateActivitySchema>} CreateActivityDto
 */

/**
 * @typedef {z.infer<typeof UpdateActivitySchema>} UpdateActivityDto
 */

/**
 * @typedef {z.infer<typeof ActivitySchema>} Activity
 */

// ============================================
// VALIDADORES
// ============================================

/**
 * Valida dados para criar atividade
 * @param {unknown} data
 * @returns {CreateActivityDto}
 */
export const validateCreateActivity = (data) => {
  return CreateActivitySchema.parse(data);
};

/**
 * Valida dados para atualizar atividade
 * @param {unknown} data
 * @returns {UpdateActivityDto}
 */
export const validateUpdateActivity = (data) => {
  return UpdateActivitySchema.parse(data);
};
```

---

### 2. activities.db.js

```javascript
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
  serverTimestamp
} from 'firebase/firestore';

import { getFirebaseDb } from '@/services/firebase';
import { omitUndefined } from '@/utils/omitUndefined';
import { validateCreateActivity, validateUpdateActivity } from './activities.schemas.js';

// ============================================
// HELPERS PRIVADOS
// ============================================

/**
 * Mapeia documento para entidade
 * @param {import('firebase/firestore').DocumentSnapshot} snapshot
 * @returns {Activity}
 * @private
 */
const mapDocToActivity = (snapshot) => {
  const data = snapshot.data();
  if (!data) throw new Error('Atividade inválida.');

  return {
    id: snapshot.id,
    idTenant: String(data.idTenant || ''),
    name: String(data.name || ''),
    type: data.type,
    description: data.description,
    iconUrl: data.iconUrl,
    color: data.color,
    proficiencyLevels: data.proficiencyLevels || [],
    evaluationTopics: data.evaluationTopics || [],
    materials: data.materials || [],
    minAge: data.minAge,
    maxAge: data.maxAge,
    maxStudentsPerClass: data.maxStudentsPerClass,
    durationMinutes: data.durationMinutes,
    requiresMedicalCertificate: data.requiresMedicalCertificate || false,
    requiresSwimmingExperience: data.requiresSwimmingExperience || false,
    notes: data.notes,
    status: data.status || 'active',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    createdByUserId: data.createdByUserId
  };
};

// ============================================
// CRUD BÁSICO
// ============================================

/**
 * Cria uma nova atividade
 * @param {string} idTenant
 * @param {CreateActivityDto} payload
 * @param {string} [userId]
 * @returns {Promise<string>}
 */
export const createActivity = async (idTenant, payload, userId) => {
  if (!idTenant) throw new Error('Tenant não identificado.');

  // ✅ VALIDAR SEMPRE
  const validated = validateCreateActivity(payload);

  const db = getFirebaseDb();
  const activitiesRef = collection(db, 'tenants', idTenant, 'activities');
  const activityRef = doc(activitiesRef);

  await setDoc(activityRef, omitUndefined({
    idTenant,
    ...validated,
    status: validated.status || 'active',
    createdByUserId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }));

  return activityRef.id;
};

/**
 * Busca todas as atividades
 * @param {string} idTenant
 * @param {Object} [options]
 * @param {string} [options.status]
 * @returns {Promise<Activity[]>}
 */
export const fetchActivities = async (idTenant, options = {}) => {
  if (!idTenant) return [];

  const db = getFirebaseDb();
  const activitiesRef = collection(db, 'tenants', idTenant, 'activities');
  
  let q = query(activitiesRef, orderBy('name'));
  
  if (options.status) {
    q = query(q, where('status', '==', options.status));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDocToActivity);
};

/**
 * Busca atividade por ID
 * @param {string} idTenant
 * @param {string} activityId
 * @returns {Promise<Activity | null>}
 */
export const fetchActivityById = async (idTenant, activityId) => {
  if (!idTenant || !activityId) return null;

  const db = getFirebaseDb();
  const activityRef = doc(db, 'tenants', idTenant, 'activities', activityId);
  const snapshot = await getDoc(activityRef);

  if (!snapshot.exists()) return null;

  return mapDocToActivity(snapshot);
};

/**
 * Atualiza atividade
 * @param {string} idTenant
 * @param {string} activityId
 * @param {UpdateActivityDto} payload
 * @param {string} [userId]
 * @returns {Promise<void>}
 */
export const updateActivity = async (idTenant, activityId, payload, userId) => {
  if (!idTenant || !activityId) throw new Error('Atividade não identificada.');

  // ✅ VALIDAR SEMPRE
  const validated = validateUpdateActivity(payload);

  const db = getFirebaseDb();
  const activityRef = doc(db, 'tenants', idTenant, 'activities', activityId);

  await updateDoc(activityRef, omitUndefined({
    ...validated,
    updatedAt: serverTimestamp(),
    updatedBy: userId
  }));
};
```

---

### 3. activities.domain.js

```javascript
import { ActivityType } from './activities.schemas.js';

// ============================================
// TRANSFORMAÇÕES
// ============================================

/**
 * Obtém label do tipo de atividade
 * @param {string} type
 * @returns {string}
 */
export const getActivityTypeLabel = (type) => {
  const labels = {
    [ActivityType.SWIMMING]: 'Natação',
    [ActivityType.WATER_AEROBICS]: 'Hidroginástica',
    [ActivityType.AQUA_FITNESS]: 'Fitness Aquático',
    [ActivityType.BABY_SWIMMING]: 'Natação para Bebês',
    [ActivityType.SYNCHRONIZED]: 'Nado Sincronizado',
    [ActivityType.WATER_POLO]: 'Polo Aquático',
    [ActivityType.OTHER]: 'Outra'
  };
  
  return labels[type] || type;
};

// ============================================
// VALIDAÇÕES DE NEGÓCIO
// ============================================

/**
 * Verifica se cliente pode participar da atividade
 * @param {Activity} activity
 * @param {number} clientAge
 * @param {boolean} hasMedicalCertificate
 * @returns {{canParticipate: boolean, reason?: string}}
 */
export const canClientParticipate = (activity, clientAge, hasMedicalCertificate = false) => {
  // Verificar idade mínima
  if (activity.minAge && clientAge < activity.minAge) {
    return {
      canParticipate: false,
      reason: `Idade mínima: ${activity.minAge} anos`
    };
  }
  
  // Verificar idade máxima
  if (activity.maxAge && clientAge > activity.maxAge) {
    return {
      canParticipate: false,
      reason: `Idade máxima: ${activity.maxAge} anos`
    };
  }
  
  // Verificar atestado médico
  if (activity.requiresMedicalCertificate && !hasMedicalCertificate) {
    return {
      canParticipate: false,
      reason: 'Atestado médico obrigatório'
    };
  }
  
  return { canParticipate: true };
};

/**
 * Obtém nível de proficiência por ID
 * @param {Activity} activity
 * @param {string} levelId
 * @returns {ProficiencyLevel | null}
 */
export const getProficiencyLevel = (activity, levelId) => {
  if (!activity.proficiencyLevels) return null;
  return activity.proficiencyLevels.find(l => l.id === levelId) || null;
};

/**
 * Obtém próximo nível de proficiência
 * @param {Activity} activity
 * @param {string} currentLevelId
 * @returns {ProficiencyLevel | null}
 */
export const getNextProficiencyLevel = (activity, currentLevelId) => {
  if (!activity.proficiencyLevels || activity.proficiencyLevels.length === 0) {
    return null;
  }
  
  const currentLevel = getProficiencyLevel(activity, currentLevelId);
  if (!currentLevel) return null;
  
  const nextLevel = activity.proficiencyLevels.find(
    l => l.order === currentLevel.order + 1
  );
  
  return nextLevel || null;
};
```

---

## 🔗 Integração entre Módulos

### Como Colaboradores e Atividades se Relacionam

**No sistema atual, a relação acontece através das TURMAS (Classes):**

```javascript
// Estrutura de uma Turma
const classData = {
  id: 'class-456',
  idActivity: 'activity-natacao',      // ← Atividade da turma
  idEmployee: 'col-123',               // ← Instrutor da turma
  idArea: 'area-piscina-1',
  weekday: 1,                          // Segunda-feira
  startTime: '08:00',
  endTime: '09:00',
  maxCapacity: 10,
  status: 'active'
};
```

### Buscar Instrutor de uma Turma

```javascript
/**
 * Busca o instrutor responsável por uma turma
 */
const getClassInstructor = async (tenantId, branchId, classId) => {
  // 1. Buscar dados da turma
  const classData = await fetchClassById(tenantId, branchId, classId);
  
  if (!classData) return null;
  
  // 2. Buscar colaborador pelo idEmployee
  const instructor = await fetchCollaboratorById(
    tenantId, 
    branchId, 
    classData.idEmployee
  );
  
  return instructor;
};
```

### Buscar Atividade de uma Turma

```javascript
/**
 * Busca a atividade de uma turma
 */
const getClassActivity = async (tenantId, branchId, classId) => {
  // 1. Buscar dados da turma
  const classData = await fetchClassById(tenantId, branchId, classId);
  
  if (!classData) return null;
  
  // 2. Buscar atividade pelo idActivity
  const activity = await fetchActivityById(
    tenantId,
    classData.idActivity
  );
  
  return activity;
};
```

### Buscar Turmas de um Instrutor

```javascript
/**
 * Busca todas as turmas de um instrutor
 */
const getInstructorClasses = async (tenantId, branchId, instructorId) => {
  const db = getFirebaseDb();
  const classesRef = collection(
    db, 
    'tenants', tenantId, 
    'branches', branchId, 
    'classes'
  );
  
  const q = query(
    classesRef,
    where('idEmployee', '==', instructorId),
    where('status', '==', 'active')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

### Buscar Turmas de uma Atividade

```javascript
/**
 * Busca todas as turmas de uma atividade
 */
const getActivityClasses = async (tenantId, branchId, activityId) => {
  const db = getFirebaseDb();
  const classesRef = collection(
    db, 
    'tenants', tenantId, 
    'branches', branchId, 
    'classes'
  );
  
  const q = query(
    classesRef,
    where('idActivity', '==', activityId),
    where('status', '==', 'active')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

---

## 🔄 Fluxos Completos

### Fluxo 1: Cadastrar Instrutor e Criar Turma

```javascript
// 1. Criar instrutor
const instructorId = await createCollaborator(tenantId, branchId, {
  firstName: 'João',
  lastName: 'Silva',
  birthDate: '1985-05-15',
  gender: 'male',
  email: 'joao@email.com',
  phone: '11999999999',
  address: {
    zipCode: '12345678',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Centro',
    street: 'Rua A',
    number: '123'
  },
  documents: {
    cpf: '12345678901',
    cref: 'CREF-123456'
  },
  role: 'instructor',
  contractType: 'clt',
  hireDate: '2024-01-01',
  workSchedule: [
    {
      dayOfWeek: 1, // Segunda
      startTime: '08:00',
      endTime: '18:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00'
    }
  ],
  permissions: getDefaultPermissions('instructor')
}, userId);

// 2. Buscar atividade de natação
const activities = await fetchActivities(tenantId, { status: 'active' });
const swimActivity = activities.find(a => a.name === 'Natação');

// 3. Criar turma atribuindo instrutor e atividade
const classId = await createClass(tenantId, branchId, {
  idActivity: swimActivity.id,      // ← Atividade
  idEmployee: instructorId,          // ← Instrutor
  idArea: 'area-piscina-1',
  weekday: 1,                        // Segunda-feira
  startDate: '2024-01-01',
  startTime: '08:00',
  endTime: '09:00',
  durationMinutes: 60,
  maxCapacity: 10,
  status: 'active'
}, userId);
```

### Fluxo 2: Criar Atividade com Níveis

```javascript
// Criar atividade de natação com níveis
const activityId = await createActivity(tenantId, {
  name: 'Natação',
  type: 'swimming',
  description: 'Aulas de natação para todos os níveis',
  proficiencyLevels: [
    {
      id: 'nivel-1',
      name: 'Iniciante',
      order: 1,
      description: 'Adaptação ao meio aquático',
      color: '#4CAF50'
    },
    {
      id: 'nivel-2',
      name: 'Básico',
      order: 2,
      description: 'Fundamentos da natação',
      color: '#2196F3'
    },
    {
      id: 'nivel-3',
      name: 'Intermediário',
      order: 3,
      description: 'Aperfeiçoamento técnico',
      color: '#FF9800'
    },
    {
      id: 'nivel-4',
      name: 'Avançado',
      order: 4,
      description: 'Técnicas avançadas',
      color: '#F44336'
    }
  ],
  evaluationTopics: [
    {
      id: 'topic-1',
      name: 'Respiração',
      order: 1,
      levels: [
        { id: 'resp-1', name: 'Básico', order: 1, levelValue: 1 },
        { id: 'resp-2', name: 'Intermediário', order: 2, levelValue: 2 },
        { id: 'resp-3', name: 'Avançado', order: 3, levelValue: 3 }
      ]
    },
    {
      id: 'topic-2',
      name: 'Flutuação',
      order: 2,
      levels: [
        { id: 'flut-1', name: 'Básico', order: 1, levelValue: 1 },
        { id: 'flut-2', name: 'Intermediário', order: 2, levelValue: 2 },
        { id: 'flut-3', name: 'Avançado', order: 3, levelValue: 3 }
      ]
    }
  ],
  materials: [
    { name: 'Prancha', quantity: 1, isOptional: false },
    { name: 'Pull buoy', quantity: 1, isOptional: true }
  ],
  minAge: 6,
  maxAge: 99,
  maxStudentsPerClass: 10,
  durationMinutes: 50,
  requiresMedicalCertificate: true
}, userId);
```

---

## 📁 Estrutura de Arquivos Completa

```
modules/
├── collaborators/
│   ├── collaborators.schemas.js    # ✅ Validação Zod
│   ├── collaborators.db.js         # ✅ CRUD Firebase
│   ├── collaborators.domain.js     # ✅ Lógica de negócio
│   └── index.js                    # ✅ Exports
│
└── activities/
    ├── activities.schemas.js       # ✅ Validação Zod
    ├── activities.db.js            # ✅ CRUD Firebase
    ├── activities.domain.js        # ✅ Lógica de negócio
    └── index.js                    # ✅ Exports
```

---

## ✅ Checklist de Implementação

### Collaborators

- [ ] Criar `collaborators.schemas.js` com todos os schemas
- [ ] Implementar CRUD completo em `collaborators.db.js`
- [ ] Adicionar lógica de negócio em `collaborators.domain.js`
- [ ] Implementar sistema de permissões
- [ ] Criar validação de horários
- [ ] Adicionar busca por função

### Activities

- [ ] Criar `activities.schemas.js` com todos os schemas
- [ ] Implementar CRUD completo em `activities.db.js`
- [ ] Adicionar lógica de negócio em `activities.domain.js`
- [ ] Implementar níveis de proficiência
- [ ] Criar tópicos de avaliação
- [ ] Adicionar validação de idade
- [ ] Implementar materiais necessários

### Integração

- [ ] Conectar colaboradores com atividades (especialidades)
- [ ] Conectar atividades com turmas
- [ ] Conectar colaboradores com turmas (atribuição)
- [ ] Implementar validações cruzadas

---

**Este guia completo define como organizar os módulos de Colaboradores e Atividades!** 🚀
