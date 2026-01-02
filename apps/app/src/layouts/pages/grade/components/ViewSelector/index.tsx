import MDBox from "components/MDBox";
import MDButton from "components/MDButton";

import type { GradeView } from "../../types";

type Props = {
  value: GradeView;
  onChange: (value: GradeView) => void;
};

function ViewSelector({ value, onChange }: Props): JSX.Element {
  return (
    <MDBox display="flex" gap={1}>
      <MDButton
        variant={value === "day" ? "gradient" : "outlined"}
        color="info"
        size="small"
        onClick={() => onChange("day")}
      >
        Dia
      </MDButton>
      <MDButton
        variant={value === "week" ? "gradient" : "outlined"}
        color="info"
        size="small"
        onClick={() => onChange("week")}
      >
        Semana
      </MDButton>
    </MDBox>
  );
}

export default ViewSelector;
