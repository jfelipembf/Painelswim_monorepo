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
import Modal from "@mui/material/Modal";
import MenuItem from "@mui/material/MenuItem";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import React from "react";
import { FormField } from "components";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LeadData) => void;
}

export interface LeadData {
  name: string;
  interest: string;
  origin: string;
  phone: string;
  email: string;
  contract: string;
}

function AddLeadModal({ open, onClose, onSubmit }: Props): JSX.Element {
  const [formData, setFormData] = React.useState<LeadData>({
    name: "",
    interest: "",
    origin: "",
    phone: "",
    email: "",
    contract: "",
  });

  const handleChange = (field: keyof LeadData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({
      name: "",
      interest: "",
      origin: "",
      phone: "",
      email: "",
      contract: "",
    });
    onClose();
  };

  const originOptions = [
    { value: "visita", label: "Visita" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "indicacao", label: "Indicação" },
    { value: "pesquisa_internet", label: "Pesquisa na internet" },
  ];

  return (
    <Modal open={open} onClose={onClose}>
      <MDBox
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 500 },
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <MDTypography variant="h6" mb={3}>
          Adicionar Novo Lead
        </MDTypography>

        <MDBox mb={2}>
          <FormField
            label="Nome"
            value={formData.name}
            onChange={(e: any) => handleChange("name", e.target.value)}
          />
        </MDBox>

        <MDBox mb={2}>
          <FormField
            label="Interesse"
            value={formData.interest}
            onChange={(e: any) => handleChange("interest", e.target.value)}
          />
        </MDBox>

        <MDBox mb={2}>
          <FormField
            label="Origem"
            select
            value={formData.origin}
            onChange={(e: any) => handleChange("origin", e.target.value)}
          >
            {originOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </FormField>
        </MDBox>

        <MDBox mb={2}>
          <FormField
            label="Telefone"
            value={formData.phone}
            onChange={(e: any) => handleChange("phone", e.target.value)}
          />
        </MDBox>

        <MDBox mb={2}>
          <FormField
            label="Email"
            value={formData.email}
            onChange={(e: any) => handleChange("email", e.target.value)}
          />
        </MDBox>

        <MDBox mb={3}>
          <FormField
            label="Contrato"
            value={formData.contract}
            onChange={(e: any) => handleChange("contract", e.target.value)}
          />
        </MDBox>

        <MDBox display="flex" justifyContent="flex-end" gap={2}>
          <MDButton variant="outlined" color="secondary" onClick={onClose}>
            Cancelar
          </MDButton>
          <MDButton variant="gradient" color="info" onClick={handleSubmit}>
            Adicionar Lead
          </MDButton>
        </MDBox>
      </MDBox>
    </Modal>
  );
}

export default AddLeadModal;
