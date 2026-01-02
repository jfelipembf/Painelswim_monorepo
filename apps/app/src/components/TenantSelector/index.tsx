import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// @mui material components
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { setTenant } from "../../redux/slices/tenantSlice";

// Mock tenants for demonstration - in real app this would come from an API
const MOCK_TENANTS = [
  { id: "tenant-1", name: "Academia Central", slug: "central" },
  { id: "tenant-2", name: "Fit Studio", slug: "fitstudio" },
  { id: "tenant-3", name: "Clube Natação", slug: "natacao" },
  { id: "tenant-4", name: "CrossFit Box", slug: "crossfit" },
];

function TenantSelector() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { idTenant, slug } = useAppSelector((state) => state.tenant);
  const [tenants, setTenants] = useState(MOCK_TENANTS);

  const handleTenantChange = (event: any) => {
    const selectedTenantId = event.target.value;
    const selectedTenant = tenants.find((t) => t.id === selectedTenantId);

    if (selectedTenant) {
      // Update Redux store
      dispatch(
        setTenant({
          idTenant: selectedTenant.id,
          slug: selectedTenant.slug,
          branding: {
            name: selectedTenant.name,
          },
        })
      );

      // Navigate to tenant-specific route if needed
      if (selectedTenant.slug !== slug) {
        navigate(`/t/${selectedTenant.slug}`, { replace: true });
      }
    }
  };

  const currentTenant = tenants.find((t) => t.id === idTenant);

  return (
    <FormControl variant="standard" sx={{ minWidth: 180 }}>
      <InputLabel id="tenant-select-label" sx={{ color: "inherit !important" }}>
        Academia
      </InputLabel>
      <Select
        labelId="tenant-select-label"
        id="tenant-select"
        value={idTenant || ""}
        onChange={handleTenantChange}
        sx={{
          color: "inherit",
          "& .MuiSvgIcon-root": {
            color: "inherit",
          },
          "& .MuiInput-underline:before": {
            borderBottomColor: "rgba(255, 255, 255, 0.3)",
          },
          "& .MuiInput-underline:hover:before": {
            borderBottomColor: "rgba(255, 255, 255, 0.5)",
          },
          "& .MuiInput-underline:after": {
            borderBottomColor: "inherit",
          },
        }}
      >
        {tenants.map((tenant) => (
          <MenuItem key={tenant.id} value={tenant.id}>
            <MDBox display="flex" alignItems="center" gap={1}>
              <MDTypography variant="button" color="inherit">
                {tenant.name}
              </MDTypography>
              {currentTenant?.id === tenant.id && (
                <MDTypography variant="caption" color="info" sx={{ ml: 1 }}>
                  ●
                </MDTypography>
              )}
            </MDBox>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default TenantSelector;
