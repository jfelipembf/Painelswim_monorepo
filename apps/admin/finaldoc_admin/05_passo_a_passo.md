# Passo a passo (subir e usar o painel admin)

1) **Preparar env (.env.local)**  
   - Defina credenciais do Firebase:  
     - `REACT_APP_DEFAULTAUTH=firebase`  
     - `REACT_APP_APIKEY=...`  
     - `REACT_APP_AUTHDOMAIN=...`  
     - `REACT_APP_PROJECTID=...`  
     - `REACT_APP_STORAGEBUCKET=...`  
     - `REACT_APP_MESSAGINGSENDERID=...`  
     - `REACT_APP_APPID=...`  
     - `REACT_APP_MEASUREMENTID=...` (opcional)  
   - Fallbacks com prefixo `REACT_APP_FIREBASE_` também funcionam.

2) **Instalar dependências**  
   ```bash
   cd apps/admin
   npm install
   ```

3) **Criar usuário admin no Firebase Auth**  
   - No console do Firebase, crie um usuário (email/senha).  
   - No Firestore, crie `systemAdmins/{uid}` (documento vazio) para permitir acesso total.

4) **Regras do Firestore (mínimo)**  
   - Liberar leitura/escrita de tenants/branches apenas para system admins. Exemplo (adapte conforme necessário):
   ```javascript
   match /systemAdmins/{uid} {
     allow read: if request.auth.uid == uid;
   }
   match /tenants/{tenantId} {
     allow read, write: if exists(/databases/$(database)/documents/systemAdmins/$(request.auth.uid));
     match /branches/{branchId} {
       allow read, write: if exists(/databases/$(database)/documents/systemAdmins/$(request.auth.uid));
     }
   }
   match /tenantsBySlug/{slug} {
     allow read: if true;
     allow write: if exists(/databases/$(database)/documents/systemAdmins/$(request.auth.uid));
   }
   match /users/{uid} {
     allow read, write: if exists(/databases/$(database)/documents/systemAdmins/$(request.auth.uid));
   }
   ```

5) **Subir em modo dev**  
   ```bash
   npm start
   ```
   - Acesse `http://localhost:3000/login`, faça login com o admin.

6) **Criar tenant pelo painel**  
   - Vá em `/tenants` → “Novo Tenant”.  
   - O fluxo `createTenant` cria: tenant, slug em `tenantsBySlug`, branch padrão e membro owner.

7) **Criar branches adicionais**  
   - Em `/tenants/:tenantId`, crie branches; owners são adicionados como admin na nova branch automaticamente.

8) **Criar usuários**  
   - Use a tela de “Novo usuário” (caminho `/users/new`) que chama `createUserWithDetails` (Auth + Storage + doc em `users`).

9) **Erros comuns**  
   - “Firebase não inicializado”: checar envs e `REACT_APP_DEFAULTAUTH`.  
   - “auth/…”: credenciais inválidas ou domínio não autorizado no Firebase.  
   - Falha ao criar tenant/branch: verifique se o usuário logado tem documento em `systemAdmins`.

10) **Próximos ajustes recomendados**  
   - Adicionar toasts e loaders consistentes para feedback.  
   - Centralizar validações com Yup (já disponível).  
   - (Opcional) Introduzir React Query para cache de listas (tenants/branches/users) mantendo Redux para layout/auth.
