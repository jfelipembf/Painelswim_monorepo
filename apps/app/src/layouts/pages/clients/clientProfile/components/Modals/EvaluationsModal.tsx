import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import RemoveIcon from "@mui/icons-material/Remove";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import { useAppSelector } from "../../../../../../redux/hooks";
import { fetchActivityObjectives, type Objective } from "hooks/activities";
import { fetchClientEvaluations, type EvaluationDoc } from "hooks/evaluations";

type Props = {
  open: boolean;
  onClose: () => void;
};

const MAX_COLS = 5;

type Topic = {
  id: string | number;
  description?: string;
  order?: number;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toMillis(input: unknown): number {
  if (!input) return 0;
  const asAny = input as any;

  if (typeof asAny?.toDate === "function") {
    const d = asAny.toDate();
    const ms = d instanceof Date ? d.getTime() : 0;
    return Number.isFinite(ms) ? ms : 0;
  }

  if (typeof asAny?.seconds === "number") {
    const ms = asAny.seconds * 1000;
    return Number.isFinite(ms) ? ms : 0;
  }

  if (typeof input === "string" && input.includes("Timestamp")) {
    const match = input.match(/Timestamp\(seconds=(\d+),/);
    if (match?.[1]) {
      const seconds = Number(match[1]);
      const ms = seconds * 1000;
      return Number.isFinite(ms) ? ms : 0;
    }
  }

  if (typeof input === "string") {
    const ms = new Date(input).getTime();
    return Number.isFinite(ms) ? ms : 0;
  }

  if (input instanceof Date) {
    const ms = input.getTime();
    return Number.isFinite(ms) ? ms : 0;
  }

  return 0;
}

function formatDate(input: unknown): string {
  const ms = toMillis(input);
  if (!ms) return "--";
  const d = new Date(ms);
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
}

function truncate(text: string, max = 35): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

type ColumnItem = {
  id: string;
  date: string;
  evaluation: EvaluationDoc | null;
  hasData: boolean;
};

function getTopicValue(evaluation: EvaluationDoc, topicId: string) {
  const entry = (evaluation?.levelsByTopicId || ({} as any))?.[String(topicId)] as any;
  const value = Number(entry?.levelValue ?? 0);
  const name = String(entry?.levelName ?? "").trim();
  return { value, name };
}

function EvaluationsModal({ open, onClose }: Props): JSX.Element {
  const { id: clientId } = useParams();
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [objectives, setObjectives] = useState([]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!open) return;

      if (!idTenant || !idBranch || !clientId) {
        if (!active) return;
        setHistory([]);
        setObjectives([]);
        return;
      }

      setLoading(true);

      try {
        const list = await fetchClientEvaluations(idTenant, idBranch, String(clientId), 50);
        const normalized = Array.isArray(list) ? list : [];

        const orderedDesc = [...normalized].sort((a, b) => {
          const ams = toMillis(a?.createdAt ?? a?.startAt);
          const bms = toMillis(b?.createdAt ?? b?.startAt);
          return bms - ams;
        });

        // Pega todas as avaliações em ordem decrescente (mais recente primeiro)
        const allRecentDesc = orderedDesc;

        const activityId = String(orderedDesc?.[0]?.idActivity || "").trim();
        const objs = activityId
          ? await fetchActivityObjectives(idTenant, idBranch, activityId)
          : [];

        if (!active) return;
        setHistory(allRecentDesc);
        setObjectives(Array.isArray(objs) ? (objs as Objective[]) : []);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [clientId, idBranch, idTenant, open]);

  const columns = useMemo(() => {
    const evaluations = Array.isArray(history) ? history : [];
    const cols: ColumnItem[] = [];

    // Mostra todas as avaliações em ordem decrescente (mais recente à direita)
    evaluations.forEach((e, i) => {
      if (e) {
        cols.push({
          id: String(e.id || `eval_${i}`),
          date: formatDate(e.createdAt ?? e.startAt),
          evaluation: e,
          hasData: true,
        });
      }
    });

    return cols;
  }, [history]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "90vh",
          width: "95vw",
          maxWidth: "1400px",
        },
      }}
    >
      <DialogTitle>
        <MDBox display="flex" justifyContent="space-between" alignItems="center">
          <MDBox>
            <MDTypography variant="h5">Histórico de Avaliações</MDTypography>
            <MDTypography variant="body2" color="text" sx={{ mt: 0.5 }}>
              Acompanhe a evolução dos objetivos e tópicos ao longo do tempo
            </MDTypography>
          </MDBox>
          <MDButton onClick={onClose} variant="outlined" color="secondary" size="small">
            Fechar
          </MDButton>
        </MDBox>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <MDBox p={3} textAlign="center">
            <MDTypography variant="body2">Carregando...</MDTypography>
          </MDBox>
        ) : objectives.length === 0 ? (
          <MDBox p={3} textAlign="center">
            <MDTypography variant="body2">Nenhuma avaliação encontrada.</MDTypography>
          </MDBox>
        ) : (
          <MDBox sx={{ overflowX: "auto", pb: 2, minWidth: "fit-content" }}>
            {/* Objetivos e Tópicos */}
            {(Array.isArray(objectives) ? objectives : [])
              .sort((a: Objective, b: Objective) => (a.order ?? 0) - (b.order ?? 0))
              .map((objective, objIndex) => (
                <MDBox key={objective.id} mb={3}>
                  <Card
                    sx={{
                      backgroundColor: (theme) => theme.palette.grey[50],
                      border: "1px solid",
                      borderColor: (theme) => theme.palette.divider,
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <MDTypography variant="h6" fontWeight="bold" mb={2}>
                        {objIndex + 1}. {objective.title}
                      </MDTypography>

                      {/* Header com as datas - alinhado com os valores */}
                      <MDBox display="flex" gap={2} mb={2} sx={{ minWidth: "fit-content" }}>
                        <MDBox
                          sx={{
                            width: 280,
                            flexShrink: 0,
                          }}
                        />
                        {columns.map((col, idx) => (
                          <MDBox
                            key={col.id}
                            sx={{
                              width: 180,
                              flexShrink: 0,
                            }}
                          >
                            <Card
                              sx={{
                                backgroundColor: (theme) =>
                                  col.hasData
                                    ? theme.palette.secondary.main
                                    : theme.palette.grey[100],
                                color: col.hasData ? "white" : "text.secondary",
                              }}
                            >
                              <CardContent sx={{ py: 1, px: 2, "&:last-child": { pb: 1 } }}>
                                <MDTypography
                                  variant="caption"
                                  fontWeight="bold"
                                  sx={{ color: "inherit", textAlign: "center", display: "block" }}
                                >
                                  {col.date}
                                </MDTypography>
                                {idx > 0 && (
                                  <MDTypography
                                    variant="caption"
                                    sx={{
                                      color: "secondary",
                                      opacity: 0.8,
                                      textAlign: "center",
                                      display: "block",
                                      fontSize: "0.65rem",
                                    }}
                                  ></MDTypography>
                                )}
                              </CardContent>
                            </Card>
                          </MDBox>
                        ))}
                      </MDBox>

                      {(Array.isArray(objective.topics) ? objective.topics : [])
                        .sort((a: Topic, b: Topic) => (a.order ?? 0) - (b.order ?? 0))
                        .map((topic: Topic, topicIdx: number) => (
                          <MDBox key={topic.id}>
                            {topicIdx > 0 && <Divider sx={{ my: 2 }} />}

                            <MDBox
                              display="flex"
                              gap={2}
                              alignItems="stretch"
                              sx={{ minWidth: "fit-content" }}
                            >
                              {/* Nome do Tópico */}
                              <MDBox
                                sx={{
                                  width: 280,
                                  flexShrink: 0,
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <Tooltip title={topic.description || ""} arrow placement="top">
                                  <MDTypography
                                    variant="body2"
                                    color="text"
                                    sx={{
                                      cursor: "help",
                                      maxWidth: 250,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {topicIdx + 1}. {truncate(topic.description || "", 35)}
                                  </MDTypography>
                                </Tooltip>
                              </MDBox>

                              {/* Valores das Avaliações */}
                              {columns.map((col, idx) => {
                                const showData = col.hasData && col.evaluation;

                                if (!showData) {
                                  return (
                                    <MDBox
                                      key={col.id}
                                      sx={{
                                        width: 180,
                                        flexShrink: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <MDTypography variant="body2" color="text.secondary">
                                        --
                                      </MDTypography>
                                    </MDBox>
                                  );
                                }

                                const current = getTopicValue(col.evaluation!, String(topic.id));
                                const prev =
                                  idx > 0 && columns[idx - 1].hasData && columns[idx - 1].evaluation
                                    ? getTopicValue(columns[idx - 1].evaluation!, String(topic.id))
                                    : null;

                                const delta = prev ? current.value - prev.value : null;

                                return (
                                  <MDBox
                                    key={col.id}
                                    sx={{
                                      width: 180,
                                      flexShrink: 0,
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      py: 1.5,
                                      px: 2,
                                      textAlign: "center",
                                    }}
                                  >
                                    {/* Valor */}
                                    <MDTypography variant="h5" fontWeight="bold" color="dark">
                                      {current.value}
                                    </MDTypography>

                                    {/* Nome do Nível */}
                                    <MDTypography
                                      variant="caption"
                                      color="text"
                                      sx={{ display: "block", mt: 0.5, mb: 1 }}
                                    >
                                      {current.name || "—"}
                                    </MDTypography>

                                    {/* Delta */}
                                    {idx > 0 && delta !== null && (
                                      <Chip
                                        size="small"
                                        icon={
                                          delta > 0 ? (
                                            <TrendingUpIcon sx={{ fontSize: 14 }} />
                                          ) : delta < 0 ? (
                                            <TrendingDownIcon sx={{ fontSize: 14 }} />
                                          ) : (
                                            <RemoveIcon sx={{ fontSize: 14 }} />
                                          )
                                        }
                                        label={
                                          delta > 0 ? `+${delta}` : delta < 0 ? String(delta) : "0"
                                        }
                                        color={
                                          delta > 0 ? "success" : delta < 0 ? "error" : "default"
                                        }
                                        sx={{
                                          fontWeight: 600,
                                          fontSize: "0.7rem",
                                        }}
                                      />
                                    )}

                                    {idx > 0 && delta === null && (
                                      <MDTypography variant="caption" color="text.secondary">
                                        —
                                      </MDTypography>
                                    )}
                                  </MDBox>
                                );
                              })}
                            </MDBox>
                          </MDBox>
                        ))}
                    </CardContent>
                  </Card>
                </MDBox>
              ))}
          </MDBox>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EvaluationsModal;
