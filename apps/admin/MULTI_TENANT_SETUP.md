# Sistema Multi-Tenant - Documentação Completa

## 📋 Visão Geral

Este sistema implementa **multi-tenancy** com suporte a **múltiplas branches/unidades** por tenant. Cada tenant pode ter uma ou várias unidades, e o sistema garante isolamento completo de dados entre eles.

---

## 🏗️ Arquitetura Firestore

### Estrutura de Coleções

```
tenantsBySlug/{slug}
  └─ idTenant: string

tenants/{idTenant}
  ├─ name: string
  ├─ slug: string (usado na URL)
  ├─ status: 'active' | 'inactive'
  ├─ branding: object
  ├─ createdAt: timestamp
  └─ updatedAt: timestamp

tenants/{idTenant}/members/{uid}
  ├─ role: 'owner' | 'manager' | 'staff'
  ├─ roleId: string
  ├─ roleByBranch: { [branchId]: roleId }
  ├─ branchIds: string[]
  ├─ status: 'active' | 'inactive'
  └─ createdAt: timestamp

tenants/{idTenant}/branches/{idBranch}
  ├─ name: string
  ├─ status: 'active' | 'inactive'
  ├─ billingStatus: 'active' | 'past_due' | 'canceled'
  ├─ timezone: string
  ├─ address: object
  ├─ createdAt: timestamp
  └─ updatedAt: timestamp

systemAdmins/{uid}
  └─ (documento vazio indica que é admin do sistema)
```

### Dados por Branch

Todos os dados do app ficam dentro de `tenants/{idTenant}/branches/{idBranch}/`:
- `members/` - Clientes
- `schedules/` - Grade de horários
- `sessions/` - Aulas/sessões
- `transactions/` - Financeiro
- `sales/` - Vendas
- etc.

---

## 🔐 Sistema de Permissões

### Níveis de Acesso

1. **System Owner** (você, proprietário do sistema)
   - Acessa painel `/system-owner/tenants`
   - Cria/bloqueia tenants
   - Gerencia todas as branches
   - Vê status de pagamento

2. **Tenant Owner** (dono da academia/empresa)
   - Acessa todas as branches do seu tenant
   - Cria novas branches
   - Gerencia membros

3. **Manager/Staff** (colaboradores)
   - Acessa apenas branches específicas (`branchIds`)
   - Permissões definidas por `roleByBranch`

---

## 🌐 Roteamento por URL

### Opções de URL

O sistema detecta o tenant de 3 formas (em ordem de prioridade):

1. **Subdomínio**: `unidade1.painelswim.com`
2. **Path**: `app.painelswim.com/unidade1`
3. **LocalStorage**: fallback se nenhum dos anteriores

### Configuração Vercel

Para subdomínios funcionarem:

1. Adicione domínio wildcard no Vercel: `*.painelswim.com`
2. Configure DNS com registro CNAME:
   ```
   *.painelswim.com → cname.vercel-dns.com
   ```

---

## 🚀 Fluxo de Onboarding

### 1. Criar Tenant

```javascript
import { useTenantManagement } from './hooks/clients/useTenantManagement'

const { createTenant } = useTenantManagement()

await createTenant(
  {
    name: 'Academia XYZ',
    slug: 'academia-xyz', // URL: app.painelswim.com/academia-xyz
    branding: {}
  },
  ownerUid // UID do Firebase Auth
)
```

**O que acontece automaticamente:**
- Cria documento em `tenants/{id}`
- Cria mapeamento `tenantsBySlug/academia-xyz`
- Cria `members/{ownerUid}` com role `owner`
- Cria branch padrão "Unidade 1"
- Associa owner à branch

### 2. Acessar Sistema

Usuário acessa: `app.painelswim.com/academia-xyz`

**Fluxo automático:**
1. `TenantContext` detecta slug na URL
2. Busca `tenantsBySlug/academia-xyz` → pega `idTenant`
3. Carrega dados do tenant
4. `BranchContext` carrega branches do tenant
5. Auto-seleciona primeira branch (ou última usada)
6. `TenantMiddleware` verifica:
   - Tenant está ativo?
   - Branch está ativa?
   - Pagamento em dia?
7. Se tudo OK, libera acesso

---

## 🛠️ Arquivos Criados

### Contexts
- `src/context/TenantContext.js` - Gerencia tenant atual
- `src/context/BranchContext.js` - Gerencia branch/unidade atual

### Services
- `src/services/tenantService.js` - CRUD de tenants e branches

### Hooks
- `src/hooks/clients/useTenantManagement.js` - Hook para painel owner

### Helpers
- `src/helpers/tenantGuard.js` - Verificações de acesso

### Middleware
- `src/routes/middleware/TenantMiddleware.js` - Protege rotas

### Pages
- `src/pages/SystemOwner/TenantManagement.js` - Painel de administração

---

## 📝 Como Usar nos Componentes

### Acessar Tenant/Branch Atual

