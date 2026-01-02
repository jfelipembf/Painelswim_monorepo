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

import { Form, Formik } from "formik";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import ObjectivesTopicsManager from "../components/ObjectivesTopicsManager";
import Sidenav from "../components/Sidenav";

import ActivityFormFields from "./components/ActivityFormFields";
import ActivityPhotoUploader from "./components/ActivityPhotoUploader";
import { useActivityForm } from "./hooks/useActivityForm";
import { activityValidationSchema } from "./utils/validation";

import type { ActivityFormValues } from "./types";

import team2 from "assets/images/team-2.jpg";

function NewActivity(): JSX.Element {
  const {
    isEditMode,
    createdActivity,
    objectives,
    photoUrl,
    photoUploading,
    localError,
    initialValues,
    formInitialValues,
    handleSubmit,
    handleSelectPhoto,
    handleObjectivesChange,
    handleObjectivesSave,
    handleCancel,
  } = useActivityForm();

  if (isEditMode) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox my={3}>
          <MDBox mt={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={3}>
                <Sidenav />
              </Grid>
              <Grid item xs={12} lg={9}>
                <MDBox mb={3}>
                  {createdActivity ? (
                    <Grid container spacing={3}>
                      <Grid item xs={12} id="detalhes">
                        <Formik<ActivityFormValues>
                          initialValues={formInitialValues}
                          validationSchema={activityValidationSchema}
                          onSubmit={handleSubmit}
                          enableReinitialize
                        >
                          {({ values, errors, touched, isSubmitting, setFieldValue }) => (
                            <Form autoComplete="off">
                              <Card>
                                <MDBox p={3}>
                                  <MDTypography variant="h5">Detalhes da Atividade</MDTypography>
                                  {localError ? (
                                    <MDBox mt={2}>
                                      <MDTypography
                                        variant="button"
                                        color="error"
                                        fontWeight="medium"
                                      >
                                        {localError}
                                      </MDTypography>
                                    </MDBox>
                                  ) : null}
                                  <ActivityPhotoUploader
                                    photoUrl={photoUrl || values.photoUrl || team2}
                                    fallbackImage={team2}
                                    uploading={photoUploading}
                                    onSelectFile={(file) =>
                                      void handleSelectPhoto(file, setFieldValue)
                                    }
                                  />
                                </MDBox>
                                <MDBox p={3} pt={0}>
                                  <ActivityFormFields
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    setFieldValue={setFieldValue}
                                  />
                                  <MDBox mt={3} display="flex" justifyContent="flex-end">
                                    <MDBox ml={1}>
                                      <MDButton
                                        disabled={isSubmitting}
                                        type="submit"
                                        variant="gradient"
                                        color="info"
                                      >
                                        salvar
                                      </MDButton>
                                    </MDBox>
                                  </MDBox>
                                </MDBox>
                              </Card>
                            </Form>
                          )}
                        </Formik>
                      </Grid>
                      <Grid item xs={12} id="objetivos">
                        <ObjectivesTopicsManager
                          objectives={objectives}
                          onObjectivesChange={handleObjectivesChange}
                          onSave={handleObjectivesSave}
                        />
                      </Grid>
                    </Grid>
                  ) : (
                    <Card>
                      <MDBox p={3}>
                        <MDTypography variant="button" color="text" fontWeight="regular">
                          Carregando atividade…
                        </MDTypography>
                      </MDBox>
                    </Card>
                  )}
                </MDBox>
              </Grid>
            </Grid>
          </MDBox>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox my={3}>
        <Card>
          <MDBox p={3}>
            <MDTypography variant="h5">Nova atividade</MDTypography>
            {localError ? (
              <MDBox mt={2}>
                <MDTypography variant="button" color="error" fontWeight="medium">
                  {localError}
                </MDTypography>
              </MDBox>
            ) : null}
            <ActivityPhotoUploader
              photoUrl={photoUrl || team2}
              fallbackImage={team2}
              uploading={photoUploading}
              onSelectFile={(file) => void handleSelectPhoto(file)}
            />
          </MDBox>
          <MDBox p={3} pt={0}>
            <Formik<ActivityFormValues>
              initialValues={initialValues}
              validationSchema={activityValidationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, isSubmitting, setFieldValue }) => (
                <Form autoComplete="off">
                  <ActivityFormFields
                    values={values}
                    errors={errors}
                    touched={touched}
                    setFieldValue={setFieldValue}
                  />
                  <MDBox mt={3} display="flex" justifyContent="flex-end">
                    <MDButton variant="outlined" color="dark" onClick={handleCancel}>
                      cancelar
                    </MDButton>
                    <MDBox ml={1}>
                      <MDButton
                        disabled={isSubmitting}
                        type="submit"
                        variant="gradient"
                        color="info"
                      >
                        salvar
                      </MDButton>
                    </MDBox>
                  </MDBox>
                </Form>
              )}
            </Formik>
          </MDBox>

          <MDBox p={3} pt={0}>
            <ObjectivesTopicsManager
              objectives={objectives}
              onObjectivesChange={handleObjectivesChange}
            />
          </MDBox>
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default NewActivity;
