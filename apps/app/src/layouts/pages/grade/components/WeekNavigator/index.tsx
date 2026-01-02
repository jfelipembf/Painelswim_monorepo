import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { addDays, formatWeekRangeLabel, getStartOfWeekSunday } from "../../utils/date";

type Props = {
  referenceDate: Date;
  onReferenceDateChange: (date: Date) => void;
};

function WeekNavigator({ referenceDate, onReferenceDateChange }: Props): JSX.Element {
  const weekStart = getStartOfWeekSunday(referenceDate);
  const weekEnd = addDays(weekStart, 6);

  return (
    <MDBox display="flex" alignItems="center" gap={1}>
      <IconButton size="small" onClick={() => onReferenceDateChange(addDays(referenceDate, -7))}>
        <Icon fontSize="small">chevron_left</Icon>
      </IconButton>

      <MDTypography variant="button" fontWeight="medium">
        {formatWeekRangeLabel(weekStart, weekEnd)}
      </MDTypography>

      <IconButton size="small" onClick={() => onReferenceDateChange(addDays(referenceDate, 7))}>
        <Icon fontSize="small">chevron_right</Icon>
      </IconButton>
    </MDBox>
  );
}

export default WeekNavigator;
