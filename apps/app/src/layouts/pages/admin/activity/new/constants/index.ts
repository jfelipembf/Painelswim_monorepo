import type { ActivityFormValues } from "../types";

export const DEFAULT_ACTIVITY_COLOR = "#1E88E5";

export const ACTIVITY_FORM_INITIAL_VALUES: ActivityFormValues = {
  name: "",
  description: "",
  color: DEFAULT_ACTIVITY_COLOR,
  status: "active",
  shareWithOtherUnits: false,
  photoUrl: "",
};
