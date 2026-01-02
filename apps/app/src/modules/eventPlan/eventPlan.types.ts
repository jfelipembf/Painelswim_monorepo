export type EventType = {
  id: string;
  idTenant: string;
  idBranch: string;
  name: string;
  className: string;
  inactive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type EventTypePayload = {
  idBranch?: string;
  name: string;
  className: string;
  inactive: boolean;
};

export type EventPlan = {
  id: string;
  idTenant: string;
  idBranch: string;
  eventTypeId: string;
  eventTypeName: string;
  className: string;
  startAt: string;
  endAt?: string;
  allDay: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type EventPlanPayload = {
  idBranch?: string;
  eventTypeId: string;
  eventTypeName: string;
  className: string;
  startAt: string;
  endAt?: string;
  allDay: boolean;
};
