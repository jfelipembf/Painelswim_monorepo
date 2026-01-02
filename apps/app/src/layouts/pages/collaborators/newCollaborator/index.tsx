import { useEffect, useMemo, useState, type ChangeEvent } from "react";

// @mui material components
import Autocomplete from "@mui/material/Autocomplete";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";

import { GENDER_LABELS, GENDERS } from "constants/gender";
import { useToast } from "context/ToastContext";
import { useCepLookup } from "hooks/useCepLookup";
import { formatCep } from "utils/cep";

import { useAppSelector } from "../../../../redux/hooks";
import type { Branch } from "../../../../redux/slices/branchSlice";
import { createAuthUser, getTemporaryPassword } from "../../../../services/auth";
import { upsertMember } from "../../../../services/members";
import { uploadImage } from "../../../../services/storage";
import { createCollaborator } from "hooks/collaborators";
import { ensureDefaultRoles, fetchRoles, type Role } from "hooks/roles";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import team2 from "assets/images/team-2.jpg";

// Material Dashboard 2 PRO React TS examples components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { AvatarUploadCard, FormField } from "components";

// Settings page components

type FormState = {
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  photoUrl: string;
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

const initialFormState: FormState = {
  firstName: "",
  lastName: "",
  gender: "",
  birthDate: "",
  photoUrl: "",
  cpf: "",
  phone: "",
  email: "",
  zip: "",
  state: "",
  city: "",
  neighborhood: "",
  addressLine: "",
  street: "",
  number: "",
  hireDate: "",
  salary: "",
  council: "",
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

function NewCollaborator(): JSX.Element {
  document.title = "Novo Colaborador";
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { branches, idBranch } = useAppSelector((state) => state.branch);
  const { showError, showSuccess } = useToast();

  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<Branch[]>([]);
  const [roleByBranch, setRoleByBranch] = useState<Record<string, string>>({});
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const selectedBranchIds = useMemo(
    () => selectedBranches.map((branch) => branch.idBranch),
    [selectedBranches]
  );

  const missingRoleBranches = useMemo(
    () => selectedBranchIds.filter((branchId) => !roleByBranch[branchId]),
    [selectedBranchIds, roleByBranch]
  );
  const { address: cepAddress, loading: cepLoading, error: cepError } = useCepLookup(formState.zip);

  useEffect(() => {
    if (!idTenant || !idBranch) {
      setRoles([]);
      return;
    }

    let active = true;
    setLoadingRoles(true);
    setRolesError(null);

    ensureDefaultRoles(idTenant, idBranch)
      .then(() => fetchRoles(idTenant, idBranch))
      .then((data) => {
        if (!active) {
          return;
        }
        setRoles(data);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setRolesError(getErrorMessage(error, "Nao foi possivel carregar os cargos."));
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setLoadingRoles(false);
      });

    return () => {
      active = false;
    };
  }, [idBranch, idTenant]);

  useEffect(() => {
    if (!branches.length || selectedBranches.length > 0 || !idBranch) {
      return;
    }

    const currentBranch = branches.find((branch) => branch.idBranch === idBranch);
    if (currentBranch) {
      setSelectedBranches([currentBranch]);
    }
  }, [branches, idBranch, selectedBranches.length]);

  useEffect(() => {
    if (!cepAddress) {
      return;
    }

    setFormState((prev) => ({
      ...prev,
      state: prev.state || cepAddress.state,
      city: prev.city || cepAddress.city,
      neighborhood: prev.neighborhood || cepAddress.neighborhood,
      addressLine: prev.addressLine || cepAddress.address,
    }));
  }, [cepAddress]);

  const handleInputChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleZipChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = formatCep(event.target.value);
    setFormState((prev) => ({ ...prev, zip: next }));
  };

  const handleBranchesChange = (_: unknown, newValue: Branch[]) => {
    const ids = newValue.map((branch) => branch.idBranch);
    setSelectedBranches(newValue);
    setRoleByBranch((prev) => {
      const next: Record<string, string> = {};
      ids.forEach((id) => {
        if (prev[id]) {
          next[id] = prev[id];
        }
      });
      return next;
    });
  };

  const handleRoleChange = (branchId: string, value: string) => {
    setRoleByBranch((prev) => ({
      ...prev,
      [branchId]: value,
    }));
  };

  const handleSelectPhoto = async (file: File | null) => {
    if (!file) return;
    if (!idTenant) {
      showError("Academia nao identificada.");
      return;
    }

    setPhotoUploading(true);
    try {
      const result = await uploadImage({
        idTenant,
        file,
        folder: "collaborators",
        filenamePrefix: "collaborator",
      });

      setFormState((prev) => ({
        ...prev,
        photoUrl: result.downloadUrl,
      }));
    } catch (error: unknown) {
      showError(getErrorMessage(error, "Nao foi possivel enviar a imagem."));
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!idTenant || !idBranch) {
      showError("Academia nao identificada.");
      return;
    }

    if (!formState.firstName.trim() || !formState.email.trim()) {
      showError("Nome e e-mail sao obrigatorios.");
      return;
    }

    if (selectedBranchIds.length === 0) {
      showError("Selecione ao menos uma unidade.");
      return;
    }

    if (missingRoleBranches.length > 0) {
      showError("Selecione um cargo para cada unidade.");
      return;
    }

    setSaving(true);
    try {
      const tempPassword = getTemporaryPassword();
      const authUid = await createAuthUser(formState.email.trim(), tempPassword);
      await upsertMember(idTenant, authUid, {
        role: "staff",
        branchIds: selectedBranchIds,
        roleByBranch,
      });
      await createCollaborator(idTenant, idBranch, {
        name: formState.firstName.trim(),
        lastName: formState.lastName.trim(),
        email: formState.email.trim(),
        photoUrl: formState.photoUrl ? String(formState.photoUrl) : undefined,
        phone: formState.phone.trim(),
        gender: formState.gender,
        birthDate: formState.birthDate,
        cpf: formState.cpf,
        hireDate: formState.hireDate,
        salary: formState.salary,
        council: formState.council,
        status: "active",
        branchIds: selectedBranchIds,
        roleByBranch,
        address: {
          zip: formState.zip,
          state: formState.state,
          city: formState.city,
          neighborhood: formState.neighborhood,
          addressLine: formState.addressLine,
          street: formState.street,
          number: formState.number,
        },
        authUid,
      });

      showSuccess(`Colaborador criado. Senha provisoria: ${tempPassword}`, 10000);
      setFormState(initialFormState);
      setSelectedBranches([]);
      setRoleByBranch({});
    } catch (error: unknown) {
      showError(getErrorMessage(error, "Nao foi possivel criar o colaborador."));
    } finally {
      setSaving(false);
    }
  };

  const isSubmitDisabled =
    saving ||
    loadingRoles ||
    !idTenant ||
    !formState.firstName.trim() ||
    !formState.email.trim() ||
    selectedBranchIds.length === 0 ||
    missingRoleBranches.length > 0;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mt={4} mb={3} px={2}>
        <MDBox mb={3}>
          <MDTypography variant="h4" fontWeight="bold">
            Novo Colaborador
          </MDTypography>
          <MDTypography variant="button" color="text">
            Informe os dados pessoais e defina acesso por unidade.
          </MDTypography>
        </MDBox>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={7}>
            <Card sx={{ overflow: "visible", mb: 3 }}>
              <MDBox p={3}>
                <MDTypography variant="h6" mb={2}>
                  Dados Pessoais
                </MDTypography>

                <AvatarUploadCard
                  imageUrl={formState.photoUrl || undefined}
                  defaultImage={team2}
                  loading={photoUploading}
                  disabled={saving}
                  onSelectFile={(file) => void handleSelectPhoto(file)}
                />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormField
                      label="Nome"
                      placeholder="Ex: Joao"
                      value={formState.firstName}
                      onChange={handleInputChange("firstName")}
                      disabled={saving}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormField
                      label="Sobrenome"
                      placeholder="Ex: Silva"
                      value={formState.lastName}
                      onChange={handleInputChange("lastName")}
                      disabled={saving}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormField
                      select
                      label="Sexo"
                      value={formState.gender}
                      onChange={handleInputChange("gender")}
                      disabled={saving}
                    >
                      <MenuItem value="">Selecione...</MenuItem>
                      {GENDERS.map((gender) => (
                        <MenuItem key={gender} value={gender}>
                          {GENDER_LABELS[gender]}
                        </MenuItem>
                      ))}
                    </FormField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormField
                      label="Data de Nascimento"
                      value={formState.birthDate}
                      onChange={handleInputChange("birthDate")}
                      type="date"
                      disabled={saving}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormField
                      label="CPF"
                      placeholder="Ex: 123.456.789-00"
                      value={formState.cpf}
                      onChange={handleInputChange("cpf")}
                      disabled={saving}
                    />
                  </Grid>
                </Grid>
              </MDBox>
            </Card>

            <Card sx={{ overflow: "visible", mb: 3 }}>
              <MDBox p={3}>
                <MDTypography variant="h6" mb={2}>
                  Contato
                </MDTypography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormField
                      label="Telefone"
                      placeholder="Ex: (11) 99999-9999"
                      value={formState.phone}
                      onChange={handleInputChange("phone")}
                      disabled={saving}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormField
                      label="Email"
                      placeholder="Ex: joao@painelswim.com"
                      inputProps={{ type: "email" }}
                      value={formState.email}
                      onChange={handleInputChange("email")}
                      disabled={saving}
                    />
                  </Grid>
                </Grid>
              </MDBox>
            </Card>

            <Card sx={{ overflow: "visible" }}>
              <MDBox p={3}>
                <MDTypography variant="h6" mb={2}>
                  Endereco
                </MDTypography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <FormField
                      label="CEP"
                      placeholder="Ex: 01234-567"
                      value={formState.zip}
                      onChange={handleZipChange}
                      disabled={saving}
                    />
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
                  <Grid item xs={12} sm={4}>
                    <FormField
                      label="Estado"
                      placeholder="Ex: SP"
                      value={formState.state}
                      onChange={handleInputChange("state")}
                      disabled={saving}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormField
                      label="Cidade"
                      placeholder="Ex: Sao Paulo"
                      value={formState.city}
                      onChange={handleInputChange("city")}
                      disabled={saving}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormField
                      label="Bairro"
                      placeholder="Ex: Centro"
                      value={formState.neighborhood}
                      onChange={handleInputChange("neighborhood")}
                      disabled={saving}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormField
                      label="Endereco"
                      placeholder="Ex: Rua das Flores"
                      value={formState.addressLine}
                      onChange={handleInputChange("addressLine")}
                      disabled={saving}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormField
                      label="Rua"
                      placeholder="Ex: Rua Principal"
                      value={formState.street}
                      onChange={handleInputChange("street")}
                      disabled={saving}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormField
                      label="Numero"
                      placeholder="Ex: 123"
                      value={formState.number}
                      onChange={handleInputChange("number")}
                      disabled={saving}
                    />
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Card sx={{ overflow: "visible", mb: 3 }}>
              <MDBox p={3}>
                <MDTypography variant="h6" mb={2}>
                  Dados Profissionais
                </MDTypography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormField
                      label="Data de Contratacao"
                      value={formState.hireDate}
                      onChange={handleInputChange("hireDate")}
                      type="date"
                      disabled={saving}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormField
                      label="Salario"
                      placeholder="Ex: R$ 3.000,00"
                      value={formState.salary}
                      onChange={handleInputChange("salary")}
                      disabled={saving}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormField
                      label="Conselho de Classe"
                      placeholder="Ex: CREF 12345"
                      value={formState.council}
                      onChange={handleInputChange("council")}
                      disabled={saving}
                    />
                  </Grid>
                </Grid>
              </MDBox>
            </Card>

            <Card sx={{ overflow: "visible" }}>
              <MDBox p={3}>
                <MDTypography variant="h6" mb={2}>
                  Acesso e Permissoes
                </MDTypography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Autocomplete<Branch, true, false, false>
                      multiple
                      options={branches}
                      value={selectedBranches}
                      onChange={handleBranchesChange}
                      getOptionLabel={(option) => option.name || option.idBranch}
                      isOptionEqualToValue={(option, value) => option.idBranch === value.idBranch}
                      renderInput={(params) => (
                        <FormField
                          {...params}
                          label="Unidades com acesso"
                          placeholder="Selecione as unidades"
                          disabled={saving}
                        />
                      )}
                    />
                  </Grid>

                  {selectedBranches.map((branch) => (
                    <Grid item xs={12} key={branch.idBranch}>
                      <FormField
                        select
                        label={`Cargo em ${branch.name}`}
                        value={roleByBranch[branch.idBranch] || ""}
                        onChange={(event: any) =>
                          handleRoleChange(branch.idBranch, String(event.target.value || ""))
                        }
                        disabled={saving || roles.length === 0}
                      >
                        <MenuItem value="">Selecione...</MenuItem>
                        {roles.map((role) => (
                          <MenuItem key={role.id} value={role.id}>
                            {role.name}
                          </MenuItem>
                        ))}
                      </FormField>
                    </Grid>
                  ))}

                  {loadingRoles && (
                    <Grid item xs={12}>
                      <MDTypography variant="caption" color="text">
                        Carregando cargos...
                      </MDTypography>
                    </Grid>
                  )}

                  {!loadingRoles && rolesError && (
                    <Grid item xs={12}>
                      <MDTypography variant="caption" color="error" fontWeight="medium">
                        {rolesError}
                      </MDTypography>
                    </Grid>
                  )}

                  {!loadingRoles && !rolesError && roles.length === 0 && (
                    <Grid item xs={12}>
                      <MDTypography variant="caption" color="text">
                        Cadastre cargos em Administrativos &gt; Cargos e Permissoes.
                      </MDTypography>
                    </Grid>
                  )}
                </Grid>
              </MDBox>
            </Card>
          </Grid>
        </Grid>

        <MDBox
          mt={3}
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
        >
          <MDButton
            variant="gradient"
            color="info"
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
          >
            criar colaborador
          </MDButton>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default NewCollaborator;
