export type ClientAddressPayload = {
  zipCode: string;
  state: string;
  city: string;
  neighborhood: string;
  address: string;
  number: string;
};

export type ClientPayload = {
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  email: string;
  photoUrl?: string;
  phone?: string;
  whatsapp?: string;
  responsibleName?: string;
  responsiblePhone?: string;
  address: ClientAddressPayload;
  notes?: string;
  status?: string;
  createdByUserId?: string;
};

export type Client = ClientPayload & {
  id: string;
  idTenant: string;
  idBranch: string;
  friendlyId?: string;
  debtCents?: number;
  activeMembershipId?: string;
  scheduledMembershipId?: string;
  activeSaleId?: string;
  createdByUserId?: string;
  access?: {
    allowCrossBranchAccess?: boolean;
    allowedBranchIds?: string[];
  };
  lastPresenceDateKey?: string;
  abandonmentRisk?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};
