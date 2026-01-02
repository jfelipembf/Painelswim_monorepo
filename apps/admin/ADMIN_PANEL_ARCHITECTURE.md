# 🎯 Arquitetura do Painel Administrativo

## Visão Geral

Este sistema é **APENAS** o painel administrativo do proprietário do sistema (você). Os clientes **NÃO** acessam este sistema - eles têm outro projeto separado.

---

## O que este sistema faz

✅ **Gerenciamento de Tenants**
- Criar novos tenants (clientes/academias)
- Listar todos os tenants
- Bloquear/desbloquear tenants
- Ver informações de cada tenant

✅ **Gerenciamento de Branches**
- Criar branches (unidades) para cada tenant
- Listar branches de um tenant
- Bloquear/desbloquear branches
- Controlar status de pagamento de cada branch

✅ **Controle de Acesso**
- Apenas você (system owner) acessa
- Autenticação via Firebase Auth
- Verificação de `systemAdmins/{uid}` no Firestore

---

## O que este sistema NÃO faz

❌ Clientes não acessam aqui
❌ Não há isolamento por tenant (você vê todos)
❌ Não há detecção de slug na URL
❌ Não há TenantContext/BranchContext
❌ Não há TenantMiddleware

---

## Estrutura de Dados (Firestore)

```
systemAdmins/{uid}
  (documento vazio indica que é admin do sistema)

tenants/{tenantId}
  ├─ name: string
  ├─ slug: string
  ├─ status: 'active' | 'inactive'
  ├─ createdAt: timestamp
  └─ updatedAt: timestamp

tenants/{tenantId}/branches/{branchId}
  ├─ name: string
  ├─ status: 'active' | 'inactive'
  ├─ billingStatus: 'active' | 'past_due' | 'canceled'
  ├─ timezone: string
  ├─ address: object
  ├─ createdAt: timestamp
  └─ updatedAt: timestamp

tenantsBySlug/{slug}
  └─ idTenant: string (mapeamento para acesso rápido)
```

---

## Páginas Principais

### 1. `/tenants` - Lista de Tenants
- Cards com todos os tenants
- Botão "Criar Tenant"
- Ver perfil de cada tenant
- Bloquear/liberar tenant

### 2. `/tenants/:tenantId` - Perfil do Tenant
- Cards com todas as branches do tenant
- Botão "Criar Branch"
- Bloquear/liberar branches
- Controlar status de pagamento

---

## Arquivos Importantes

### Services
- `src/services/tenantService.js` - CRUD de tenants e branches

### Hooks
- `src/hooks/clients/useTenantManagement.js` - Hook para operações de tenant

### Pages
- `src/pages/Tenants/TenantsList.js` - Lista de tenants
- `src/pages/Tenants/TenantProfile.js` - Perfil do tenant com branches

---

## Setup Inicial

### 1. Configurar como System Admin

No Firestore Console:
```
Collection: systemAdmins
Document ID: {SEU_UID_DO_FIREBASE_AUTH}
(documento vazio)
```

### 2. Adicionar Rotas

Em `src/routes/allRoutes.js`:
```javascript
import TenantsList from '../pages/Tenants/TenantsList'
import TenantProfile from '../pages/Tenants/TenantProfile'

export const userRoutes = [
  // ... outras rotas
  { path: "/tenants", component: <TenantsList /> },
  { path: "/tenants/:tenantId", component: <TenantProfile /> },
]
```

### 3. Testar

```bash
npm start
```

Acesse `/tenants` e crie seu primeiro tenant.

---

## Fluxo de Uso

### Criar Tenant
1. Acesse `/tenants`
2. Clique em "Novo Tenant"
3. Preencha nome e slug
4. Sistema cria automaticamente:
   - Documento em `tenants/{id}`
   - Mapeamento em `tenantsBySlug/{slug}`
   - Branch padrão "Unidade 1"

### Gerenciar Branches
1. Na lista de tenants, clique em "Ver Perfil"
2. Veja cards com todas as branches
3. Crie novas branches conforme necessário
4. Bloqueie/libere ou controle pagamento

---

## Integração com Sistema dos Clientes

Os clientes acessam **outro projeto** (não este). Quando um cliente faz login no sistema dele:

1. Sistema do cliente detecta `slug` na URL
2. Busca `tenantsBySlug/{slug}` → pega `idTenant`
3. Carrega dados de `tenants/{idTenant}/branches/{branchId}`
4. Aplica isolamento (só vê dados da sua branch)

**Este painel admin não precisa dessa lógica** - você vê tudo.

---

## Firestore Security Rules (Exemplo)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // System Admins
    match /systemAdmins/{uid} {
      allow read: if request.auth.uid == uid;
    }
    
    // Tenants - apenas system admins podem gerenciar
    match /tenants/{tenantId} {
      allow read, write: if exists(/databases/$(database)/documents/systemAdmins/$(request.auth.uid));
      
      match /branches/{branchId} {
        allow read, write: if exists(/databases/$(database)/documents/systemAdmins/$(request.auth.uid));
      }
    }
    
    // Slug mapping
    match /tenantsBySlug/{slug} {
      allow read: if true; // Público para sistema dos clientes
      allow write: if exists(/databases/$(database)/documents/systemAdmins/$(request.auth.uid));
    }
  }
}
```

---

## Deploy

### Vercel
```bash
# Build
npm run build

# Deploy
vercel --prod
```

**Environment Variables:**
- `REACT_APP_DEFAULTAUTH=firebase`
- `REACT_APP_APIKEY=...`
- `REACT_APP_AUTHDOMAIN=...`
- `REACT_APP_PROJECTID=...`
- `REACT_APP_STORAGEBUCKET=...`
- `REACT_APP_MESSAGINGSENDERID=...`
- `REACT_APP_APPID=...`
- `REACT_APP_MEASUREMENTID=...`

---

## Resumo

Este é um **painel administrativo simples** onde você:
- Cria tenants (clientes)
- Cria branches (unidades) para cada tenant
- Controla status e pagamento
- **Não há complexidade de multi-tenancy aqui** - isso fica no sistema dos clientes

**Arquivos desnecessários removidos:**
- ❌ `TenantContext.js` (não usado)
- ❌ `BranchContext.js` (não usado)
- ❌ `TenantMiddleware.js` (não usado)

**Arquivos necessários:**
- ✅ `tenantService.js` (CRUD)
- ✅ `useTenantManagement.js` (hook)
- ✅ `TenantsList.js` (página)
- ✅ `TenantProfile.js` (página)
