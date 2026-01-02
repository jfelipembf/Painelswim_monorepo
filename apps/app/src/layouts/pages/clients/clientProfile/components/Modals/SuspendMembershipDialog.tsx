import { useEffect, useState } from "react";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import MDTypography from "components/MDTypography";

type Props = {
  open: boolean;
  loading?: boolean;
  minDays?: number;
  maxDays?: number;
  remainingTimes?: number | null;
  onClose: () => void;
  onConfirm: (days: number) => void;
};

function SuspendMembershipDialog({
  open,
  loading,
  minDays,
  maxDays,
  remainingTimes,
  onClose,
  onConfirm,
}: Props): JSX.Element {
  const [days, setDays] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDays(minDays && minDays > 0 ? String(minDays) : "");
    setError(null);
  }, [minDays, open]);

  const handleConfirm = () => {
    const parsed = Number(days || 0);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Informe a quantidade de dias.");
      return;
    }
    if (minDays && parsed < minDays) {
      setError(`A suspensão deve ter no mínimo ${minDays} dias.`);
      return;
    }
    if (maxDays && parsed > maxDays) {
      setError(`A suspensão deve ter no máximo ${maxDays} dias.`);
      return;
    }
    setError(null);
    onConfirm(Math.floor(parsed));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Suspender contrato</DialogTitle>
      <DialogContent>
        <MDBox display="flex" flexDirection="column" gap={1.5} mt={0.5}>
          <MDTypography variant="button" color="text">
            Informe a quantidade de dias que o contrato ficará suspenso.
          </MDTypography>
          <MDInput
            type="number"
            label="Dias de suspensão"
            value={days}
            onChange={(e: any) => setDays(e.target.value)}
            inputProps={{ min: 1 }}
            disabled={loading}
          />
          {remainingTimes !== null ? (
            <MDTypography variant="caption" color="text">
              Suspensões restantes: {Math.max(0, remainingTimes)}
            </MDTypography>
          ) : null}
          {minDays ? (
            <MDTypography variant="caption" color="text">
              Mínimo: {minDays} dias
            </MDTypography>
          ) : null}
          {maxDays ? (
            <MDTypography variant="caption" color="text">
              Máximo: {maxDays} dias
            </MDTypography>
          ) : null}
          {error ? (
            <MDTypography variant="caption" color="error">
              {error}
            </MDTypography>
          ) : null}
        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton variant="outlined" color="dark" onClick={onClose} disabled={loading}>
          Cancelar
        </MDButton>
        <MDButton variant="gradient" color="info" onClick={handleConfirm} disabled={loading}>
          Confirmar
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

export default SuspendMembershipDialog;
