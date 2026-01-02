import { fetchAddressByCep, normalizeCep } from "../../../utils";

export const fetchNormalizedAddress = async (cep) => {
  const normalized = normalizeCep(cep);
  if (normalized.length !== 8) {
    return { normalizedCep: normalized, address: null };
  }

  const address = await fetchAddressByCep(normalized);
  return { normalizedCep: normalized, address };
};
