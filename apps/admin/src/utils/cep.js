export const normalizeCep = (cep) => {
  if (!cep) return "";
  return String(cep).replace(/\D/g, "").slice(0, 8);
};

export const fetchAddressByCep = async (cep) => {
  const normalized = normalizeCep(cep);
  if (normalized.length !== 8) return null;

  const res = await fetch(`https://viacep.com.br/ws/${normalized}/json/`);
  if (!res.ok) throw new Error("Erro ao buscar CEP");

  const data = await res.json();
  if (data?.erro) return null;

  return {
    cep: data.cep || normalized,
    estado: data.uf || "",
    cidade: data.localidade || "",
    bairro: data.bairro || "",
    rua: data.logradouro || "",
  };
};
