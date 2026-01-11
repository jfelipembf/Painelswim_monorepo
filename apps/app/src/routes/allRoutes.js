// Profile
import UserProfile from "../pages/Authentication/user-profile"

import ActivitiesList from "../pages/Admin/Activities"
import AreasPage from "../pages/Admin/Areas"
import CatalogPage from "../pages/Admin/Catalog"
import CollaboratorsList from "../pages/Admin/Collaborators/List"
import ClassesPage from "../pages/Admin/Classes"
import CashierPage from "../pages/Financial/Cashier"
import CashierPrintPage from "../pages/Financial/Cashier/Components/Print"
import CashFlowPage from "../pages/Financial/CashFlow"
import AcquirersPage from "../pages/Financial/Acquirers"
import ClientsList from "../pages/Clients/Components/clientList"
import ClientSalesPage from "../pages/Clients/Components/Sales"
import RolesPage from "../pages/Admin/Roles"
import ContractsPage from "../pages/Admin/Contracts/ContractsPage"
import Grade from "../pages/Grade"
import ClientProfile from "../pages/Clients/Components/Profile"
import ClientEnrollPage from "../pages/Clients/Enroll"
import PlanningEventsPage from "../pages/Events/Planning"
import EvaluationLevelsPage from "../pages/Management/EvaluationLevels"
import Evaluation from "../pages/Evaluation"
import SettingsPage from "../pages/Admin/Settings"
import CollaboratorProfile from "../pages/Collaborators/Components/Profile"
import CRMPage from "../pages/CRM"
import { Navigate } from "react-router-dom"

// Authentication related pages
import Login from "../pages/Authentication/Login"
import Logout from "../pages/Authentication/Logout"
import Register from "../pages/Authentication/Register"
import ForgetPwd from "../pages/Authentication/ForgetPassword"

// Inner Authentication
import Login1 from "../pages/AuthenticationInner/Login"
import Register1 from "../pages/AuthenticationInner/Register"
import Recoverpw from "../pages/AuthenticationInner/Recoverpw"
import LockScreen from "../pages/AuthenticationInner/auth-lock-screen"

// Dashboard
import Dashboard from "../pages/Dashboard/index"


//Extra Pages
import PagesBlank from "../pages/Extra Pages/pages-blank";
import Pages404 from "../pages/Extra Pages/pages-404";
import Pages500 from "../pages/Extra Pages/pages-500";

const userRoutes = [
  { path: "/dashboard", component: <Dashboard /> },
  { path: "/grade", component: <Grade /> },
  { path: "/admin/roles", component: <RolesPage /> },
  { path: "/admin/activity", component: <ActivitiesList /> },
  { path: "/admin/contracts", component: <ContractsPage /> },
  { path: "/admin/areas", component: <AreasPage /> },
  { path: "/admin/classes", component: <ClassesPage /> },
  { path: "/admin/catalog", component: <CatalogPage /> },
  { path: "/financial/cashier", component: <CashierPage /> },
  { path: "/financial/cashier/print", component: <CashierPrintPage /> },
  { path: "/financial/cashflow", component: <CashFlowPage /> },
  { path: "/financial/acquirers", component: <AcquirersPage /> },
  { path: "/clients/profile", component: <ClientProfile /> },
  { path: "/clients/:clientId/enroll", component: <ClientEnrollPage /> },
  { path: "/clients/enroll", component: <ClientEnrollPage /> },
  { path: "/clients/sales", component: <ClientSalesPage /> },
  { path: "/collaborators/profile", component: <CollaboratorProfile /> },
  { path: "/crm", component: <CRMPage /> },
  { path: "/events/planning", component: <PlanningEventsPage /> },
  { path: "/management/evaluation-levels", component: <EvaluationLevelsPage /> },
  { path: "/evaluation", component: <Evaluation /> },
  { path: "/admin/settings", component: <SettingsPage /> },
  // // //profile
  { path: "/profile", component: <UserProfile /> },
  { path: "/clients", component: <Navigate to="/clients/list" replace /> },
  { path: "/clients/list", component: <ClientsList /> },
  { path: "/collaborators/list", component: <CollaboratorsList /> },

  { path: "/pages-blank", component: <PagesBlank /> },

]

const authRoutes = [
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "/register", component: <Register /> },

  { path: "/pages-404", component: <Pages404 /> },
  { path: "/pages-500", component: <Pages500 /> },

  // Authentication Inner
  { path: "/pages-login", component: <Login1 /> },
  { path: "/pages-register", component: <Register1 /> },
  { path: "/page-recoverpw", component: <Recoverpw /> },
  { path: "/auth-lock-screen", component: <LockScreen /> },
]

export { userRoutes, authRoutes }
