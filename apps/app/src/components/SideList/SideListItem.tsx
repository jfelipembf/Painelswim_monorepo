import { ReactNode } from "react";

import MDBox from "components/MDBox";

type Props = {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  right?: ReactNode;
};

function SideListItem({ active = false, onClick, children, right }: Props) {
  return (
    <MDBox
      onClick={onClick}
      px={2}
      py={1.5}
      mb={1.5}
      borderRadius="lg"
      sx={(theme: any) => ({
        cursor: onClick ? "pointer" : "default",
        border: `1px solid ${active ? theme.palette.info.main : theme.palette.divider}`,
        backgroundColor: active ? theme.palette.action.hover : theme.palette.background.paper,
        transition: "all 0.2s ease",
        "&:hover": onClick
          ? {
              backgroundColor: theme.palette.action.hover,
              borderColor: theme.palette.info.main,
              transform: "translateY(-2px)",
              boxShadow: theme.shadows[2],
            }
          : undefined,
      })}
      display="flex"
      justifyContent="space-between"
      alignItems="flex-start"
      gap={2}
    >
      <MDBox minWidth={0} flex={1}>
        {children}
      </MDBox>
      {right ? <MDBox flexShrink={0}>{right}</MDBox> : null}
    </MDBox>
  );
}

export default SideListItem;
