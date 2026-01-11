# Bootstrap e rotas

## Inicialização (src/App.js)
1) Lê `REACT_APP_DEFAULTAUTH` (default: `firebase`).
2) Monta `firebaseConfig` a partir das envs (`REACT_APP_APIKEY`, `REACT_APP_AUTHDOMAIN`, `REACT_APP_PROJECTID`, etc., com fallbacks `REACT_APP_FIREBASE_*`).
3) Se `defaultAuthProvider === 'firebase'` e as chaves mínimas existem (`apiKey`, `authDomain`, `projectId`, `appId`), chama `initFirebaseBackend(firebaseConfig)`:
   - Inicializa app/auth/db/storage/analytics (opcional).
   - `onAuthStateChanged` persiste `authUser` no localStorage.
4) Seleciona layout (Vertical/Horizontal) via `layout.layoutType` (Redux Layout reducer).
5) Renderiza rotas públicas em `NonAuthLayout` e privadas em `Authmiddleware` + layout.

## Rotas (src/routes/allRoutes.js)
- **Públicas (`authRoutes`)**: `/login`, `/logout`, `/forgot-password`, páginas 404/500, variantes internas.
- **Privadas (`userRoutes`)**: `/dashboard`, `/profile`, `/users/*`, `/tenants/*`, `/branches/*`, `/pages-blank`, fallback `/` → `/dashboard`.
- Rotas privadas são embrulhadas por `Authmiddleware`.

## Middleware de rota
- `src/routes/middleware/Authmiddleware.js`: checa `localStorage.authUser`; se ausente, redireciona para `/login`. Não valida permissões/roles além de estar logado.
- Não há guards de tenant/branch ou slug neste painel (admin vê tudo).

## Observações
- Se precisar bloquear acesso a quem não é system admin, faça a checagem no login (consultando `systemAdmins/{uid}`) ou em services sensíveis (`modules/tenants/*.db.js`) antes de executar ações.
- Para testes locais sem Firebase, poderia ser adicionado fake backend, mas no código atual apenas Firebase é considerado.
