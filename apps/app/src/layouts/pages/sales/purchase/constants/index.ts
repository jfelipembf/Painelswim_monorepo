import type { PaymentMethodOption } from "../types";

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { value: "cash", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "transfer", label: "Transferência" },
  { value: "credit", label: "Crédito" },
  { value: "debit", label: "Débito" },
];
