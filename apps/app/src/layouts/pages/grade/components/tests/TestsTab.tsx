import { useEffect, useMemo, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import MDTypography from "components/MDTypography";
import { StudentsBox, StudentRowShell } from "components";
import { useToast } from "context/ToastContext";

import { useAppSelector } from "../../../../../redux/hooks";

import { useStudentsFromEnrollments } from "hooks/ui/useStudentsFromEnrollments";

import {
  fetchTestDefinitions,
  fetchTestsEventForDate,
  fetchClientTestResultForEventPlan,
  upsertClientTestResultForEventPlan,
  secondsToTimeParts,
  timePartsToSecondsString,
  type TestDefinition,
} from "hooks/tests";

type Props = {
  enrollments: any[];
  schedule: any;
};

function TestsTab({ enrollments, schedule }: Props): JSX.Element {
  const toast = useToast();
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);
  const { user } = useAppSelector((state) => state.auth);

  const todayKey = String(new Date().toISOString()).slice(0, 10);

  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftInitialized, setDraftInitialized] = useState(false);
  const [tests, setTests] = useState<TestDefinition[]>([]);
  const [testsEvent, setTestsEvent] = useState<any>(null);

  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [draftByStudentId, setDraftByStudentId] = useState<Record<string, Record<string, string>>>(
    {}
  );

  const resultsCacheRef = useRef<Map<string, Record<string, string>>>(new Map());
  const cacheEventPlanIdRef = useRef<string | null>(null);

  const { students, studentIdsKey } = useStudentsFromEnrollments<any>(enrollments);

  const canUse = Boolean(idTenant && idBranch);
  const testsEnabled = Boolean(testsEvent?.id);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!canUse) {
        if (!active) return;
        setTests([]);
        setTestsEvent(null);
        setSelectedTestId(null);
        setDraftByStudentId({});
        setDraftLoading(false);
        setDraftInitialized(false);
        return;
      }

      setLoading(true);
      setDraftInitialized(false);
      try {
        const [defs, event] = await Promise.all([
          fetchTestDefinitions(idTenant, idBranch),
          fetchTestsEventForDate(idTenant, idBranch, todayKey),
        ]);
        if (!active) return;

        const list = (Array.isArray(defs) ? defs : []).filter(
          (t) => !Boolean((t as any)?.inactive)
        );
        setTests(list);
        setTestsEvent(event);
        setSelectedTestId((prev) => prev || (list[0]?.id ? String(list[0].id) : null));
      } catch (e: any) {
        if (!active) return;
        setTests([]);
        setTestsEvent(null);
        toast.showError(e?.message || "Erro ao carregar testes.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [canUse, idBranch, idTenant, todayKey, toast]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!canUse) return;
      const studentsList = students;
      if (!testsEvent?.id) {
        if (!active) return;
        setDraftByStudentId({});
        setDraftLoading(false);
        setDraftInitialized(true);
        return;
      }

      if (!studentsList.length) {
        if (!active) return;
        setDraftByStudentId({});
        setDraftLoading(false);
        setDraftInitialized(true);
        return;
      }

      const eventPlanId = String(testsEvent.id);
      if (cacheEventPlanIdRef.current !== eventPlanId) {
        cacheEventPlanIdRef.current = eventPlanId;
        resultsCacheRef.current = new Map();
      }

      const base: Record<string, Record<string, string>> = {};

      setDraftLoading(true);
      await Promise.all(
        studentsList.map(async (s: any) => {
          const cid = String(s?.id || "").trim();
          if (!cid) return;

          const cacheKey = `${eventPlanId}:${cid}`;
          const cached = resultsCacheRef.current.get(cacheKey);
          if (cached) {
            base[cid] = cached;
            return;
          }

          const doc = await fetchClientTestResultForEventPlan(idTenant, idBranch, cid, eventPlanId);
          const stored = (doc?.resultsByTestId || {}) as any;
          const byTestId: Record<string, string> = {};
          Object.entries(stored).forEach(([tid, v]) => {
            const id = String(tid || "").trim();
            if (!id) return;
            byTestId[id] = String((v as any)?.value || "");
          });
          resultsCacheRef.current.set(cacheKey, byTestId);
          base[cid] = byTestId;
        })
      );

      if (!active) return;
      setDraftByStudentId(base);
      setDraftLoading(false);
      setDraftInitialized(true);
    };

    void run();
    return () => {
      active = false;
    };
  }, [canUse, idBranch, idTenant, studentIdsKey, testsEvent?.id, students]);

  const testOptions = useMemo(() => {
    return (Array.isArray(tests) ? tests : []).map((t) => ({ id: t.id, name: t.name }));
  }, [tests]);

  const selectedTest = useMemo(() => {
    if (!selectedTestId) return null;
    return (
      (Array.isArray(tests) ? tests : []).find((t) => String(t.id) === String(selectedTestId)) ||
      null
    );
  }, [selectedTestId, tests]);

  const handleSave = async () => {
    if (!testsEvent?.id) {
      toast.showError("Testes bloqueados: não existe período ativo de testes.");
      return;
    }
    const students = Array.isArray(enrollments) ? enrollments : [];
    if (!students.length) return;

    setSaving(true);
    try {
      await Promise.all(
        students.map(async (s: any) => {
          const cid = String(s?.id || "").trim();
          if (!cid) return;

          const byTestId = draftByStudentId?.[cid] || {};
          const resultsByTestId: Record<string, { value: string }> = {};
          Object.entries(byTestId).forEach(([tid, v]) => {
            const id = String(tid || "").trim();
            if (!id) return;
            resultsByTestId[id] = { value: String(v || "") };
          });

          await upsertClientTestResultForEventPlan({
            idTenant,
            idBranch,
            clientId: cid,
            eventPlanId: String(testsEvent.id),
            eventTypeName: String(testsEvent.eventTypeName || "Testes"),
            startAt: String(testsEvent.startAt || ""),
            endAt: testsEvent.endAt ? String(testsEvent.endAt) : undefined,
            resultsByTestId,
            updatedByUserId: user?.uid,
          });
        })
      );

      toast.showSuccess("Resultados salvos com sucesso!");
    } catch (e: any) {
      toast.showError(e?.message || "Erro ao salvar resultados");
    } finally {
      setSaving(false);
    }
  };

  const readyToRender = !loading && draftInitialized;

  return (
    <MDBox position="relative">
      {!readyToRender ? (
        <MDBox
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={2}
        >
          <CircularProgress color="info" />
        </MDBox>
      ) : null}

      <MDBox
        sx={{ opacity: readyToRender ? 1 : 0, pointerEvents: readyToRender ? "auto" : "none" }}
      >
        <MDBox mb={2}>
          <MDTypography variant="h6" fontWeight="medium">
            Testes
          </MDTypography>
          <MDTypography variant="button" color="text">
            Selecione um teste para lançar os resultados dos alunos.
          </MDTypography>
          {!testsEnabled ? (
            <MDTypography variant="button" color="warning" sx={{ display: "block", mt: 0.5 }}>
              Testes bloqueados: não existe um evento &quot;Testes&quot; ativo para a data de hoje.
            </MDTypography>
          ) : null}
        </MDBox>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <Autocomplete
              options={testOptions}
              getOptionLabel={(option: any) => option.name}
              value={testOptions.find((t) => t.id === selectedTestId) || null}
              disabled={loading}
              onChange={(_, newValue: any) => {
                setSelectedTestId(newValue ? newValue.id : null);
              }}
              renderInput={(params) => (
                <MDInput {...params} label="Teste" placeholder="Selecione o teste" />
              )}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <StudentsBox loadingOverlay={draftLoading}>
              {!selectedTestId ? (
                <MDTypography variant="button" color="text">
                  Selecione um teste para liberar o lançamento de resultados.
                </MDTypography>
              ) : students.length === 0 ? (
                <MDTypography variant="button" color="text">
                  Nenhum aluno.
                </MDTypography>
              ) : (
                <MDBox display="flex" flexDirection="column" gap={1.5}>
                  {students.map((student: any) => (
                    <StudentRowShell
                      key={student.id}
                      name={String(student.name || "")}
                      photoUrl={student.photoUrl || null}
                      right={
                        selectedTest?.mode === "distance" ? (
                          (() => {
                            const sid = String(student.id);
                            const tid = String(selectedTestId || "");
                            const rawValue = draftByStudentId?.[sid]?.[tid] || "";
                            const parts = secondsToTimeParts(rawValue);

                            const setPart = (key: "hh" | "mm" | "ss") => (e: any) => {
                              const nextVal = String(e?.target?.value ?? "");
                              const current = secondsToTimeParts(
                                draftByStudentId?.[sid]?.[tid] || ""
                              );
                              const secondsString = timePartsToSecondsString({
                                hh: key === "hh" ? nextVal : current.hh,
                                mm: key === "mm" ? nextVal : current.mm,
                                ss: key === "ss" ? nextVal : current.ss,
                              });

                              setDraftByStudentId((prev) => {
                                const next = { ...(prev || {}) };
                                const byTestId = next[sid] ? { ...next[sid] } : {};
                                byTestId[tid] = secondsString;
                                next[sid] = byTestId;
                                return next;
                              });
                            };

                            return (
                              <MDBox display="flex" gap={0.75} alignItems="flex-end">
                                <MDInput
                                  label="HH"
                                  inputProps={{
                                    inputMode: "numeric",
                                    pattern: "[0-9]*",
                                    maxLength: 4,
                                  }}
                                  sx={{ width: 46 }}
                                  disabled={!testsEnabled || draftLoading}
                                  value={parts.hh}
                                  onChange={setPart("hh")}
                                />
                                <MDInput
                                  label="MM"
                                  inputProps={{
                                    inputMode: "numeric",
                                    pattern: "[0-9]*",
                                    maxLength: 2,
                                  }}
                                  sx={{ width: 46 }}
                                  disabled={!testsEnabled || draftLoading}
                                  value={parts.mm}
                                  onChange={setPart("mm")}
                                />
                                <MDInput
                                  label="SS"
                                  inputProps={{
                                    inputMode: "numeric",
                                    pattern: "[0-9]*",
                                    maxLength: 2,
                                  }}
                                  sx={{ width: 46 }}
                                  disabled={!testsEnabled || draftLoading}
                                  value={parts.ss}
                                  onChange={setPart("ss")}
                                />
                              </MDBox>
                            );
                          })()
                        ) : (
                          <MDInput
                            label="Distância (m)"
                            placeholder="0"
                            disabled={!testsEnabled || draftLoading}
                            value={
                              draftByStudentId?.[String(student.id)]?.[String(selectedTestId)] || ""
                            }
                            onChange={(e: any) => {
                              const sid = String(student.id);
                              const tid = String(selectedTestId || "");
                              if (!sid || !tid) return;
                              setDraftByStudentId((prev) => {
                                const next = { ...(prev || {}) };
                                const byTestId = next[sid] ? { ...next[sid] } : {};
                                byTestId[tid] = String(e.target.value || "");
                                next[sid] = byTestId;
                                return next;
                              });
                            }}
                          />
                        )
                      }
                    />
                  ))}
                </MDBox>
              )}
            </StudentsBox>
          </Grid>
        </Grid>

        <MDBox mt={2} display="flex" justifyContent="flex-end">
          <MDButton
            variant="gradient"
            color="info"
            disabled={!selectedTestId || saving || !testsEnabled}
            onClick={handleSave}
          >
            {saving ? "Salvando..." : "Salvar"}
          </MDButton>
        </MDBox>
      </MDBox>
    </MDBox>
  );
}

export default TestsTab;
