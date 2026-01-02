import { useState } from "react";

// formik components
import { Formik, Form } from "formik";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 PRO React TS examples components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// NewMember page components
import UserInfo from "./components/UserInfo/index";
import Parental from "./components/Parental/index";
import Address from "./components/Address/index";
import Profile from "./components/Profile/index";

// NewMember layout constants/utilities for form and fields
import form from "./constants/form";
import initialValues from "./constants/initialValues";
import validations from "./utils/validation";

import { useAppSelector } from "../../../../redux/hooks";
import { useToast } from "../../../../context/ToastContext";
import { createClient } from "hooks/clients";
import { useNavigate } from "react-router-dom";

import { uploadImage } from "../../../../services/storage";

function getSteps(): string[] {
  return ["Dados pessoais", "Contato", "Endereço", "Observações"];
}

function getStepContent(stepIndex: number, formData: any): JSX.Element {
  switch (stepIndex) {
    case 0:
      return <UserInfo formData={formData} />;
    case 1:
      return <Parental formData={formData} />;
    case 2:
      return <Address formData={formData} />;
    case 3:
      return <Profile formData={formData} />;
    default:
      return null;
  }
}

function NewClient(): JSX.Element {
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const steps = getSteps();
  const { formId, formField } = form;
  const currentValidation = validations[activeStep];
  const isLastStep = activeStep === steps.length - 1;

  const navigate = useNavigate();
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);
  const { user } = useAppSelector((state) => state.auth);
  const { showError, showSuccess } = useToast();

  const handleSelectPhoto = async (
    file: File | null,
    setFieldValue: (field: string, value: any) => void
  ) => {
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
        folder: "clients",
        filenamePrefix: "client",
      });

      setFieldValue("photoUrl", result.downloadUrl);
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : "Nao foi possivel enviar a imagem.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleBack = () => setActiveStep(activeStep - 1);

  const handleSubmit = async (values: any, actions: any) => {
    if (!isLastStep) {
      setActiveStep(activeStep + 1);
      actions.setTouched({});
      actions.setSubmitting(false);
      return;
    }

    if (!idTenant || !idBranch) {
      showError("Academia ou unidade nao identificada.");
      actions.setSubmitting(false);
      return;
    }

    try {
      const clientId = await createClient(idTenant, idBranch, {
        firstName: values.firstName,
        lastName: values.lastName,
        gender: values.gender,
        birthDate: values.birthDate,
        email: values.email,
        photoUrl: values.photoUrl ? String(values.photoUrl) : undefined,
        phone: values.phone,
        whatsapp: values.whatsapp,
        responsibleName: values.responsibleName,
        responsiblePhone: values.responsiblePhone,
        address: {
          zipCode: values.zipCode,
          state: values.state,
          city: values.city,
          neighborhood: values.neighborhood,
          address: values.address,
          number: values.number,
        },
        notes: values.notes,
        status: "lead",
        createdByUserId: user?.uid,
      });

      showSuccess("Cliente criado com sucesso!");
      setSubmitted(true);
      navigate(`/clients/profile/${clientId}`);
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : "Nao foi possivel criar o cliente.");
    } finally {
      actions.setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3} mb={20} height="65vh">
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            sx={{ height: "100%", mt: 8 }}
          >
            <Grid item xs={12} lg={8}>
              <Card sx={{ height: "100%" }}>
                <MDBox
                  p={3}
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="100%"
                >
                  <MDTypography variant="h4" color="success">
                    Formulário enviado com sucesso!
                  </MDTypography>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} mb={20} height="65vh">
        <Grid container justifyContent="center" alignItems="center" sx={{ height: "100%", mt: 8 }}>
          <Grid item xs={12} lg={8}>
            <Formik
              initialValues={initialValues}
              validationSchema={currentValidation}
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, isSubmitting, setFieldValue, setFieldTouched }) => (
                <Form id={formId} autoComplete="off">
                  <Card sx={{ height: "100%" }}>
                    <MDBox mx={2} mt={-3}>
                      <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map((label) => (
                          <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                    </MDBox>
                    <MDBox p={3}>
                      <MDBox>
                        {getStepContent(activeStep, {
                          values,
                          touched,
                          formField,
                          errors,
                          setFieldValue,
                          setFieldTouched,
                          photoUploading,
                          onSelectPhoto: (file: File | null): void => {
                            void handleSelectPhoto(file, setFieldValue);
                          },
                        })}
                        <MDBox mt={2} width="100%" display="flex" justifyContent="space-between">
                          {activeStep === 0 ? (
                            <MDBox />
                          ) : (
                            <MDButton variant="gradient" color="light" onClick={handleBack}>
                              voltar
                            </MDButton>
                          )}
                          <MDButton
                            disabled={isSubmitting}
                            type="submit"
                            variant="gradient"
                            color="dark"
                          >
                            {isLastStep ? "salvar" : "próximo"}
                          </MDButton>
                        </MDBox>
                      </MDBox>
                    </MDBox>
                  </Card>
                </Form>
              )}
            </Formik>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default NewClient;
