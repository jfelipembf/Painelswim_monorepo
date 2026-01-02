export type MembershipStatus = "pending" | "active" | "paused" | "canceled" | "expired";

export type Membership = {
  id: string;
  idTenant: string;
  idBranch: string;
  clientId: string;
  planId: string;
  planName: string;
  priceCents: number;
  startAt: string;
  durationType?: "day" | "week" | "month" | "year";
  duration?: number;
  endAt?: string;
  statusDateKey?: string;
  status: MembershipStatus;
  pauseStartAt?: string;
  pauseUntil?: string;
  suspensionCount?: number;
  suspensionDaysUsed?: number;
  suspensionDaysCurrent?: number;
  allowCrossBranchAccess: boolean;
  allowedBranchIds?: string[];
  saleId?: string;
  cancellationReason?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type MembershipSuspension = {
  id: string;
  idTenant?: string;
  idBranch?: string;
  clientId?: string;
  membershipId?: string;
  startAt: string;
  endAt: string;
  days?: number;
  reason?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type MembershipAdjustment = {
  id: string;
  idTenant?: string;
  idBranch?: string;
  clientId?: string;
  membershipId?: string;
  days: number;
  previousEndAt?: string;
  nextEndAt?: string;
  reason?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CreateMembershipPayload = Omit<
  Membership,
  "id" | "idTenant" | "createdAt" | "updatedAt" | "clientId" | "idBranch"
>;
