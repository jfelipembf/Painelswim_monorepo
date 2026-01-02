import React, { useEffect } from "react";
import { Button } from "reactstrap";

export const BranchBillingTab = ({
  branchId,
  billing,
  billingLoading,
  onRefresh,
  onOpenPortal,
  onLoad,
  error,
}) => {
  useEffect(() => {
    if (!billing && !billingLoading) {
      onLoad?.();
    }
  }, [billing, billingLoading, onLoad]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <div className="text-muted">Status de cobrança</div>
          <div>{billingLoading ? "Carregando..." : billing?.status || "—"}</div>
        </div>
        <div className="d-flex gap-2">
          <Button color="secondary" onClick={onRefresh} disabled={billingLoading}>
            Atualizar
          </Button>
          <Button color="primary" onClick={onOpenPortal} disabled={billingLoading}>
            Abrir portal
          </Button>
        </div>
      </div>

      {error ? <div className="text-danger mb-3">{error}</div> : null}

      <div className="mb-3">
        <div className="text-muted">Branch ID</div>
        <div>{branchId}</div>
      </div>

      {billing ? (
        <pre className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(billing, null, 2)}
        </pre>
      ) : null}
    </>
  );
};

export default BranchBillingTab;
