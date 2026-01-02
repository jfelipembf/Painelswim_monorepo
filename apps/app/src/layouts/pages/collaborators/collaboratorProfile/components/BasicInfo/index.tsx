import { useEffect, useState, type ChangeEvent } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import { FormField } from "components";

// Settings page components

import { useToast } from "context/ToastContext";
import {
  updateCollaborator,
  type Collaborator,
  type CollaboratorUpdatePayload,
} from "hooks/collaborators";

type Props = {
  collaborator: Collaborator | null;
  roleLabel: string;
  idTenant: string | null;
  onUpdated?: (collaborator: Collaborator) => void;
};

type FormState = {
  name: string;
  lastName: string;
  gender: string;
  birthDate: string;
  cpf: string;
  phone: string;
  email: string;
  zip: string;
  state: string;
  city: string;
  neighborhood: string;
  addressLine: string;
  street: string;
  number: string;
  hireDate: string;
  salary: string;
  council: string;
};

const buildFormState = (collaborator: Collaborator | null): FormState => ({
  name: collaborator?.name ?? "",
  lastName: collaborator?.lastName ?? "",
  gender: collaborator?.gender ?? "",
  birthDate: collaborator?.birthDate ?? "",
  cpf: collaborator?.cpf ?? "",
  phone: collaborator?.phone ?? "",
  email: collaborator?.email ?? "",
  zip: collaborator?.address?.zip ?? "",
  state: collaborator?.address?.state ?? "",
  city: collaborator?.address?.city ?? "",
  neighborhood: collaborator?.address?.neighborhood ?? "",
  addressLine: collaborator?.address?.addressLine ?? "",
  street: collaborator?.address?.street ?? "",
  number: collaborator?.address?.number ?? "",
  hireDate: collaborator?.hireDate ?? "",
  salary: collaborator?.salary ?? "",
  council: collaborator?.council ?? "",
});

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

