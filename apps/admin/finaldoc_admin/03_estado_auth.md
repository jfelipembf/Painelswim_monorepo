# Estado global e autenticação

## Redux/Sagas presentes
- Reducers combinados em `src/store/reducers.js`:
  - `Layout`: tema/orientação/compactação do layout.
  - `Breadcrumb`: itens de navegação.
  - `Login`, `Account` (registro), `ForgetPassword`, `Profile`: estados de auth e perfil.
- Sagas em `src/store/sagas.js`: `AuthSaga`, `AccountSaga`, `ForgetSaga`, `ProfileSaga`, `LayoutSaga`.
- Conexão via `connect`/`mapStateToProps` (não há hooks do React Redux).

## Sessão/autenticação
- `firebase_helper.js`:
  - `initFirebaseBackend` inicializa app/auth/db/storage e liga `onAuthStateChanged`.
  - `onAuthStateChanged` salva `authUser` no `localStorage` (JSON) ou remove ao sair.
  - Métodos: `loginUser`, `registerUser`, `forgetPassword`, `logout`, `socialLoginUser`, `createUserWithDetails`, `listUsers`, upload para Storage.
- `Authmiddleware` usa `localStorage.getItem("authUser")` para permitir ou redirecionar.
- Não há refresh de token manual (Firebase gerencia); a sessão persiste pelo localStorage e cookies do Firebase.

## Acesso/admin
- Este painel destina-se ao **system owner**. Para reforçar:
  - Criar documento vazio em `systemAdmins/{uid}` para cada admin permitido.
  - Em serviços críticos (`modules/tenants/*.db.js`) ou no fluxo de login, validar se `systemAdmins/{uid}` existe antes de permitir ações.
- Não há controle de permissões por rota; use checagens por serviço/feature se precisar granularidade.

## Integração com Firebase
- Variáveis obrigatórias (pelo menos): `REACT_APP_APIKEY`, `REACT_APP_AUTHDOMAIN`, `REACT_APP_PROJECTID`, `REACT_APP_APPID`. Storage e Messaging opcionais mas recomendados.
- Fallbacks aceitos: `REACT_APP_FIREBASE_API_KEY`, etc.
- Se quiser usar emuladores, adicione flags e conectores (não presente hoje); por padrão, conecta na produção das credenciais fornecidas.
