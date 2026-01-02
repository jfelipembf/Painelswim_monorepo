import MDBox from "components/MDBox";
import MDButton from "components/MDButton";

import type { GradeTurn } from "../../types";
import { TURN_LABELS } from "../../constants/turns";

type Props = {
  value: GradeTurn;
  onChange: (value: GradeTurn) => void;
};

function TurnSelector({ value, onChange }: Props): JSX.Element {
  return (
    <MDBox display="flex" gap={1} flexWrap="wrap">
      <MDButton
        variant={value === "all" ? "gradient" : "outlined"}
        color="info"
        size="small"
        onClick={() => onChange("all")}
      >
        {TURN_LABELS.all}
      </MDButton>
      <MDButton
        variant={value === "morning" ? "gradient" : "outlined"}
        color="info"
        size="small"
        onClick={() => onChange("morning")}
      >
        {TURN_LABELS.morning}
      </MDButton>
      <MDButton
        variant={value === "afternoon" ? "gradient" : "outlined"}
        color="info"
        size="small"
        onClick={() => onChange("afternoon")}
      >
        {TURN_LABELS.afternoon}
      </MDButton>
      <MDButton
        variant={value === "night" ? "gradient" : "outlined"}
        color="info"
        size="small"
        onClick={() => onChange("night")}
      >
        {TURN_LABELS.night}
      </MDButton>
    </MDBox>
  );
}

export default TurnSelector;
