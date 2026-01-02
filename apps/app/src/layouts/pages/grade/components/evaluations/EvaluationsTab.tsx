import { useEffect, useMemo, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import Autocomplete from "@mui/material/Autocomplete";
import Icon from "@mui/material/Icon";
import CircularProgress from "@mui/material/CircularProgress";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import MDTypography from "components/MDTypography";
import { StudentsBox, StudentRowShell } from "components";
import { useToast } from "context/ToastContext";

import { useAppSelector } from "../../../../../redux/hooks";

import { useStudentsFromEnrollments } from "hooks/ui/useStudentsFromEnrollments";

import { fetchActivityObjectives, type Objective } from "hooks/activities";

import { fetchEvaluationLevels, type EvaluationLevel } from "hooks/evaluationLevels";

import {
  fetchClientEvaluationForEventPlan,
  fetchClientEvaluations,
  fetchEvaluationEventForDate,
  upsertClientEvaluationForEventPlan,
  type EvaluationTopicLevel,
} from "hooks/evaluations";

type Props = {
  enrollments: any[];
  schedule: any;
};

function EvaluationsTab({ enrollments, schedule }: Props): JSX.Element {
  const toast = useToast();
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);
  const { user } = useAppSelector((state) => state.auth);

  const idClass = String(schedule?.idClass || "").trim();
  const idActivity = String(schedule?.idActivity || "").trim();
  const sessionDateKey = String(schedule?.sessionDate || "").slice(0, 10);
  const todayKey = String(new Date().toISOString()).slice(0, 10);

  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftInitialized, setDraftInitialized] = useState(false);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [levels, setLevels] = useState<EvaluationLevel[]>([]);

  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const [evaluationEvent, setEvaluationEvent] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [draftLevelsByStudentId, setDraftLevelsByStudentId] = useState<
    Record<string, Record<string, EvaluationTopicLevel>>
  >({});

  const resultsCacheRef = useRef<Map<string, Record<string, EvaluationTopicLevel>>>(new Map());
  const lastEvaluationCacheRef = useRef<Map<string, Record<string, EvaluationTopicLevel>>>(
    new Map()
  );
  const cacheEventPlanIdRef = useRef<string | null>(null);

  const { students, studentIdsKey } = useStudentsFromEnrollments<any>(enrollments);

  const canUse = Boolean(idTenant && idBranch && idClass && idActivity);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!canUse) {
        if (!active) return;
        setObjectives([]);
        setLevels([]);
        setEvaluationEvent(null);
        setDraftInitialized(false);
        return;
      }

      setLoading(true);
      setDraftInitialized(false);
      try {
        const [objs, lvls, event] = await Promise.all([
          fetchActivityObjectives(idTenant, idBranch, idActivity),
          fetchEvaluationLevels(idTenant, idBranch),
          fetchEvaluationEventForDate(idTenant, idBranch, todayKey),
        ]);
        if (!active) return;

        const objList = Array.isArray(objs) ? (objs as Objective[]) : [];
        const levelsList = Array.isArray(lvls) ? lvls : [];

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
  }, [canUse, idActivity, idBranch, idTenant, todayKey]);

  const objectiveOptions = useMemo(() => {
    return objectives.map((o) => ({ id: o.id, name: o.title }));
  }, [objectives]);

  const objectiveIndexById = useMemo(() => {
    const map = new Map<string, number>();
    objectives.forEach((o, idx) => {
      const id = String(o?.id || "").trim();
      if (id) map.set(id, idx);
    });
    return map;
  }, [objectives]);

  const topicIdsByObjectiveId = useMemo(() => {
    const map = new Map<string, string[]>();
    objectives.forEach((o) => {
      const oid = String(o?.id || "").trim();
      if (!oid) return;
      const tids = (Array.isArray(o?.topics) ? o.topics : [])
        .map((t: any) => String(t?.id || "").trim())
        .filter(Boolean);
      map.set(oid, tids);
    });
    return map;
  }, [objectives]);

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

  const filteredTopics = useMemo(() => {
    if (!selectedObjectiveId) return [];
    const obj = objectives.find((o) => String(o.id) === String(selectedObjectiveId));
    return (obj?.topics || []).map((t) => ({ id: t.id, name: t.description }));
  }, [objectives, selectedObjectiveId]);

  const handlePrevTopic = () => {
    if (!canGoPrevNext) return;
    const oid = String(selectedObjectiveId || "").trim();
    if (!oid) {
      const firstObj = objectives[0];
      if (!firstObj) return;
      const nextOid = String(firstObj.id);
      const topics = topicIdsByObjectiveId.get(nextOid) || [];
      setSelectedObjectiveId(nextOid);
      setSelectedTopicId(topics[0] || null);
      return;
    }

    const topics = topicIdsByObjectiveId.get(oid) || [];
    const idx = selectedTopicId ? topics.indexOf(String(selectedTopicId)) : -1;

    if (idx > 0) {
      setSelectedTopicId(topics[idx - 1]);
      return;
    }

    const oIdx = objectiveIndexById.get(oid) ?? -1;
    if (oIdx > 0) {
      const prevObj = objectives[oIdx - 1];
      const prevOid = String(prevObj.id);
      const prevTopics = topicIdsByObjectiveId.get(prevOid) || [];
      setSelectedObjectiveId(prevOid);
      setSelectedTopicId(prevTopics[prevTopics.length - 1] || null);
    }
  };

  const handleNextTopic = () => {
    if (!canGoPrevNext) return;
    const oid = String(selectedObjectiveId || "").trim();
    if (!oid) {
      const firstObj = objectives[0];
      if (!firstObj) return;
      const nextOid = String(firstObj.id);
      const topics = topicIdsByObjectiveId.get(nextOid) || [];
      setSelectedObjectiveId(nextOid);
      setSelectedTopicId(topics[0] || null);
      return;
    }

    const topics = topicIdsByObjectiveId.get(oid) || [];
    const idx = selectedTopicId ? topics.indexOf(String(selectedTopicId)) : -1;

    if (idx >= 0 && idx < topics.length - 1) {
      setSelectedTopicId(topics[idx + 1]);
      return;
    }

    const oIdx = objectiveIndexById.get(oid) ?? -1;
    if (oIdx >= 0 && oIdx < objectives.length - 1) {
      const nextObj = objectives[oIdx + 1];
      const nextOid = String(nextObj.id);
      const nextTopics = topicIdsByObjectiveId.get(nextOid) || [];
      setSelectedObjectiveId(nextOid);
      setSelectedTopicId(nextTopics[0] || null);
    }
  };

  useEffect(() => {
    if (!selectedTopicId && filteredTopics.length > 0) {
      setSelectedTopicId(filteredTopics[0].id);
    }
  }, [filteredTopics, selectedTopicId]);

  const sortedLevels = useMemo(() => {
    return [...(Array.isArray(levels) ? levels : [])]
      .filter((l) => !Boolean((l as any)?.inactive))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [levels]);

  const defaultLevel = useMemo(() => {
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
      if (!canUse) {
        if (!active) return;
        setDraftLevelsByStudentId({});
        setDraftLoading(false);
        setDraftInitialized(true);
        return;
      }

      const studentsList = students;
      if (!studentsList.length) {
        if (!active) return;
        setDraftLevelsByStudentId({});
        setDraftLoading(false);
        setDraftInitialized(true);
        return;
      }

      // Only allow drafting when evaluation is enabled.
      if (!evaluationEvent?.id) {
        if (!active) return;
        setDraftLevelsByStudentId({});
        setDraftLoading(false);
        setDraftInitialized(true);
        return;
      }

      const eventPlanId = String(evaluationEvent.id);

      if (cacheEventPlanIdRef.current !== eventPlanId) {
        cacheEventPlanIdRef.current = eventPlanId;
        resultsCacheRef.current = new Map();
      }

      const baseByStudentId: Record<string, Record<string, EvaluationTopicLevel>> = {};

      setDraftLoading(true);
      await Promise.all(
        studentsList.map(async (s: any) => {
          const cid = String(s?.id || "").trim();
          if (!cid) return;

          const cacheKey = `${eventPlanId}:${cid}`;
          const cached = resultsCacheRef.current.get(cacheKey);
          if (cached) {
            baseByStudentId[cid] = cached;
            return;
          }

          const current = await fetchClientEvaluationForEventPlan(
            idTenant,
            idBranch,
            cid,
            eventPlanId
          );

          if (current) {
            const stored = (current?.levelsByTopicId || {}) as Record<string, EvaluationTopicLevel>;
            const byTopic = { ...(stored || {}) };
            resultsCacheRef.current.set(cacheKey, byTopic);
            baseByStudentId[cid] = byTopic;
            return;
          }

          const lastCacheKey = `${cid}:${idActivity || "all"}`;
          const cachedLast = lastEvaluationCacheRef.current.get(lastCacheKey);
          if (cachedLast) {
            const byTopic = { ...cachedLast };
            resultsCacheRef.current.set(cacheKey, byTopic);
            baseByStudentId[cid] = byTopic;
            return;
          }

          const history = await fetchClientEvaluations(idTenant, idBranch, cid, 20);
          const last = history.find((doc) => {
            if (String(doc.eventPlanId || "") === eventPlanId) return false;
            if (idActivity && String(doc.idActivity || "") !== idActivity) return false;
            return Object.keys(doc.levelsByTopicId || {}).length > 0;
          });
          const byTopic = { ...(last?.levelsByTopicId || {}) };
          lastEvaluationCacheRef.current.set(lastCacheKey, byTopic);
          resultsCacheRef.current.set(cacheKey, byTopic);
          baseByStudentId[cid] = byTopic;
        })
      );

      if (!active) return;
      setDraftLevelsByStudentId(baseByStudentId);
      setDraftLoading(false);
      setDraftInitialized(true);
    };

    void run();
    return () => {
      active = false;
    };
  }, [canUse, evaluationEvent?.id, idActivity, idBranch, idTenant, studentIdsKey, students]);

  // Ensure draft has an entry for the currently selected topic so UI never looks empty.
  useEffect(() => {
    if (!evaluationEnabled) return;
    if (!selectedTopicId) return;
    const topicId = String(selectedTopicId);
    const studentsList = students;
    if (!studentsList.length) return;

    setDraftLevelsByStudentId((prev) => {
      const next = { ...(prev || {}) };
      studentsList.forEach((s: any) => {
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

    const studentsList = students;
    if (!studentsList.length) return;

    setSaving(true);
    try {
      await Promise.all(
        studentsList.map(async (s: any) => {
          const cid = String(s?.id || "").trim();
          if (!cid) return;

          const byTopic = draftLevelsByStudentId?.[cid] || {};

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

      toast.showSuccess("Avaliações salvas com sucesso!");
    } catch (e: any) {
      toast.showError(e?.message || "Erro ao salvar avaliações");
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
            Avaliações
          </MDTypography>
          <MDTypography variant="button" color="text">
            Selecione um objetivo e um tópico para avaliar os alunos.
          </MDTypography>
          {!evaluationEnabled ? (
            <MDTypography variant="button" color="warning" sx={{ display: "block", mt: 0.5 }}>
              Avaliação bloqueada: não existe um evento &quot;avaliação&quot; ativo para a data de
              hoje.
            </MDTypography>
          ) : null}
        </MDBox>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={objectiveOptions}
              getOptionLabel={(option: any) => option.name}
              value={objectiveOptions.find((o) => o.id === selectedObjectiveId) || null}
              disabled={loading}
              onChange={(_, newValue: any) => {
                setSelectedObjectiveId(newValue ? newValue.id : null);
                setSelectedTopicId(null);
              }}
              renderInput={(params) => (
                <MDInput {...params} label="Objetivo" placeholder="Selecione" />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={filteredTopics}
              getOptionLabel={(option: any) => option.name}
              value={filteredTopics.find((t) => t.id === selectedTopicId) || null}
              disabled={!selectedObjectiveId || loading}
              onChange={(_, newValue: any) => {
                setSelectedTopicId(newValue ? newValue.id : null);
              }}
              renderInput={(params) => (
                <MDInput {...params} label="Tópico" placeholder="Selecione" />
              )}
            />

            <MDBox mt={1} display="flex" justifyContent="flex-end" gap={1} flexWrap="wrap">
              <MDButton
                variant="outlined"
                color="dark"
                size="medium"
                disabled={!canGoPrevNext || isAtFirst || loading}
                onClick={handlePrevTopic}
                sx={{ minHeight: 44 }}
              >
                <Icon sx={{ fontWeight: "bold" }}>chevron_left</Icon>
                &nbsp;Anterior
              </MDButton>
              <MDButton
                variant="outlined"
                color="dark"
                size="medium"
                disabled={!canGoPrevNext || isAtLast || loading}
                onClick={handleNextTopic}
                sx={{ minHeight: 44 }}
              >
                Próximo&nbsp;
                <Icon sx={{ fontWeight: "bold" }}>chevron_right</Icon>
              </MDButton>
            </MDBox>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <StudentsBox loadingOverlay={draftLoading}>
              {!selectedTopicId ? (
                <MDTypography variant="button" color="text">
                  Selecione um tópico para liberar a avaliação.
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
                        <Autocomplete
                          options={sortedLevels}
                          getOptionLabel={(option: any) => option.name}
                          value={
                            sortedLevels.find(
                              (l) =>
                                String(l.id) ===
                                String(
                                  draftLevelsByStudentId?.[String(student.id)]?.[
                                    String(selectedTopicId)
                                  ]?.levelId
                                )
                            ) || null
                          }
                          disabled={draftLoading || !selectedTopicId}
                          onChange={(_, newValue) => {
                            const sid = String(student.id);
                            const tid = String(selectedTopicId || "");
                            if (!tid) return;
                            setDraftLevelsByStudentId((prev) => {
                              const lvl = newValue
                                ? {
                                    levelId: String(newValue.id),
                                    levelName: String(newValue.name),
                                    levelValue: Number(newValue.value || 0),
                                  }
                                : defaultLevel;

                              const next = { ...(prev || {}) };
                              const byTopic = next[sid] ? { ...next[sid] } : {};
                              byTopic[tid] = lvl;
                              next[sid] = byTopic;
                              return next;
                            });
                          }}
                          sx={{ minWidth: 220 }}
                          renderInput={(params) => (
                            <MDInput {...params} label="Nível" placeholder="Selecione" />
                          )}
                        />
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
            disabled={!selectedTopicId || saving || !evaluationEnabled}
            onClick={handleSave}
          >
            {saving ? "Salvando..." : "Salvar"}
          </MDButton>
        </MDBox>
      </MDBox>
    </MDBox>
  );
}

export default EvaluationsTab;
