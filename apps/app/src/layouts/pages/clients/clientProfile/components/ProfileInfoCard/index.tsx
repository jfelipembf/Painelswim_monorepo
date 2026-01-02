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
import { useEffect, useState, ChangeEvent } from "react";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Settings page components
import MDInput from "components/MDInput";

import { GENDER_LABELS, GENDERS, type GenderKey } from "constants/gender";

import { updateClient, type Client } from "hooks/clients";
import { useToast } from "context/ToastContext";
import { useAppSelector } from "../../../../../../redux/hooks";
import { FormField } from "components";
import {
  applyDateMask,
  formatDateFromISO,
  formatDateToISO,
} from "../../../../../../utils/dateMask";

type FormValues = {
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  email: string;
  phone: string;
  whatsapp: string;
  responsibleName: string;
  responsiblePhone: string;
  notes: string;
  address: {
    zipCode: string;
    state: string;
    city: string;
    neighborhood: string;
    address: string;
    number: string;
  };
};

type Props = {
  client: Client | null;
  onRefetch?: () => Promise<void>;
};

function ProfileInfoCard({ client, onRefetch }: Props): JSX.Element {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const buildFormValues = (): FormValues => ({
    firstName: client?.firstName || "",
    lastName: client?.lastName || "",
    gender: client?.gender || "",
    birthDate: formatDateFromISO(client?.birthDate || ""),
    email: client?.email || "",
    phone: client?.phone || "",
    whatsapp: client?.whatsapp || "",
    responsibleName: client?.responsibleName || "",
    responsiblePhone: client?.responsiblePhone || "",
    notes: client?.notes || "",
    address: {
      zipCode: client?.address?.zipCode || "",
      state: client?.address?.state || "",
      city: client?.address?.city || "",
      neighborhood: client?.address?.neighborhood || "",
      address: client?.address?.address || "",
      number: client?.address?.number || "",
    },
  });

  const [formValues, setFormValues] = useState<FormValues>(buildFormValues);
  const [initialValues, setInitialValues] = useState<FormValues>(buildFormValues);
  const [displayValues, setDisplayValues] = useState<FormValues>(buildFormValues);

  useEffect(() => {
    const nextValues = buildFormValues();
    setFormValues(nextValues);
    setInitialValues(nextValues);
    setDisplayValues(nextValues);
    setIsEditing(false);
    setSaving(false);
  }, [client]);

  const handleInputChange =
    (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFormValues((prev) => ({ ...prev, [field]: value }));
    };

  const handleBirthDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const maskedValue = applyDateMask(event.target.value);
    setFormValues((prev) => ({ ...prev, birthDate: maskedValue }));
  };

  const handleAddressChange =
    (field: keyof FormValues["address"]) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFormValues((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    };

  const handleCancel = () => {
    setFormValues(initialValues);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!client?.id || !client?.idTenant) return;
    setSaving(true);
    try {
      const payload = {
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        gender: formValues.gender,
        birthDate: formatDateToISO(formValues.birthDate),
        email: formValues.email,
        phone: formValues.phone,
        whatsapp: formValues.whatsapp,
        responsibleName: formValues.responsibleName,
        responsiblePhone: formValues.responsiblePhone,
        notes: formValues.notes,
        address: { ...formValues.address },
      };

      await updateClient(
        String(idTenant || client?.idTenant || ""),
        String(idBranch || client?.idBranch || ""),
        String(client.id || ""),
        payload
      );
      toast.showSuccess("Informações atualizadas.");
      setInitialValues(formValues);
      setDisplayValues(formValues);
      setIsEditing(false);
      if (typeof onRefetch === "function") {
        await onRefetch();
      }
    } catch (error: any) {
      toast.showError(error?.message || "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  const displayGenderLabel = (value: string): string => {
    const key = value as GenderKey;
    return (GENDER_LABELS as any)[key] || value || "";
  };

  const renderDisplayValue = (label: string, value?: string) => (
    <MDBox mb={1.5}>
      <MDTypography variant="caption" fontWeight="medium" color="text">
        {label}
      </MDTypography>
      <MDTypography variant="h6" fontWeight="regular" color="text">
        {value || "—"}
      </MDTypography>
    </MDBox>
  );

  const editingFieldProps = { disabled: saving };
  const display = displayValues;
  const displayGender = displayGenderLabel(display.gender);

  return (
    <Card id="personal-info" sx={{ overflow: "visible" }}>
      <MDBox
        p={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
      >
        <MDTypography variant="h5">Informações Pessoais</MDTypography>
        <MDBox display="flex" gap={1}>
          {isEditing ? (
            <>
              <MDButton variant="outlined" color="dark" onClick={handleCancel} disabled={saving}>
                Cancelar
              </MDButton>
              <MDButton variant="gradient" color="info" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </MDButton>
            </>
          ) : (
            <MDButton
              variant="outlined"
              color="info"
              onClick={() => setIsEditing(true)}
              disabled={!client}
            >
              Editar
            </MDButton>
          )}
        </MDBox>
      </MDBox>
      <MDBox component="form" pb={3} px={3}>
        <Grid container spacing={3}>
          {/* Dados Pessoais */}
          <Grid item xs={12} sm={6}>
            {isEditing ? (
              <FormField
                label="Nome"
                value={formValues.firstName}
                onChange={handleInputChange("firstName")}
                {...editingFieldProps}
              />
            ) : (
              renderDisplayValue("Nome", display.firstName)
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            {isEditing ? (
              <FormField
                label="Sobrenome"
                value={formValues.lastName}
                onChange={handleInputChange("lastName")}
                {...editingFieldProps}
              />
            ) : (
              renderDisplayValue("Sobrenome", display.lastName)
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            {isEditing ? (
              <FormControl variant="standard" fullWidth>
                <InputLabel id="gender-label">Gênero</InputLabel>
                <Select
                  labelId="gender-label"
                  value={formValues.gender || ""}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, gender: event.target.value }))
                  }
                  disabled={saving}
                >
                  {GENDERS.map((key) => (
                    <MenuItem key={key} value={key}>
                      {GENDER_LABELS[key]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              renderDisplayValue("Gênero", displayGender)
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            {isEditing ? (
              <FormField
                label="Data de Nascimento"
                value={formValues.birthDate}
                onChange={handleBirthDateChange}
                placeholder="DD-MM-AAAA"
                inputProps={{ maxLength: 10 }}
                {...editingFieldProps}
              />
            ) : (
              renderDisplayValue("Data de Nascimento", display.birthDate)
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Contato */}
          <Grid item xs={12} sm={6}>
            {isEditing ? (
              <FormField
                label="Email"
                value={formValues.email}
                inputProps={{ type: "email" }}
                onChange={handleInputChange("email")}
                {...editingFieldProps}
              />
            ) : (
              renderDisplayValue("Email", display.email)
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            {isEditing ? (
              <FormField
                label="Telefone"
                value={formValues.phone}
                onChange={handleInputChange("phone")}
                {...editingFieldProps}
              />
            ) : (
              renderDisplayValue("Telefone", display.phone)
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            {isEditing ? (
              <FormField
                label="WhatsApp"
                value={formValues.whatsapp}
                onChange={handleInputChange("whatsapp")}
                {...editingFieldProps}
              />
            ) : (
              renderDisplayValue("WhatsApp", display.whatsapp)
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Responsável (se houver) */}
          <Grid item xs={12} sm={6}>
            {isEditing ? (
              <FormField
                label="Nome do Responsável"
                value={formValues.responsibleName}
                onChange={handleInputChange("responsibleName")}
                {...editingFieldProps}
              />
            ) : (
              renderDisplayValue("Nome do Responsável", display.responsibleName)
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            {isEditing ? (
              <FormField
                label="Telefone do Responsável"
                value={formValues.responsiblePhone}
                onChange={handleInputChange("responsiblePhone")}
                {...editingFieldProps}
              />
            ) : (
              renderDisplayValue("Telefone do Responsável", display.responsiblePhone)
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Endereço */}
          <Grid item xs={12} sm={4}>
            {isEditing ? (
              <FormField
                label="CEP"
                value={formValues.address.zipCode}
                onChange={handleAddressChange("zipCode")}
                {...editingFieldProps}
              />
            ) : (
              renderDisplayValue("CEP", display.address.zipCode)
            )}
          </Grid>
          <Grid item xs={12} sm={8}>
            {isEditing ? (
              <FormField
                label="Endereço"
                value={formValues.address.address}
                onChange={handleAddressChange("address")}
                {...editingFieldProps}
              />
            ) : (
              renderDisplayValue("Endereço", display.address.address)
            )}
          </Grid>
          <Grid item xs={12} sm={4}>
            {isEditing ? (
              <FormField
                label="Número"
                value={formValues.address.number}
                onChange={handleAddressChange("number")}
                {...editingFieldProps}
              />
            ) : (
              renderDisplayValue("Número", display.address.number)
            )}
          </Grid>
          <Grid item xs={12} sm={4}>
            {isEditing ? (
              <FormField
                label="Bairro"
                value={formValues.address.neighborhood}
                onChange={handleAddressChange("neighborhood")}
                {...editingFieldProps}
              />
            ) : (
              renderDisplayValue("Bairro", display.address.neighborhood)
            )}
          </Grid>
          <Grid item xs={12} sm={4}>
            {isEditing ? (
              <FormField
                label="Cidade"
                value={formValues.address.city}
                onChange={handleAddressChange("city")}
                {...editingFieldProps}
              />
            ) : (
              renderDisplayValue("Cidade", display.address.city)
            )}
          </Grid>
          <Grid item xs={12} sm={4}>
            {isEditing ? (
              <FormField
                label="Estado"
                value={formValues.address.state}
                onChange={handleAddressChange("state")}
                {...editingFieldProps}
              />
            ) : (
              renderDisplayValue("Estado", display.address.state)
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Observações */}
          <Grid item xs={12}>
            {isEditing ? (
              <FormField
                label="Observações"
                value={formValues.notes}
                multiline
                rows={3}
                onChange={handleInputChange("notes")}
                {...editingFieldProps}
              />
            ) : (
              renderDisplayValue("Observações", display.notes)
            )}
          </Grid>
        </Grid>
      </MDBox>
    </Card>
  );
}

export default ProfileInfoCard;
