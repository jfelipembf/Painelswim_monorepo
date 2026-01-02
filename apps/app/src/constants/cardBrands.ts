export type CardBrandKey =
  | "visa"
  | "mastercard"
  | "elo"
  | "amex"
  | "hipercard"
  | "diners"
  | "other";

export const CARD_BRANDS: CardBrandKey[] = [
  "visa",
  "mastercard",
  "elo",
  "amex",
  "hipercard",
  "diners",
  "other",
];

export const CARD_BRAND_LABELS: Record<CardBrandKey, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "Amex",
  hipercard: "Hipercard",
  diners: "Diners",
  other: "Outra",
};
