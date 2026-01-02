export const STATUSES = ["active", "inactive", "paused"] as const;

export const STATUS_LABELS = {
  active: "Ativo",
  inactive: "Inativo",
  paused: "Pausado",
};

export const CLIENT_STATUSES = [
  "lead",
  "active",
  "inactive",
  "blocked",
  "not_renewed",
  "lost",
] as const;

export const CLIENT_STATUS_LABELS: Record<(typeof CLIENT_STATUSES)[number], string> = {
  lead: "Lead",
  active: "Ativo",
  inactive: "Inativo",
  blocked: "Bloqueado",
  not_renewed: "Não renovado",
  lost: "Perdido",
};

export const CLIENT_STATUS_BADGES: Record<
  (typeof CLIENT_STATUSES)[number],
  { label: string; color: "success" | "error" | "warning" | "info" | "secondary" | "dark" }
> = {
  lead: { label: CLIENT_STATUS_LABELS.lead, color: "info" },
  active: { label: CLIENT_STATUS_LABELS.active, color: "success" },
  inactive: { label: CLIENT_STATUS_LABELS.inactive, color: "error" },
  blocked: { label: CLIENT_STATUS_LABELS.blocked, color: "error" },
  not_renewed: { label: CLIENT_STATUS_LABELS.not_renewed, color: "warning" },
  lost: { label: CLIENT_STATUS_LABELS.lost, color: "warning" },
};

export const MEMBERSHIP_STATUSES = ["pending", "active", "paused", "canceled", "expired"] as const;

export const MEMBERSHIP_STATUS_LABELS: Record<(typeof MEMBERSHIP_STATUSES)[number], string> = {
  pending: "Pendente",
  active: "Ativo",
  paused: "Pausado",
  canceled: "Cancelado",
  expired: "Expirado",
};
