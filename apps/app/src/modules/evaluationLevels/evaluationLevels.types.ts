export type EvaluationLevel = {
  id: string;
  idTenant: string;
  idBranch: string;
  name: string;
  value: number;
  order: number;
  inactive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type EvaluationLevelPayload = {
  name: string;
  value: number;
  order?: number;
  inactive?: boolean;
};
