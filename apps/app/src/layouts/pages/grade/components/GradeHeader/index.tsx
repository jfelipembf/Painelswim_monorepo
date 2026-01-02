import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Switch from "@mui/material/Switch";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import TurnSelector from "../TurnSelector";
import ViewSelector from "../ViewSelector";
import WeekNavigator from "../WeekNavigator";

import type { GradeTurn, GradeView } from "../../types";

type Props = {
  turn: GradeTurn;
  onTurnChange: (turn: GradeTurn) => void;
  view: GradeView;
  onViewChange: (view: GradeView) => void;
  referenceDate: Date;
  onReferenceDateChange: (date: Date) => void;
  showOccupancy: boolean;
  onShowOccupancyChange: (value: boolean) => void;
};

function GradeHeader({
  turn,
  onTurnChange,
  view,
  onViewChange,
  referenceDate,
  onReferenceDateChange,
  showOccupancy,
  onShowOccupancyChange,
}: Props): JSX.Element {
  return (
    <MDBox>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={5}>
          <TurnSelector value={turn} onChange={onTurnChange} />
        </Grid>

        <Grid item xs={12} md={7}>
          <MDBox
            display="flex"
            alignItems="center"
            justifyContent={{ xs: "flex-start", md: "flex-end" }}
            gap={1}
            flexWrap="nowrap"
            sx={{ overflowX: "auto" }}
          >
            <WeekNavigator
              referenceDate={referenceDate}
              onReferenceDateChange={onReferenceDateChange}
            />
            <MDButton
              variant="gradient"
              color="info"
              size="small"
              onClick={() => onReferenceDateChange(new Date())}
              sx={{ whiteSpace: "nowrap" }}
            >
              <Icon fontSize="small">today</Icon>&nbsp;Hoje
            </MDButton>
            <ViewSelector value={view} onChange={onViewChange} />
            <MDBox display="flex" alignItems="center" gap={0.75} sx={{ pl: 0.5 }}>
              <Switch
                size="small"
                checked={Boolean(showOccupancy)}
                onChange={(e) => onShowOccupancyChange(e.target.checked)}
              />
              <MDTypography variant="button" fontWeight="regular" sx={{ whiteSpace: "nowrap" }}>
                Exibir lotação
              </MDTypography>
            </MDBox>
          </MDBox>
        </Grid>
      </Grid>
    </MDBox>
  );
}

export default GradeHeader;