function BasicInfo({ collaborator, roleLabel, idTenant, onUpdated }: Props): JSX.Element {
  const { showError, showSuccess } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<FormState>(() => buildFormState(collaborator));

  useEffect(() => {
    setFormState(buildFormState(collaborator));
    setIsEditing(false);
  }, [collaborator?.id]);

  const isReadOnly = !isEditing || saving;

  const handleChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
    if (!isEditing) {
      return;
    }
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleToggleEdit = () => {
    if (!collaborator || saving) {
      return;
    }

    if (isEditing) {
      setFormState(buildFormState(collaborator));
    }

    setIsEditing((prev) => !prev);
  };

  const handleSave = async () => {
    if (!collaborator || !idTenant) {
      showError("Colaborador nao identificado.");
      return;
    }

    setSaving(true);
    try {
      const payload: CollaboratorUpdatePayload = {
        name: formState.name.trim(),
        lastName: formState.lastName.trim(),
        gender: formState.gender.trim(),
        birthDate: formState.birthDate,
        cpf: formState.cpf.trim(),
        phone: formState.phone.trim(),
        email: formState.email.trim(),
        hireDate: formState.hireDate,
        salary: formState.salary.trim(),
        council: formState.council.trim(),
        address: {
          zip: formState.zip.trim(),
          state: formState.state.trim(),
          city: formState.city.trim(),
          neighborhood: formState.neighborhood.trim(),
          addressLine: formState.addressLine.trim(),
          street: formState.street.trim(),
          number: formState.number.trim(),
        },
      };

      await updateCollaborator(idTenant, collaborator.idBranch, collaborator.id, payload);
      const updated: Collaborator = {
        ...collaborator,
        ...payload,
        address: payload.address ?? collaborator.address,
      };
      onUpdated?.(updated);
      setFormState(buildFormState(updated));
      setIsEditing(false);
      showSuccess("Alteracoes salvas com sucesso.");
    } catch (error: unknown) {
      showError(getErrorMessage(error, "Nao foi possivel salvar as alteracoes."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card id="basic-info" sx={{ overflow: "visible" }}>
      <MDBox p={3} display="flex" alignItems="center" justifyContent="space-between">
        <MDTypography variant="h5">Dados Básicos</MDTypography>
        <MDButton
          variant="text"
          color="info"
          iconOnly
          onClick={handleToggleEdit}
          disabled={!collaborator || saving}
          title={isEditing ? "Cancelar edicao" : "Editar dados"}
        >
          <Icon>{isEditing ? "close" : "edit"}</Icon>
        </MDButton>
      </MDBox>
      <MDBox component="form" pb={3} px={3}>
        {/* Dados Pessoais */}
        <MDBox mb={4}>
          <MDTypography variant="h6" mb={2}>
            Dados Pessoais
          </MDTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Nome"
                value={formState.name}
                placeholder="Joao"
                onChange={handleChange("name")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Sobrenome"
                value={formState.lastName}
                placeholder="Silva"
                onChange={handleChange("lastName")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Sexo"
                value={formState.gender}
                placeholder="Masculino"
                onChange={handleChange("gender")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Data de Nascimento"
                value={formState.birthDate}
                placeholder="DD/MM/AAAA"
                onChange={handleChange("birthDate")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField
                label="CPF"
                value={formState.cpf}
                placeholder="123.456.789-00"
                onChange={handleChange("cpf")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
          </Grid>
        </MDBox>

        {/* Contato */}
        <MDBox mb={4}>
          <MDTypography variant="h6" mb={2}>
            Contato
          </MDTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Telefone"
                value={formState.phone}
                placeholder="(11) 99999-9999"
                onChange={handleChange("phone")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Email"
                placeholder="joao@painelswim.com"
                value={formState.email}
                onChange={handleChange("email")}
                inputProps={{ readOnly: isReadOnly }}
                type="email"
              />
            </Grid>
          </Grid>
        </MDBox>

        {/* Endereço */}
        <MDBox mb={4}>
          <MDTypography variant="h6" mb={2}>
            Endereço
          </MDTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <FormField
                label="CEP"
                value={formState.zip}
                placeholder="01234-567"
                onChange={handleChange("zip")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormField
                label="Estado"
                value={formState.state}
                placeholder="SP"
                onChange={handleChange("state")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormField
                label="Cidade"
                value={formState.city}
                placeholder="Sao Paulo"
                onChange={handleChange("city")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Bairro"
                value={formState.neighborhood}
                placeholder="Centro"
                onChange={handleChange("neighborhood")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Endereco"
                value={formState.addressLine}
                placeholder="Rua das Flores"
                onChange={handleChange("addressLine")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Rua"
                value={formState.street}
                placeholder="Rua Principal"
                onChange={handleChange("street")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Numero"
                value={formState.number}
                placeholder="123"
                onChange={handleChange("number")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
          </Grid>
        </MDBox>

        {/* Dados Profissionais */}
        <MDBox mb={4}>
          <MDTypography variant="h6" mb={2}>
            Dados Profissionais
          </MDTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Data de Contratacao"
                value={formState.hireDate}
                placeholder="DD/MM/AAAA"
                onChange={handleChange("hireDate")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Salario"
                value={formState.salary}
                placeholder="R$ 3.000,00"
                onChange={handleChange("salary")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Cargo"
                value={roleLabel || ""}
                placeholder="Administrador"
                inputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField
                label="Conselho de Classe"
                value={formState.council}
                placeholder="CREF 12345"
                onChange={handleChange("council")}
                inputProps={{ readOnly: isReadOnly }}
              />
            </Grid>
          </Grid>
        </MDBox>

        {isEditing && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <MDBox display="flex" justifyContent="flex-end" gap={2}>
                <MDButton
                  variant="outlined"
                  color="info"
                  size="small"
                  disabled={saving}
                  onClick={handleToggleEdit}
                >
                  cancelar
                </MDButton>
                <MDButton
                  variant="gradient"
                  color="info"
                  size="small"
                  disabled={saving}
                  onClick={handleSave}
                >
                  salvar
                </MDButton>
              </MDBox>
            </Grid>
          </Grid>
        )}
      </MDBox>
    </Card>
  );
}

export default BasicInfo;
