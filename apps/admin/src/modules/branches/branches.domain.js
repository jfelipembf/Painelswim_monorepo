export const validateBranchPayload = (payload) => {
  const errors = [];

  if (!payload?.tenantId) errors.push("Tenant é obrigatório");
  if (!payload?.name) errors.push("Nome da filial é obrigatório");

  return errors;
};
