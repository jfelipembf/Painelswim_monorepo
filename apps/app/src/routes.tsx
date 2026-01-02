/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-2-pro-react-ts
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

/** 
  All of the routes for the Material Dashboard 2 PRO React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that contains other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

// Material Dashboard 2 PRO React layouts
import Financial from "layouts/dashboards/financial";
import Management from "layouts/dashboards/management";
import Operational from "layouts/dashboards/operational";
import NewClient from "layouts/pages/clients/newClient";
import ClientList from "layouts/pages/clients/clientList";
import ClientProfile from "layouts/pages/clients/clientProfile";
import CollaboratorList from "layouts/pages/collaborators/collaboratorList";
import NewCollaborator from "layouts/pages/collaborators/newCollaborator";
import CollaboratorProfile from "layouts/pages/collaborators/collaboratorProfile";
import ActivityList from "layouts/pages/admin/activity";
import NewActivity from "layouts/pages/admin/activity/new";
import GradePage from "layouts/pages/grade";
import ContractsPage from "layouts/pages/admin/contracts";
import SchedulesPage from "layouts/pages/admin/schedules";
import AreasPage from "layouts/pages/admin/areas";
import RolesPage from "layouts/pages/admin/roles";
import CatalogPage from "layouts/pages/admin/catalog";
import SettingsPage from "layouts/pages/settings";
import ManagementEventPlan from "layouts/pages/management/event-plan";
import CashierPage from "layouts/pages/financial/cashier";
import CashFlowPage from "layouts/pages/financial/cashflow";
import AcquirersPage from "layouts/pages/financial/acquirers";
import CRMPage from "layouts/pages/crm";
import CRMChatPage from "layouts/pages/crm-chat";
import EvaluationLevelsPage from "layouts/pages/management/evaluation-levels";
import IntegrationsPage from "layouts/pages/management/integrations";
import ClientPurchasePage from "layouts/pages/sales/purchase";
import SettleDebtPage from "layouts/pages/sales/settleDebt";
import TestsPage from "layouts/pages/management/tests";
import LoginPage from "layouts/pages/login";
import ForgotPasswordPage from "layouts/pages/forgot-password";
import TouchPage from "layouts/pages/touch";

// Material Dashboard 2 PRO React TS components
import MDAvatar from "components/MDAvatar";

// @mui icons
import Icon from "@mui/material/Icon";

// Images
import profilePicture from "assets/images/team-3.jpg";

const routes = [
  {
    type: "collapse",
    name: "Dashboards",
    key: "dashboards",
    icon: <Icon fontSize="medium">dashboard</Icon>,
    collapse: [
      {
        name: "Operacional",
        key: "operational",
        route: "/dashboards/operational",
        component: <Operational />,
      },
      {
        name: "Gerencial",
        key: "management",
        route: "/dashboards/management",
        component: <Management />,
        permission: "dashboards_management_view",
      },
      {
        name: "Financeiro",
        key: "financial-dashboard",
        route: "/dashboards/financial",
        component: <Financial />,
        permission: "dashboards_financial_view",
      },
    ],
  },
  {
    type: "collapse",
    name: "Grade",
    key: "grade",
    icon: <Icon fontSize="medium">calendar_today</Icon>,
    noCollapse: true,
    route: "/grade",
    component: <GradePage />,
    permission: "grade_manage",
  },
  {
    type: "collapse",
    name: "Colaboradores",
    key: "collaborators",
    icon: <Icon fontSize="medium">badge</Icon>,
    noCollapse: true,
    route: "/collaborators/list",
    component: <CollaboratorList />,
    permission: "collaborators_manage",
  },
  {
    type: "collapse",
    name: "Clientes",
    key: "members",
    icon: <Icon fontSize="medium">people</Icon>,
    noCollapse: true,
    route: "/clients/list",
    component: <ClientList />,
    permission: "members_manage",
  },
  {
    type: "collapse",
    name: "Administrativos",
    key: "admin",
    icon: <Icon fontSize="medium">admin_panel_settings</Icon>,
    collapse: [
      {
        name: "Atividades",
        key: "activity",
        route: "/admin/activity",
        component: <ActivityList />,
        permission: "admin_activities",
      },
      {
        name: "Contratos",
        key: "contracts",
        route: "/admin/contracts",
        component: <ContractsPage />,
        permission: "admin_contracts",
      },
      {
        name: "Turmas",
        key: "schedules",
        route: "/admin/schedules",
        component: <SchedulesPage />,
        permission: "admin_schedules",
      },
      {
        name: "Areas",
        key: "areas",
        route: "/admin/areas",
        component: <AreasPage />,
        permission: "admin_areas",
      },
      {
        name: "Cargos e Permissoes",
        key: "roles",
        route: "/admin/roles",
        component: <RolesPage />,
        permission: "admin_roles",
      },
      {
        name: "Produtos e Serviços",
        key: "catalog",
        route: "/admin/catalog",
        component: <CatalogPage />,
        permission: "admin_catalog",
      },
    ],
  },
  {
    type: "collapse",
    name: "Financeiro",
    key: "financial",
    icon: <Icon fontSize="medium">attach_money</Icon>,
    collapse: [
      {
        name: "Caixa",
        key: "cashier",
        route: "/financial/cashier",
        component: <CashierPage />,
        permission: "financial_cashier",
      },
      {
        name: "Fluxo de Caixa",
        key: "cashflow",
        route: "/financial/cashflow",
        component: <CashFlowPage />,
        permission: "financial_cashflow",
      },
      {
        name: "Adquirintes",
        key: "acquirers",
        route: "/financial/acquirers",
        component: <AcquirersPage />,
        permission: "financial_acquirers",
      },
    ],
  },
  {
    type: "collapse",
    name: "CRM",
    key: "crm",
    icon: <Icon fontSize="medium">support_agent</Icon>,
    noCollapse: true,
    route: "/crm",
    component: <CRMPage />,
    permission: "crm_view",
  },
  {
    type: "collapse",
    name: "Gerencial",
    key: "management",
    icon: <Icon fontSize="medium">bar_chart</Icon>,
    collapse: [
      {
        name: "Planejamento de Eventos",
        key: "event-plan",
        route: "/management/event-plan",
        component: <ManagementEventPlan />,
        permission: "management_event_plan",
      },
      {
        name: "Testes",
        key: "tests",
        route: "/management/tests",
        component: <TestsPage />,
        permission: "management_tests",
      },
      {
        name: "Níveis de Avaliação",
        key: "evaluation-levels",
        route: "/management/evaluation-levels",
        component: <EvaluationLevelsPage />,
        permission: "management_evaluation_levels",
      },
    ],
  },
  {
    type: "collapse",
    name: "Configurações",
    key: "settings",
    icon: <Icon fontSize="medium">settings</Icon>,
    noCollapse: true,
    route: "/admin/settings",
    component: <SettingsPage />,
  },
  {
    route: "/admin/activity/new",
    component: <NewActivity />,
    key: "admin-activity-new",
    permission: "admin_activities",
  },
  {
    route: "/admin/activity/:id",
    component: <NewActivity />,
    key: "admin-activity-edit",
    permission: "admin_activities",
  },
  {
    route: "/members/new",
    component: <NewClient />,
    key: "members-new",
    permission: "members_manage",
  },
  {
    route: "/members/list",
    component: <ClientList />,
    key: "members-list",
    permission: "members_manage",
  },
  {
    route: "/members/profile/:id",
    component: <ClientProfile />,
    key: "members-profile",
    permission: "members_manage",
  },
  {
    route: "/clients/new",
    component: <NewClient />,
    key: "clients-new",
    permission: "members_manage",
  },
  {
    route: "/clients/profile/:id",
    component: <ClientProfile />,
    key: "clients-profile",
    permission: "members_manage",
  },
  {
    route: "/sales/purchase/:id",
    component: <ClientPurchasePage />,
    key: "sales-purchase",
    permission: "sales_purchase",
  },
  {
    route: "/sales/settle-debt/:id",
    component: <SettleDebtPage />,
    key: "sales-settle-debt",
    permission: "sales_purchase",
  },
  {
    route: "/collaborators/new",
    component: <NewCollaborator />,
    key: "collaborators-new",
    permission: "collaborators_manage",
  },
  {
    route: "/collaborators/profile/:id",
    component: <CollaboratorProfile />,
    key: "collaborators-profile-id",
    permission: "collaborators_manage",
  },
  {
    route: "/collaborators/profile",
    component: <CollaboratorProfile />,
    key: "collaborators-profile",
    permission: "collaborators_manage",
  },
  {
    type: "collapse",
    name: "Touch",
    key: "touch",
    icon: <Icon fontSize="medium">touch_app</Icon>,
    noCollapse: true,
    route: "/touch",
    component: <TouchPage />,
    permission: "grade_manage",
    hideInSidenav: true,
  },
  {
    route: "/crm/chat",
    component: <CRMChatPage />,
    key: "crm-chat",
    permission: "crm_view",
    hideInSidenav: true,
  },
  { route: "/login", component: <LoginPage />, key: "login" },
  { route: "/forgot-password", component: <ForgotPasswordPage />, key: "forgot-password" },
];

export default routes;
