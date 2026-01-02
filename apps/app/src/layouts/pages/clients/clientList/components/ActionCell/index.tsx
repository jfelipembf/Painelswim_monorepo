/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-2-pro-react-ts
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useNavigate } from "react-router-dom";

// @mui material components
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";

type Props = {
  id: string;
};

function ActionCell({ id }: Props): JSX.Element {
  const navigate = useNavigate();

  return (
    <MDBox display="flex" alignItems="center">
      <Tooltip title="Ver detalhes" placement="top">
        <MDButton
          variant="outlined"
          color="info"
          iconOnly
          onClick={() => navigate(`/clients/profile/${id}`)}
        >
          <Icon>visibility</Icon>
        </MDButton>
      </Tooltip>
    </MDBox>
  );
}

export default ActionCell;
