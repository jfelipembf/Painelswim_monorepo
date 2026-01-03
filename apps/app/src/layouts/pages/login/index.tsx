import { useMemo, useState } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";

// react-router components
import { useLocation, useNavigate } from "react-router-dom";

import { useAppSelector } from "../../../redux/hooks";
import { signInWithEmail } from "../../../services/auth";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDAlert from "components/MDAlert";

// Material Dashboard 2 PRO React TS examples
import PageLayout from "examples/LayoutContainers/PageLayout";

// Images
import bgSwim from "assets/images/bgSwim.png";
import logoSwim from "assets/images/logoSwim.png";

function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    idTenant,
    status: tenantStatus,
    error: tenantError,
  } = useAppSelector((state) => state.tenant);
  const { billingStatus, idBranch, branches } = useAppSelector((state) => state.branch);
  const activeBranch = branches.find((branch) => branch.idBranch === idBranch);
  const isBillingBlocked = billingStatus === "past_due" || billingStatus === "canceled";
  const billingStatusLabel =
    billingStatus === "past_due"
      ? "Pagamento pendente"
      : billingStatus === "canceled"
      ? "Assinatura inativa"
      : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = useMemo(() => loading || isBillingBlocked, [loading, isBillingBlocked]);
  const redirectTo =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ||
    "/dashboards/management";

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!idTenant) {
        throw new Error("Academia não identificada na URL.");
      }

      await signInWithEmail({ email, password, idTenant });
      navigate(redirectTo, { replace: true });
    } catch (e: any) {
      setError(e?.message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      throw new Error(
        "Login com Google ainda não configurado (preciso do provider: Supabase/Firebase)."
      );
    } catch (e: any) {
      setError(e?.message || "Não foi possível entrar com Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout background="white">
      <MDBox
        minHeight="100vh"
        width="100%"
        sx={{
          backgroundImage: `url(${bgSwim})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        <MDBox minHeight="100vh" width="100%" display="flex" justifyContent="flex-end">
          <MDBox
            width={{ xs: "100%", sm: 480 }}
            minHeight="100vh"
            px={{ xs: 2.5, sm: 4 }}
            py={{ xs: 4, sm: 6 }}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.86)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <MDBox display="flex" justifyContent="center" mb={2}>
              <MDBox component="img" src={logoSwim} alt="Painel Swim" sx={{ height: 84 }} />
            </MDBox>

            <MDBox textAlign="center" mb={3}>
              <MDTypography variant="h4" fontWeight="bold">
                Entrar
              </MDTypography>
              <MDTypography variant="button" color="text">
                Acesse o Painel Swim
              </MDTypography>
            </MDBox>

            <MDBox display="flex" flexDirection="column" gap={1.5}>
              <MDInput
                type="email"
                label="E-mail"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                disabled={loading || isBillingBlocked}
                fullWidth
              />

              <MDInput
                type="password"
                label="Senha"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                disabled={loading || isBillingBlocked}
                fullWidth
              />

              <MDBox display="flex" justifyContent="flex-end" mt={-0.5}>
                <MDButton
                  variant="text"
                  color="info"
                  size="small"
                  disabled={loading || isBillingBlocked}
                  onClick={handleForgotPassword}
                >
                  Esqueci a senha
                </MDButton>
              </MDBox>

              {(error || (!idTenant && tenantStatus !== "loading") || tenantStatus === "error") && (
                <MDAlert
                  color="error"
                  sx={{
                    width: "100%",
                    fontSize: "0.875rem",
                    "& .MuiBox-root": { alignItems: "flex-start" },
                  }}
                >
                  <MDBox display="flex" flexDirection="column" gap={0.5}>
                    {error && <span>{error}</span>}
                    {!error && !idTenant && tenantStatus !== "loading" && (
                      <span>Não conseguimos identificar a academia. Verifique se o link está correto.</span>
                    )}
                    {!error && tenantStatus === "error" && (
                      <span>{tenantError || "Academia não encontrada."}</span>
                    )}
                  </MDBox>
                </MDAlert>
              )}

              <MDButton
                variant="gradient"
                color="info"
                fullWidth
                disabled={isDisabled}
                onClick={handleLogin}
              >
                {loading ? "Entrando..." : "Entrar"}
              </MDButton>

              <Divider />

              <MDButton
                variant="outlined"
                color="dark"
                fullWidth
                disabled={loading || isBillingBlocked}
                onClick={handleGoogleLogin}
                startIcon={
                  <Icon fontSize="small" sx={{ lineHeight: 0 }}>
                    google
                  </Icon>
                }
              >
                Entrar com Google
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </MDBox>
      {isBillingBlocked && (
        <MDBox
          position="fixed"
          top={0}
          left={0}
          width="100%"
          height="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1300}
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(6px)",
          }}
        >
          <Card sx={{ maxWidth: 480, width: "90%", textAlign: "center" }}>
            <MDBox p={3} display="flex" flexDirection="column" gap={1}>
              <MDTypography variant="h5" fontWeight="bold">
                Acesso bloqueado
              </MDTypography>
              <MDTypography variant="body2" color="text">
                {billingStatusLabel || "Esta unidade está bloqueada por pendência de pagamento."}
              </MDTypography>
              {activeBranch && (
                <MDTypography variant="caption" color="text">
                  Unidade: {activeBranch.name}
                </MDTypography>
              )}
              <MDTypography variant="caption" color="text">
                Entre em contato com o suporte para regularizar a assinatura.
              </MDTypography>
            </MDBox>
          </Card>
        </MDBox>
      )}
    </PageLayout>
  );
}

export default LoginPage;
