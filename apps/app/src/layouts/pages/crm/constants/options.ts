export type Option = { value: string; label: string };

export const CRM_EVALUATIONS: Option[] = [
  { value: "ev-1", label: "Avaliação Inicial" },
  { value: "ev-2", label: "Avaliação Intermediária" },
  { value: "ev-3", label: "Avaliação Avançada" },
];

export const CRM_TESTS: Option[] = [
  { value: "t-1", label: "Teste 50m Livre" },
  { value: "t-2", label: "Teste 100m Livre" },
  { value: "t-3", label: "Teste 200m Livre" },
];

export const CRM_CONTRACTS: Option[] = [
  { value: "", label: "Selecione o contrato" },
  { value: "monthly", label: "Plano Mensal" },
  { value: "quarterly", label: "Plano Trimestral" },
  { value: "annual", label: "Plano Anual" },
];

export const CRM_AGREEMENTS: Option[] = [
  { value: "", label: "Selecione o convênio" },
  { value: "agreement-1", label: "Convênio A" },
  { value: "agreement-2", label: "Convênio B" },
];

export const CRM_INSTRUCTORS: Option[] = [
  { value: "", label: "Todos" },
  { value: "Professor 1", label: "Professor 1" },
  { value: "Professor 2", label: "Professor 2" },
];

export const CRM_CONSULTANTS: Option[] = [
  { value: "", label: "Todos" },
  { value: "Consultor A", label: "Consultor A" },
  { value: "Consultor B", label: "Consultor B" },
];

export const CRM_ACTIVITIES: Option[] = [
  { value: "", label: "Todas" },
  { value: "Natação", label: "Natação" },
  { value: "Hidro", label: "Hidro" },
  { value: "Musculação", label: "Musculação" },
];
