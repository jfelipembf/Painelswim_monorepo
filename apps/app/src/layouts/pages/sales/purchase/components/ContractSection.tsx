import Autocomplete from "@mui/material/Autocomplete";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import type { Contract } from "hooks/contracts";
import { formatCentsBRL } from "hooks/sales";
import type { BranchOption, CheckoutItem } from "../types";
import { FormField } from "components";

type Props = {
  contracts: Contract[];
  contractsLoading: boolean;
  contractsError: string | null;
  contractId: string;
  onSelectContract: (event: any) => void;
  selectedContract: Contract | null;
  allowCrossBranchAccess: boolean;
  onToggleCrossBranchAccess: (checked: boolean) => void;
  branchOptions: BranchOption[];
  allowedBranchIds: string[];
  onAllowedBranchIdsChange: (ids: string[]) => void;
  checkoutItems: CheckoutItem[];
  grossTotalCents: number;
  netTotalCents: number;
};

const ContractSection = ({
  contracts,
  contractsLoading,
  contractsError,
  contractId,
  onSelectContract,
  selectedContract,
  allowCrossBranchAccess,
  onToggleCrossBranchAccess,
  branchOptions,
  allowedBranchIds,
  onAllowedBranchIdsChange,
  checkoutItems,
  grossTotalCents,
  netTotalCents,
}: Props): JSX.Element => (
  <MDBox mt={1.5}>
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormField
          label="Contrato"
          select
          value={contractId}
          onChange={onSelectContract}
          disabled={Boolean(contractsLoading)}
        >
          <MenuItem value="">Selecione...</MenuItem>
          {contracts.map((contract) => (
            <MenuItem key={contract.id} value={contract.id}>
              {contract?.name || "—"}
            </MenuItem>
          ))}
        </FormField>
      </Grid>
      {selectedContract ? (
        <Grid item xs={12}>
          <MDBox display="flex" alignItems="center" gap={1.5}>
            <Switch
              checked={allowCrossBranchAccess}
              onChange={(event) => {
                const checked = Boolean(event.target.checked);
                onToggleCrossBranchAccess(checked);
              }}
            />
            <MDTypography variant="button" fontWeight="regular">
              Permite acessar outras unidades
            </MDTypography>
          </MDBox>
        </Grid>
      ) : null}
      {selectedContract && allowCrossBranchAccess ? (
        <Grid item xs={12}>
          <Autocomplete
            multiple
            options={branchOptions}
            value={branchOptions.filter((branch) => allowedBranchIds.includes(branch.id))}
            onChange={(_, selected: BranchOption[]) => {
              const ids = (Array.isArray(selected) ? selected : [])
                .map((branch) => String(branch?.id || ""))
                .filter(Boolean);
              onAllowedBranchIdsChange(ids);
            }}
            getOptionLabel={(opt) => String(opt?.name || opt?.id || "")}
            isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
            renderInput={(params) => (
              <FormField
                {...params}
                label="Unidades permitidas (vazio = todas)"
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
        </Grid>
      ) : null}
    </Grid>

    {contractsError ? (
      <MDTypography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
        {contractsError}
      </MDTypography>
    ) : null}

    <MDBox mt={3}>
      {checkoutItems.length ? (
        <MDBox mb={2}>
          <MDTypography variant="button" color="text">
            Itens selecionados
          </MDTypography>
          <MDBox mt={1} display="flex" flexDirection="column" gap={1}>
            {checkoutItems.map((item) => (
              <MDBox key={item.id} display="flex" justifyContent="space-between" gap={1}>
                <MDTypography variant="caption" color="text">
                  {item.description} × {item.quantity}
                </MDTypography>
                <MDTypography variant="caption" fontWeight="medium">
                  {formatCentsBRL(item.totalCents)}
                </MDTypography>
              </MDBox>
            ))}
          </MDBox>
        </MDBox>
      ) : null}
    </MDBox>
  </MDBox>
);

export default ContractSection;
