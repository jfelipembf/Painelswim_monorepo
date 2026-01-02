import { useState } from "react";

// @mui material components
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";

import { CASHIER_EXIT_CATEGORIES } from "../../constants";

type ExitCategory = (typeof CASHIER_EXIT_CATEGORIES)[number];

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { description: string; value: number; category: string }) => void;
}

function NewExitModal({ open, onClose, onConfirm }: Props): JSX.Element {
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState<ExitCategory>(CASHIER_EXIT_CATEGORIES[0]);

  const handleConfirm = () => {
    const numValue = parseFloat(value.replace(",", ".")) || 0;
    onConfirm({ description, value: numValue, category });
    setDescription("");
    setValue("");
    setCategory(CASHIER_EXIT_CATEGORIES[0]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <MDBox display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h6" fontWeight="medium" color="error">
            Nova Saída
          </MDTypography>
          <IconButton onClick={onClose} size="small">
            <Icon>close</Icon>
          </IconButton>
        </MDBox>
      </DialogTitle>
      <DialogContent>
        <MDBox pt={2} pb={3} display="flex" flexDirection="column" gap={2}>
          <MDInput
            variant="standard"
            label="Descrição"
            fullWidth
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
          />
          <MDInput
            variant="standard"
            label="Valor (R$)"
            fullWidth
            type="number"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
          />
          <MDInput
            variant="standard"
            select
            label="Categoria"
            fullWidth
            value={category}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCategory(e.target.value as ExitCategory)
            }
          >
            {CASHIER_EXIT_CATEGORIES.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </MDInput>
        </MDBox>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <MDButton variant="outlined" color="secondary" onClick={onClose}>
          Cancelar
        </MDButton>
        <MDButton variant="gradient" color="error" onClick={handleConfirm}>
          Salvar Saída
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

export default NewExitModal;
