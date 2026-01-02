import Box from "@mui/material/Box";
import { Theme, alpha } from "@mui/material/styles";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { getOccupancyPct, parseMaxCapacity } from "../../utils/occupancy";

type Props = {
  schedule: any;
  color?: string | null;
  showOccupancyMask?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
};

function GradeEventCard({
  schedule,
  color,
  showOccupancyMask,
  onClick,
  isSelected,
}: Props): JSX.Element {
  const startTime = String(schedule?.startTime || "");
  const endTime = String(schedule?.endTime || "");

  const maxCapacityRaw = schedule?.maxCapacity;
  const maxCapacity = parseMaxCapacity(maxCapacityRaw);
  const resolvedEnrolledCount = Math.max(0, Number(schedule?.enrolledCount || 0));

  const occupancyPct = getOccupancyPct(resolvedEnrolledCount, maxCapacityRaw);
  const maxCapacityLabel = maxCapacity === "-" ? "—" : maxCapacity;

  const resolvedActivityName =
    schedule?.activityName || schedule?.name || schedule?.idActivity || "Turma";
  const employeeName = schedule?.employeeName || schedule?.instructorName || "";
  const resolvedAreaName = schedule?.areaName || "";

  return (
    <Box
      sx={(theme: Theme) => ({
        ...(showOccupancyMask && occupancyPct !== null
          ? {
              backgroundColor:
                occupancyPct >= 1
                  ? alpha(theme.palette.error.main, 0.12)
                  : occupancyPct >= 0.7
                  ? alpha(theme.palette.warning.main, 0.12)
                  : alpha(theme.palette.success.main, 0.12),
            }
          : {}),
        display: "flex",
        gap: 1,
        p: 1.25,
        borderRadius: 1.25,
        transition: "box-shadow 160ms ease, transform 160ms ease, background-color 160ms ease",
        boxShadow: theme.shadows[1],
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        border: "1px solid",
        borderColor: theme.palette.divider,
        ...(isSelected
          ? {
              boxShadow: `0 10px 22px ${alpha(theme.palette.success.main, 0.22)}, 0 0 0 1px ${alpha(
                theme.palette.success.main,
                0.35
              )}`,
            }
          : {}),
        ...(color
          ? {
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 5,
                backgroundColor: color,
              },
            }
          : {}),
      })}
      onClick={onClick}
    >
      <Box sx={{ pl: 0.75, flex: 1, minWidth: 0 }}>
        <MDBox display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <MDTypography variant="caption" fontWeight="bold">
            {startTime} - {endTime}
          </MDTypography>

          <MDTypography
            variant="caption"
            fontWeight="medium"
            sx={{
              px: 1,
              borderRadius: 999,
              backgroundColor: (theme: Theme) => theme.palette.action.hover,
              whiteSpace: "nowrap",
              lineHeight: 1.8,
            }}
          >
            {resolvedEnrolledCount}/{maxCapacityLabel}
          </MDTypography>
        </MDBox>

        <MDTypography variant="button" fontWeight="bold" display="block" mt={0.25}>
          {resolvedActivityName}
        </MDTypography>

        {employeeName ? (
          <MDTypography variant="caption" color="text" display="block">
            {String(employeeName).toUpperCase()}
          </MDTypography>
        ) : null}

        {resolvedAreaName ? (
          <MDTypography variant="caption" color="text" display="block">
            {resolvedAreaName}
          </MDTypography>
        ) : null}
      </Box>
    </Box>
  );
}

export default GradeEventCard;
