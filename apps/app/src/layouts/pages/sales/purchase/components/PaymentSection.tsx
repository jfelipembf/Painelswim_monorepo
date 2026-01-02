import { useEffect, useMemo } from "react";

import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import type { Acquirer } from "hooks/acquirers";
import { formatCentsBRL, parseBRLToCents } from "hooks/sales";
import { PAYMENT_METHOD_OPTIONS } from "../constants";
import type { PaymentMethod } from "../types";
import { FormField } from "components";
import { CARD_BRAND_LABELS, type CardBrandKey } from "constants/cardBrands";

type Props = {
  paymentTabValue: number;
  onPaymentTabChange: (_: unknown, value: number) => void;
  newPaymentMethod: PaymentMethod;
  newPaymentAmount: string;
  onPaymentAmountChange: (value: string) => void;
  newPaymentPixTxid: string;
  onPaymentPixTxidChange: (value: string) => void;
  newPaymentTransferBankName: string;
  onPaymentTransferBankNameChange: (value: string) => void;
  newPaymentTransferReference: string;
  onPaymentTransferReferenceChange: (value: string) => void;
  newPaymentCardAcquirer: string;
  onPaymentCardAcquirerChange: (value: string) => void;
  newPaymentCardBrand: string;
  onPaymentCardBrandChange: (value: string) => void;
  newPaymentCardInstallments: string;
  onPaymentCardInstallmentsChange: (value: string) => void;
  newPaymentCardAuthCode: string;
  onPaymentCardAuthCodeChange: (value: string) => void;
  acquirers: Acquirer[];
  acquirersLoading: boolean;
  acquirersError: string | null;
  remainingCents: number;
  maxPaymentCents?: number;
  onAddPayment: () => void;
  editingPaymentId?: string | null;
  onCancelEditPayment?: () => void;
  disabled?: boolean;
};

