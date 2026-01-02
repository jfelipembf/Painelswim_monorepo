import { serverTimestamp } from "firebase/firestore";

import type { SaleItem, SaleStatus } from "../sales.types";

type SaleDocumentParams = {
  idTenant: string;
  sanitizedPayload: Record<string, any>;
  dateKey: string;
  branchDateKey: string;
  items: SaleItem[];
  status: SaleStatus;
  feesCents: number;
  netPaidTotalCents: number;
};

const buildSaleDocument = ({
  idTenant,
  sanitizedPayload,
  dateKey,
  branchDateKey,
  items,
  status,
  feesCents,
  netPaidTotalCents,
}: SaleDocumentParams) => ({
  idTenant,
  ...sanitizedPayload,
  dateKey,
  branchDateKey,
  items,
  status,
  feesCents,
  netPaidTotalCents,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

export { buildSaleDocument };
