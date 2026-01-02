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

// @mui material components
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import { Theme } from "@mui/material/styles";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import MDButton from "components/MDButton";

// Types
import type { BirthdayPerson } from "layouts/dashboards/commercial/components/kanban/data";

interface Props {
  birthdays: BirthdayPerson[];
}

function Header({ birthdays }: Props): JSX.Element {
  const avatarStyles: { [key: string]: any } = {
    border: ({ borders: { borderWidth }, palette: { white } }: Theme) =>
      `${borderWidth[2]} solid ${white.main}`,
    cursor: "pointer",
    position: "relative",
    ml: -1.5,

    "&:hover, &:focus": {
      zIndex: "10",
    },
  };

  return (
    <MDBox display="flex" alignItems="center">
      <MDBox mt={0.5} pr={1}>
        <MDBox mb={1} ml={-1.25} lineHeight={0}>
          <MDTypography variant="caption" color="secondary">
            Aniversariantes de hoje:
          </MDTypography>
        </MDBox>
        {birthdays.length ? (
          <>
            <MDBox display="flex">
              {birthdays.map((person) => (
                <MDAvatar
                  key={person.id}
                  src={person.avatar}
                  alt={person.name}
                  size="sm"
                  sx={avatarStyles}
                  title={person.label ? `${person.name} — ${person.label}` : person.name}
                >
                  {!person.avatar ? person.name.slice(0, 1) : null}
                </MDAvatar>
              ))}
            </MDBox>
            <MDBox mt={0.5}>
              <MDTypography variant="caption" color="text">
                {birthdays.map((person) => person.name).join(", ")}
              </MDTypography>
            </MDBox>
          </>
        ) : (
          <MDTypography variant="caption" color="text">
            Nenhum aniversariante hoje.
          </MDTypography>
        )}
      </MDBox>
      <MDBox height="75%" alignSelf="flex-end" sx={{ display: { xs: "none", sm: "block" } }}>
        <Divider orientation="vertical" />
      </MDBox>
      <MDBox pl={1}>
        <MDButton
          variant="gradient"
          color="info"
          iconOnly
          aria-label="Adicionar lead"
          title="Adicionar lead"
        >
          <Icon sx={{ fontWeight: "bold" }}>add</Icon>
        </MDButton>
      </MDBox>
    </MDBox>
  );
}

export default Header;
