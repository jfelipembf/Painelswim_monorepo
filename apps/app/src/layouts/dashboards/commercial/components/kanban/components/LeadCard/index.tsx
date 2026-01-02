/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-2-pro-react-ts
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import Icon from "@mui/material/Icon";
import Divider from "@mui/material/Divider";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDBadge from "components/MDBadge";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";

import React from "react";

// Types
import { LeadData } from "../AddLeadModal";

// Images
import team1 from "assets/images/team-1.jpg";

interface Props {
  lead: LeadData;
  badge?: {
    color: "primary" | "secondary" | "info" | "success" | "warning" | "error" | "dark" | "light";
    label: string;
  };
  createdAt?: string;
  checklist: {
    scheduledTrial: boolean;
    confirmed: boolean;
    attended: boolean;
  };
  onOpen: () => void;
}

function LeadCard({
  lead,
  badge,
  createdAt = "Hoje 14:30",
  checklist,
  onOpen,
}: Props): JSX.Element {
  return (
    <MDBox width="100%" onClick={onOpen} sx={{ cursor: "pointer", position: "relative" }}>
      <MDBox
        position="absolute"
        top={8}
        right={8}
        zIndex={1}
        sx={{
          cursor: "pointer",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
      >
        <Icon fontSize="small" sx={{ color: "text.secondary" }}>
          visibility
        </Icon>
      </MDBox>

      {badge && <MDBadge size="xs" color={badge.color} badgeContent={badge.label} container />}

      {/* Nome e telefone */}
      <MDBox mt={0.75}>
        <MDTypography variant="body1" fontWeight="medium" color="text">
          {lead.name}
        </MDTypography>
        {lead.phone && (
          <MDTypography
            variant="caption"
            color="text"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Icon sx={{ fontSize: "0.85rem", mr: 0.5 }}>phone</Icon>
            {lead.phone}
          </MDTypography>
        )}
      </MDBox>

      <Divider sx={{ my: 1 }} />

      {/* Status (reflexo do modal) */}
      <MDBox display="flex" flexDirection="column" gap={0.75}>
        <MDBox display="flex" alignItems="center" gap={1}>
          <MDBox
            width={18}
            height={18}
            display="flex"
            alignItems="center"
            justifyContent="center"
            color={checklist.scheduledTrial ? "success" : "error"}
          >
            <Icon fontSize="small">{checklist.scheduledTrial ? "check" : "close"}</Icon>
          </MDBox>
          <MDTypography variant="button" color="text" sx={{ fontSize: "0.75rem" }}>
            Agendou aula experimental
          </MDTypography>
        </MDBox>

        <MDBox display="flex" alignItems="center" gap={1}>
          <MDBox
            width={18}
            height={18}
            display="flex"
            alignItems="center"
            justifyContent="center"
            color={checklist.confirmed ? "success" : "error"}
          >
            <Icon fontSize="small">{checklist.confirmed ? "check" : "close"}</Icon>
          </MDBox>
          <MDTypography variant="button" color="text" sx={{ fontSize: "0.75rem" }}>
            Confirmou
          </MDTypography>
        </MDBox>

        <MDBox display="flex" alignItems="center" gap={1}>
          <MDBox
            width={18}
            height={18}
            display="flex"
            alignItems="center"
            justifyContent="center"
            color={checklist.attended ? "success" : "error"}
          >
            <Icon fontSize="small">{checklist.attended ? "check" : "close"}</Icon>
          </MDBox>
          <MDTypography variant="button" color="text" sx={{ fontSize: "0.75rem" }}>
            Compareceu
          </MDTypography>
        </MDBox>
      </MDBox>

      <Divider sx={{ my: 1 }} />

      {/* Consultor */}
      <MDBox>
        <MDBox display="flex" alignItems="center" gap={1}>
          <MDAvatar src={team1} alt="João Silva" size="xs" />
          <MDTypography variant="body2" color="text">
            João Silva
          </MDTypography>
        </MDBox>
        <MDTypography variant="caption" color="text" ml={4}>
          Criado em {createdAt}
        </MDTypography>
      </MDBox>
    </MDBox>
  );
}

export default LeadCard;
