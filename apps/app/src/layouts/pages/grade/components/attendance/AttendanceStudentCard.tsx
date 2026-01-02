import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDBadge from "components/MDBadge";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";

type Props = {
  name: string;
  photoUrl?: string | null;
  present: boolean;
  suspended?: boolean;
  onToggle: () => void;
  hasJustification?: boolean;
  justificationCollapsed?: boolean;
  onShowJustification?: () => void;
};

function AttendanceStudentCard({
  name,
  photoUrl,
  present,
  suspended,
  onToggle,
  hasJustification,
  justificationCollapsed,
  onShowJustification,
}: Props): JSX.Element {
  return (
    <Card
      sx={(theme: any) => ({
        borderRadius: theme.shape.borderRadius * 1.25,
        boxShadow: "none",
        border: "none",
        backgroundColor: "transparent",
      })}
    >
      <MDBox
        px={0}
        py={1}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        sx={{ opacity: suspended ? 0.5 : 1 }}
      >
        <MDBox display="flex" alignItems="center" gap={1.5} minWidth={0}>
          <MDAvatar src={photoUrl || undefined} alt={name} size="sm" bgColor="info" />

          <MDBox minWidth={0}>
            <MDTypography variant="button" fontWeight="medium" noWrap>
              {name}
            </MDTypography>
            {suspended ? (
              <MDBadge badgeContent="Suspenso" color="warning" variant="contained" />
            ) : (
              <MDTypography variant="caption" color={present ? "success" : "text"} display="block">
                {present ? "Presente" : "Ausente"}
              </MDTypography>
            )}
          </MDBox>
        </MDBox>

        <MDBox display="flex" alignItems="center" gap={0.5}>
          <MDButton
            variant="outlined"
            color={present ? "error" : "success"}
            size="small"
            startIcon={<Icon>{present ? "thumb_down" : "thumb_up"}</Icon>}
            onClick={onToggle}
            disabled={suspended}
            sx={{ minWidth: 190, justifyContent: "flex-start" }}
          >
            {present ? "MARCAR AUSÊNCIA" : "MARCAR PRESENÇA"}
          </MDButton>

          {hasJustification && justificationCollapsed ? (
            <Tooltip title="Justificativa registrada. Clique para visualizar." placement="top">
              <span>
                <IconButton
                  size="small"
                  color="info"
                  onClick={onShowJustification}
                  disabled={!onShowJustification}
                >
                  <Icon fontSize="small">description</Icon>
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
        </MDBox>
      </MDBox>
    </Card>
  );
}

export default AttendanceStudentCard;
