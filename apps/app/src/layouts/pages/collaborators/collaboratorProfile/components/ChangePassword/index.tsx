import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import { updateCurrentUserPassword } from "services/auth";
import { useAppSelector } from "../../../../../../redux/hooks";
import { useToast } from "context/ToastContext";

type ChangePasswordProps = {
  collaboratorEmail?: string | null;
};

function ChangePassword({ collaboratorEmail }: ChangePasswordProps): JSX.Element {
  const { user } = useAppSelector((state) => state.auth);
  const { showError, showSuccess } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const isSameUser = useMemo(() => {
    if (!collaboratorEmail || !user?.email) {
      return false;
    }

    return user.email === collaboratorEmail;
  }, [collaboratorEmail, user?.email]);

  const isDisabled =
    saving || !isSameUser || !password || !confirmPassword || password !== confirmPassword;

  const handleSubmit = async (event: FormEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!isSameUser) {
      showError("Somente o proprio colaborador pode alterar a senha.");
      return;
    }

    if (password !== confirmPassword) {
      showError("As senhas nao conferem.");
      return;
    }

    setSaving(true);
    try {
      await updateCurrentUserPassword(password);
      showSuccess("Senha atualizada com sucesso.");
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Nao foi possivel atualizar a senha.";
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card id="password">
      <MDBox p={3}>
        <MDTypography variant="h5">Alterar Senha</MDTypography>
      </MDBox>
      <MDBox component="form" pb={3} px={3} onSubmit={handleSubmit}>
        {!isSameUser && (
          <MDBox mb={2}>
            <MDTypography variant="button" color="text">
              Para alterar a senha, faça login com este colaborador.
            </MDTypography>
          </MDBox>
        )}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <MDInput
              fullWidth
              label="Nova Senha"
              inputProps={{ type: "password", autoComplete: "" }}
              value={password}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
              disabled={!isSameUser || saving}
            />
          </Grid>
          <Grid item xs={12}>
            <MDInput
              fullWidth
              label="Confirmar Nova Senha"
              inputProps={{ type: "password", autoComplete: "" }}
              value={confirmPassword}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(event.target.value)
              }
              disabled={!isSameUser || saving}
            />
          </Grid>
        </Grid>
        <MDBox mt={2} display="flex" justifyContent="flex-end">
          <MDButton
            variant="gradient"
            color="dark"
            size="small"
            type="submit"
            disabled={isDisabled}
          >
            atualizar senha
          </MDButton>
        </MDBox>
      </MDBox>
    </Card>
  );
}

export default ChangePassword;
