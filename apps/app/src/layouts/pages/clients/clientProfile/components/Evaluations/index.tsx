import { Fragment, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";

import EvaluationsModal from "layouts/pages/clients/clientProfile/components/Modals/EvaluationsModal";

import { useAppSelector } from "../../../../../../redux/hooks";

import { fetchActivityObjectives, type Objective } from "hooks/activities";
import { fetchEvaluationLevels } from "hooks/evaluationLevels";
import { fetchClientEvaluations, type EvaluationDoc } from "hooks/evaluations";

type TopicProgress = {
  id: string;
  description: string;
  levelValue: number;
  levelName: string;
};

type ObjectiveProgress = {
  id: string;
  title: string;
  topics: TopicProgress[];
  percent: number;
};

function Evaluations(): JSX.Element {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { id: clientId } = useParams();
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const openDetails = () => setDetailsOpen(true);
  const closeDetails = () => setDetailsOpen(false);

  const [loading, setLoading] = useState(false);
  const [latestEvaluation, setLatestEvaluation] = useState<EvaluationDoc | null>(null);
  const [activityObjectives, setActivityObjectives] = useState<Objective[]>([]);
  const [maxLevelValue, setMaxLevelValue] = useState(0);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!idTenant || !idBranch || !clientId) {
        if (!active) return;
        setLatestEvaluation(null);
        setActivityObjectives([]);
        setMaxLevelValue(0);
        return;
      }

      setLoading(true);
      try {
        const [history, levels] = await Promise.all([
          fetchClientEvaluations(idTenant, idBranch, String(clientId), 1),
          fetchEvaluationLevels(idTenant, idBranch),
        ]);
        const latest = Array.isArray(history) ? history[0] || null : null;

        const maxValue = Math.max(
          0,
          ...(Array.isArray(levels) ? levels : []).map((l: any) => Number(l?.value || 0))
        );

        if (!active) return;
        setLatestEvaluation(latest);
        setMaxLevelValue(maxValue);

        const idActivity = String(latest?.idActivity || "").trim();
        if (!idActivity) {
          setActivityObjectives([]);
          return;
        }

        const objectives = await fetchActivityObjectives(idTenant, idBranch, idActivity);
        if (!active) return;
        setActivityObjectives(Array.isArray(objectives) ? (objectives as Objective[]) : []);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [clientId, idBranch, idTenant]);

  const objectives = useMemo<ObjectiveProgress[]>(() => {
    const byTopicId = (latestEvaluation?.levelsByTopicId || {}) as any;
    const max = Math.max(0, Number(maxLevelValue || 0));

    return (Array.isArray(activityObjectives) ? activityObjectives : [])
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((obj, objIndex) => {
        const topics = (Array.isArray(obj.topics) ? obj.topics : [])
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((t) => {
            const entry = byTopicId?.[String(t.id)] || null;
            const levelValue = Number(entry?.levelValue || 0);
            const levelName = String(entry?.levelName || "").trim();
            return {
              id: String(t.id),
              description: String(t.description || ""),
              levelValue,
              levelName,
            };
          });

        const sum = topics.reduce((acc, t) => acc + Number(t.levelValue || 0), 0);
        const denom = max > 0 ? topics.length * max : 0;
        const percent = denom > 0 ? Math.round((sum / denom) * 100) : 0;

        return {
          id: String(obj.id),
          title: String(obj.title || ""),
          topics,
          percent,
        };
      });
  }, [activityObjectives, latestEvaluation?.levelsByTopicId, maxLevelValue]);

  const currentLevelLabel = useMemo(() => {
    const allTopics: TopicProgress[] = objectives.flatMap((o) => o.topics);
    if (!allTopics.length) return "—";
    const sum = allTopics.reduce((acc, t) => acc + Number(t.levelValue || 0), 0);
    const avg = sum / allTopics.length;
    if (!Number.isFinite(avg)) return "—";
    return avg.toFixed(1);
  }, [objectives]);

  return (
    <>
      <Card
        id="evaluations"
        sx={{ display: "flex", flexDirection: "column", maxHeight: 420, overflow: "hidden", mb: 3 }}
      >
        <MDBox p={3} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h5">Avaliações</MDTypography>
          <MDButton variant="outlined" color="info" size="small" onClick={openDetails}>
            Ver histórico
          </MDButton>
        </MDBox>

        <MDBox sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 3 }}>
          <MDBox
            px={3}
            pb={2}
            pt={0}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <MDBox display="flex" alignItems="center" gap={1}>
              <Icon fontSize="small">school</Icon>
              <MDTypography variant="button" fontWeight="medium">
                Nível atual (média): {currentLevelLabel}
              </MDTypography>
            </MDBox>

            <MDBox display="flex" justifyContent="flex-end" width="100%">
              <MDBadge
                badgeContent={latestEvaluation ? "Última avaliação" : "Sem avaliações"}
                color={latestEvaluation ? "info" : "secondary"}
                variant="contained"
                container
                size="xs"
              />
            </MDBox>
          </MDBox>

          <Divider />

          <MDBox p={3} pt={2}>
            {loading ? (
              <MDTypography variant="button" color="text" fontWeight="regular">
                Carregando...
              </MDTypography>
            ) : objectives.length === 0 ? (
              <MDTypography variant="button" color="text" fontWeight="regular">
                Nenhuma avaliação encontrada.
              </MDTypography>
            ) : (
              objectives.map((obj, objIndex) => (
                <Fragment key={obj.id}>
                  <MDBox mb={1.5}>
                    <MDBox
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      gap={1}
                    >
                      <MDTypography variant="button" fontWeight="medium">
                        {objIndex + 1}. {obj.title}
                      </MDTypography>
                      <MDBox display="flex" justifyContent="flex-end" width="100%">
                        <MDBadge
                          badgeContent={`${obj.percent}%`}
                          color={
                            obj.percent >= 80 ? "success" : obj.percent >= 50 ? "info" : "secondary"
                          }
                          variant="contained"
                          container
                          size="xs"
                        />
                      </MDBox>
                    </MDBox>
                  </MDBox>

                  {obj.topics.map((topic, topicIndex) => {
                    return (
                      <Fragment key={topic.id}>
                        <MDBox
                          display="flex"
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          flexDirection={{ xs: "column", sm: "row" }}
                          gap={1}
                          py={1}
                        >
                          <MDTypography
                            variant="caption"
                            color="text"
                            sx={{ maxWidth: 520, pl: 2 }}
                          >
                            {topicIndex + 1}. {topic.description}
                          </MDTypography>

                          <MDBox
                            display="flex"
                            flexDirection="column"
                            alignItems="flex-end"
                            gap={0.5}
                          >
                            <MDBadge
                              badgeContent={`Atual: ${topic.levelValue}`}
                              color={
                                topic.levelValue >= maxLevelValue
                                  ? "success"
                                  : topic.levelValue > 0
                                  ? "info"
                                  : "secondary"
                              }
                              variant="contained"
                              container
                              size="xs"
                            />
                            <MDBadge
                              badgeContent={topic.levelName ? topic.levelName : "—"}
                              color={topic.levelName ? "dark" : "secondary"}
                              variant="contained"
                              container
                              size="xs"
                            />
                          </MDBox>
                        </MDBox>

                        {topicIndex < obj.topics.length - 1 ? <Divider /> : null}
                      </Fragment>
                    );
                  })}

                  {objIndex < objectives.length - 1 ? <Divider sx={{ my: 2 }} /> : null}
                </Fragment>
              ))
            )}
          </MDBox>
        </MDBox>
      </Card>

      <EvaluationsModal open={detailsOpen} onClose={closeDetails} />
    </>
  );
}

export default Evaluations;
