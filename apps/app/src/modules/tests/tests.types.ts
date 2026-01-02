export type TestMode = "distance" | "time";

export type TestDefinition = {
  id: string;
  idTenant: string;
  idBranch: string;
  mode: TestMode;
  name: string;
  fixedDistanceMeters?: number;
  fixedTimeSeconds?: number;
  inactive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type TestDefinitionPayload = {
  mode: TestMode;
  name: string;
  fixedDistanceMeters?: number;
  fixedTimeSeconds?: number;
  inactive?: boolean;
};

export type TestResultValue = {
  value: string;
};

export type ClientTestResultDoc = {
  id: string;
  idTenant: string;
  idBranch: string;
  clientId: string;
  eventPlanId: string;
  eventTypeName: string;
  startAt: string;
  endAt?: string;
  resultsByTestId: Record<string, TestResultValue>;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedByUserId?: string;
};

export type UpsertClientTestResultPayload = {
  idTenant: string;
  idBranch: string;
  clientId: string;
  eventPlanId: string;
  eventTypeName: string;
  startAt: string;
  endAt?: string;
  resultsByTestId: Record<string, TestResultValue>;
  updatedByUserId?: string;
};
