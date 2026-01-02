const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "";

const buildUrl = (path) => {
  if (!apiBaseUrl) return path;
  return `${apiBaseUrl}${path}`;
};

export const getBranchBillingStatus = async ({ branchId }) => {
  const response = await fetch(buildUrl(`/api/stripe/branches/${branchId}/status`), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Falha ao buscar status de pagamento");
  }

  return response.json();
};

export const createBranchCustomerPortalSession = async ({ branchId, returnUrl }) => {
  const response = await fetch(buildUrl(`/api/stripe/branches/${branchId}/portal`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnUrl }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Falha ao abrir portal de pagamentos");
  }

  return response.json();
};
