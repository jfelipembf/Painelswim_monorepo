import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Icon from "@mui/material/Icon";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

type ActionType = "evaluation" | "test";

type Props = {
  open: boolean;
  classTitle: string;
  onClose: () => void;
  onSelect: (action: ActionType) => void;
};

function SelectActionDialog({ open, classTitle, onClose, onSelect }: Props): JSX.Element {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" gap={2}>
          <MDBox>
            <MDTypography variant="h5" fontWeight="bold">
              {classTitle || "Turma"}
            </MDTypography>
            <MDTypography variant="button" color="text">
              O que você deseja registrar?
            </MDTypography>
          </MDBox>
          <MDButton variant="outlined" color="secondary" onClick={onClose}>
            Fechar
          </MDButton>
        </MDBox>

        <MDBox mt={3} display="grid" gap={2}>
          <MDButton
            variant="gradient"
            color="info"
            size="large"
            onClick={() => onSelect("evaluation")}
            sx={{ py: 2 }}
          >
            <Icon>assignment_turned_in</Icon>&nbsp;Avaliar
          </MDButton>

          <MDButton
            variant="gradient"
            color="success"
            size="large"
            onClick={() => onSelect("test")}
            sx={{ py: 2 }}
          >
            <Icon>timer</Icon>&nbsp;Informar Teste
          </MDButton>
        </MDBox>
      </DialogContent>
    </Dialog>
  );
}

export default SelectActionDialog;
export type { ActionType };
