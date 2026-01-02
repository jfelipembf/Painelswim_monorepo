import { useEffect, useMemo, useState } from "react";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import { HARD_CODED_EVENT_TYPES, normalizeEventTypeKey } from "constants/eventPlanTypes";

import type { EventType, EventTypePayload } from "hooks/eventPlan";
import { FormField } from "components";

type Props = {
  open: boolean;
  loading?: boolean;
  eventTypes: EventType[];
  onClose: () => void;
  onCreateType: (payload: EventTypePayload) => Promise<string>;
  onUpdateType: (eventTypeId: string, payload: Partial<EventTypePayload>) => Promise<void>;
  onDeleteType: (eventTypeId: string) => Promise<void>;
};

const CLASSNAME_OPTIONS: { value: string; label: string }[] = [
  { value: "info", label: "Azul" },
  { value: "warning", label: "Amarelo" },
  { value: "success", label: "Verde" },
  { value: "error", label: "Vermelho" },
  { value: "dark", label: "Preto" },
];

function EventTypesDialog({
  open,
  loading = false,
  eventTypes,
  onClose,
  onCreateType,
  onUpdateType,
  onDeleteType,
}: Props): JSX.Element {
  const hardcodedKeys = useMemo<Set<string>>(
    () => new Set<string>(HARD_CODED_EVENT_TYPES.map((t) => t.key)),
    []
  );

  const sortedTypes = useMemo(
    () => eventTypes.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [eventTypes]
  );

  const [submitting, setSubmitting] = useState(false);

  const [newName, setNewName] = useState("");
  const [newClassName, setNewClassName] = useState<string>("info");

  const [drafts, setDrafts] = useState<
    Record<string, { name: string; className: string; inactive: boolean }>
  >({});

  useEffect(() => {
    if (!open) return;
    setDrafts(
      Object.fromEntries(
        sortedTypes.map((t) => [
          t.id,
          { name: t.name, className: t.className, inactive: Boolean(t.inactive) },
        ])
      )
    );
  }, [open, sortedTypes]);

  const canCreate = Boolean(String(newName || "").trim()) && !submitting && !loading;

  const handleCreate = async () => {
    if (!canCreate) return;
    setSubmitting(true);
    try {
      await onCreateType({
        name: String(newName || "").trim(),
        className: newClassName,
        inactive: false,
      });
      setNewName("");
      setNewClassName("info");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async (id: string) => {
    const d = drafts[id];
    if (!d || submitting || loading) return;

    const name = String(d.name || "").trim();
    if (!name) return;

    setSubmitting(true);
    try {
      await onUpdateType(id, {
        name,
        className: d.className,
        inactive: Boolean(d.inactive),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (submitting || loading) return;
    const ok = window.confirm(
      "Excluir este tipo de evento?\n\nAtenção: eventos existentes podem ficar sem referência."
    );
    if (!ok) return;

    setSubmitting(true);
    try {
      await onDeleteType(id);
    } finally {
      setSubmitting(false);
    }
  };

  const disableAll = submitting || loading;

  return (
    <Dialog open={open} onClose={disableAll ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Tipos de evento</DialogTitle>

      <DialogContent>
        <MDBox pt={1}>
          <MDTypography variant="button" color="text">
            Criar novo tipo
          </MDTypography>

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <FormField
                label="Nome"
                value={newName}
                onChange={(e: any) => setNewName(e.target.value)}
                disabled={disableAll}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormField
                label="Cor"
                select
                value={newClassName}
                onChange={(e: any) => setNewClassName(e.target.value)}
                disabled={disableAll}
              >
                {CLASSNAME_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </FormField>
            </Grid>
            <Grid item xs={12} md={2}>
              <MDBox height="100%" display="flex" alignItems="center">
                <MDButton
                  fullWidth
                  variant="gradient"
                  color="info"
                  onClick={handleCreate}
                  disabled={!canCreate}
                >
                  Criar
                </MDButton>
              </MDBox>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <MDTypography variant="button" color="text">
            Lista de tipos
          </MDTypography>

          {!sortedTypes.length ? (
            <MDBox mt={1}>
              <MDTypography variant="caption" color="text">
                Nenhum tipo cadastrado.
              </MDTypography>
            </MDBox>
          ) : null}

          <MDBox mt={1}>
            {sortedTypes.map((t) => {
              const d = drafts[t.id] || {
                name: t.name,
                className: t.className,
                inactive: Boolean(t.inactive),
              };

              const key = normalizeEventTypeKey(String(t.name || ""));
              const isHardcoded = hardcodedKeys.has(key);
              const disabledRow = disableAll || isHardcoded;

              return (
                <MDBox
                  key={t.id}
                  mb={2}
                  p={1.5}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                      <FormField
                        label="Nome"
                        value={d.name}
                        onChange={(e: any) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [t.id]: { ...d, name: e.target.value },
                          }))
                        }
                        disabled={disabledRow}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormField
                        label="Cor"
                        select
                        value={d.className}
                        onChange={(e: any) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [t.id]: { ...d, className: e.target.value },
                          }))
                        }
                        disabled={disabledRow}
                      >
                        {CLASSNAME_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </FormField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <MDBox display="flex" alignItems="center" gap={1}>
                        <Switch
                          checked={Boolean(d.inactive)}
                          onChange={(e: any) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [t.id]: { ...d, inactive: Boolean(e.target.checked) },
                            }))
                          }
                          disabled={disabledRow}
                        />
                        <MDTypography variant="caption" color="text">
                          Inativo
                        </MDTypography>
                      </MDBox>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <MDBox display="flex" alignItems="center" gap={1}>
                        <Tooltip
                          title={
                            isHardcoded
                              ? "Este tipo é fixo do sistema e não pode ser alterado."
                              : "Salvar alterações"
                          }
                        >
                          <span>
                            <IconButton
                              color="info"
                              size="small"
                              onClick={() => handleSave(t.id)}
                              disabled={disabledRow || !String(d.name || "").trim()}
                              sx={(theme) => ({
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                border: `1px solid ${theme.palette.info.main}`,
                                color: theme.palette.info.main,
                                backgroundColor: alpha(theme.palette.info.main, 0.12),
                                transition: "all 150ms ease",
                                "&:hover": {
                                  backgroundColor: alpha(theme.palette.info.main, 0.2),
                                  transform: "scale(1.03)",
                                },
                                "&.Mui-disabled": {
                                  borderColor: theme.palette.action.disabledBackground,
                                  color: theme.palette.text.disabled,
                                  backgroundColor: alpha(
                                    theme.palette.action.disabledBackground,
                                    0.3
                                  ),
                                },
                              })}
                            >
                              <Icon fontSize="small">check</Icon>
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip
                          title={
                            isHardcoded
                              ? "Este tipo é fixo do sistema e não pode ser excluído."
                              : "Excluir tipo"
                          }
                        >
                          <span>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDelete(t.id)}
                              disabled={disabledRow}
                              sx={(theme) => ({
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                border: `1px solid ${theme.palette.error.main}`,
                                color: theme.palette.error.main,
                                backgroundColor: alpha(theme.palette.error.main, 0.12),
                                transition: "all 150ms ease",
                                "&:hover": {
                                  backgroundColor: alpha(theme.palette.error.main, 0.2),
                                  transform: "scale(1.03)",
                                },
                                "&.Mui-disabled": {
                                  borderColor: theme.palette.action.disabledBackground,
                                  color: theme.palette.text.disabled,
                                  backgroundColor: alpha(
                                    theme.palette.action.disabledBackground,
                                    0.3
                                  ),
                                },
                              })}
                            >
                              <Icon fontSize="small">delete</Icon>
                            </IconButton>
                          </span>
                        </Tooltip>
                      </MDBox>
                    </Grid>
                  </Grid>
                </MDBox>
              );
            })}
          </MDBox>
        </MDBox>
      </DialogContent>

      <DialogActions>
        <MDButton variant="outlined" color="secondary" onClick={onClose} disabled={disableAll}>
          Fechar
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

export default EventTypesDialog;
