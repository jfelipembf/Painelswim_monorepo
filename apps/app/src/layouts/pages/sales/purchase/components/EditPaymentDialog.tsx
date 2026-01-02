import { useEffect, useMemo } from "react";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import type { Acquirer } from "hooks/acquirers";
import { formatCentsBRL, parseBRLToCents } from "hooks/sales";
import type { PurchasePaymentDraft } from "../types";
import { FormField } from "components";
import { CARD_BRAND_LABELS, type CardBrandKey } from "constants/cardBrands";

type Props = {
  open: boolean;
  submitting: boolean;
  payments: PurchasePaymentDraft[];
  editPaymentId: string;
  editPaymentAmount: string;
  onEditPaymentAmountChange: (value: string) => void;
  editPaymentPixTxid: string;
  onEditPaymentPixTxidChange: (value: string) => void;
  editPaymentTransferBankName: string;
  onEditPaymentTransferBankNameChange: (value: string) => void;
  editPaymentTransferReference: string;
  onEditPaymentTransferReferenceChange: (value: string) => void;
  editPaymentCardAcquirer: string;
  onEditPaymentCardAcquirerChange: (value: string) => void;
  editPaymentCardBrand: string;
  onEditPaymentCardBrandChange: (value: string) => void;
  editPaymentCardInstallments: string;
  onEditPaymentCardInstallmentsChange: (value: string) => void;
  editPaymentCardAuthCode: string;
  onEditPaymentCardAuthCodeChange: (value: string) => void;
  acquirers: Acquirer[];
  acquirersLoading: boolean;
  remainingCents: number;
  onClose: () => void;
  onSave: () => void;
};

