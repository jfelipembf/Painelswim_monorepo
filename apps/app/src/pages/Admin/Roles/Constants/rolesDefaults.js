export const PERMISSIONS = [
  {
    id: "dashboards_management_view",
    label: "Dashboard de gestão",
    description: "Acesso aos indicadores e visão gerencial.",
  },
  {
    id: "dashboards_commercial_view",
    label: "Dashboard comercial",
    description: "Indicadores comerciais, funil e performance de vendas.",
  },
  {
    id: "members_manage",
    label: "Clientes",
    description: "Cadastro, edição e exclusão de clientes.",
  },
  {
    id: "collaborators_manage",
    label: "Colaboradores",
    description: "Gerenciar colaboradores e perfis de acesso.",
  },
  {
    id: "crm_view",
    label: "CRM",
    description: "Listas de clientes ativos, suspensos, cancelados e leads.",
  },
  {
    id: "admin_contracts",
    label: "Contratos",
    description: "Gerenciar contratos, planos e termos.",
  },
  {
    id: "sales_purchase",
    label: "Vendas e compras",
    description: "Registrar vendas de contratos, produtos e serviços.",
  },
  {
    id: "financial_cashier",
    label: "Caixa",
    description: "Operação e impressão do caixa.",
  },
  {
    id: "financial_cashflow",
    label: "Fluxo de caixa",
    description: "Relatórios de fluxo e lançamentos financeiros.",
  },
  {
    id: "financial_acquirers",
    label: "Adquirentes",
    description: "Configurar taxas e adquirentes de cartão.",
  },
  {
    id: "admin_catalog",
    label: "Catálogo",
    description: "Produtos, serviços e configurações de catálogo.",
  },
  {
    id: "admin_roles",
    label: "Perfis de acesso",
    description: "Gerenciar cargos e permissões.",
  },
  {
    id: "admin_activities",
    label: "Atividades e turmas",
    description: "Configurar atividades, turmas e capacidade.",
  },
  {
    id: "admin_schedules",
    label: "Agenda",
    description: "Gerenciar agenda e sessões de aulas.",
  },
  {
    id: "grade_manage",
    label: "Grade de aulas",
    description: "Organizar a grade semanal e presenças.",
  },
  {
    id: "admin_areas",
    label: "Áreas",
    description: "Gerenciar áreas físicas e alocação.",
  },
  {
    id: "management_evaluation_levels",
    label: "Níveis de avaliação",
    description: "Configurar níveis e critérios de avaliação.",
  },
  {
    id: "management_tests",
    label: "Testes",
    description: "Configurar testes de tempo/distância.",
  },
  {
    id: "management_event_plan",
    label: "Planejamento de eventos",
    description: "Planejamento de avaliações, testes e eventos.",
  },
  {
    id: "management_integrations",
    label: "Integrações",
    description: "Gerenciar integrações externas.",
  },
]

const ALL_TRUE_PERMISSIONS = PERMISSIONS.reduce((acc, permission) => {
  acc[permission.id] = true
  return acc
}, {})

const EMPTY_PERMISSIONS = PERMISSIONS.reduce((acc, permission) => {
  acc[permission.id] = false
  return acc
}, {})

export const DEFAULT_ROLES = [
  {
    id: "manager",
    label: "Gestor",
    description: "Acesso total ao sistema.",
    permissions: { ...ALL_TRUE_PERMISSIONS },
  },
  {
    id: "coordinator",
    label: "Coordenador",
    description: "Coordena instrutores, agenda e operações diárias.",
    permissions: {
      ...EMPTY_PERMISSIONS,
      dashboards_management_view: true,
      dashboards_commercial_view: true,
      members_manage: true,
      collaborators_manage: true,
      crm_view: true,
      admin_activities: true,
      admin_schedules: true,
      grade_manage: true,
      admin_contracts: true,
      admin_catalog: true,
      management_tests: true,
      management_evaluation_levels: true,
      management_event_plan: true,
      sales_purchase: true,
    },
  },
  {
    id: "teacher",
    label: "Professor",
    description: "Instrutor que gerencia suas turmas e presenças.",
    permissions: {
      ...EMPTY_PERMISSIONS,
      dashboards_management_view: true,
      admin_activities: true,
      admin_schedules: true,
      grade_manage: true,
      management_tests: true,
      management_evaluation_levels: true,
    },
  },
  {
    id: "receptionist",
    label: "Recepcionista",
    description: "Controle de entrada, dúvidas e cadastro rápido.",
    permissions: {
      ...EMPTY_PERMISSIONS,
      dashboards_commercial_view: true,
      members_manage: true,
      crm_view: true,
      sales_purchase: true,
      financial_cashier: true,
    },
  },
]
