export type RolePermissions = Record<string, boolean>;

export type PermissionItem = {
  key: string;
  label: string;
};

export type PermissionGroup = {
  label: string;
  permissions: PermissionItem[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "Dashboards",
    permissions: [
      { key: "dashboards_management_view", label: "Dashboard gerencial" },
      { key: "dashboards_commercial_view", label: "Dashboard comercial" },
      { key: "dashboards_financial_view", label: "Dashboard financeiro" },
    ],
  },
  {
    label: "Grade",
    permissions: [{ key: "grade_manage", label: "Gerenciar grade" }],
  },
  {
    label: "Clientes",
    permissions: [{ key: "members_manage", label: "Gerenciar clientes" }],
  },
  {
    label: "Colaboradores",
    permissions: [{ key: "collaborators_manage", label: "Gerenciar colaboradores" }],
  },
  {
    label: "Administrativo",
    permissions: [
      { key: "admin_activities", label: "Atividades" },
      { key: "admin_contracts", label: "Contratos" },
      { key: "admin_schedules", label: "Turmas" },
      { key: "admin_areas", label: "Areas" },
      { key: "admin_catalog", label: "Produtos e servicos" },
      { key: "admin_roles", label: "Cargos e permissoes" },
    ],
  },
  {
    label: "Financeiro",
    permissions: [
      { key: "financial_cashier", label: "Caixa" },
      { key: "financial_cashflow", label: "Fluxo de caixa" },
      { key: "financial_acquirers", label: "Adquirentes" },
    ],
  },
  {
    label: "CRM",
    permissions: [{ key: "crm_view", label: "Acessar CRM" }],
  },
  {
    label: "Gerencial",
    permissions: [
      { key: "management_event_plan", label: "Planejamento de eventos" },
      { key: "management_tests", label: "Testes" },
      { key: "management_evaluation_levels", label: "Niveis de avaliacao" },
      { key: "management_integrations", label: "Integracoes" },
    ],
  },
  {
    label: "Vendas",
    permissions: [{ key: "sales_purchase", label: "Compras e contratos" }],
  },
];

export type Role = {
  id: string;
  idTenant: string;
  idBranch: string;
  name: string;
  description?: string;
  permissions: RolePermissions;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type RolePayload = {
  name: string;
  description?: string;
  permissions: RolePermissions;
};
