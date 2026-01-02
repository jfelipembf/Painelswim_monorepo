import type { ClientAddressPayload, ClientPayload } from "./clients.types";

export const emptyAddress = (): ClientAddressPayload => ({
  zipCode: "",
  state: "",
  city: "",
  neighborhood: "",
  address: "",
  number: "",
});

export const normalizeClientPayload = (payload: ClientPayload): ClientPayload => {
  return {
    ...payload,
    firstName: String(payload.firstName || "").trim(),
    lastName: String(payload.lastName || "").trim(),
    gender: String(payload.gender || "").trim(),
    birthDate: String(payload.birthDate || "").trim(),
    email: String(payload.email || "").trim(),
    phone: payload.phone !== undefined ? String(payload.phone || "").trim() : undefined,
    whatsapp: payload.whatsapp !== undefined ? String(payload.whatsapp || "").trim() : undefined,
    responsibleName:
      payload.responsibleName !== undefined
        ? String(payload.responsibleName || "").trim()
        : undefined,
    responsiblePhone:
      payload.responsiblePhone !== undefined
        ? String(payload.responsiblePhone || "").trim()
        : undefined,
    notes: payload.notes !== undefined ? String(payload.notes || "") : undefined,
    status: payload.status !== undefined ? String(payload.status || "").trim() : undefined,
    address: payload.address
      ? {
          zipCode: String(payload.address.zipCode || "").trim(),
          state: String(payload.address.state || "").trim(),
          city: String(payload.address.city || "").trim(),
          neighborhood: String(payload.address.neighborhood || "").trim(),
          address: String(payload.address.address || "").trim(),
          number: String(payload.address.number || "").trim(),
        }
      : emptyAddress(),
  };
};
