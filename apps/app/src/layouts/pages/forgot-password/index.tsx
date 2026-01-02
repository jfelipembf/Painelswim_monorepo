import { useState } from "react";

// @mui material components
import Icon from "@mui/material/Icon";

// react-router components
import { useNavigate } from "react-router-dom";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

// Material Dashboard 2 PRO React TS examples
import PageLayout from "examples/LayoutContainers/PageLayout";

// Images
import bgSwim from "assets/images/bgSwim.png";
import logoSwim from "assets/images/logoSwim.png";

function ForgotPasswordPage(): JSX.Element {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setMessage(null);
    setLoading(true);

    try {
      setMessage("Recuperação de senha ainda não configurada.");
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
                Recuperar senha
              </MDTypography>
              <MDTypography variant="button" color="text">
                Informe seu e-mail para receber o link
              </MDTypography>
            </MDBox>

            <MDBox display="flex" flexDirection="column" gap={1.5}>
              <MDInput
                type="email"
                label="E-mail"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                fullWidth
              />

              {message && (
                <MDTypography variant="caption" color="text" fontWeight="medium">
                  {message}
                </MDTypography>
              )}

              <MDButton
                variant="gradient"
                color="info"
                fullWidth
                disabled={loading || !email}
                onClick={handleSubmit}
              >
                {loading ? "Enviando..." : "Enviar link"}
              </MDButton>

              <MDButton
                variant="text"
                color="dark"
                fullWidth
                disabled={loading}
                onClick={() => navigate("/login")}
                startIcon={
                  <Icon fontSize="small" sx={{ lineHeight: 0 }}>
                    arrow_back
                  </Icon>
                }
              >
                Voltar para login
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </MDBox>
    </PageLayout>
  );
}

export default ForgotPasswordPage;
