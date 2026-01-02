import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";

import { useToast } from "context/ToastContext";

import { uploadImage } from "../../../../../../services/storage";
import { updateCollaborator, type Collaborator } from "hooks/collaborators";

// Images
import team1 from "assets/images/team-1.jpg";
import { AvatarUploadCard } from "components";

type Props = {
  collaborator: Collaborator | null;
  roleLabel: string;
  idTenant: string | null;
  idBranch: string | null;
  onUpdated?: (collaborator: Collaborator) => void;
};

const resolveStatus = (status?: string) => {
  if (status === "inactive") {
    return { label: "inativo", color: "error" as const };
  }
  if (status === "paused") {
    return { label: "pausado", color: "warning" as const };
  }
  return { label: "ativo", color: "success" as const };
};

function HeaderCard({
  collaborator,
  roleLabel,
  idTenant,
  idBranch,
  onUpdated,
}: Props): JSX.Element {
  const toast = useToast();

  const fullName = collaborator
    ? [collaborator.name, collaborator.lastName].filter(Boolean).join(" ")
    : "Colaborador";
  const email = collaborator?.email || "";
  const statusInfo = resolveStatus(collaborator?.status);
  const staffId = collaborator?.id ? String(collaborator.id) : "";
  const photoUrl = collaborator?.photoUrl ? String(collaborator.photoUrl) : "";

  const handleSelectPhoto = async (file: File | null) => {
    if (!file) return;
    if (!idTenant || !idBranch || !staffId) {
      toast.showError("Colaborador não identificado.");
      return;
    }

    try {
      const result = await uploadImage({
        idTenant,
        file,
        folder: "collaborators",
        filenamePrefix: staffId,
      });

      await updateCollaborator(idTenant, idBranch, staffId, { photoUrl: result.downloadUrl });
      toast.showSuccess("Foto atualizada.");

      if (onUpdated && collaborator) {
        onUpdated({
          ...collaborator,
          photoUrl: result.downloadUrl,
        });
      }
    } catch (e: any) {
      toast.showError(e?.message || "Erro ao atualizar foto.");
    }
  };

  return (
    <Card id="header">
      <MDBox p={2}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <AvatarUploadCard
              mt={0}
              size="xl"
              variant="circular"
              imageUrl={photoUrl || undefined}
              defaultImage={team1}
              disabled={!staffId}
              onSelectFile={(file) => void handleSelectPhoto(file)}
            />
          </Grid>
          <Grid item>
            <MDBox height="100%" mt={0.5} lineHeight={1}>
              <MDTypography variant="h5" fontWeight="medium">
                {fullName}
              </MDTypography>
              <MDTypography variant="button" color="text" fontWeight="medium">
                {email}
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
              <MDBox mr={2} textAlign="right">
                <MDTypography variant="button" fontWeight="medium">
                  Funcao: {roleLabel || "Sem cargo"}
                </MDTypography>
              </MDBox>
              <MDBox>
                <MDBadge badgeContent={statusInfo.label} container color={statusInfo.color} />
              </MDBox>
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
    </Card>
  );
}

export default HeaderCard;
