import { useEffect, useState } from "react";

import Autocomplete from "@mui/material/Autocomplete";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import MDTypography from "components/MDTypography";

import AttendanceStudentCard from "./AttendanceStudentCard";

import { EnrollmentsDivider, EnrollmentsList } from "../ScheduleEnrollmentsDialog/styles";

import type { AttendanceDraft, StudentRow } from "../ScheduleEnrollmentsDialog/types";

type SearchOption = {
  id: string;
  name: string;
  photoUrl?: string | null;
};

type Props = {
  loading: boolean;
  students: StudentRow[];
  draftByClientId: Record<string, AttendanceDraft>;
  savingAttendance: boolean;
  searchOptions: SearchOption[];
  onAddStudent: (student: any) => void;
  onToggleAttendance: (studentId: string) => void;
  onJustificationChange: (clientId: string, value: string) => void;
  onSaveAttendance: () => void;
};

function AttendanceTab({
  loading,
  students,
  draftByClientId,
  savingAttendance,
  searchOptions,
  onAddStudent,
  onToggleAttendance,
  onJustificationChange,
  onSaveAttendance,
}: Props): JSX.Element {
  const [collapsedJustifications, setCollapsedJustifications] = useState<Record<string, boolean>>(
    {}
  );

  const handleToggle = (studentId: string) => {
    const student = students.find((s) => String(s.id) === String(studentId));
    if (student?.isSuspended) return;
    onToggleAttendance(studentId);
    setCollapsedJustifications((prev) => {
      if (!prev[studentId]) return prev;
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const handleCollapse = (studentId: string) => {
    setCollapsedJustifications((prev) => ({ ...prev, [studentId]: true }));
  };

  const handleExpand = (studentId: string) => {
    setCollapsedJustifications((prev) => {
      if (!prev[studentId]) return prev;
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  useEffect(() => {
    setCollapsedJustifications((prev) => {
      const next = { ...prev };

      students.forEach((student) => {
        const draft = draftByClientId?.[student.id];
        const hasAbsence = Boolean(draft && draft.present === false);
        const hasText = Boolean(String(draft?.justification || "").trim());

        if (hasAbsence && hasText) {
          if (next[student.id] === undefined) {
            next[student.id] = true;
          }
        } else if (!hasAbsence || !hasText) {
          if (next[student.id] !== undefined) {
            delete next[student.id];
          }
        }
      });

      return next;
    });
  }, [students, draftByClientId]);

  return (
    <>
      <MDBox mb={2}>
        <MDTypography variant="h6" fontWeight="medium">
          Presença
        </MDTypography>
        <MDTypography variant="button" color="text">
          Marque presença ou falta. Faltas exigem justificativa.
        </MDTypography>
      </MDBox>

      <MDBox mb={2}>
        <MDBox mt={1} display="flex" alignItems="center" gap={1.5}>
          <Autocomplete
            options={searchOptions}
            getOptionLabel={(option) => option.name}
            fullWidth
            disabled={loading}
            onChange={(_, value) => {
              if (value) onAddStudent(value);
            }}
            renderInput={(params) => (
              <MDInput {...params} label="Buscar aluno" placeholder="Digite o nome" />
            )}
          />
        </MDBox>
      </MDBox>

      <MDBox
        p={2}
        sx={(theme: any) => ({
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.shape.borderRadius * 1.25,
          height: 420,
          overflow: "auto",
        })}
      >
        <MDBox mb={1.5}>
          <MDTypography variant="button" fontWeight="medium">
            Alunos
          </MDTypography>
          <EnrollmentsDivider />
        </MDBox>

        <EnrollmentsList>
          {students.map((student) => (
            <MDBox key={student.id}>
              <AttendanceStudentCard
                name={String(student.name || "Aluno")}
                photoUrl={student.photoUrl || null}
                present={Boolean(draftByClientId?.[student.id]?.present ?? true)}
                suspended={Boolean(student.isSuspended)}
                onToggle={() => handleToggle(String(student.id))}
                hasJustification={Boolean(
                  String(draftByClientId?.[student.id]?.justification || "").trim()
                )}
                justificationCollapsed={Boolean(collapsedJustifications[student.id])}
                onShowJustification={() => handleExpand(String(student.id))}
              />

              {!Boolean(draftByClientId?.[student.id]?.present ?? true) &&
                !collapsedJustifications[student.id] &&
                !student.isSuspended && (
                  <MDBox mt={1.25} ml={5.5}>
                    <MDBox display="flex" alignItems="flex-start" gap={1}>
                      <MDInput
                        fullWidth
                        multiline
                        minRows={2}
                        label="Justificativa"
                        placeholder="Descreva o motivo da falta"
                        value={String(draftByClientId?.[student.id]?.justification || "")}
                        onChange={(e: any) => onJustificationChange(student.id, e.target.value)}
                      />
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleCollapse(String(student.id))}
                      >
                        <Icon>close</Icon>
                      </IconButton>
                    </MDBox>
                  </MDBox>
                )}
            </MDBox>
          ))}
        </EnrollmentsList>
      </MDBox>

      <MDBox mt={2} display="flex" justifyContent="flex-end">
        <MDButton
          variant="gradient"
          color="info"
          disabled={loading || savingAttendance}
          onClick={onSaveAttendance}
        >
          {savingAttendance ? "Salvando..." : "Salvar"}
        </MDButton>
      </MDBox>
    </>
  );
}

export default AttendanceTab;
