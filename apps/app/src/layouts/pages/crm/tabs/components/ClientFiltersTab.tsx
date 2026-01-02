import { useMemo, useState } from "react";

import Card from "@mui/material/Card";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import { useClientsList } from "hooks/clients";
import { buildClientFilterRows, filterClientRows } from "layouts/pages/crm/utils";

import ClientFiltersForm from "./ClientFiltersForm";
import ClientFiltersResultsModal from "./modals/ClientFiltersResultsModal";
import { useClientFilters } from "layouts/pages/crm/hooks/useClientFilters";
import type { ClientFiltersState } from "layouts/pages/crm/types";

function ClientFiltersTab(): JSX.Element {
  const [resultsOpen, setResultsOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ClientFiltersState | null>(null);

  const { data: clients, loading, error } = useClientsList();
  const members = useMemo(() => buildClientFilterRows(clients), [clients]);
  const { filters, actions, resetFilters } = useClientFilters();

  const filteredMembers = useMemo(
    () => (appliedFilters ? filterClientRows(members, appliedFilters) : []),
    [appliedFilters, members]
  );

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    setResultsOpen(true);
  };

  const handleReset = () => {
    resetFilters();
    setAppliedFilters(null);
  };

  return (
    <MDBox>
      <Card>
        <MDBox p={3}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" gap={2}>
            <MDTypography variant="h6" fontWeight="medium">
              Filtro de clientes
            </MDTypography>
            <MDBox display="flex" gap={1}>
              <MDButton variant="outlined" color="secondary" onClick={handleReset}>
                Limpar
              </MDButton>
              <MDButton variant="gradient" color="info" onClick={handleSearch} disabled={loading}>
                Buscar
              </MDButton>
            </MDBox>
          </MDBox>

          <MDBox mt={2}>
            <ClientFiltersForm filters={filters} actions={actions} />
          </MDBox>
        </MDBox>
      </Card>

      <ClientFiltersResultsModal
        open={resultsOpen}
        onClose={() => setResultsOpen(false)}
        members={filteredMembers}
        loading={loading}
        error={error}
      />
    </MDBox>
  );
}

export default ClientFiltersTab;
