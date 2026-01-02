import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import Autocomplete from "@mui/material/Autocomplete";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Icon from "@mui/material/Icon";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";

import { useClientsList, useCollaborators } from "hooks/clients";

import type { TaskPayload } from "modules/tasks/tasks.types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: TaskPayload) => Promise<void>;
};

function CreateTaskModal({ open, onClose, onCreate }: Props): JSX.Element {
  const collaboratorsHook = useCollaborators();
  const clientsHook = useClientsList({ enabled: open });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDateKey, setDueDateKey] = useState(() => String(new Date().toISOString()).slice(0, 10));
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [assignees, setAssignees] = useState<any[]>([]);
  const [client, setClient] = useState<any | null>(null);

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setError(null);
    setTitle("");
    setDescription("");
    setDueDateKey(String(new Date().toISOString()).slice(0, 10));
    setUrgency("medium");
    setAssignees([]);
    setClient(null);
  }, [open]);

  const collaboratorOptions = useMemo(
    () => (Array.isArray(collaboratorsHook.collaborators) ? collaboratorsHook.collaborators : []),
    [collaboratorsHook.collaborators]
  );

  const clientOptions = useMemo(() => {
    const list = Array.isArray(clientsHook.data) ? clientsHook.data : [];
    return list.map((c: any) => ({
      id: String(c.id),
      name: `${String(c.firstName || "").trim()} ${String(c.lastName || "").trim()}`
        .trim()
        .replace(/\s+/g, " "),
      photoUrl: c.photoUrl,
    }));
  }, [clientsHook.data]);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const payload: TaskPayload = {
        title,
        description: description ? String(description) : undefined,
        dueDateKey,
        urgency,
        assigneeIds: assignees.map((a: any) => String(a?.id || "")).filter(Boolean),
        clientId: client?.id ? String(client.id) : undefined,
      };

      await onCreate(payload);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Não foi possível criar a tarefa.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <MDBox display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h6">Nova tarefa</MDTypography>
          <MDButton variant="text" color="dark" iconOnly onClick={onClose}>
            <Icon>close</Icon>
          </MDButton>
        </MDBox>
      </DialogTitle>
      <DialogContent>
        <MDBox pt={1} display="flex" flexDirection="column" gap={2}>
          {error ? (
            <MDTypography variant="button" color="error" fontWeight="medium">
              {error}
            </MDTypography>
          ) : null}

          <MDInput
            variant="standard"
            label="Título"
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(String(e.target.value))}
            fullWidth
          />

          <MDInput
            variant="standard"
            label="Descrição (opcional)"
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(String(e.target.value))}
            fullWidth
            multiline
            minRows={2}
          />

          <MDInput
            variant="standard"
            label="Data"
            type="date"
            value={dueDateKey}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDueDateKey(String(e.target.value))}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <FormControl variant="standard" fullWidth>
            <InputLabel id="urgency-label">Urgência</InputLabel>
            <Select
              labelId="urgency-label"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as "low" | "medium" | "high")}
              label="Urgência"
            >
              <MenuItem value="low">Baixa</MenuItem>
              <MenuItem value="medium">Média</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            multiple
            options={collaboratorOptions}
            value={assignees}
            getOptionLabel={(opt: any) => String(opt?.name || "")}
            onChange={(_, next) => setAssignees(next)}
            renderInput={(params) => (
              <MDInput {...params} variant="standard" label="Responsáveis" fullWidth />
            )}
          />

          <Autocomplete
            options={clientOptions}
            value={client}
            getOptionLabel={(opt: any) => String(opt?.name || "")}
            onChange={(_, next) => setClient(next)}
            renderInput={(params) => (
              <MDInput {...params} variant="standard" label="Aluno (opcional)" fullWidth />
            )}
          />
        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton variant="outlined" color="secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </MDButton>
        <MDButton variant="gradient" color="info" onClick={handleSubmit} disabled={saving}>
          Salvar
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

export default CreateTaskModal;
