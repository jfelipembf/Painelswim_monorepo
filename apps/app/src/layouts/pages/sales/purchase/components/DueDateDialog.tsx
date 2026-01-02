import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import { Portuguese } from "flatpickr/dist/l10n/pt";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDDatePicker from "components/MDDatePicker";
import MDTypography from "components/MDTypography";

type Props = {
  open: boolean;
  submitting: boolean;
  dueDateValue: Date | null;
  onChangeDate: (value: Date | null) => void;
  onClose: () => void;
  onSave: () => void;
};

const DueDateDialog = ({
  open,
  submitting,
  dueDateValue,
  onChangeDate,
  onClose,
  onSave,
}: Props): JSX.Element => (
  <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
    <DialogTitle>Saldo devedor</DialogTitle>
    <DialogContent>
      <MDBox pt={1}>
        <MDTypography variant="body2" color="text">
          Existe saldo em aberto. Informe a data prometida de pagamento para continuar.
        </MDTypography>
        <MDBox mt={2}>
          <MDDatePicker
            value={dueDateValue ? [dueDateValue] : []}
            options={{
              dateFormat: "d/m/Y",
              locale: Portuguese,
            }}
            onChange={(dates: any[]) => {
              const date = dates?.[0] || null;
              onChangeDate(date);
            }}
            input={{
              label: "Data prometida",
              fullWidth: true,
            }}
          />
        </MDBox>
      </MDBox>
    </DialogContent>
    <DialogActions>
      <MDButton variant="outlined" color="secondary" onClick={onClose} disabled={submitting}>
        Cancelar
      </MDButton>
      <MDButton
        variant="gradient"
        color="info"
        disabled={submitting || !dueDateValue}
        onClick={onSave}
      >
        Salvar
      </MDButton>
    </DialogActions>
  </Dialog>
);

export default DueDateDialog;
