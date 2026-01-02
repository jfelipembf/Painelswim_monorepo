import type { Activity, ActivityPayload, Objective } from "hooks/activities";

import { ACTIVITY_FORM_INITIAL_VALUES } from "../constants";
import type { ActivityFormValues } from "../types";

export const buildActivityFormValues = (activity?: Activity | null): ActivityFormValues => {
  if (!activity) return ACTIVITY_FORM_INITIAL_VALUES;
  return {
    name: String(activity.name || ""),
    description: String(activity.description || ""),
    color: String(activity.color || ACTIVITY_FORM_INITIAL_VALUES.color),
    status: activity.status === "inactive" ? "inactive" : "active",
    shareWithOtherUnits: Boolean(activity.shareWithOtherUnits),
    photoUrl: activity.photoUrl ? String(activity.photoUrl) : "",
  };
};

export const buildActivityPayload = (
  values: ActivityFormValues,
  objectives: Objective[],
  photoUrlOverride?: string
): ActivityPayload => {
  const resolvedPhotoUrl = photoUrlOverride || values.photoUrl;

  return {
    name: values.name,
    description: values.description,
    color: values.color,
    status: values.status,
    shareWithOtherUnits: values.shareWithOtherUnits,
    photoUrl: resolvedPhotoUrl ? String(resolvedPhotoUrl) : undefined,
    objectives,
  };
};
