import { useState } from "react";

// @mui material components
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (initialValue: number) => void;
}

function OpenRegisterModal({ open, onClose, onConfirm }: Props): JSX.Element {
  const [initialValue, setInitialValue] = useState("");

  const handleConfirm = () => {
    const value = parseFloat(initialValue.replace(",", ".")) || 0;
    onConfirm(value);
    setInitialValue("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <MDBox display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h6" fontWeight="medium">
            Abrir Caixa
          </MDTypography>
          <IconButton onClick={onClose} size="small">
            <Icon>close</Icon>
          </IconButton>
        </MDBox>
      </DialogTitle>
      <DialogContent>
        <MDBox pt={2} pb={3}>
          <MDTypography variant="body2" color="text" mb={3}>
            Informe o valor inicial disponível no caixa para iniciar as operações do dia.
          </MDTypography>
          <MDInput
            autoFocus
            label="Saldo Inicial (R$)"
            fullWidth
            type="number"
            value={initialValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInitialValue(e.target.value)}
          />
        </MDBox>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <MDButton variant="outlined" color="secondary" onClick={onClose}>
          Cancelar
        </MDButton>
        <MDButton variant="gradient" color="info" onClick={handleConfirm}>
          Abrir Caixa
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

export default OpenRegisterModal;
