import { Form, Formik } from "formik";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import { scheduleValidationSchema } from "./utils";
import ScheduleForm from "./components/ScheduleForm";
import { useSchedulesPage } from "./hooks/useSchedulesPage";

import GradeHeader from "../../grade/components/GradeHeader";
import GradeGrid from "../../grade/components/GradeGrid";

import type { ScheduleFormValues } from "./types";

import { ConfirmDialog } from "components";

function SchedulesPage(): JSX.Element {
  const {
    grade,
    confirmDialog,
    activityOptions,
    areaOptions,
    instructorOptions,
    schedules,
    formInitialValues,
    selectedClassId,
    selectedScheduleId,
    handleSelectSchedule,
    handleSubmit,
    handleCancel,
    handleDelete,
    isLoading,
    isGeneratingSessions,
  } = useSchedulesPage();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} px={2}>
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ height: "100%" }}>
                  <MDBox p={3}>
                    <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <MDTypography variant="h5">Nova turma</MDTypography>
                    </MDBox>

                    <Formik<ScheduleFormValues>
                      initialValues={formInitialValues}
                      enableReinitialize
                      validationSchema={scheduleValidationSchema}
                      onSubmit={handleSubmit}
                    >
                      {({
                        values,
                        errors,
                        touched,
                        handleChange,
                        setFieldValue,
                        isSubmitting,
                        submitForm,
                      }) => (
                        <Form>
                          <ScheduleForm
                            values={values}
                            errors={errors}
                            touched={touched}
                            handleChange={handleChange}
                            setFieldValue={setFieldValue}
                            activities={activityOptions}
                            instructors={instructorOptions}
                            areas={areaOptions}
                            disabled={isLoading || isSubmitting}
                          />

                          <MDBox
                            display="flex"
                            justifyContent="flex-end"
                            gap={1.5}
                            mt={3}
                            flexWrap="wrap"
                          >
                            <MDButton
                              variant="outlined"
                              color="dark"
                              disabled={isLoading || isSubmitting}
                              onClick={handleCancel}
                            >
                              Cancelar
                            </MDButton>

                            <MDButton
                              variant="outlined"
                              color="error"
                              disabled={!selectedClassId || isLoading || isSubmitting}
                              onClick={handleDelete}
                            >
                              Excluir
                            </MDButton>

                            <MDButton
                              variant="gradient"
                              color="info"
                              type="button"
                              disabled={isLoading || isSubmitting}
                              onClick={() => submitForm()}
                            >
                              {selectedClassId ? "Atualizar" : "Salvar"}
                            </MDButton>
                          </MDBox>
                        </Form>
                      )}
                    </Formik>
                  </MDBox>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card sx={{ height: "100%" }}>
                  <MDBox p={3}>
                    <MDBox mb={2}>
                      <MDTypography variant="h5">Calendário</MDTypography>
                    </MDBox>

                    <MDBox mb={2}>
                      <GradeHeader
                        turn={grade.turn}
                        onTurnChange={grade.setTurn}
                        view={grade.view}
                        onViewChange={grade.setView}
                        referenceDate={grade.referenceDate}
                        onReferenceDateChange={grade.setReferenceDate}
                        showOccupancy={grade.showOccupancy}
                        onShowOccupancyChange={grade.setShowOccupancy}
                      />
                    </MDBox>

                    <MDBox
                      sx={(theme: any) => ({
                        position: "relative",
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: theme.shape.borderRadius * 1.25,
                        overflow: "hidden",
                        backgroundColor: theme.palette.background.paper,
                      })}
                    >
                      {(isLoading || isGeneratingSessions) && (
                        <Box
                          sx={(theme: any) => ({
                            position: "absolute",
                            inset: 0,
                            zIndex: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: theme.palette.background.paper,
                            opacity: 0.7,
                          })}
                        >
                          <CircularProgress color="success" />
                        </Box>
                      )}
                      <GradeGrid
                        turn={grade.turn}
                        view={grade.view}
                        weekStart={grade.weekStart}
                        referenceDate={grade.referenceDate}
                        schedules={schedules}
                        showOccupancy={grade.showOccupancy}
                        onSelectSchedule={handleSelectSchedule}
                        selectedScheduleId={selectedScheduleId}
                      />
                    </MDBox>
                  </MDBox>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
      <ConfirmDialog
        {...confirmDialog.dialogProps}
        onCancel={confirmDialog.handleCancel}
        onConfirm={confirmDialog.handleConfirm}
      />
    </DashboardLayout>
  );
}

export default SchedulesPage;
