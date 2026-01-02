export const normalizeTenantSlug = (value) => {
  if (!value) return "";
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

export const normalizeCnpj = (value) => {
  if (!value) return "";
  return String(value).replace(/\D/g, "");
};

export const validateTenantPayload = (payload) => {
  const errors = [];

  if (!payload?.name) errors.push("Nome é obrigatório");
  if (!payload?.slug) errors.push("Slug é obrigatório");

  const cnpj = normalizeCnpj(payload?.cnpj);
  if (!cnpj) errors.push("CNPJ é obrigatório");
  if (cnpj && cnpj.length !== 14) errors.push("CNPJ inválido");

  const responsaveis = Array.isArray(payload?.responsaveis)
    ? payload.responsaveis.filter(Boolean)
    : [];
  if (!responsaveis.length) errors.push("Informe ao menos 1 responsável");

  const adminEmail = payload?.adminEmail || responsaveis?.[0]?.email;
  if (!adminEmail) errors.push("Email do responsável é obrigatório");

  return errors;
};
