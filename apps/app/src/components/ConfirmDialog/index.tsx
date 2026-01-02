import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "info" | "error" | "success" | "warning" | "dark";
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmColor = "error",
  onConfirm,
  onCancel,
}: ConfirmDialogProps): JSX.Element {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {description ? (
          <MDTypography variant="button" color="text" sx={{ display: "block" }}>
            {description}
          </MDTypography>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <MDButton variant="outlined" color="dark" onClick={onCancel}>
          {cancelLabel}
        </MDButton>
        <MDButton variant="gradient" color={confirmColor} onClick={onConfirm}>
          {confirmLabel}
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;
