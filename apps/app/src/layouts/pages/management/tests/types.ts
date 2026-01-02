import type { TestDefinition, TestMode } from "hooks/tests";

export type TestFormValues = {
  name: string;
  fixedDistanceMeters: string;
  fixedTimeSeconds: string;
  inactive: boolean;
};

export type TestItem = TestDefinition;
export type TestTabMode = TestMode;