const EditPaymentDialog = ({
  open,
  submitting,
  payments,
  editPaymentId,
  editPaymentAmount,
  onEditPaymentAmountChange,
  editPaymentPixTxid,
  onEditPaymentPixTxidChange,
  editPaymentTransferBankName,
  onEditPaymentTransferBankNameChange,
  editPaymentTransferReference,
  onEditPaymentTransferReferenceChange,
  editPaymentCardAcquirer,
  onEditPaymentCardAcquirerChange,
  editPaymentCardBrand,
  onEditPaymentCardBrandChange,
  editPaymentCardInstallments,
  onEditPaymentCardInstallmentsChange,
  editPaymentCardAuthCode,
  onEditPaymentCardAuthCodeChange,
  acquirers,
  acquirersLoading,
  remainingCents,
  onClose,
  onSave,
}: Props): JSX.Element => {
  const current = payments.find((payment) => payment.id === editPaymentId);
  const method = current?.method;
  const oldAmountCents = Number(current?.amountCents || 0);
  const allowedMax = remainingCents + oldAmountCents;
  const newAmountCents = parseBRLToCents(editPaymentAmount);
  const exceedsAllowedMax = newAmountCents > allowedMax;

  const selectedCardAcquirer = useMemo(
    () =>
      acquirers.find((acquirer) => String(acquirer.id) === String(editPaymentCardAcquirer || "")),
    [acquirers, editPaymentCardAcquirer]
  );

  const brandOptions = useMemo<CardBrandKey[]>(
    () =>
      selectedCardAcquirer
        ? (Object.entries(selectedCardAcquirer.brands || {}) as [CardBrandKey, boolean][])
            .filter(([, active]) => Boolean(active))
            .map(([brand]) => brand)
        : [],
    [selectedCardAcquirer]
  );

  useEffect(() => {
    const isCard = method === "credit" || method === "debit";
    if (!isCard) return;
    if (!selectedCardAcquirer || brandOptions.length === 0) {
      if (editPaymentCardBrand) onEditPaymentCardBrandChange("");
      return;
    }
    if (editPaymentCardBrand && !brandOptions.includes(editPaymentCardBrand as CardBrandKey)) {
      onEditPaymentCardBrandChange("");
    }
  }, [
    brandOptions,
    editPaymentCardBrand,
    method,
    onEditPaymentCardBrandChange,
    selectedCardAcquirer,
  ]);

  const brandSelectDisabled =
    !selectedCardAcquirer || brandOptions.length === 0 || Boolean(acquirersLoading);

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar pagamento</DialogTitle>
      <DialogContent>
        <MDBox pt={1}>
          {!method ? null : (
            <>
              <MDTypography variant="button" color="text">
                Método: {String(method).toUpperCase()}
              </MDTypography>
              <MDBox mt={2}>
                <FormField
                  label="Valor (R$)"
                  name="editAmount"
                  type="number"
                  value={editPaymentAmount}
                  onChange={(event: any) => onEditPaymentAmountChange(event.target.value)}
                  required
                />
                {exceedsAllowedMax ? (
                  <MDTypography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                    Valor não pode exceder {formatCentsBRL(allowedMax)}.
                  </MDTypography>
                ) : null}
              </MDBox>

              {method === "pix" ? (
                <MDBox mt={2}>
                  <FormField
                    label="TXID (opcional)"
                    name="editPixTxid"
                    value={editPaymentPixTxid}
                    onChange={(event: any) => onEditPaymentPixTxidChange(event.target.value)}
                  />
                </MDBox>
              ) : null}

              {method === "transfer" ? (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <FormField
                      label="Banco (opcional)"
                      name="editBankName"
                      value={editPaymentTransferBankName}
                      onChange={(event: any) =>
                        onEditPaymentTransferBankNameChange(event.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormField
                      label="Referência (opcional)"
                      name="editReference"
                      value={editPaymentTransferReference}
                      onChange={(event: any) =>
                        onEditPaymentTransferReferenceChange(event.target.value)
                      }
                    />
                  </Grid>
                </Grid>
              ) : null}

              {method === "credit" || method === "debit" ? (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <FormField
                      label="Adquirente"
                      name="editAcquirer"
                      select
                      value={editPaymentCardAcquirer}
                      onChange={(event: any) => onEditPaymentCardAcquirerChange(event.target.value)}
                      required
                      disabled={Boolean(acquirersLoading)}
                    >
                      <MenuItem value="">Selecione...</MenuItem>
                      {acquirers
                        .filter((acquirer) => !acquirer.inactive)
                        .map((acquirer) => (
                          <MenuItem key={acquirer.id} value={acquirer.id}>
                            {acquirer.name}
                          </MenuItem>
                        ))}
                    </FormField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormField
                      label="Bandeira"
                      name="editBrand"
                      value={editPaymentCardBrand}
                      onChange={(event: any) => onEditPaymentCardBrandChange(event.target.value)}
                      required
                    />
                  </Grid>
                  {method === "credit" ? (
                    <Grid item xs={12} md={6}>
                      <FormField
                        label="Parcelas"
                        name="editInstallments"
                        type="number"
                        value={editPaymentCardInstallments}
                        onChange={(event: any) =>
                          onEditPaymentCardInstallmentsChange(event.target.value)
                        }
                        required
                      />
                    </Grid>
                  ) : null}
                  <Grid item xs={12} md={method === "credit" ? 6 : 12}>
                    <FormField
                      label="Código de autorização"
                      name="editAuthCode"
                      value={editPaymentCardAuthCode}
                      onChange={(event: any) => onEditPaymentCardAuthCodeChange(event.target.value)}
                      required
                    />
                  </Grid>
                </Grid>
              ) : null}
            </>
          )}
        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton variant="outlined" color="secondary" onClick={onClose} disabled={submitting}>
          Cancelar
        </MDButton>
        <MDButton
          variant="gradient"
          color="info"
          disabled={submitting || !editPaymentId || !newAmountCents || exceedsAllowedMax}
          onClick={onSave}
        >
          Salvar
        </MDButton>
      </DialogActions>
    </Dialog>
  );
};

export default EditPaymentDialog;
