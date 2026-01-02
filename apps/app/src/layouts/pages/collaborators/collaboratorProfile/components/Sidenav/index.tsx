// @mui material components
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import { Theme } from "@mui/material/styles";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 PRO React context
import { useMaterialUIController } from "context";

function Sidenav(): JSX.Element {
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;

  const sidenavItems = [
    { icon: "person", label: "Dados Básicos", href: "basic-info" },
    { icon: "lock", label: "Alterar Senha", href: "password" },
    { icon: "delete", label: "Excluir Conta", href: "delete" },
  ];

  const renderSidenavItems = sidenavItems.map(({ icon, label, href }, key) => {
    const itemKey = `item-${key}`;

    return (
      <MDBox key={itemKey} component="li" pt={key === 0 ? 0 : 1}>
        <MDTypography
          component="a"
          href={`#${href}`}
          variant="button"
          fontWeight="regular"
          textTransform="capitalize"
          sx={({
            borders: { borderRadius },
            functions: { pxToRem },
            palette: { light },
            transitions,
          }: Theme) => ({
            display: "flex",
            alignItems: "center",
            borderRadius: borderRadius.md,
            padding: `${pxToRem(10)} ${pxToRem(16)}`,
            transition: transitions.create("background-color", {
              easing: transitions.easing.easeInOut,
              duration: transitions.duration.shorter,
            }),

            "&:hover": {
              backgroundColor: light.main,
            },
          })}
        >
          <MDBox mr={1.5} lineHeight={1} color={darkMode ? "white" : "dark"}>
            <Icon fontSize="small">{icon}</Icon>
          </MDBox>
          {label}
        </MDTypography>
      </MDBox>
    );
  });

  return (
    <Card
      sx={{
        borderRadius: ({ borders: { borderRadius } }) => borderRadius.lg,
        position: "sticky",
        top: "1%",
      }}
    >
      <MDBox
        component="ul"
        display="flex"
        flexDirection="column"
        p={2}
        m={0}
        sx={{ listStyle: "none" }}
      >
        {renderSidenavItems}
      </MDBox>
    </Card>
  );
}

export default Sidenav;
