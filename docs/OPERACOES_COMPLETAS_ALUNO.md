# 🏊 Operações Completas: Ciclo de Vida do Aluno

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Cadastro e Onboarding](#cadastro-e-onboarding)
3. [Vendas e Contratos](#vendas-e-contratos)
4. [Controle de Presença](#controle-de-presença)
5. [Avaliações e Testes](#avaliações-e-testes)
6. [Gestão de Pagamentos](#gestão-de-pagamentos)
7. [Comunicação e Notificações](#comunicação-e-notificações)
8. [Cancelamento e Reembolso](#cancelamento-e-reembolso)
9. [Relatórios e Análises](#relatórios-e-análises)
10. [Arquitetura: Redux vs Módulos](#arquitetura-redux-vs-módulos)

---

## 🎯 Visão Geral

### Ciclo de Vida Completo do Aluno

```
┌─────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA DO ALUNO                   │
└─────────────────────────────────────────────────────────────┘

1. CADASTRO
   ├─ Dados pessoais
   ├─ Responsável (se menor)
   ├─ Anamnese/Saúde
   └─ Documentos

2. AVALIAÇÃO INICIAL
   ├─ Teste de nível
   ├─ Avaliação física
   └─ Definição de turma

3. VENDA/MATRÍCULA
   ├─ Seleção de plano
   ├─ Pagamento
   └─ Ativação

4. FREQUÊNCIA
   ├─ Check-in
   ├─ Presença em aulas
   └─ Controle de faltas

5. ACOMPANHAMENTO
   ├─ Avaliações periódicas
   ├─ Progressão de nível
   └─ Feedback

6. GESTÃO FINANCEIRA
   ├─ Pagamentos recorrentes
   ├─ Inadimplência
   └─ Renovação

7. COMUNICAÇÃO
   ├─ Notificações
   ├─ Mensagens
   └─ Relatórios

8. ENCERRAMENTO
   ├─ Cancelamento
   ├─ Reembolso
   └─ Feedback de saída
```

---

## 📝 Cadastro e Onboarding

### 1.1 Cadastro Inicial

```typescript
interface CreateStudentDto {
  // Dados Pessoais
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  cpf?: string;
  rg?: string;
  
  // Contato
  email?: string;
  phone: string;
  alternativePhone?: string;
  
  // Endereço
  address: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  
  // Responsável (se menor)
  guardian?: {
    name: string;
    cpf: string;
    rg?: string;
    phone: string;
    email?: string;
    relationship: 'father' | 'mother' | 'guardian' | 'other';
  };
  
  // Saúde (Anamnese)
  healthInfo: {
    bloodType?: string;
    allergies?: string[];
    medications?: string[];
    medicalConditions?: string[];
    restrictions?: string[];
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  
  // Preferências
  preferences?: {
    preferredDays?: string[];
    preferredTimes?: string[];
    goals?: string[];
  };
  
  // Origem
  source?: 'organic' | 'referral' | 'social_media' | 'ads' | 'other';
  referredBy?: string;
  
  // Metadados
  branchId: string;
  notes?: string;
  tags?: string[];
}
```

**Funções:**

```typescript
// 1. Criar aluno
export const createStudent = async (
  tenantId: string,
  data: CreateStudentDto,
  userId: string
): Promise<Student>;

// 2. Validar dados
export const validateStudentData = (data: CreateStudentDto): void;

// 3. Verificar duplicatas
export const checkDuplicateStudent = async (
  tenantId: string,
  cpf?: string,
  email?: string
): Promise<boolean>;

// 4. Gerar ID amigável
export const generateStudentFriendlyId = async (
  tenantId: string,
  branchId: string
): Promise<string>; // ALU-0001
```

---

### 1.2 Upload de Documentos

```typescript
interface StudentDocument {
  id: string;
  studentId: string;
  type: 'photo' | 'cpf' | 'rg' | 'medical_certificate' | 'other';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
}

// Funções
export const uploadStudentDocument = async (
  tenantId: string,
  studentId: string,
  file: File,
  type: string,
  userId: string
): Promise<StudentDocument>;

export const getStudentDocuments = async (
  tenantId: string,
  studentId: string
): Promise<StudentDocument[]>;

export const deleteStudentDocument = async (
  tenantId: string,
  documentId: string,
  userId: string
): Promise<void>;
```

---

### 1.3 Avaliação Inicial

```typescript
interface InitialAssessment {
  id: string;
  studentId: string;
  assessedBy: string;
  assessedAt: string;
  
  // Teste de Nível (Natação)
  swimmingLevel: {
    level: 'beginner' | 'intermediate' | 'advanced' | 'competitive';
    canFloat: boolean;
    canBreathe: boolean;
    canSwimFreestyle: boolean;
    canSwimBackstroke: boolean;
    canSwimBreaststroke: boolean;
    canSwimButterfly: boolean;
    distance25m?: number; // tempo em segundos
    notes?: string;
  };
  
  // Avaliação Física
  physicalAssessment?: {
    height: number; // cm
    weight: number; // kg
    bmi?: number;
    flexibility?: 'poor' | 'fair' | 'good' | 'excellent';
    strength?: 'poor' | 'fair' | 'good' | 'excellent';
    endurance?: 'poor' | 'fair' | 'good' | 'excellent';
  };
  
  // Recomendação
  recommendedClass?: string;
  recommendedLevel?: string;
  goals?: string[];
  observations?: string;
}

// Funções
export const createInitialAssessment = async (
  tenantId: string,
  data: InitialAssessment,
  userId: string
): Promise<InitialAssessment>;

export const getStudentAssessments = async (
  tenantId: string,
  studentId: string
): Promise<InitialAssessment[]>;
```

---

## 💰 Vendas e Contratos

### 2.1 Seleção de Plano

```typescript
// Buscar planos disponíveis
export const getAvailablePlans = async (
  tenantId: string,
  branchId: string,
  filters?: {
    category?: 'membership' | 'package' | 'class';
    minPrice?: number;
    maxPrice?: number;
  }
): Promise<Contract[]>;

// Calcular valores
export const calculatePlanValues = (
  plan: Contract,
  options: {
    discountPercent?: number;
    installments?: number;
  }
): PlanCalculation;

// Simular parcelamento
export const simulateInstallments = (
  totalCents: number,
  installments: number
): InstallmentSimulation[];
```

---

### 2.2 Processo de Venda

```typescript
// Criar venda de matrícula
export const createMembershipSale = async (
  tenantId: string,
  data: CreateMembershipSaleDto,
  userId: string
): Promise<{
  sale: Sale;
  membership: Membership;
  receivables: Receivable[];
}>;

// Adicionar pagamento
export const addPaymentToSale = async (
  tenantId: string,
  saleId: string,
  payment: PaymentInput,
  userId: string
): Promise<Sale>;

// Aplicar desconto
export const applyDiscount = async (
  tenantId: string,
  saleId: string,
  discountCents: number,
  reason: string,
  userId: string
): Promise<Sale>;
```

---

### 2.3 Renovação

```typescript
interface RenewMembershipDto {
  studentId: string;
  currentMembershipId: string;
  newContractId: string;
  startDate?: string; // Se não informado, inicia após término da atual
  payments: PaymentInput[];
  discountCents?: number;
  notes?: string;
}

// Renovar matrícula
export const renewMembership = async (
  tenantId: string,
  data: RenewMembershipDto,
  userId: string
): Promise<{
  sale: Sale;
  membership: Membership;
  receivables: Receivable[];
}>;

// Verificar elegibilidade para renovação
export const canRenewMembership = async (
  tenantId: string,
  membershipId: string
): Promise<{
  canRenew: boolean;
  reason?: string;
  daysUntilExpiration?: number;
}>;

// Notificar renovação próxima
export const notifyUpcomingRenewal = async (
  tenantId: string,
  membershipId: string
): Promise<void>;
```

---

## 📅 Controle de Presença

### 3.1 Check-in

```typescript
interface CheckIn {
  id: string;
  studentId: string;
  branchId: string;
  classId?: string;
  checkInAt: string;
  checkInBy: string;
  checkInMethod: 'manual' | 'qrcode' | 'biometric' | 'card';
  checkOutAt?: string;
  status: 'present' | 'late' | 'absent';
}

// Check-in do aluno
export const checkInStudent = async (
  tenantId: string,
  studentId: string,
  branchId: string,
  classId?: string,
  method?: string,
  userId?: string
): Promise<CheckIn>;

// Check-out do aluno
export const checkOutStudent = async (
  tenantId: string,
  checkInId: string
): Promise<CheckIn>;

// Verificar se aluno pode fazer check-in
export const canCheckIn = async (
  tenantId: string,
  studentId: string
): Promise<{
  allowed: boolean;
  reason?: string;
  membership?: Membership;
}>;
```

---

### 3.2 Controle de Aulas

```typescript
interface ClassAttendance {
  id: string;
  classId: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'justified' | 'late';
  checkInAt?: string;
  checkOutAt?: string;
  justification?: string;
  notes?: string;
  markedBy: string;
}

// Marcar presença em aula
export const markClassAttendance = async (
  tenantId: string,
  classId: string,
  studentId: string,
  status: 'present' | 'absent' | 'late',
  userId: string
): Promise<ClassAttendance>;

// Justificar falta
export const justifyAbsence = async (
  tenantId: string,
  attendanceId: string,
  justification: string,
  userId: string
): Promise<ClassAttendance>;

// Buscar frequência do aluno
export const getStudentAttendance = async (
  tenantId: string,
  studentId: string,
  startDate: string,
  endDate: string
): Promise<{
  total: number;
  present: number;
  absent: number;
  justified: number;
  late: number;
  attendanceRate: number;
}>;

// Buscar alunos presentes em aula
export const getClassAttendanceList = async (
  tenantId: string,
  classId: string,
  date: string
): Promise<ClassAttendance[]>;
```

---

### 3.3 Relatórios de Frequência

```typescript
// Relatório mensal de frequência
export const getMonthlyAttendanceReport = async (
  tenantId: string,
  branchId: string,
  month: string
): Promise<{
  totalStudents: number;
  totalClasses: number;
  averageAttendance: number;
  byDay: Record<string, number>;
  byHour: Record<string, number>;
  topStudents: Array<{ studentId: string; attendanceRate: number }>;
  absentStudents: Array<{ studentId: string; absences: number }>;
}>;

// Alertar baixa frequência
export const alertLowAttendance = async (
  tenantId: string,
  studentId: string,
  threshold: number
): Promise<void>;
```

---

## 📊 Avaliações e Testes

### 4.1 Avaliações Periódicas

```typescript
interface PeriodicAssessment {
  id: string;
  studentId: string;
  assessmentType: 'monthly' | 'quarterly' | 'level_change' | 'custom';
  assessedBy: string;
  assessedAt: string;
  
  // Habilidades Técnicas
  technicalSkills: {
    freestyle?: number; // 1-10
    backstroke?: number;
    breaststroke?: number;
    butterfly?: number;
    diving?: number;
    turns?: number;
    breathing?: number;
  };
  
  // Desempenho
  performance: {
    distance25m?: number; // tempo em segundos
    distance50m?: number;
    distance100m?: number;
    endurance?: 'poor' | 'fair' | 'good' | 'excellent';
  };
  
  // Comportamento
  behavior?: {
    discipline?: number; // 1-10
    focus?: number;
    teamwork?: number;
    effort?: number;
  };
  
  // Progressão
  currentLevel: string;
  suggestedNextLevel?: string;
  readyForLevelChange: boolean;
  
  // Feedback
  strengths?: string[];
  areasForImprovement?: string[];
  goals?: string[];
  instructorNotes?: string;
  
  // Comparação
  previousAssessmentId?: string;
  progressSummary?: string;
}

// Criar avaliação
export const createAssessment = async (
  tenantId: string,
  data: PeriodicAssessment,
  userId: string
): Promise<PeriodicAssessment>;

// Buscar avaliações do aluno
export const getStudentAssessments = async (
  tenantId: string,
  studentId: string,
  limit?: number
): Promise<PeriodicAssessment[]>;

// Comparar avaliações
export const compareAssessments = async (
  tenantId: string,
  assessmentId1: string,
  assessmentId2: string
): Promise<{
  improvements: string[];
  declines: string[];
  maintained: string[];
  summary: string;
}>;

// Gerar relatório de progresso
export const generateProgressReport = async (
  tenantId: string,
  studentId: string,
  startDate: string,
  endDate: string
): Promise<ProgressReport>;
```

---

### 4.2 Mudança de Nível

```typescript
interface LevelChange {
  id: string;
  studentId: string;
  fromLevel: string;
  toLevel: string;
  changeDate: string;
  reason: string;
  assessmentId?: string;
  approvedBy: string;
  notes?: string;
}

// Solicitar mudança de nível
export const requestLevelChange = async (
  tenantId: string,
  studentId: string,
  toLevel: string,
  reason: string,
  assessmentId?: string,
  userId?: string
): Promise<LevelChange>;

// Aprovar mudança de nível
export const approveLevelChange = async (
  tenantId: string,
  levelChangeId: string,
  userId: string
): Promise<LevelChange>;

// Histórico de níveis
export const getStudentLevelHistory = async (
  tenantId: string,
  studentId: string
): Promise<LevelChange[]>;
```

---

### 4.3 Certificados e Conquistas

```typescript
interface Certificate {
  id: string;
  studentId: string;
  type: 'level_completion' | 'course_completion' | 'achievement' | 'participation';
  title: string;
  description?: string;
  level?: string;
  issuedAt: string;
  issuedBy: string;
  certificateUrl?: string;
}

// Emitir certificado
export const issueCertificate = async (
  tenantId: string,
  studentId: string,
  type: string,
  title: string,
  userId: string
): Promise<Certificate>;

// Buscar certificados do aluno
export const getStudentCertificates = async (
  tenantId: string,
  studentId: string
): Promise<Certificate[]>;

// Gerar PDF do certificado
export const generateCertificatePdf = async (
  tenantId: string,
  certificateId: string
): Promise<string>; // URL do PDF
```

---

## 💳 Gestão de Pagamentos

### 5.1 Recebíveis

```typescript
// Buscar recebíveis do aluno
export const getStudentReceivables = async (
  tenantId: string,
  studentId: string,
  filters?: {
    status?: ReceivableStatus[];
    startDate?: string;
    endDate?: string;
  }
): Promise<Receivable[]>;

// Pagar recebível
export const payReceivable = async (
  tenantId: string,
  receivableId: string,
  payment: PaymentInput,
  userId: string
): Promise<Receivable>;

// Negociar dívida
export const negotiateDebt = async (
  tenantId: string,
  studentId: string,
  receivableIds: string[],
  newDueDate: string,
  discountCents?: number,
  userId?: string
): Promise<Receivable[]>;

// Parcelar dívida
export const installDebt = async (
  tenantId: string,
  studentId: string,
  receivableIds: string[],
  installments: number,
  userId: string
): Promise<Receivable[]>;
```

---

### 5.2 Histórico Financeiro

```typescript
interface FinancialHistory {
  sales: Sale[];
  payments: Payment[];
  receivables: Receivable[];
  summary: {
    totalPurchased: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    averageTicket: number;
    paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

// Buscar histórico financeiro
export const getStudentFinancialHistory = async (
  tenantId: string,
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<FinancialHistory>;

// Calcular score de crédito
export const calculateCreditScore = async (
  tenantId: string,
  studentId: string
): Promise<{
  score: number; // 0-100
  classification: 'excellent' | 'good' | 'fair' | 'poor';
  factors: string[];
}>;
```

---

## 📧 Comunicação e Notificações

### 6.1 Notificações Automáticas

```typescript
interface Notification {
  id: string;
  studentId: string;
  type: 'payment_reminder' | 'class_reminder' | 'assessment_scheduled' | 
        'membership_expiring' | 'achievement' | 'general';
  title: string;
  message: string;
  channels: ('email' | 'sms' | 'push' | 'whatsapp')[];
  scheduledFor?: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed';
}

// Enviar notificação
export const sendNotification = async (
  tenantId: string,
  studentId: string,
  notification: Omit<Notification, 'id' | 'status'>
): Promise<Notification>;

// Agendar notificação
export const scheduleNotification = async (
  tenantId: string,
  studentId: string,
  notification: Omit<Notification, 'id' | 'status'>,
  scheduledFor: string
): Promise<Notification>;

// Notificações automáticas
export const notifyPaymentDue = async (
  tenantId: string,
  receivableId: string
): Promise<void>;

export const notifyMembershipExpiring = async (
  tenantId: string,
  membershipId: string,
  daysBeforeExpiration: number
): Promise<void>;

export const notifyClassReminder = async (
  tenantId: string,
  classId: string,
  studentId: string,
  hoursBeforeClass: number
): Promise<void>;
```

---

### 6.2 Mensagens

```typescript
interface Message {
  id: string;
  studentId: string;
  fromUserId?: string;
  subject: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  sentAt: string;
  readAt?: string;
}

// Enviar mensagem
export const sendMessage = async (
  tenantId: string,
  studentId: string,
  subject: string,
  body: string,
  userId: string
): Promise<Message>;

// Marcar como lida
export const markMessageAsRead = async (
  tenantId: string,
  messageId: string
): Promise<Message>;

// Buscar mensagens
export const getStudentMessages = async (
  tenantId: string,
  studentId: string,
  unreadOnly?: boolean
): Promise<Message[]>;
```

---

## ❌ Cancelamento e Reembolso

### 7.1 Cancelamento de Matrícula

```typescript
interface CancellationRequest {
  membershipId: string;
  reason: 'dissatisfaction' | 'relocation' | 'health' | 'financial' | 'other';
  reasonDetails?: string;
  requestRefund: boolean;
  requestedBy: string;
  requestedAt: string;
}

// Solicitar cancelamento
export const requestCancellation = async (
  tenantId: string,
  data: CancellationRequest,
  userId: string
): Promise<{
  cancellation: Cancellation;
  eligibleForRefund: boolean;
  refundAmount?: number;
  reason?: string;
}>;

// Processar cancelamento
export const processCancellation = async (
  tenantId: string,
  cancellationId: string,
  approved: boolean,
  notes?: string,
  userId?: string
): Promise<void>;

// Cancelar com reembolso
export const cancelWithRefund = async (
  tenantId: string,
  membershipId: string,
  reason: string,
  refundMethod: 'pix' | 'bank_transfer' | 'credit_card',
  userId: string
): Promise<{
  cancellation: Cancellation;
  refund: Refund;
}>;

// Cancelar sem reembolso
export const cancelWithoutRefund = async (
  tenantId: string,
  membershipId: string,
  reason: string,
  userId: string
): Promise<Cancellation>;
```

---

### 7.2 Pausar Matrícula

```typescript
interface MembershipPause {
  id: string;
  membershipId: string;
  pauseStartDate: string;
  pauseEndDate: string;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'active' | 'completed';
}

// Solicitar pausa
export const requestMembershipPause = async (
  tenantId: string,
  membershipId: string,
  startDate: string,
  endDate: string,
  reason: string,
  userId: string
): Promise<MembershipPause>;

// Aprovar pausa
export const approveMembershipPause = async (
  tenantId: string,
  pauseId: string,
  userId: string
): Promise<MembershipPause>;

// Reativar matrícula
export const resumeMembership = async (
  tenantId: string,
  membershipId: string,
  userId: string
): Promise<Membership>;
```

---

### 7.3 Transferência

```typescript
// Transferir aluno para outra unidade
export const transferStudentToBranch = async (
  tenantId: string,
  studentId: string,
  fromBranchId: string,
  toBranchId: string,
  reason: string,
  userId: string
): Promise<Student>;

// Transferir aluno para outra turma
export const transferStudentToClass = async (
  tenantId: string,
  studentId: string,
  fromClassId: string,
  toClassId: string,
  reason: string,
  userId: string
): Promise<void>;
```

---

## 📈 Relatórios e Análises

### 8.1 Relatório Individual

```typescript
interface StudentReport {
  student: Student;
  membership: Membership;
  
  // Financeiro
  financial: {
    totalPurchased: number;
    totalPaid: number;
    totalPending: number;
    paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
  };
  
  // Frequência
  attendance: {
    totalClasses: number;
    present: number;
    absent: number;
    attendanceRate: number;
    lastAttendance?: string;
  };
  
  // Progresso
  progress: {
    currentLevel: string;
    levelChanges: number;
    lastAssessment?: PeriodicAssessment;
    strengths: string[];
    improvements: string[];
  };
  
  // Engajamento
  engagement: {
    daysAsStudent: number;
    totalCheckIns: number;
    averageCheckInsPerWeek: number;
    lastCheckIn?: string;
  };
}

// Gerar relatório completo
export const generateStudentReport = async (
  tenantId: string,
  studentId: string
): Promise<StudentReport>;

// Exportar para PDF
export const exportStudentReportPdf = async (
  tenantId: string,
  studentId: string
): Promise<string>; // URL do PDF
```

---

### 8.2 Análises e Insights

```typescript
// Identificar alunos em risco de evasão
export const identifyChurnRisk = async (
  tenantId: string,
  branchId: string
): Promise<Array<{
  studentId: string;
  riskScore: number; // 0-100
  factors: string[];
  recommendations: string[];
}>>;

// Alunos mais engajados
export const getTopEngagedStudents = async (
  tenantId: string,
  branchId: string,
  limit: number
): Promise<Array<{
  studentId: string;
  engagementScore: number;
  metrics: Record<string, number>;
}>>;

// Alunos inadimplentes
export const getDelinquentStudents = async (
  tenantId: string,
  branchId: string
): Promise<Array<{
  studentId: string;
  overdueAmount: number;
  daysPastDue: number;
  receivables: Receivable[];
}>>;
```

---

## 🏗️ Arquitetura: Redux vs Módulos

### Análise Comparativa

#### ✅ **Arquitetura Modular (Recomendada)**

```
src/
├── modules/
│   ├── students/
│   │   ├── students.types.ts
│   │   ├── students.db.ts
│   │   ├── students.domain.ts
│   │   ├── students.validation.ts
│   │   └── index.ts
│   │
│   ├── attendance/
│   │   ├── attendance.types.ts
│   │   ├── attendance.db.ts
│   │   ├── attendance.domain.ts
│   │   └── index.ts
│   │
│   ├── assessments/
│   │   ├── assessments.types.ts
│   │   ├── assessments.db.ts
│   │   ├── assessments.domain.ts
│   │   └── index.ts
│   │
│   ├── memberships/
│   ├── sales/
│   ├── receivables/
│   └── notifications/
│
└── hooks/
    ├── students/
    │   ├── useStudent.ts
    │   ├── useStudentList.ts
    │   ├── useStudentForm.ts
    │   └── index.ts
    │
    ├── attendance/
    │   ├── useCheckIn.ts
    │   ├── useAttendanceList.ts
    │   └── index.ts
    │
    └── assessments/
        ├── useAssessment.ts
        └── useAssessmentList.ts
```

**Vantagens:**
- ✅ **Separação clara de responsabilidades**
- ✅ **Fácil manutenção** - cada módulo é independente
- ✅ **Testabilidade** - testa cada módulo isoladamente
- ✅ **Escalabilidade** - adiciona novos módulos sem afetar existentes
- ✅ **Performance** - carrega apenas o necessário
- ✅ **Sem boilerplate** - menos código repetitivo
- ✅ **Type-safe** - TypeScript nativo
- ✅ **Flexibilidade** - cada módulo escolhe sua estratégia

**Desvantagens:**
- ⚠️ Precisa gerenciar cache manualmente (React Query resolve)
- ⚠️ Sem time-travel debugging (raramente necessário)

---

#### ❌ **Redux (Não Recomendado para este caso)**

```
src/
├── store/
│   ├── students/
│   │   ├── studentsSlice.ts
│   │   ├── studentsActions.ts
│   │   ├── studentsSelectors.ts
│   │   ├── studentsThunks.ts
│   │   └── studentsTypes.ts
│   │
│   ├── attendance/
│   │   ├── attendanceSlice.ts
│   │   ├── attendanceActions.ts
│   │   └── ...
│   │
│   └── store.ts
│
└── hooks/
    └── useAppSelector.ts
```

**Desvantagens:**
- ❌ **Muito boilerplate** - actions, reducers, selectors, thunks
- ❌ **Complexidade desnecessária** - para CRUD simples
- ❌ **Performance** - re-renders desnecessários
- ❌ **Difícil manutenção** - código espalhado em vários arquivos
- ❌ **Curva de aprendizado** - Redux é complexo
- ❌ **Overhead** - para operações simples

**Vantagens:**
- ✅ Time-travel debugging (raramente usado)
- ✅ Estado global centralizado (nem sempre necessário)

---

### 🎯 **Recomendação Final: Arquitetura Modular + React Query**

```typescript
// modules/students/students.db.ts
export const getStudentById = async (
  tenantId: string,
  studentId: string
): Promise<Student> => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', studentId)
    .single();
  
  if (error) throw error;
  return mapDocToStudent(data);
};

// hooks/students/useStudent.ts
import { useQuery } from '@tanstack/react-query';
import { getStudentById } from '@/modules/students';

export const useStudent = (studentId: string) => {
  const { tenantId } = useTenant();
  
  return useQuery({
    queryKey: ['students', studentId],
    queryFn: () => getStudentById(tenantId, studentId),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Uso no componente
const StudentProfile = ({ studentId }: Props) => {
  const { data: student, isLoading, error } = useStudent(studentId);
  
  if (isLoading) return <Loading />;
  if (error) return <Error error={error} />;
  
  return <div>{student.firstName}</div>;
};
```

---

### 📊 Comparação de Código

#### Criar Aluno

**Com Módulos + React Query:**
```typescript
// Hook
export const useCreateStudent = () => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateStudentDto) => 
      createStudent(tenantId, data, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    }
  });
};

// Componente
const { mutate, isPending } = useCreateStudent();

const handleSubmit = (data: CreateStudentDto) => {
  mutate(data, {
    onSuccess: () => toast.success('Aluno criado!'),
    onError: (error) => toast.error(error.message)
  });
};
```

**Com Redux:**
```typescript
// Slice
const studentsSlice = createSlice({
  name: 'students',
  initialState: { list: [], loading: false, error: null },
  reducers: {
    createStudentStart: (state) => { state.loading = true; },
    createStudentSuccess: (state, action) => {
      state.loading = false;
      state.list.push(action.payload);
    },
    createStudentFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    }
  }
});

// Thunk
export const createStudentThunk = createAsyncThunk(
  'students/create',
  async (data: CreateStudentDto, { rejectWithValue }) => {
    try {
      return await createStudent(tenantId, data, userId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Componente
const dispatch = useDispatch();
const { loading } = useSelector((state) => state.students);

const handleSubmit = (data: CreateStudentDto) => {
  dispatch(createStudentThunk(data))
    .unwrap()
    .then(() => toast.success('Aluno criado!'))
    .catch((error) => toast.error(error));
};
```

**Linhas de código:**
- Módulos: ~15 linhas
- Redux: ~40 linhas

---

### ✅ **Decisão Final**

**Use Arquitetura Modular com React Query porque:**

1. **Menos código** - 60% menos boilerplate
2. **Mais simples** - fácil de entender e manter
3. **Melhor performance** - cache inteligente, menos re-renders
4. **Type-safe** - TypeScript nativo
5. **Flexível** - cada módulo é independente
6. **Moderno** - padrão atual da indústria
7. **Escalável** - adiciona módulos sem complexidade

**Não use Redux porque:**
- ❌ Complexidade desnecessária para CRUD
- ❌ Muito boilerplate
- ❌ Difícil manutenção
- ❌ Performance inferior ao React Query

---

## 📋 Resumo de Todas as Operações

### Por Categoria

| Categoria | Operações | Total |
|-----------|-----------|-------|
| **Cadastro** | Criar, Editar, Validar, Upload docs, Avaliação inicial | 8 |
| **Vendas** | Listar planos, Calcular, Vender, Renovar, Desconto | 7 |
| **Presença** | Check-in, Check-out, Marcar presença, Justificar, Relatórios | 9 |
| **Avaliações** | Criar, Listar, Comparar, Mudar nível, Certificados | 10 |
| **Financeiro** | Listar recebíveis, Pagar, Negociar, Parcelar, Histórico | 8 |
| **Comunicação** | Notificações, Mensagens, Lembretes automáticos | 6 |
| **Cancelamento** | Cancelar, Reembolsar, Pausar, Transferir | 7 |
| **Relatórios** | Individual, Análises, Insights, Exportar PDF | 6 |
| **TOTAL** | | **61 operações** |

---

**Esta é a arquitetura ideal: Modular, escalável e sem complexidade desnecessária!** 🚀
