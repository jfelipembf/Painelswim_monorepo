import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Switch from "@mui/material/Switch";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { FormField } from "components";

type Props = {
  zipCode: string;
  stateValue: string;
  city: string;
  neighborhood: string;
  addressLine: string;
  cepLoading: boolean;
  cepError: string | null;
  attendanceSummaryAtMidnight: boolean;
  onZipChange: (event: any) => void;
  onStateChange: (event: any) => void;
  onCityChange: (event: any) => void;
  onNeighborhoodChange: (event: any) => void;
  onAddressLineChange: (event: any) => void;
  onToggleAttendanceSummaryAtMidnight: () => void;
};

function SettingsCompanyTab({
  zipCode,
  stateValue,
  city,
  neighborhood,
  addressLine,
  cepLoading,
  cepError,
  attendanceSummaryAtMidnight,
  onZipChange,
  onStateChange,
  onCityChange,
  onNeighborhoodChange,
  onAddressLineChange,
  onToggleAttendanceSummaryAtMidnight,
}: Props): JSX.Element {
  return (
    <MDBox display="flex" flexDirection="column" gap={3}>
      <Card>
        <MDBox p={2} display="flex" alignItems="center" gap={1}>
          <Icon color="action">domain</Icon>
          <MDTypography variant="h6">Dados</MDTypography>
        </MDBox>
        <MDBox px={2} pb={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormField label="Nome fantasia" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="CNPJ" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="Nome interno" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="Razão social" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormField label="CEP" value={zipCode} onChange={onZipChange} />
              {cepLoading && (
                <MDTypography variant="caption" color="text">
                  Buscando endereco...
                </MDTypography>
              )}
              {!cepLoading && cepError && (
                <MDTypography variant="caption" color="error" fontWeight="medium">
                  {cepError}
                </MDTypography>
              )}
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormField label="UF" value={stateValue} onChange={onStateChange} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormField label="Endereço" value={addressLine} onChange={onAddressLineChange} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormField label="Número" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="Bairro" value={neighborhood} onChange={onNeighborhoodChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="Cidade" value={city} onChange={onCityChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="Telefone" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="Whatsapp" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="Metragem (m²)" inputProps={{ type: "number", min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="Logotipo" type="file" inputProps={{ accept: "image/*" }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="Horário de funcionamento" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="Facebook" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="Data de inauguração" type="date" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="Fuso horário" defaultValue="(UTC-03:00) Brasília" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Checkbox />}
                label="Permitir nova matrícula sem cobrança no ato da venda"
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <FormControlLabel
                control={<Checkbox />}
                label="Excluir dados sensíveis após quantos dias de inatividade"
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormField label="Dias de inatividade" inputProps={{ type: "number", min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="E-mail de resposta" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField label="E-mail para divulgação" />
            </Grid>
          </Grid>
        </MDBox>
      </Card>

      <Card>
        <MDBox p={2} display="flex" alignItems="center" gap={1}>
          <Icon color="action">schedule</Icon>
          <MDTypography variant="h6">Automação operacional</MDTypography>
        </MDBox>
        <MDBox px={2} pb={2}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" gap={2}>
            <MDBox>
              <MDTypography variant="button" fontWeight="medium">
                Salvar o controle de presença todos os dias às 00:00?
              </MDTypography>
              <MDTypography variant="caption" color="text" sx={{ display: "block", mt: 0.5 }}>
                Gera automaticamente o resumo diário de presença.
              </MDTypography>
            </MDBox>
            <Switch
              checked={attendanceSummaryAtMidnight}
              onChange={onToggleAttendanceSummaryAtMidnight}
            />
          </MDBox>
        </MDBox>
      </Card>
    </MDBox>
  );
}

export default SettingsCompanyTab;
