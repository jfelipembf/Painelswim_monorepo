const normalizeStatus = status => String(status || "").toLowerCase().trim()

export const STATUS_LABELS = {
  contract: {
    active: "Ativo",
    waiting: "Em espera",
    pending: "Pendente",
    expired: "Expirado",
    cancelled: "Cancelado",
    suspended: "Suspenso",
  },
  enrollment: {
    active: "Ativa",
    pending: "Pendente",
    cancelled: "Cancelada",
    completed: "Concluída",
    suspended: "Suspensa",
  },
  sale: {
    pending: "Pendente",
    paid: "Pago",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
    open: "Aberto",
    overdue: "Vencido",
  },
  client: {
    active: "Ativo",
    inactive: "Inativo",
    pending: "Pendente",
    suspended: "Suspenso",
  },
}

export const getStatusLabel = (status, type = "contract") => {
  const normalized = normalizeStatus(status)
  const labels = STATUS_LABELS[type] || {}
  return labels[normalized] || status || ""
}

/**
 * Mapeamento de cores para status (para badges e elementos visuais)
 */
export const STATUS_COLORS = {
  active: "success",
  waiting: "warning",
  pending: "warning",
  expired: "danger",
  cancelled: "danger",
  suspended: "secondary",
  completed: "info",
  paid: "success",
  refunded: "warning",
  open: "warning",
  overdue: "danger",
}

/**
 * Obtém cor para status
 * @param {string} status - Status
 * @returns {string} - Cor para uso em badges
 */
export const getStatusColor = status => {
  if (!status) return "secondary"

  const normalizedStatus = normalizeStatus(status)
  return STATUS_COLORS[normalizedStatus] || "secondary"
}
