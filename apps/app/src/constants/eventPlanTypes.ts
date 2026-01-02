export const EVENT_PLAN_TYPE_KEYS = {
  EVALUATION: "avaliacao",
  TESTS: "testes",
} as const;

export const EVENT_PLAN_TYPE_LABELS = {
  [EVENT_PLAN_TYPE_KEYS.EVALUATION]: "Avaliação",
  [EVENT_PLAN_TYPE_KEYS.TESTS]: "Testes",
} as const;

export const normalizeEventTypeKey = (value: string): string => {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return "";
  const noAccents = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return noAccents.replace(/[^a-z0-9]+/g, "");
};

export const HARD_CODED_EVENT_TYPES = [
  {
    key: EVENT_PLAN_TYPE_KEYS.EVALUATION,
    name: EVENT_PLAN_TYPE_LABELS[EVENT_PLAN_TYPE_KEYS.EVALUATION],
    className: "info",
  },
  {
    key: EVENT_PLAN_TYPE_KEYS.TESTS,
    name: EVENT_PLAN_TYPE_LABELS[EVENT_PLAN_TYPE_KEYS.TESTS],
    className: "dark",
  },
] as const;