```javascript
import { useTenant } from '../context/TenantContext'
import { useBranch } from '../context/BranchContext'

function MeuComponente() {
  const { currentTenant, tenantLoading } = useTenant()
  const { currentBranch, branchLoading } = useBranch()

  if (tenantLoading || branchLoading) return <Loading />

  // Usar currentTenant.id e currentBranch.id nas queries
  const membersRef = collection(
    db, 
    'tenants', currentTenant.id, 
    'branches', currentBranch.id, 
    'members'
  )
}
```

### Trocar de Branch

```javascript
const { userBranches, switchBranch } = useBranch()

<select onChange={(e) => switchBranch(e.target.value)}>
  {userBranches.map(branch => (
    <option key={branch.id} value={branch.id}>
      {branch.name}
    </option>
  ))}
</select>
```

---

## 🔒 Firestore Security Rules (Exemplo)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: verifica se usuário é membro do tenant
    function isMember(tenantId) {
      return exists(/databases/$(database)/documents/tenants/$(tenantId)/members/$(request.auth.uid));
    }
    
    // Helper: verifica se é owner
    function isOwner(tenantId) {
      let member = get(/databases/$(database)/documents/tenants/$(tenantId)/members/$(request.auth.uid));
      return member.data.role == 'owner';
    }
    
    // Helper: verifica acesso à branch
    function hasBranchAccess(tenantId, branchId) {
      let member = get(/databases/$(database)/documents/tenants/$(tenantId)/members/$(request.auth.uid));
      return member.data.role == 'owner' || branchId in member.data.branchIds;
    }
    
    // Tenants
    match /tenants/{tenantId} {
      allow read: if isMember(tenantId);
      allow write: if isOwner(tenantId);
      
      // Members
      match /members/{memberId} {
        allow read: if isMember(tenantId);
        allow write: if isOwner(tenantId);
      }
      
      // Branches
      match /branches/{branchId} {
        allow read: if hasBranchAccess(tenantId, branchId);
        allow write: if isOwner(tenantId);
        
        // Dados da branch (members, schedules, etc.)
        match /{collection}/{document=**} {
          allow read, write: if hasBranchAccess(tenantId, branchId);
        }
      }
    }
    
    // System Admins (apenas leitura para verificação)
    match /systemAdmins/{uid} {
      allow read: if request.auth.uid == uid;
    }
  }
}
```

---

## 💰 Integração com Stripe (Futuro)

### Estrutura Sugerida

```
tenants/{idTenant}/branches/{idBranch}/billing/{billingId}
  ├─ stripeCustomerId
  ├─ stripeSubscriptionId
  ├─ status: 'active' | 'past_due' | 'canceled'
  ├─ currentPeriodEnd: timestamp
  └─ updatedAt: timestamp
```

### Webhook Handler

Quando receber evento do Stripe:
1. Atualizar `billingStatus` na branch
2. Se `past_due` ou `canceled`, bloquear acesso automaticamente
3. `TenantMiddleware` já verifica isso e nega acesso

---

## 🎯 Próximos Passos

### 1. Configurar System Admin

Adicione seu UID como admin do sistema:

```javascript
// No console do Firestore, criar documento:
systemAdmins/{SEU_UID_AQUI}
// (documento vazio)
```

### 2. Adicionar Rota do Painel Owner

Em `src/routes/allRoutes.js`:

```javascript
import TenantManagement from '../pages/SystemOwner/TenantManagement'

export const userRoutes = [
  // ... outras rotas
  { 
    path: "/system-owner/tenants", 
    component: <TenantManagement /> 
  },
]
```

### 3. Criar Primeiro Tenant

Acesse `/system-owner/tenants` e crie um tenant de teste.

### 4. Testar Acesso

Acesse `app.painelswim.com/{slug}` e verifique se carrega corretamente.

---

## 🐛 Troubleshooting

### "Tenant não encontrado"
- Verifique se `tenantsBySlug/{slug}` existe
- Confirme que `idTenant` está correto

### "Acesso negado"
- Verifique se usuário tem documento em `tenants/{id}/members/{uid}`
- Confirme `branchIds` no membro

### "Unidade bloqueada"
- Verifique `status` da branch (deve ser `active`)
- Verifique `billingStatus` (deve ser `active`)

### Subdomínio não funciona
- Confirme DNS configurado (pode levar até 48h)
- Verifique domínio adicionado na Vercel
- Teste com path primeiro: `app.painelswim.com/{slug}`

---

## 📚 Referências

- Documento original: `/Users/felipemacedo/Downloads/PainelSwim-front/FIREBASE_STRUCTURE.md`
- Firebase Auth: https://firebase.google.com/docs/auth
- Firestore Rules: https://firebase.google.com/docs/firestore/security/get-started
- Vercel Domains: https://vercel.com/docs/concepts/projects/domains

---

**Criado em:** 2 de Janeiro de 2026  
**Versão:** 1.0
