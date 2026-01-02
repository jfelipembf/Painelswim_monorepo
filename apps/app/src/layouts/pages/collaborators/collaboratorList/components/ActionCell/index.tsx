import { useNavigate } from "react-router-dom";

// @mui material components
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";

function ActionCell({ id }: { id: string }): JSX.Element {
  const navigate = useNavigate();

  return (
    <MDBox display="flex" alignItems="center">
      <Tooltip title="Ver perfil" placement="top">
        <MDButton
          variant="outlined"
          color="info"
          iconOnly
          onClick={() => navigate(`/collaborators/profile/${id}`)}
        >
          <Icon>visibility</Icon>
        </MDButton>
      </Tooltip>
    </MDBox>
  );
}

export default ActionCell;
