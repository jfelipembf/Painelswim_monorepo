import { useEffect, useMemo, useState } from "react";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import { FormField } from "components";

import { HARD_CODED_EVENT_TYPES, normalizeEventTypeKey } from "constants/eventPlanTypes";

import type { EventPlan, EventPlanPayload, EventType } from "hooks/eventPlan";

type Props = {
  loading?: boolean;
  eventTypes: EventType[];
  selectedPlan?: EventPlan | null;
  selectedDateKey?: string | null;
  onCreatePlan: (payload: EventPlanPayload) => Promise<string>;
  onUpdatePlan: (eventPlanId: string, payload: Partial<EventPlanPayload>) => Promise<void>;
  onDeletePlan: (eventPlanId: string) => Promise<void>;
  onClearSelection: () => void;
  onManageTypes: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
};

function EventPlanSidePanel({
  loading = false,
  eventTypes,
  selectedPlan,
  selectedDateKey,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
  onClearSelection,
  onManageTypes,
  onSuccess,
  onError,
}: Props): JSX.Element {
  const hardcodedKeys = useMemo<Set<string>>(
    () => new Set<string>(HARD_CODED_EVENT_TYPES.map((t) => t.key)),
    []
  );

  const sortedTypes = useMemo(
    () =>
      eventTypes
        .filter((t) => !t.inactive)
        .slice()
        .sort((a, b) => {
          const aKey = normalizeEventTypeKey(String(a?.name || ""));
          const bKey = normalizeEventTypeKey(String(b?.name || ""));
          const aHard = hardcodedKeys.has(aKey);
          const bHard = hardcodedKeys.has(bKey);
          if (aHard !== bHard) return aHard ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
    [eventTypes, hardcodedKeys]
  );

  const [submitting, setSubmitting] = useState(false);
  const [eventTypeId, setEventTypeId] = useState<string>("");

  const [startAt, setStartAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");

  useEffect(() => {
    if (selectedPlan) {
      setEventTypeId(selectedPlan.eventTypeId);
      setStartAt(String(selectedPlan.startAt || "").slice(0, 10));
      setEndAt(String(selectedPlan.endAt || "").slice(0, 10));
      return;
    }

    if (selectedDateKey) {
      setEventTypeId("");
      setStartAt(String(selectedDateKey).slice(0, 10));
      setEndAt("");
      return;
    }

    setEventTypeId("");
    setStartAt("");
    setEndAt("");
  }, [selectedPlan, selectedDateKey, sortedTypes.length]);

  const isEditing = Boolean(selectedPlan?.id);

  const disableSave = submitting || loading || !startAt || !eventTypeId;

  const handleSave = async () => {
    if (disableSave) return;

    setSubmitting(true);
    try {
      let resolvedTypeId = eventTypeId;
      let resolvedTypeName = "";
      let resolvedClassName = "info";

      const found = sortedTypes.find((t) => t.id === eventTypeId);
      if (!found) return;
      resolvedTypeName = found.name;
      resolvedClassName = found.className;

      const normalizedStart = String(startAt || "").slice(0, 10);
      const normalizedEnd = endAt ? String(endAt).slice(0, 10) : undefined;

      if (normalizedEnd && normalizedEnd < normalizedStart) {
        throw new Error("Data fim não pode ser menor que data início.");
      }

      if (isEditing && selectedPlan?.id) {
        await onUpdatePlan(selectedPlan.id, {
          eventTypeId: resolvedTypeId,
          eventTypeName: resolvedTypeName,
          className: resolvedClassName,
          startAt: normalizedStart,
          endAt: normalizedEnd,
          allDay: true,
        });
        onSuccess?.("Evento atualizado com sucesso.");
        return;
      }

      await onCreatePlan({
        eventTypeId: resolvedTypeId,
        eventTypeName: resolvedTypeName,
        className: resolvedClassName,
        startAt: normalizedStart,
        endAt: normalizedEnd,
        allDay: true,
      });

      onClearSelection();
      onSuccess?.("Evento criado com sucesso.");
    } catch (error: any) {
      onError?.(error?.message || "Não foi possível salvar o evento.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan?.id || submitting || loading) return;
    setSubmitting(true);
    try {
      await onDeletePlan(selectedPlan.id);
      onClearSelection();
      onSuccess?.("Evento excluído com sucesso.");
    } catch (error: any) {
      onError?.(error?.message || "Não foi possível excluir o evento.");
    } finally {
      setSubmitting(false);
    }
  };

  const title = isEditing ? "Editar evento" : "Novo evento";
  const subtitle = isEditing
    ? `${String(selectedPlan?.startAt || "").slice(0, 10)}${
        selectedPlan?.endAt ? ` → ${String(selectedPlan.endAt).slice(0, 10)}` : ""
      }`
    : startAt
    ? startAt
    : "Selecione um dia no calendário";

  return (
    <Card sx={{ height: "100%" }}>
      <MDBox pt={2} px={2} display="flex" alignItems="center" gap={1}>
        <MDTypography variant="h6" fontWeight="medium">
          {title}
        </MDTypography>

        <MDBox ml="auto" display="flex" gap={1}>
          <MDButton
            size="small"
            variant="outlined"
            color="secondary"
            disabled={submitting || loading}
            onClick={onClearSelection}
          >
            Novo
          </MDButton>
          {isEditing ? (
            <MDButton
              size="small"
              variant="outlined"
              color="error"
              disabled={submitting || loading}
              onClick={handleDelete}
            >
              Excluir
            </MDButton>
          ) : null}
        </MDBox>
      </MDBox>

      <MDBox px={2} pb={2} pt={0.5}>
        <MDTypography variant="button" color="text">
          {subtitle}
        </MDTypography>

        <MDBox mt={2}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                <MDTypography variant="button" color="text">
                  Tipo
                </MDTypography>
                <MDButton
                  size="small"
                  variant="outlined"
                  color="info"
                  disabled={submitting || loading}
                  onClick={onManageTypes}
                >
                  Gerenciar tipos
                </MDButton>
              </MDBox>
            </Grid>

            <Grid item xs={12}>
              <FormField
                label="Tipo de evento"
                select
                value={eventTypeId}
                onChange={(e: any) => setEventTypeId(e.target.value)}
                disabled={submitting || loading || !sortedTypes.length}
              >
                <MenuItem value="">Selecione...</MenuItem>
                {sortedTypes.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </FormField>

              {!sortedTypes.length ? (
                <MDTypography variant="caption" color="text" sx={{ mt: 1, display: "block" }}>
                  Nenhum tipo cadastrado ainda. Clique em Gerenciar tipos para criar.
                </MDTypography>
              ) : null}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormField
                label="Início"
                type="date"
                value={startAt}
                onChange={(e: any) => setStartAt(String(e.target.value || "").slice(0, 10))}
                disabled={submitting || loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormField
                label="Fim"
                type="date"
                value={endAt}
                onChange={(e: any) => setEndAt(String(e.target.value || "").slice(0, 10))}
                disabled={submitting || loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <MDButton
                fullWidth
                variant="gradient"
                color="info"
                onClick={handleSave}
                disabled={disableSave}
              >
                Salvar
              </MDButton>
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </Card>
  );
}

export default EventPlanSidePanel;
