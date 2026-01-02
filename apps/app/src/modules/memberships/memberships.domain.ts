import type { CreateMembershipPayload } from "./memberships.types";

export const normalizeMembershipPayload = (
  payload: CreateMembershipPayload
): CreateMembershipPayload => {
  return {
    ...payload,
    planId: String(payload.planId || "").trim(),
    planName: String(payload.planName || "").trim(),
    priceCents: Math.max(0, Math.round(Number(payload.priceCents || 0))),
    startAt: String(payload.startAt || ""),
    endAt: payload.endAt ? String(payload.endAt) : undefined,
    status: (payload.status as any) || "active",
    allowCrossBranchAccess: Boolean(payload.allowCrossBranchAccess),
    allowedBranchIds: Array.isArray(payload.allowedBranchIds)
      ? payload.allowedBranchIds.map(String)
      : [],
    saleId: payload.saleId ? String(payload.saleId) : undefined,
  };
};