const PaymentSection = ({
  paymentTabValue,
  onPaymentTabChange,
  newPaymentMethod,
  newPaymentAmount,
  onPaymentAmountChange,
  newPaymentPixTxid,
  onPaymentPixTxidChange,
  newPaymentTransferBankName,
  onPaymentTransferBankNameChange,
  newPaymentTransferReference,
  onPaymentTransferReferenceChange,
  newPaymentCardAcquirer,
  onPaymentCardAcquirerChange,
  newPaymentCardBrand,
  onPaymentCardBrandChange,
  newPaymentCardInstallments,
  onPaymentCardInstallmentsChange,
  newPaymentCardAuthCode,
  onPaymentCardAuthCodeChange,
  acquirers,
  acquirersLoading,
  acquirersError,
  remainingCents,
  maxPaymentCents,
  onAddPayment,
  editingPaymentId,
  onCancelEditPayment,
  disabled,
}: Props): JSX.Element => {
  const amountCents = parseBRLToCents(newPaymentAmount);
  const isCardPayment = newPaymentMethod === "credit" || newPaymentMethod === "debit";
  const effectiveMaxCents =
    typeof maxPaymentCents === "number" && Number.isFinite(maxPaymentCents)
      ? maxPaymentCents
      : remainingCents;
  const exceedsMax = effectiveMaxCents >= 0 && amountCents > effectiveMaxCents;
  const actionLabel = editingPaymentId ? "Salvar alterações" : "Adicionar pagamento";
  const handleCancelEdit = () => {
    if (typeof onCancelEditPayment === "function") onCancelEditPayment();
  };
  const submitDisabled = Boolean(disabled) || !amountCents || exceedsMax || effectiveMaxCents < 0;

  const selectedCardAcquirer = useMemo(
    () =>
      acquirers.find((acquirer) => String(acquirer.id) === String(newPaymentCardAcquirer || "")),
    [acquirers, newPaymentCardAcquirer]
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
    if (!isCardPayment) return;
    if (!selectedCardAcquirer || brandOptions.length === 0) {
      if (newPaymentCardBrand) onPaymentCardBrandChange("");
      return;
    }
    if (newPaymentCardBrand && !brandOptions.includes(newPaymentCardBrand as CardBrandKey)) {
      onPaymentCardBrandChange("");
    }
  }, [
    brandOptions,
    isCardPayment,
    newPaymentCardBrand,
    onPaymentCardBrandChange,
    selectedCardAcquirer,
  ]);

  const brandSelectDisabled =
    Boolean(disabled) || !selectedCardAcquirer || brandOptions.length === 0;

  return (
    <MDBox mt={3}>
      <MDTypography variant="h6" fontWeight="medium">
        Pagamentos
      </MDTypography>

      <MDBox mt={1}>
        <Tabs
          value={paymentTabValue}
          onChange={onPaymentTabChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: "36px",
            "& .MuiTab-root": {
              fontSize: "0.875rem",
              minHeight: "36px",
            },
          }}
        >
          {PAYMENT_METHOD_OPTIONS.map((opt) => (
            <Tab key={opt.value} label={opt.label} disabled={Boolean(disabled)} />
          ))}
        </Tabs>
      </MDBox>

      {editingPaymentId ? (
        <MDBox mt={2} p={2} borderRadius="md" sx={{ border: "1px solid rgba(0,0,0,0.1)" }}>
          <MDTypography variant="button" color="text" fontWeight="medium">
            Editando pagamento selecionado
          </MDTypography>
          <MDTypography variant="caption" color="text" display="block">
            As alterações substituirão o pagamento existente.
          </MDTypography>
        </MDBox>
      ) : null}

      <MDBox mt={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormField
              label="Valor (R$)"
              name="amountCents"
              type="number"
              value={newPaymentAmount}
              onChange={(event: any) => onPaymentAmountChange(event.target.value)}
              disabled={Boolean(disabled)}
            />
          </Grid>
        </Grid>
      </MDBox>

      {newPaymentMethod === "pix" ? (
        <MDBox mt={2}>
          <FormField
            label="TXID (opcional)"
            name="pixTxid"
            value={newPaymentPixTxid}
            onChange={(event: any) => onPaymentPixTxidChange(event.target.value)}
            disabled={Boolean(disabled)}
          />
        </MDBox>
      ) : null}

      {newPaymentMethod === "transfer" ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <FormField
              label="Banco (opcional)"
              name="bankName"
              value={newPaymentTransferBankName}
              onChange={(event: any) => onPaymentTransferBankNameChange(event.target.value)}
              disabled={Boolean(disabled)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              label="Referência (opcional)"
              name="reference"
              value={newPaymentTransferReference}
              onChange={(event: any) => onPaymentTransferReferenceChange(event.target.value)}
              disabled={Boolean(disabled)}
            />
          </Grid>
        </Grid>
      ) : null}

      {newPaymentMethod === "credit" || newPaymentMethod === "debit" ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <FormField
              label="Adquirente"
              name="acquirer"
              select
              value={newPaymentCardAcquirer}
              onChange={(event: any) => onPaymentCardAcquirerChange(event.target.value)}
              required
              disabled={Boolean(acquirersLoading) || Boolean(disabled)}
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
            {acquirersError ? (
              <MDTypography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                {acquirersError}
              </MDTypography>
            ) : null}
          </Grid>

          <Grid item xs={12} md={6}>
            <FormField
              label="Bandeira"
              name="brand"
              select
              value={newPaymentCardBrand}
              onChange={(event: any) => onPaymentCardBrandChange(event.target.value)}
              required
              disabled={brandSelectDisabled}
            >
              <MenuItem value="">Selecione...</MenuItem>
              {brandOptions.map((brand) => (
                <MenuItem key={brand} value={brand}>
                  {brand === "other"
                    ? selectedCardAcquirer?.otherBrandName?.trim() || CARD_BRAND_LABELS.other
                    : CARD_BRAND_LABELS[brand]}
                </MenuItem>
              ))}
            </FormField>
            {!selectedCardAcquirer || brandOptions.length ? null : (
              <MDTypography variant="caption" color="text" sx={{ mt: 1, display: "block" }}>
                Nenhuma bandeira habilitada para esta adquirente.
              </MDTypography>
            )}
          </Grid>

          {newPaymentMethod === "credit" ? (
            <Grid item xs={12} md={6}>
              <FormField
                label="Parcelas"
                name="installments"
                type="number"
                value={newPaymentCardInstallments}
                onChange={(event: any) => onPaymentCardInstallmentsChange(event.target.value)}
                required
                disabled={Boolean(disabled)}
              />
            </Grid>
          ) : null}

          <Grid item xs={12} md={newPaymentMethod === "credit" ? 6 : 12}>
            <FormField
              label="Código de autorização"
              name="authCode"
              value={newPaymentCardAuthCode}
              onChange={(event: any) => onPaymentCardAuthCodeChange(event.target.value)}
              required
              disabled={Boolean(disabled)}
            />
          </Grid>
        </Grid>
      ) : null}

      {exceedsMax ? (
        <MDTypography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
          Valor não pode exceder {formatCentsBRL(effectiveMaxCents)}.
        </MDTypography>
      ) : null}

      <MDBox mt={2} display="flex" flexDirection="column" gap={1}>
        <MDButton
          fullWidth
          variant="gradient"
          color="info"
          onClick={onAddPayment}
          disabled={submitDisabled}
        >
          {actionLabel}
        </MDButton>
        {editingPaymentId ? (
          <MDButton
            fullWidth
            variant="outlined"
            color="secondary"
            onClick={handleCancelEdit}
            disabled={Boolean(disabled)}
          >
            Cancelar edição
          </MDButton>
        ) : null}
      </MDBox>
    </MDBox>
  );
};

export default PaymentSection;
