import logoSwim from "assets/images/logoSwim.png";

import Icon from "@mui/material/Icon";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

type Props = {
  onClose: () => void;
};

function TouchHeader({ onClose }: Props): JSX.Element {
  return (
    <MDBox
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={2}
    >
      <MDBox display="flex" alignItems="center" gap={2}>
        <MDButton variant="outlined" color="secondary" onClick={onClose} size="medium">
          <Icon>close</Icon>&nbsp;Fechar
        </MDButton>

        <MDBox>
          <MDTypography variant="h3" fontWeight="bold">
            Painel de avaliação
          </MDTypography>
        </MDBox>
      </MDBox>

      <MDBox>
        <MDBox display="flex" justifyContent="flex-end" alignItems="center" gap={1.5}>
          <MDBox
            component="img"
            src={logoSwim}
            alt="Painel Swim"
            sx={{ height: 80, width: "auto" }}
          />
        </MDBox>
      </MDBox>
    </MDBox>
  );
}

export default TouchHeader;
