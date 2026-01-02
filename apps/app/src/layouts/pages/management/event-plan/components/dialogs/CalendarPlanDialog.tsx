import { useMemo, useState } from "react";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import { FormField } from "components";

import { HARD_CODED_EVENT_TYPES, normalizeEventTypeKey } from "constants/eventPlanTypes";

import type { EventPlan, EventPlanPayload, EventType, EventTypePayload } from "hooks/eventPlan";

type Props = {
  open: boolean;
  loading?: boolean;
  eventTypes: EventType[];
  selectedDateIso?: string | null;
  selectedPlan?: EventPlan | null;
  onClose: () => void;
  onCreateType: (payload: EventTypePayload) => Promise<string>;
  onCreatePlan: (payload: EventPlanPayload) => Promise<string>;
  onDeletePlan: (eventPlanId: string) => Promise<void>;
};

const CLASSNAME_OPTIONS: { value: string; label: string }[] = [
  { value: "info", label: "Azul" },
  { value: "warning", label: "Amarelo" },
  { value: "success", label: "Verde" },
  { value: "error", label: "Vermelho" },
  { value: "dark", label: "Preto" },
];

function CalendarPlanDialog({
  open,
  loading = false,
  eventTypes,
  selectedDateIso,
  selectedPlan,
  onClose,
  onCreateType,
  onCreatePlan,
  onDeletePlan,
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

  const [typeMode, setTypeMode] = useState<"existing" | "new">("existing");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [newTypeName, setNewTypeName] = useState<string>("");
  const [newTypeClassName, setNewTypeClassName] = useState<string>("info");

  const [submitting, setSubmitting] = useState(false);

  const dateLabel = useMemo(() => {
    const raw = selectedPlan?.startAt || selectedDateIso;
    if (!raw) return "";
    try {
      const dateKey = String(raw).slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return new Date(`${dateKey}T00:00:00`).toLocaleDateString("pt-BR");
      }
      return new Date(raw).toLocaleDateString("pt-BR");
    } catch {
      return String(raw);
    }
  }, [selectedDateIso, selectedPlan?.startAt]);

  const handleClose = () => {
    if (submitting) return;
    setTypeMode("existing");
    setSelectedTypeId("");
    setNewTypeName("");
    setNewTypeClassName("info");
    onClose();
  };

  const handleSave = async () => {
    if (submitting) return;

    const startAt = String(selectedPlan?.startAt || selectedDateIso || "").slice(0, 10);
    if (!startAt) return;

    setSubmitting(true);
    try {
      let eventTypeId = selectedPlan?.eventTypeId || "";
      let eventTypeName = selectedPlan?.eventTypeName || "";
      let className = selectedPlan?.className || "info";

      if (selectedPlan) {
        eventTypeId = selectedPlan.eventTypeId;
        eventTypeName = selectedPlan.eventTypeName;
        className = selectedPlan.className;
      } else if (typeMode === "new") {
        const newId = await onCreateType({
          name: newTypeName,
          className: newTypeClassName,
          inactive: false,
        });
        eventTypeId = newId;
        eventTypeName = String(newTypeName || "").trim();
        className = newTypeClassName;
      } else {
        const found = sortedTypes.find((t) => t.id === selectedTypeId);
        if (!found) return;
        eventTypeId = found.id;
        eventTypeName = found.name;
        className = found.className;
      }

      await onCreatePlan({
        eventTypeId,
        eventTypeName,
        className,
        startAt,
        allDay: true,
      });

      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan?.id || submitting) return;
    setSubmitting(true);
    try {
      await onDeletePlan(selectedPlan.id);
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  const disableSave =
    submitting ||
    loading ||
    Boolean(selectedPlan) ||
    !selectedDateIso ||
    (typeMode === "existing" ? !selectedTypeId : !String(newTypeName || "").trim());

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{selectedPlan ? "Detalhes do evento" : "Programar evento"}</DialogTitle>

      <DialogContent>
        <MDBox pt={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormField label="Data" name="date" value={dateLabel} disabled />
            </Grid>

            {selectedPlan ? (
              <>
                <Grid item xs={12} md={6}>
                  <FormField label="Tipo" name="type" value={selectedPlan.eventTypeName} disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormField label="Cor" name="className" value={selectedPlan.className} disabled />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12}>
                  <MDBox display="flex" gap={1} alignItems="center">
                    <MDButton
                      variant={typeMode === "existing" ? "contained" : "outlined"}
                      color="info"
                      size="small"
                      onClick={() => setTypeMode("existing")}
                      disabled={submitting || loading}
                    >
                      Selecionar tipo
                    </MDButton>
                    <MDButton
                      variant={typeMode === "new" ? "contained" : "outlined"}
                      color="info"
                      size="small"
                      onClick={() => setTypeMode("new")}
                      disabled={submitting || loading}
                    >
                      Criar novo tipo
                    </MDButton>
                  </MDBox>
                </Grid>

                {typeMode === "existing" ? (
                  <Grid item xs={12}>
                    <FormField
                      label="Tipo de evento"
                      select
                      value={selectedTypeId}
                      onChange={(e: any) => setSelectedTypeId(e.target.value)}
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
                        Nenhum tipo cadastrado ainda.
                      </MDTypography>
                    ) : null}
                  </Grid>
                ) : (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormField
                        label="Nome do tipo"
                        name="newTypeName"
                        value={newTypeName}
                        onChange={(e: any) => setNewTypeName(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormField
                        label="Cor"
                        select
                        value={newTypeClassName}
                        onChange={(e: any) => setNewTypeClassName(e.target.value)}
                      >
                        {CLASSNAME_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </FormField>
                    </Grid>
                  </>
                )}
              </>
            )}
          </Grid>
        </MDBox>
      </DialogContent>

      <DialogActions>
        <MDButton
          variant="outlined"
          color="secondary"
          onClick={handleClose}
          disabled={submitting || loading}
        >
          Fechar
        </MDButton>

        {selectedPlan ? (
          <MDButton
            variant="outlined"
            color="error"
            onClick={handleDelete}
            disabled={submitting || loading}
          >
            Excluir
          </MDButton>
        ) : (
          <MDButton variant="gradient" color="info" onClick={handleSave} disabled={disableSave}>
            Salvar
          </MDButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default CalendarPlanDialog;
