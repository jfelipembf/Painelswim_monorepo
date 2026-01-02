export const GENDERS = ["masculino", "feminino", "outro"] as const;

export type GenderKey = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<GenderKey, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  outro: "Outro",
};
