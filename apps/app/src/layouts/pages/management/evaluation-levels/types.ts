import type { EvaluationLevel } from "hooks/evaluationLevels";

export type EvaluationLevelFormValues = {
  name: string;
  value: string;
  sharedAcrossBranches: boolean;
  inactive: boolean;
};

export type EvaluationLevelItem = EvaluationLevel;
