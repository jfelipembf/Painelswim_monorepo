# Arquitetura (Admin Panel)

## Stack real
- CRA (react-scripts 5) + JavaScript, React 18.
- UI: Reactstrap/Bootstrap 5 (`theme.scss`), Styled Components, componentes de layout Vertical/Horizontal.
- Estado: Redux + Redux-Saga + Reselect; Redux Form está presente mas pode ser evitado (preferir Formik/Yup já instalados).
- Router: React Router v6.
- Firebase v11: Auth, Firestore, Storage, Analytics opcional (`src/helpers/firebase_helper.js`).
- Utilitários: i18next, axios, charts (ApexCharts/ECharts/ToastUI/Chart.js), drag and drop (react-beautiful-dnd/@hello-pangea/dnd), upload (react-dropzone).

## Camadas e responsabilidades
- **UI Shell**: `src/App.js` seleciona Vertical/Horizontal layout e aplica Authmiddleware; NonAuthLayout para rotas públicas.
- **Rotas**: definidas em `src/routes/allRoutes.js` separando `authRoutes` (login/forgot) e `userRoutes` (dashboard, tenants, branches, users).
- **Estado global**: reducers/sagas em `src/store` (Layout, Breadcrumb, Login/Register/Forget/Profile). Conexão via `connect`/`mapStateToProps`.
- **Integração Firebase**: `src/helpers/firebase_helper.js` inicializa app/auth/db/storage, trata auth state e expõe funções (login, logout, password reset, upload, CRUD auxiliar). `initFirebaseBackend` é chamado em `src/App.js` se env estiver preenchido.
- **Domínio**: módulos em `src/modules/*` (ex.: `modules/tenants/*.db.js`) encapsulam Firestore CRUD para tenants/branches e regras de negócio básicas.
- **Pages**: em `src/pages/**` consomem serviços/hooks e compõem UI.

## Diferenciais deste painel
- **Somente system owner** acessa; não há isolamento por tenant/branch no router. Você vê todos os tenants/branches.
- Não há Tenant/Branch context/middleware; checks de acesso são simples (auth + ser listado em `systemAdmins/{uid}` se necessário).
- Provisionamento de tenant cria usuário owner, mapeia slug e cria branch padrão.

## Convenções de caminhos
- `src/helpers/firebase_helper.js`: bootstrap do Firebase e utilidades (auth/storage).
- `src/routes/allRoutes.js`: lista única de rotas públicas/privadas.
- `src/routes/middleware/Authmiddleware.js`: protege rotas verificando `localStorage.authUser`.
- `src/modules/tenants/*`: CRUD de tenants/branches e lógica associada.
- `src/pages/Tenants/*`: telas de listagem, criação e perfil de tenant/branch.
