export const TENANTS_COLLECTION = "tenants";

export const TENANT_STATUSES = {
  active: "active",
  trial: "trial",
  suspended: "suspended",
  canceled: "canceled",
};

export const TENANT_STATUS_LABELS = {
  [TENANT_STATUSES.active]: "Ativo",
  [TENANT_STATUSES.trial]: "Teste",
  [TENANT_STATUSES.suspended]: "Suspenso",
  [TENANT_STATUSES.canceled]: "Cancelado",
};
