import { ReactNode } from "react";

import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";

import MDBox from "components/MDBox";

type Props = {
  header?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  height?: string;
};

function SideListCard({ header, action, children, height = "calc(100vh - 300px)" }: Props) {
  return (
    <Card sx={{ height: "100%", overflow: "hidden" }}>
      {header || action ? (
        <MDBox p={2} pb={action ? 2 : 1} display="flex" justifyContent="space-between" gap={2}>
          <MDBox minWidth={0}>{header}</MDBox>
          {action ? <MDBox flexShrink={0}>{action}</MDBox> : null}
        </MDBox>
      ) : null}
      <Divider sx={{ my: 0 }} />
      <MDBox sx={{ overflowY: "auto", height, p: 2 }}>{children}</MDBox>
    </Card>
  );
}

export default SideListCard;
