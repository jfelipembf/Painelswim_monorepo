import { useMemo, useState } from "react";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import { SideListCard, SideListItem, FormField } from "components";

type IntegrationKey = "openai" | "gemini" | "evolution";

type IntegrationItem = {
  id: IntegrationKey;
  name: string;
  description: string;
  inactive: boolean;
};

type OpenAIFormValues = {
  apiKey: string;
  organizationId: string;
  projectId: string;
  defaultModel: string;
};

type GeminiFormValues = {
  apiKey: string;
  defaultModel: string;
};

type EvolutionFormValues = {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
  webhookUrl: string;
};

type IntegrationForms = {
  openai: OpenAIFormValues;
  gemini: GeminiFormValues;
  evolution: EvolutionFormValues;
};

function IntegrationsPage(): JSX.Element {
  const integrations = useMemo<IntegrationItem[]>(
    () => [
      {
        id: "openai",
        name: "OpenAI",
        description: "Configuração de credenciais e modelo padrão.",
        inactive: false,
      },
      {
        id: "gemini",
        name: "Gemini",
        description: "Configuração de credenciais e modelo padrão.",
        inactive: false,
      },
      {
        id: "evolution",
        name: "Evolution API",
        description: "Configuração de URL, credenciais e instância.",
        inactive: true,
      },
    ],
    []
  );

  const [selected, setSelected] = useState<IntegrationKey>("openai");

  // UI-only: valores mockados (sem persistência)
  const [forms] = useState<IntegrationForms>({
    openai: {
      apiKey: "",
      organizationId: "",
      projectId: "",
      defaultModel: "gpt-4o-mini",
    },
    gemini: {
      apiKey: "",
      defaultModel: "gemini-1.5-flash",
    },
    evolution: {
      baseUrl: "",
      apiKey: "",
      instanceName: "",
      webhookUrl: "",
    },
  });

  const currentItem = integrations.find((it) => it.id === selected) ?? integrations[0];

  const renderLeftList = () => (
    <SideListCard header={<MDTypography variant="h6">Integrações</MDTypography>} height="auto">
      {integrations.map((item) => {
        const isActive = item.id === selected;
        const inactive = Boolean(item.inactive);

        return (
          <SideListItem
            key={item.id}
            active={isActive}
            onClick={() => setSelected(item.id)}
            right={
              <MDTypography
                variant="button"
                fontWeight="medium"
                color={inactive ? "secondary" : "success"}
                sx={{ flexShrink: 0 }}
              >
                {inactive ? "Inativo" : "Ativo"}
              </MDTypography>
            }
          >
            <MDTypography variant="button" fontWeight="medium" sx={{ wordBreak: "break-word" }}>
              {item.name}
            </MDTypography>
            <MDTypography
              variant="caption"
              color="text"
              sx={{ display: "block", mt: 0.5, wordBreak: "break-word" }}
            >
              {item.description}
            </MDTypography>
          </SideListItem>
        );
      })}
    </SideListCard>
  );

  const renderOpenAIForm = () => {
    const values = forms.openai;

    return (
      <>
        <Grid item xs={12} sm={6}>
          <FormField label="API Key" defaultValue={values.apiKey} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormField label="Modelo padrão" defaultValue={values.defaultModel} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormField label="Organization ID" defaultValue={values.organizationId} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormField label="Project ID" defaultValue={values.projectId} />
        </Grid>
      </>
    );
  };

  const renderGeminiForm = () => {
    const values = forms.gemini;

    return (
      <>
        <Grid item xs={12} sm={6}>
          <FormField label="API Key" defaultValue={values.apiKey} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormField label="Modelo padrão" defaultValue={values.defaultModel} />
        </Grid>
      </>
    );
  };

  const renderEvolutionForm = () => {
    const values = forms.evolution;

    return (
      <>
        <Grid item xs={12} sm={6}>
          <FormField label="Base URL" defaultValue={values.baseUrl} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormField label="API Key" defaultValue={values.apiKey} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormField label="Instance name" defaultValue={values.instanceName} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormField label="Webhook URL" defaultValue={values.webhookUrl} />
        </Grid>
      </>
    );
  };

  const renderRightFormFields = () => {
    if (selected === "openai") return renderOpenAIForm();
    if (selected === "gemini") return renderGeminiForm();
    return renderEvolutionForm();
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <MDBox py={3} px={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            {renderLeftList()}
          </Grid>

          <Grid item xs={12} lg={8}>
            <Card sx={{ overflow: "visible" }}>
              <MDBox
                p={3}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={2}
              >
                <MDBox display="flex" alignItems="center" gap={1.5}>
                  <Icon fontSize="small">settings</Icon>
                  <MDTypography variant="h5">{currentItem?.name || "Integração"}</MDTypography>
                </MDBox>

                <MDBox display="flex" gap={2}>
                  <MDButton variant="outlined" color="info">
                    Limpar
                  </MDButton>
                  <MDButton variant="gradient" color="info">
                    Salvar
                  </MDButton>
                </MDBox>
              </MDBox>

              <MDBox pb={3} px={3}>
                <Grid container spacing={3}>
                  {renderRightFormFields()}
                </Grid>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      <Footer />
    </DashboardLayout>
  );
}

export default IntegrationsPage;
