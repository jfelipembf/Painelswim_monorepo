export type Topic = {
  id: string;
  description: string;
  order?: number;
};

export type Objective = {
  id: string;
  title: string;
  topics: Topic[];
  order?: number;
};

export type ActivityStatus = "active" | "inactive";

export type Activity = {
  id: string;
  idTenant: string;
  idBranch: string;
  name: string;
  description?: string;
  color: string;
  status: ActivityStatus;
  shareWithOtherUnits: boolean;
  photoUrl?: string;
  objectives: Objective[];
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ActivityPayload = Omit<
  Activity,
  "id" | "idTenant" | "idBranch" | "createdAt" | "updatedAt"
>;
