export type TaskPayload = {
  title: string;
  description?: string;
  dueDateKey: string;
  assigneeIds: string[];
  clientId?: string;
  urgency?: "low" | "medium" | "high";
  status?: string;
};

export type Task = TaskPayload & {
  id: string;
  idTenant: string;
  idBranch: string;
  createdByUserId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  completedBy?: Record<string, unknown>;
};
