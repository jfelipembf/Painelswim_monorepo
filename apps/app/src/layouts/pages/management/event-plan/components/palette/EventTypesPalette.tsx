import { useMemo } from "react";

import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import { useTheme } from "@mui/material/styles";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

type EventTypeItem = {
  type: string;
  label: string;
  className: string;
};

const EVENT_TYPE_ITEMS: EventTypeItem[] = [
  { type: "evaluation", label: "Avaliação", className: "info" },
  { type: "test", label: "Teste", className: "warning" },
  { type: "other", label: "Outro", className: "dark" },
];

function EventTypesPalette(): JSX.Element {
  const theme = useTheme();

  const resolveBorderColor = useMemo(
    () => (className: string) => {
      if (className === "primary") return theme.palette.primary.main;
      if (className === "secondary") return theme.palette.secondary.main;
      if (className === "success") return theme.palette.success.main;
      if (className === "warning") return theme.palette.warning.main;
      if (className === "error") return theme.palette.error.main;
      if (className === "dark") return theme.palette.grey[900];
      if (className === "light") return theme.palette.grey[300];
      return theme.palette.info.main;
    },
    [theme]
  );

  return (
    <Card sx={{ height: "100%" }}>
      <MDBox pt={2} px={2}>
        <MDTypography variant="h6" fontWeight="medium">
          Tipos de eventos
        </MDTypography>
        <MDTypography variant="caption" color="text">
          (UI) Use para padronizar os eventos.
        </MDTypography>
      </MDBox>

      <Divider />

      {/* UI-only: sem Draggable / sem atributos de drag */}
      <MDBox p={2} sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {EVENT_TYPE_ITEMS.map((item) => (
          <MDBox
            key={item.type}
            sx={{
              userSelect: "none",
              border: `1px solid ${theme.palette.grey[300]}`,
              borderLeft: `6px solid ${resolveBorderColor(item.className)}`,
              borderRadius: 2,
              px: 1.5,
              py: 1.25,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <MDTypography variant="button" fontWeight="medium">
              {item.label}
            </MDTypography>
          </MDBox>
        ))}
      </MDBox>
    </Card>
  );
}

export default EventTypesPalette;
