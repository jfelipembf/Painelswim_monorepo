import type { ReactNode } from "react";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";

type Props = {
  name: string;
  photoUrl?: string | null;
  right?: ReactNode;
};

function StudentRowShell({ name, photoUrl, right }: Props): JSX.Element {
  return (
    <MDBox display="flex" alignItems="center" justifyContent="space-between" gap={1.5}>
      <MDBox display="flex" alignItems="center" gap={1.5} minWidth={0}>
        <MDAvatar src={photoUrl || undefined} alt={name} size="sm" bgColor="info" />
        <MDBox minWidth={0}>
          <MDTypography variant="button" fontWeight="medium" noWrap>
            {name}
          </MDTypography>
        </MDBox>
      </MDBox>

      {right ? <MDBox>{right}</MDBox> : null}
    </MDBox>
  );
}

export default StudentRowShell;
