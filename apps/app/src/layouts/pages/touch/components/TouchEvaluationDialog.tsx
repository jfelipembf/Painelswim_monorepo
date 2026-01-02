import { useEffect, useMemo, useState } from "react";

import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import { FormField } from "components";

import { useToast } from "context/ToastContext";

import { useAppSelector } from "../../../../redux/hooks";

import { useScheduleAttendanceDialog } from "hooks/classes";

import { fetchActivityObjectives, type Objective } from "hooks/activities";
import { fetchEvaluationLevels, type EvaluationLevel } from "hooks/evaluationLevels";

import {
  fetchClientEvaluationForEventPlan,
  fetchEvaluationEventForDate,
  upsertClientEvaluationForEventPlan,
  type EvaluationTopicLevel,
} from "hooks/evaluations";

type Props = {
  schedule: any | null;
};

const normalizeIsoDateKey = (value: any): string => String(value || "").slice(0, 10);

function TouchEvaluationDialog({ schedule }: Props): JSX.Element {
  const toast = useToast();

  const enabled = Boolean(schedule);

  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);
  const { user } = useAppSelector((state) => state.auth);

  const sessionDateKey = normalizeIsoDateKey(schedule?.sessionDate);
  const idClass = String(schedule?.idClass || "").trim();
  const sessionId = String(schedule?.id || "").trim();
  const idActivity = String(schedule?.idActivity || "").trim();

  const { loading: studentsLoading, students } = useScheduleAttendanceDialog({
    open: enabled,
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

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [levels, setLevels] = useState<EvaluationLevel[]>([]);
  const [evaluationEvent, setEvaluationEvent] = useState<any | null>(null);

  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const [draftByStudentId, setDraftByStudentId] = useState<
    Record<string, Record<string, EvaluationTopicLevel>>
  >({});

  const canUse = Boolean(enabled && idTenant && idBranch && idClass && idActivity);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!canUse) {
        if (!active) return;
        setObjectives([]);
        setLevels([]);
        setEvaluationEvent(null);
        setSelectedObjectiveId(null);
        setSelectedTopicId(null);
        setDraftByStudentId({});
        return;
      }

      setLoading(true);
      try {
        const todayKey = normalizeIsoDateKey(new Date().toISOString());
        const [objs, lvls, event] = await Promise.all([
          fetchActivityObjectives(idTenant, idBranch, idActivity),
          fetchEvaluationLevels(idTenant, idBranch),
          fetchEvaluationEventForDate(idTenant, idBranch, todayKey),
        ]);

        if (!active) return;

        const objList = Array.isArray(objs) ? (objs as Objective[]) : [];
        const levelsList = Array.isArray(lvls) ? (lvls as EvaluationLevel[]) : [];

        setObjectives(objList);
        setLevels(levelsList);
        setEvaluationEvent(event);

        const firstObjectiveId = objList[0]?.id ? String(objList[0].id) : null;
        const firstTopicId = firstObjectiveId
          ? String(objList[0]?.topics?.[0]?.id || "") || null
          : null;

        setSelectedObjectiveId((prev) => prev || firstObjectiveId);
        setSelectedTopicId((prev) => prev || firstTopicId);
      } catch (e: any) {
        if (!active) return;
        setObjectives([]);
        setLevels([]);
        setEvaluationEvent(null);
        toast.showError(e?.message || "Erro ao carregar dados de avaliação.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [canUse, idActivity, idBranch, idTenant, toast]);

  const objectiveOptions = useMemo(() => {
    return (Array.isArray(objectives) ? objectives : [])
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((o) => ({
        id: String(o.id),
        name: o.title,
      }));
  }, [objectives]);

  const objectiveIndexById = useMemo(() => {
    const map = new Map<string, number>();
    (Array.isArray(objectives) ? objectives : [])
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((o: any, idx: number) => {
        const id = String(o?.id || "").trim();
        if (id) map.set(id, idx);
      });
    return map;
  }, [objectives]);

  const topicIdsByObjectiveId = useMemo(() => {
    const map = new Map<string, string[]>();
    (Array.isArray(objectives) ? objectives : []).forEach((o: any) => {
      const oid = String(o?.id || "").trim();
      if (!oid) return;
      const tids = (Array.isArray(o?.topics) ? o.topics : [])
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((t: any) => String(t?.id || "").trim())
        .filter(Boolean);
      map.set(oid, tids);
    });
    return map;
  }, [objectives]);

  const topicOptions = useMemo(() => {
    if (!selectedObjectiveId) return [];
    const obj = (Array.isArray(objectives) ? objectives : []).find(
      (o) => String(o.id) === String(selectedObjectiveId)
    );
    return (Array.isArray(obj?.topics) ? obj?.topics : [])
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((t: any) => ({
        id: String(t.id),
        name: String(t.description || ""),
      }));
  }, [objectives, selectedObjectiveId]);

  const canGoPrevNext = Boolean(objectives.length);
  const currentObjectiveIdx = selectedObjectiveId
    ? objectiveIndexById.get(String(selectedObjectiveId)) ?? -1
    : -1;
  const currentTopicIds = selectedObjectiveId
    ? topicIdsByObjectiveId.get(String(selectedObjectiveId)) || []
    : [];
  const currentTopicIdx = selectedTopicId ? currentTopicIds.indexOf(String(selectedTopicId)) : -1;

  const isAtFirst =
    currentObjectiveIdx <= 0 && (currentTopicIdx <= 0 || currentTopicIds.length === 0);
  const isAtLast =
    currentObjectiveIdx >= objectives.length - 1 &&
    currentTopicIds.length > 0 &&
    currentTopicIdx >= currentTopicIds.length - 1;

  const handlePrevTopic = () => {
    if (!canGoPrevNext) return;
    const oid = String(selectedObjectiveId || "").trim();
    if (!oid) return;

    const topics = topicIdsByObjectiveId.get(oid) || [];
    const idx = selectedTopicId ? topics.indexOf(String(selectedTopicId)) : -1;

    if (idx > 0) {
      setSelectedTopicId(topics[idx - 1]);
      return;
    }

    const oIdx = objectiveIndexById.get(oid) ?? -1;
    if (oIdx > 0) {
      const prevObj: any = (Array.isArray(objectives) ? objectives : [])[oIdx - 1];
      const prevOid = String(prevObj?.id || "");
      const prevTopics = topicIdsByObjectiveId.get(prevOid) || [];
      setSelectedObjectiveId(prevOid || null);
      setSelectedTopicId(prevTopics[prevTopics.length - 1] || null);
    }
  };

  const handleNextTopic = () => {
    if (!canGoPrevNext) return;
    const oid = String(selectedObjectiveId || "").trim();
    if (!oid) return;

    const topics = topicIdsByObjectiveId.get(oid) || [];
    const idx = selectedTopicId ? topics.indexOf(String(selectedTopicId)) : -1;

    if (idx >= 0 && idx < topics.length - 1) {
      setSelectedTopicId(topics[idx + 1]);
      return;
    }

    const oIdx = objectiveIndexById.get(oid) ?? -1;
    if (oIdx >= 0 && oIdx < objectives.length - 1) {
      const nextObj: any = (Array.isArray(objectives) ? objectives : [])[oIdx + 1];
      const nextOid = String(nextObj?.id || "");
      const nextTopics = topicIdsByObjectiveId.get(nextOid) || [];
      setSelectedObjectiveId(nextOid || null);
      setSelectedTopicId(nextTopics[0] || null);
    }
  };

  useEffect(() => {
    if (!selectedTopicId && topicOptions.length > 0) {
      setSelectedTopicId(topicOptions[0].id);
    }
  }, [selectedTopicId, topicOptions]);

  const sortedLevels = useMemo(() => {
    return [...(Array.isArray(levels) ? levels : [])]
      .filter((l) => !Boolean((l as any)?.inactive))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [levels]);

  const levelOptions = useMemo(() => {
    return sortedLevels.map((l: any) => ({
      id: String(l.id),
      name: String(l.name),
      value: Number(l.value || 0),
    }));
  }, [sortedLevels]);

  const defaultLevel = useMemo((): EvaluationTopicLevel => {
    const first = sortedLevels[0];
    return first
      ? {
          levelId: String(first.id),
          levelName: String(first.name),
          levelValue: Number(first.value || 0),
        }
      : { levelId: "", levelName: "", levelValue: 0 };
  }, [sortedLevels]);

  const evaluationEnabled = Boolean(evaluationEvent?.id);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!enabled) return;
      if (!evaluationEnabled) return;

      const eventPlanId = String(evaluationEvent?.id || "");
      if (!eventPlanId) return;

      const list = Array.isArray(students) ? students : [];
      if (!list.length) return;

      const baseByStudentId: Record<string, Record<string, EvaluationTopicLevel>> = {};

      await Promise.all(
        list.map(async (s: any) => {
          const cid = String(s?.id || "").trim();
          if (!cid) return;

          const current = await fetchClientEvaluationForEventPlan(
            idTenant,
            idBranch,
            cid,
            eventPlanId
          );
          const stored = (current?.levelsByTopicId || {}) as Record<string, EvaluationTopicLevel>;
          baseByStudentId[cid] = { ...(stored || {}) };
        })
      );

      if (!active) return;
      setDraftByStudentId(baseByStudentId);
    };

    void run();
    return () => {
      active = false;
    };
  }, [defaultLevel, enabled, evaluationEnabled, evaluationEvent?.id, idBranch, idTenant, students]);

  useEffect(() => {
    if (!evaluationEnabled) return;
    if (!selectedTopicId) return;
    const topicId = String(selectedTopicId);
    const list = Array.isArray(students) ? students : [];
    if (!list.length) return;

    setDraftByStudentId((prev) => {
      const next = { ...(prev || {}) };
      list.forEach((s: any) => {
        const cid = String(s?.id || "").trim();
        if (!cid) return;
        const byTopic = next[cid] ? { ...next[cid] } : {};
        if (!byTopic[topicId]) byTopic[topicId] = defaultLevel;
        next[cid] = byTopic;
      });
      return next;
    });
  }, [defaultLevel, evaluationEnabled, selectedTopicId, students]);

  const handleSave = async () => {
    if (!evaluationEvent?.id) {
      toast.showError("Avaliação bloqueada: não existe período ativo de avaliação.");
      return;
    }
    if (!selectedTopicId) {
      toast.showError("Selecione um tópico.");
      return;
    }

    setSaving(true);
    try {
      const list = Array.isArray(students) ? students : [];

      await Promise.all(
        list.map(async (s: any) => {
          const cid = String(s?.id || "").trim();
          if (!cid) return;

          const byTopic = draftByStudentId?.[cid] || {};

          await upsertClientEvaluationForEventPlan({
            idTenant,
            idBranch,
            clientId: cid,
            idClass,
            idActivity,
            eventPlanId: String(evaluationEvent.id),
            eventTypeName: String(evaluationEvent.eventTypeName || "avaliação"),
            startAt: String(evaluationEvent.startAt || ""),
            endAt: evaluationEvent.endAt ? String(evaluationEvent.endAt) : undefined,
            levelsByTopicId: byTopic,
            updatedByUserId: user?.uid,
          });
        })
      );

      toast.showSuccess("Avaliação salva.");
    } catch (e: any) {
      toast.showError(e?.message || "Erro ao salvar avaliação");
    } finally {
      setSaving(false);
    }
  };

  const busy = loading || studentsLoading;

  return (
    <MDBox
      p={2}
      borderRadius="xl"
      sx={({ palette }) => ({
        border: `1px solid ${palette.divider}`,
        backgroundColor: "rgba(255,255,255,0.78)",
        backdropFilter: "blur(10px)",
        backgroundImage: "linear-gradient(135deg, rgba(26, 115, 232, 0.06), rgba(0, 0, 0, 0) 55%)",
        minHeight: 520,
      })}
    >
      <MDBox mb={2}>
        <MDTypography variant="h5" fontWeight="bold">
          Avaliação
        </MDTypography>
        {schedule ? (
          <MDTypography variant="caption" color="text" sx={{ display: "block" }}>
            {String(schedule?.startTime || "")} - {String(schedule?.endTime || "")} •{" "}
            {String(schedule?.activityName || schedule?.name || "Turma")}
          </MDTypography>
        ) : (
          <MDTypography variant="caption" color="text" sx={{ display: "block" }}>
            Selecione uma turma na coluna da esquerda.
          </MDTypography>
        )}
      </MDBox>

      {!schedule ? null : busy ? (
        <MDBox display="flex" alignItems="center" justifyContent="center" py={6}>
          <CircularProgress color="info" />
        </MDBox>
      ) : (
        <MDBox>
          {!evaluationEnabled ? (
            <MDTypography variant="button" color="warning" sx={{ display: "block", mb: 2 }}>
              Avaliação bloqueada: não existe um evento &quot;avaliação&quot; ativo para hoje.
            </MDTypography>
          ) : null}

          <Grid container spacing={2} sx={{ mb: 2, position: "relative" }}>
            <Grid item xs={12} md={5.5}>
              <Autocomplete
                options={objectiveOptions}
                getOptionLabel={(option: any) => option.name}
                value={objectiveOptions.find((o) => o.id === selectedObjectiveId) || null}
                disabled={!evaluationEnabled}
                onChange={(_, newValue: any) => {
                  setSelectedObjectiveId(newValue ? newValue.id : null);
                  setSelectedTopicId(null);
                }}
                renderInput={(params) => (
                  <MDInput {...params} label="Objetivo" placeholder="Selecione" />
                )}
              />
            </Grid>

            <Grid item xs={12} md={5.5}>
              <Autocomplete
                options={topicOptions}
                getOptionLabel={(option: any) => option.name}
                value={topicOptions.find((t) => t.id === selectedTopicId) || null}
                disabled={!evaluationEnabled || !selectedObjectiveId}
                onChange={(_, newValue: any) => {
                  setSelectedTopicId(newValue ? newValue.id : null);
                }}
                renderInput={(params) => (
                  <MDInput {...params} label="Tópico" placeholder="Selecione" />
                )}
              />
            </Grid>

            <Grid item xs={12} md={1}>
              <MDBox
                display="flex"
                gap={0.5}
                sx={{
                  height: 56,
                  justifyContent: "flex-end",
                }}
              >
                <MDButton
                  variant="outlined"
                  color="info"
                  disabled={!canGoPrevNext || isAtFirst || loading}
                  onClick={handlePrevTopic}
                  sx={{ height: 56, minWidth: 36, width: 36 }}
                >
                  <Icon>chevron_left</Icon>
                </MDButton>
                <MDButton
                  variant="outlined"
                  color="info"
                  disabled={!canGoPrevNext || isAtLast || loading}
                  onClick={handleNextTopic}
                  sx={{ height: 56, minWidth: 36, width: 36 }}
                >
                  <Icon>chevron_right</Icon>
                </MDButton>
              </MDBox>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          <MDBox
            mb={2}
            p={0}
            borderRadius="lg"
            sx={({ palette }) => ({
              border: "none",
              backgroundColor: "transparent",
              maxHeight: 260,
              overflowY: "auto",
            })}
          >
            {students.length === 0 ? (
              <MDTypography variant="button" color="text" display="block">
                Sem alunos matriculados
              </MDTypography>
            ) : (
              <MDBox display="grid" gap={0}>
                {students.map((s: any, idx: number) => {
                  const sid = String(s?.id || "").trim();
                  const name = String(s?.name || "Aluno");
                  const photoUrl = s?.photoUrl ? String(s.photoUrl) : "";

                  const topicId = String(selectedTopicId || "").trim();
                  const current =
                    sid && topicId ? draftByStudentId?.[sid]?.[topicId] || null : null;

                  return (
                    <MDBox
                      key={sid || String(idx)}
                      display="flex"
                      alignItems="center"
                      gap={1}
                      px={0.5}
                      py={1}
                      sx={({ palette }) => ({
                        borderBottom:
                          idx === students.length - 1 ? "none" : `1px solid ${palette.divider}`,
                      })}
                    >
                      <MDAvatar src={photoUrl || undefined} alt={name} size="sm" />
                      <MDBox minWidth={0} flex={1}>
                        <MDTypography
                          variant="button"
                          fontWeight="regular"
                          sx={{ lineHeight: 1.2 }}
                        >
                          {name}
                        </MDTypography>
                      </MDBox>

                      <MDBox sx={{ width: 210, flexShrink: 0 }}>
                        <FormField
                          label="Nível"
                          select
                          value={String(current?.levelId || "")}
                          disabled={!evaluationEnabled || !sid || !topicId}
                          onChange={(e: any) => {
                            if (!sid || !topicId) return;
                            const nextId = String(e?.target?.value || "");
                            const nextLevel = levelOptions.find(
                              (l: any) => String(l.id) === nextId
                            );
                            if (!nextLevel) return;

                            setDraftByStudentId((prev) => {
                              const next = { ...(prev || {}) };
                              const byTopic = next[sid] ? { ...next[sid] } : {};
                              byTopic[topicId] = {
                                levelId: String(nextLevel.id),
                                levelName: String(nextLevel.name),
                                levelValue: Number(nextLevel.value || 0),
                              };
                              next[sid] = byTopic;
                              return next;
                            });
                          }}
                        >
                          <MenuItem value="">Selecione</MenuItem>
                          {levelOptions.map((l: any) => (
                            <MenuItem key={String(l.id)} value={String(l.id)}>
                              {String(l.name)}
                            </MenuItem>
                          ))}
                        </FormField>
                      </MDBox>
                    </MDBox>
                  );
                })}
              </MDBox>
            )}
          </MDBox>

          <MDBox display="flex" justifyContent="flex-end" mt={2} position="relative">
            <MDButton
              variant="gradient"
              color="secondary"
              disabled={!evaluationEnabled || saving || students.length === 0 || !selectedTopicId}
              onClick={handleSave}
              sx={{
                minHeight: 46,
                position: "fixed",
                bottom: 20,
                right: 20,
                zIndex: 1000,
              }}
            >
              {saving ? (
                <>
                  <CircularProgress size={18} color="inherit" />
                  &nbsp;Salvando
                </>
              ) : (
                <>&nbsp;Salvar</>
              )}
            </MDButton>
          </MDBox>
        </MDBox>
      )}
    </MDBox>
  );
}

export default TouchEvaluationDialog;
