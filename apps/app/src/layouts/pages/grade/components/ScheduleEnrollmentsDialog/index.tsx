import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import AttendanceTab from "../attendance/AttendanceTab";
import EvaluationsTab from "../evaluations/EvaluationsTab";
import TestsTab from "../tests/TestsTab";

import { useAppSelector } from "../../../../../redux/hooks";

import { useScheduleAttendanceDialog } from "hooks/classes";

import { useToast } from "context/ToastContext";

import type { ScheduleEnrollmentsDialogProps } from "./types";

import { DetailsDot, DetailsPanel, EnrollmentsPanel } from "./styles";

function ScheduleEnrollmentsDialog({
  open,
  onClose,
  schedule,
}: ScheduleEnrollmentsDialogProps): JSX.Element {
  const toast = useToast();
  const [tabValue, setTabValue] = useState(0);
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);
  const { user } = useAppSelector((state) => state.auth);

  const sessionDateKey = String(schedule?.sessionDate || "").slice(0, 10);
  const idClass = String(schedule?.idClass || "").trim();
  const sessionId = String(schedule?.id || "").trim();

  const {
    loading,
    students,
    draftByClientId,
    savingAttendance,
    searchOptions,
    handleToggleAttendance,
    handleJustificationChange,
    handleAddStudent,
    handleSaveAttendance,
  } = useScheduleAttendanceDialog({
    open,
    idTenant,
    idBranch,
    idClass,
    sessionId,
    sessionDateKey,
    sessionStartTime: schedule?.startTime,
    markedByUserId: user?.uid,
    showError: toast.showError,
    showSuccess: toast.showSuccess,
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <MDBox display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h6">Detalhes da Turma</MDTypography>
          <IconButton onClick={onClose}>
            <Icon>close</Icon>
          </IconButton>
        </MDBox>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <MDBox display="flex" minHeight={520}>
          {/* Left Panel - Details */}
          <DetailsPanel p={2.5}>
            <MDBox display="flex" alignItems="center" gap={1.5}>
              <DetailsDot activityColor={schedule?.color} />
              <MDTypography variant="button" fontWeight="medium">
                Detalhes
              </MDTypography>
            </MDBox>

            <MDBox mt={2}>
              <MDTypography variant="caption" color="text" display="block">
                Data
              </MDTypography>
              <MDTypography variant="button" fontWeight="medium">
                {schedule?.sessionDate || new Date().toLocaleDateString()}
              </MDTypography>
            </MDBox>

            <MDBox mt={2}>
              <MDTypography variant="caption" color="text" display="block">
                Horário
              </MDTypography>
              <MDTypography variant="button" fontWeight="medium">
                {schedule?.startTime} - {schedule?.endTime}
              </MDTypography>
            </MDBox>

            <MDBox mt={2}>
              <MDTypography variant="caption" color="text" display="block">
                Professor
              </MDTypography>
              <MDTypography variant="button" fontWeight="medium">
                {schedule?.employeeName}
              </MDTypography>
            </MDBox>

            <MDBox mt={2}>
              <MDTypography variant="caption" color="text" display="block">
                Área
              </MDTypography>
              <MDTypography variant="button" fontWeight="medium">
                {schedule?.areaName}
              </MDTypography>
            </MDBox>

            <MDBox mt={2}>
              <MDTypography variant="caption" color="text" display="block">
                Ocupação
              </MDTypography>
              <MDTypography variant="button" fontWeight="medium">
                {students.length}/{schedule?.maxCapacity}
              </MDTypography>
            </MDBox>
          </DetailsPanel>

          {/* Right Panel - Content */}
          <EnrollmentsPanel flex={1} p={2.5}>
            <MDBox mb={2}>
              <AppBar position="static" color="transparent" elevation={0}>
                <Tabs value={tabValue} onChange={(_, next) => setTabValue(next)} variant="standard">
                  <Tab label="Presença" />
                  <Tab label="Avaliações" />
                  <Tab label="Testes" />
                </Tabs>
              </AppBar>
            </MDBox>

            {tabValue === 0 && (
              <AttendanceTab
                loading={loading}
                students={students}
                draftByClientId={draftByClientId}
                savingAttendance={savingAttendance}
                searchOptions={searchOptions}
                onAddStudent={handleAddStudent}
                onToggleAttendance={handleToggleAttendance}
                onJustificationChange={handleJustificationChange}
                onSaveAttendance={handleSaveAttendance}
              />
            )}

            {tabValue === 1 && <EvaluationsTab enrollments={students} schedule={schedule} />}

            {tabValue === 2 && <TestsTab enrollments={students} schedule={schedule} />}
          </EnrollmentsPanel>
        </MDBox>
      </DialogContent>
    </Dialog>
  );
}

export default ScheduleEnrollmentsDialog;
