export type CepAddress = {
  state: string;
  city: string;
  neighborhood: string;
  address: string;
};

export const sanitizeCep = (value: string): string => String(value || "").replace(/\D/g, "");

export const isCepComplete = (value: string): boolean => sanitizeCep(value).length === 8;

export const formatCep = (value: string): string => {
  const digits = sanitizeCep(value).slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const fetchAddressByCep = async (cep: string): Promise<CepAddress | null> => {
  const normalized = sanitizeCep(cep);
  if (normalized.length !== 8) {
    return null;
  }

  const response = await fetch(`https://viacep.com.br/ws/${normalized}/json/`);
  if (!response.ok) {
    throw new Error("Falha ao consultar o CEP.");
  }

  const data = (await response.json()) as {
    uf?: string;
    localidade?: string;
    bairro?: string;
    logradouro?: string;
    erro?: boolean;
  };

  if (data.erro) {
    return null;
  }

  return {
    state: data.uf || "",
    city: data.localidade || "",
    neighborhood: data.bairro || "",
    address: data.logradouro || "",
  };
};
