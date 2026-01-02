import Divider from "@mui/material/Divider";
import { styled } from "@mui/material/styles";

import MDBox from "components/MDBox";

export const DetailsPanel = styled(MDBox)(({ theme }) => ({
  width: 280,
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
}));

export const DetailsDot = styled(MDBox, {
  shouldForwardProp: (prop) => prop !== "activityColor",
})<{ activityColor?: string | null }>(({ theme, activityColor }) => ({
  width: 14,
  height: 14,
  borderRadius: "50%",
  backgroundColor: activityColor || theme.palette.divider,
  border: `1px solid ${theme.palette.divider}`,
}));

export const EnrollmentsPanel = styled(MDBox)(() => ({
  minWidth: 0,
}));

export const EnrollmentsDivider = styled(Divider)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

export const EnrollmentsList = styled(MDBox)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
}));
