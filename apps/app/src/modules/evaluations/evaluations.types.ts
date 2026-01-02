export type EvaluationTopicLevel = {
  levelId: string;
  levelName: string;
  levelValue: number;
};

export type EvaluationDoc = {
  id: string;
  idTenant: string;
  idBranch: string;
  clientId: string;
  idClass: string;
  idActivity: string;
  eventPlanId: string;
  eventTypeName: string;
  startAt: string;
  endAt?: string;
  levelsByTopicId: Record<string, EvaluationTopicLevel>;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedByUserId?: string;
};

export type UpsertEvaluationPayload = {
  idTenant: string;
  idBranch: string;
  clientId: string;
  idClass: string;
  idActivity: string;
  eventPlanId: string;
  eventTypeName: string;
  startAt: string;
  endAt?: string;
  levelsByTopicId: Record<string, EvaluationTopicLevel>;
  updatedByUserId?: string;
};
