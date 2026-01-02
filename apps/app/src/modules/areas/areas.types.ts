export type Area = {
  id: string;
  idTenant: string;
  idBranch: string;
  name: string;
  lengthMeters: number;
  widthMeters: number;
  maxCapacity: number;
  inactive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type AreaPayload = {
  name: string;
  lengthMeters: number;
  widthMeters: number;
  maxCapacity: number;
  inactive: boolean;
};
