import { getFunctions, httpsCallable } from "firebase/functions";

type SuspendMembershipPayload = {
  idTenant: string;
  idBranch: string;
  clientId: string;
  membershipId: string;
  days: number;
  reason?: string;
};

type CancelMembershipPayload = {
  idTenant: string;
  idBranch: string;
  clientId: string;
  membershipId: string;
  reason?: string;
};

type AdjustMembershipDaysPayload = {
  idTenant: string;
  idBranch: string;
  clientId: string;
  membershipId: string;
  days: number;
  reason?: string;
};

export const suspendMembership = async (
  payload: SuspendMembershipPayload
): Promise<{ ok: boolean }> => {
  const functions = getFunctions();
  const callable = httpsCallable(functions, "suspendMembership");
  const response = await callable(payload);
  return (response.data || {}) as { ok: boolean };
};

export const cancelMembership = async (
  payload: CancelMembershipPayload
): Promise<{ ok: boolean }> => {
  const functions = getFunctions();
  const callable = httpsCallable(functions, "cancelMembership");
  const response = await callable(payload);
  return (response.data || {}) as { ok: boolean };
};

export const adjustMembershipDays = async (
  payload: AdjustMembershipDaysPayload
): Promise<{ ok: boolean }> => {
  const functions = getFunctions();
  const callable = httpsCallable(functions, "adjustMembershipDays");
  const response = await callable(payload);
  return (response.data || {}) as { ok: boolean };
};
