import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Icon from "@mui/material/Icon";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import { exportClientFiltersReport } from "layouts/pages/crm/utils";

import ClientFiltersTable from "../ClientFiltersTable";

import type { ClientFilterRow } from "layouts/pages/crm/types";

type Props = {
  open: boolean;
  onClose: () => void;
  members: ClientFilterRow[];
  loading?: boolean;
  error?: string | null;
};

function ClientFiltersResultsModal({ open, onClose, members, loading, error }: Props): JSX.Element {
  const handleExport = () => {
    if (!members.length) return;
    exportClientFiltersReport(members);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Resultados do filtro</DialogTitle>
      <DialogContent>
        <MDBox pt={1}>
          {loading ? (
            <MDTypography variant="button" color="text" fontWeight="regular">
              Carregando clientes...
            </MDTypography>
          ) : error ? (
            <MDTypography variant="button" color="error" fontWeight="medium">
              {error}
            </MDTypography>
          ) : members.length ? (
            <ClientFiltersTable members={members} />
          ) : (
            <MDTypography variant="button" color="text" fontWeight="regular">
              Nenhum cliente encontrado para os filtros selecionados.
            </MDTypography>
          )}
        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton variant="outlined" color="secondary" onClick={onClose}>
          Fechar
        </MDButton>
        <MDButton
          variant="gradient"
          color="info"
          startIcon={<Icon>print</Icon>}
          onClick={handleExport}
          disabled={!members.length || Boolean(error) || Boolean(loading)}
        >
          Exportar Relatório
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

export default ClientFiltersResultsModal;
