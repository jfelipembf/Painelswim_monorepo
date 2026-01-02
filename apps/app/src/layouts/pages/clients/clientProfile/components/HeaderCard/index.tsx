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
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";

import { useNavigate } from "react-router-dom";

import { useToast } from "context/ToastContext";

import { useAppSelector } from "../../../../../../redux/hooks";

import { uploadImage } from "../../../../../../services/storage";
import { updateClient } from "hooks/clients";

import { CLIENT_STATUS_BADGES } from "constants/status";

// Images
import burceMars from "assets/images/bruce-mars.jpg";
import { AvatarUploadCard } from "components";

type Props = {
  client: {
    id: string;
    friendlyId?: string;
    firstName: string;
    lastName: string;
    email: string;
    photoUrl?: string;
    status?: string;
  } | null;
  onRefetch?: () => void;
};

function HeaderCard({ client, onRefetch }: Props): JSX.Element {
  const navigate = useNavigate();
  const toast = useToast();

  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const clientName = client ? `${client.firstName} ${client.lastName}`.trim() : "";
  const clientEmail = client?.email || "";
  const clientId = client?.id || "";
  const clientFriendlyId = client?.friendlyId || "";
  const clientStatus = client?.status || "lead";
  const clientPhotoUrl = client?.photoUrl ? String(client.photoUrl) : "";

  const badge = (CLIENT_STATUS_BADGES as any)[clientStatus] || CLIENT_STATUS_BADGES.lead;

  const handleSelectPhoto = async (file: File | null) => {
    if (!file) return;
    if (!idTenant || !idBranch || !clientId) {
      toast.showError("Cliente não identificado.");
      return;
    }

    try {
      const result = await uploadImage({
        idTenant,
        file,
        folder: "clients",
        filenamePrefix: clientId,
      });

      await updateClient(idTenant, idBranch, clientId, { photoUrl: result.downloadUrl });
      toast.showSuccess("Foto atualizada.");
      if (onRefetch) onRefetch();
    } catch (e: any) {
      toast.showError(e?.message || "Erro ao atualizar foto.");
    }
  };

  return (
    <Card id="profile">
      <MDBox p={2}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <AvatarUploadCard
              mt={0}
              size="xl"
              variant="circular"
              imageUrl={clientPhotoUrl || undefined}
              defaultImage={burceMars}
              disabled={!clientId}
              onSelectFile={(file) => void handleSelectPhoto(file)}
            />
          </Grid>
          <Grid item>
            <MDBox height="100%" mt={0.5} lineHeight={1}>
              <MDTypography variant="h5" fontWeight="medium">
                {clientName}
              </MDTypography>
              <MDTypography variant="button" color="text" fontWeight="medium">
                {clientEmail}
              </MDTypography>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={4} sx={{ ml: "auto" }}>
            <MDBox
              display="flex"
              justifyContent={{ md: "flex-end" }}
              alignItems="center"
              lineHeight={1}
            >
              <MDBox mr={2}>
                <MDButton
                  variant="gradient"
                  color="info"
                  size="small"
                  iconOnly
                  disabled={!clientId}
                  onClick={() => navigate(`/sales/purchase/${clientId}`)}
                >
                  <Icon>shopping_cart</Icon>
                </MDButton>
              </MDBox>
              <MDBox mr={2} textAlign="right">
                <MDTypography variant="button" fontWeight="medium">
                  ID: {clientFriendlyId || clientId}
                </MDTypography>
              </MDBox>
              <MDBox>
                <MDBadge badgeContent={badge.label} container color={badge.color} />
              </MDBox>
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
    </Card>
  );
}

export default HeaderCard;
