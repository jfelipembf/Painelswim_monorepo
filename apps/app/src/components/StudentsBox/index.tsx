import type { ReactNode } from "react";
import CircularProgress from "@mui/material/CircularProgress";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

type Props = {
  title?: string;
  height?: number;
  loadingOverlay?: boolean;
  children: ReactNode;
};

function StudentsBox({
  title = "Alunos",
  height = 420,
  loadingOverlay = false,
  children,
}: Props): JSX.Element {
  return (
    <MDBox
      position="relative"
      p={2}
      sx={(theme: any) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius * 1.25,
        height,
        overflow: "auto",
      })}
    >
      {loadingOverlay ? (
        <MDBox
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={2}
          sx={(theme: any) => ({
            backgroundColor: theme.palette.background.paper,
            opacity: 0.65,
          })}
        >
          <CircularProgress color="info" />
        </MDBox>
      ) : null}

      <MDBox mb={1.5}>
        <MDTypography variant="button" fontWeight="medium">
          {title}
        </MDTypography>
      </MDBox>

      {children}
    </MDBox>
  );
}

export default StudentsBox;
