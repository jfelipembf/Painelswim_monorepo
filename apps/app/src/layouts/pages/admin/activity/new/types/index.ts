import type { ActivityStatus } from "hooks/activities";

export type ActivityFormValues = {
  name: string;
  description: string;
  color: string;
  status: ActivityStatus;
  shareWithOtherUnits: boolean;
  photoUrl?: string;
};
