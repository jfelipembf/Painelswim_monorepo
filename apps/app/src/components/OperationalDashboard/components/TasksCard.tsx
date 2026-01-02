import { useEffect, useMemo, useRef, useState } from "react";

import Flatpickr from "react-flatpickr";
import { Portuguese } from "flatpickr/dist/l10n/pt";

import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { useCollaborators, useTasks } from "hooks/clients";

import CreateTaskModal from "../modals/CreateTaskModal";

import type { TaskPayload } from "modules/tasks/tasks.types";

type Props = {
  embedded?: boolean;
};

function formatDateLikeScreenshot(value?: any): string {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const base = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d); // "27 Nov 2023"
  const parts = base.split(" ");
  if (parts.length !== 3) return base;
  return `${parts[0]} ${parts[1]}, ${parts[2]}`; // "27 Nov, 2023"
}

function urgencyUi(urgency?: string) {
  const u = String(urgency || "").toLowerCase();
  if (u === "high") return { label: "High", color: "error" as const };
  if (u === "medium") return { label: "Medium", color: "warning" as const };
  if (u === "urgent") return { label: "Urgent", color: "error" as const };
  if (u === "normal") return { label: "Normal", color: "info" as const };
  return { label: "Low", color: "success" as const };
}

function statusUi(status?: string) {
  const s = String(status || "").toLowerCase();

  if (s === "waiting" || s === "aguardando")
    return { label: "Aguardando", color: "warning" as const };
  if (s === "done" || s === "feito") return { label: "Feito", color: "info" as const };
  if (s === "completed" || s === "concluida" || s === "concluída")
    return { label: "Concluída", color: "success" as const };

  return { label: "Em aberto", color: "default" as const };
}

function TasksCard({ embedded = false }: Props): JSX.Element {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const datePickerInstanceRef = useRef<any>(null);

  const tasksHook = useTasks({ dueDate: selectedDate, enabled: true });
  const collaboratorsHook = useCollaborators();
  const {
    idTenant: tasksTenantId,
    idBranch: tasksBranchId,
    tasks: tasksList,
    loading: tasksLoading,
    error: tasksError,
    canManageAll,
    currentCollaboratorId,
    resolveClient,
    toggleCompleted,
  } = tasksHook;
  const resolveClientRef = useRef(resolveClient);

  const [createOpen, setCreateOpen] = useState(false);
  const [clientById, setClientById] = useState<Record<string, { name: string; photoUrl?: string }>>(
    {}
  );

  // menu (3 pontinhos)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);

  const collaboratorById = useMemo(() => {
    const map: Record<string, any> = {};
    (collaboratorsHook.collaborators || []).forEach((c: any) => {
      const id = String(c?.id || "");
      if (id) map[id] = c;
    });
    return map;
  }, [collaboratorsHook.collaborators]);

  const tasks = useMemo(() => {
    const list = Array.isArray(tasksList) ? tasksList : [];
    return list;
  }, [tasksList]);

  const clientIdsKey = useMemo(() => {
    const list = Array.isArray(tasksList) ? tasksList : [];
    const ids = Array.from(
      new Set(list.map((t: any) => String(t?.clientId || "").trim()).filter(Boolean))
    ).sort();
    return ids.join("|");
  }, [tasksList]);

  useEffect(() => {
    resolveClientRef.current = resolveClient;
  }, [resolveClient]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!tasksTenantId || !tasksBranchId) return;

      const clientIds = clientIdsKey ? clientIdsKey.split("|") : [];

      if (clientIds.length === 0) {
        if (!active) return;
        setClientById({});
        return;
      }

      const resolved = await Promise.all(clientIds.map((id) => resolveClientRef.current(id)));
      if (!active) return;

      const next: Record<string, { name: string; photoUrl?: string }> = {};
      resolved.forEach((c: any) => {
        if (!c?.id) return;
        next[String(c.id)] = { name: String(c.name || "Cliente"), photoUrl: c.photoUrl };
      });
      setClientById(next);
    };

    void run();
    return () => {
      active = false;
    };
  }, [clientIdsKey, tasksBranchId, tasksTenantId]);

  const canCreate = canManageAll;

  // Atualiza status (adapte se você tiver um método específico no seu hook)
  const tryUpdateTask = async (taskId: string, patch: any) => {
    const api: any = tasksHook as any;

    if (typeof api.updateTask === "function") return api.updateTask(taskId, patch);
    if (typeof api.patchTask === "function") return api.patchTask(taskId, patch);
    if (typeof api.update === "function") return api.update(taskId, patch);
    if (typeof api.setTaskStatus === "function") return api.setTaskStatus(taskId, patch?.status);

    return null;
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuTaskId(null);
  };

  const openDatePicker = () => {
    window.setTimeout(() => {
      datePickerInstanceRef.current?.open?.();
    }, 0);
  };

  const handleDateChange = (dates: Date[]) => {
    const [nextDate] = dates || [];
    if (!nextDate) return;
    setSelectedDate(nextDate);
  };

  const markConcluded = async () => {
    if (!menuTaskId) return;
    await toggleCompleted(menuTaskId, true);
    await tryUpdateTask(menuTaskId, { status: "completed" });
    closeMenu();
  };

  const markWaiting = async () => {
    if (!menuTaskId) return;
    await tryUpdateTask(menuTaskId, { status: "waiting" });
    closeMenu();
  };

  const markDone = async () => {
    if (!menuTaskId) return;
    await tryUpdateTask(menuTaskId, { status: "done" });
    await toggleCompleted(menuTaskId, true);
    closeMenu();
  };

  return (
    <Card
      sx={(theme) => ({
        position: "relative",
        overflow: "hidden",
        height: "100%",
        minHeight: 190,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: "rgba(255,255,255,0.78)",
        backdropFilter: "blur(10px)",
      })}
    >
      <Flatpickr
        value={[selectedDate]}
        options={{ dateFormat: "d/m/Y", locale: Portuguese }}
        onChange={handleDateChange}
        onReady={(_, __, instance) => {
          datePickerInstanceRef.current = instance;
        }}
        render={({ defaultValue }: any, ref: any) => (
          <input
            ref={ref}
            defaultValue={defaultValue}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: "none",
            }}
          />
        )}
      />

      <MDBox p={2} display="flex" alignItems="center" justifyContent="space-between">
        <MDBox display="flex" alignItems="center" gap={1}>
          <Icon color="action">checklist</Icon>
          <MDTypography variant="h6">Tarefas do dia</MDTypography>
        </MDBox>

        <MDBox display="flex" alignItems="center" gap={1}>
          {canCreate ? (
            <IconButton size="small" onClick={() => setCreateOpen(true)} title="Criar tarefa">
              <Icon fontSize="small">add</Icon>
            </IconButton>
          ) : null}
          <IconButton size="small" onClick={openDatePicker} title="Selecionar data">
            <Icon fontSize="small">event</Icon>
          </IconButton>
          <MDTypography variant="caption" color="text" sx={{ opacity: 0.6 }}>
            {formatDateLikeScreenshot(selectedDate)}
          </MDTypography>
          <MDTypography variant="button" fontWeight="medium" sx={{ opacity: 0.7 }}>
            {tasks.length}
          </MDTypography>
        </MDBox>
      </MDBox>

      <Divider />

      {tasksLoading ? (
        <MDBox p={2}>
          <MDTypography variant="button" color="text">
            Carregando tarefas...
          </MDTypography>
        </MDBox>
      ) : tasksError ? (
        <MDBox p={2}>
          <MDTypography variant="button" color="error" fontWeight="medium">
            {tasksError}
          </MDTypography>
        </MDBox>
      ) : tasks.length === 0 ? (
        <MDBox p={2}>
          <MDTypography variant="button" color="text">
            Nenhuma tarefa para esta data.
          </MDTypography>
        </MDBox>
      ) : (
        <List
          disablePadding
          sx={{
            p: 2,
            pt: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          {tasks.map((task: any, index: number) => {
            const isCompleted = currentCollaboratorId
              ? Boolean(task?.completedBy?.[String(currentCollaboratorId)])
              : false;

            const assignees = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
            const firstAssigneeId = String(assignees[0] || "");
            const firstAssignee = firstAssigneeId ? collaboratorById[firstAssigneeId] : null;
            const otherCount = Math.max(0, assignees.length - 1);

            const client = task.clientId ? clientById[String(task.clientId)] : null;

            const urgency = task?.urgency ? urgencyUi(task.urgency) : null;
            const statusChip = statusUi(task?.status);

            const categoryLabel = String(task?.category || task?.type || "").trim();

            const rightDate = formatDateLikeScreenshot(
              task?.dueDate || task?.date || task?.createdAt
            );

            const collaboratorLabel = firstAssignee
              ? `${String(firstAssignee.name || "Colaborador")}${
                  otherCount > 0 ? ` +${otherCount}` : ""
                }`
              : "Sem responsável";

            const clientLabel = client ? String(client.name || "Cliente") : "Sem cliente";

            return (
              <ListItem key={String(task.id)} disableGutters sx={{ p: 0 }}>
                <MDBox
                  sx={(theme) => ({
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    px: 1.25,
                    py: 1.25,
                    borderRadius: 2.5,
                    border: `1px dashed ${theme.palette.divider}`,
                    backgroundColor: theme.palette.common.white,
                    opacity: isCompleted ? 0.65 : 1,

                    // remove qualquer sombra/efeito ao passar o mouse
                    boxShadow: "none",
                    transform: "none",
                    transition: "none",
                    "&:hover": {
                      boxShadow: "none",
                      transform: "none",
                    },
                  })}
                >
                  {/* ESQUERDA: numeração */}
                  <MDBox display="flex" alignItems="center" flexShrink={0}>
                    <MDTypography
                      variant="caption"
                      fontWeight="bold"
                      color="text"
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "rgba(0,0,0,0.03)",
                      }}
                    >
                      {index + 1}
                    </MDTypography>
                  </MDBox>

                  {/* MEIO: título + chips + descrição + nomes */}
                  <MDBox flex={1} minWidth={0}>
                    <MDBox display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <MDTypography
                        variant="button"
                        fontWeight="bold"
                        color="text"
                        sx={{
                          textDecoration: isCompleted ? "line-through" : "none",
                          whiteSpace: "normal",
                          overflowWrap: "anywhere",
                          lineHeight: 1.2,
                          minWidth: 0,
                          pr: 1,
                          flex: 1,
                        }}
                      >
                        {String(task.title || "Tarefa")}
                      </MDTypography>

                      {urgency ? (
                        <Chip
                          label={urgency.label}
                          size="small"
                          color={urgency.color}
                          variant="outlined"
                          sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}
                        />
                      ) : null}
                    </MDBox>

                    <MDBox display="flex" alignItems="center" gap={1} mt={0.3} flexWrap="wrap">
                      <MDTypography
                        variant="caption"
                        color="text"
                        sx={{
                          opacity: 0.7,
                          flex: 1,
                          minWidth: 0,
                          whiteSpace: "normal",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {String(
                          task.description ||
                            "Lorem ipsum dolor sit amet consectetur adipisicing elit."
                        )}
                      </MDTypography>

                      <Chip
                        label={statusChip.label}
                        size="small"
                        color={statusChip.color as any}
                        variant="filled"
                        sx={{ height: 22, fontSize: "0.7rem", fontWeight: 800, flexShrink: 0 }}
                      />
                    </MDBox>

                    {/* Nomes: colaborador + cliente (sem foto aqui, para não duplicar) */}
                    <MDBox display="flex" alignItems="center" gap={1} mt={0.75} flexWrap="wrap">
                      <MDBox display="flex" alignItems="center" gap={0.5}>
                        <Icon fontSize="small" sx={{ opacity: 0.7 }}>
                          person
                        </Icon>
                        <MDTypography variant="caption" color="text" sx={{ opacity: 0.85 }}>
                          <strong>Resp.:</strong> {collaboratorLabel}
                        </MDTypography>
                      </MDBox>

                      <MDTypography variant="caption" color="text" sx={{ opacity: 0.55 }}>
                        •
                      </MDTypography>

                      <MDBox display="flex" alignItems="center" gap={0.5}>
                        <Icon fontSize="small" sx={{ opacity: 0.7 }}>
                          school
                        </Icon>
                        <MDTypography variant="caption" color="text" sx={{ opacity: 0.85 }}>
                          <strong>Cliente:</strong> {clientLabel}
                        </MDTypography>
                      </MDBox>
                    </MDBox>
                  </MDBox>

                  {/* DIREITA: categoria + data + 1 avatar + menu */}
                  <MDBox
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-end"
                    gap={1.25}
                    flexShrink={0}
                    sx={{ pl: 0.5 }}
                  >
                    {categoryLabel ? (
                      <Chip
                        label={categoryLabel}
                        size="small"
                        variant="filled"
                        sx={{ height: 26, fontSize: "0.75rem", borderRadius: 2 }}
                      />
                    ) : null}

                    {rightDate ? (
                      <MDTypography
                        variant="button"
                        color="text"
                        sx={{ opacity: 0.6, fontWeight: 500 }}
                      >
                        {rightDate}
                      </MDTypography>
                    ) : null}

                    <IconButton
                      size="small"
                      title="Opções"
                      onClick={(e) => {
                        setMenuAnchor(e.currentTarget);
                        setMenuTaskId(String(task.id));
                      }}
                    >
                      <Icon fontSize="small">more_vert</Icon>
                    </IconButton>
                  </MDBox>
                </MDBox>
              </ListItem>
            );
          })}
        </List>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={markConcluded}>
          <ListItemIcon>
            <Icon fontSize="small">check_circle</Icon>
          </ListItemIcon>
          Marcar como concluída
        </MenuItem>

        <MenuItem onClick={markWaiting}>
          <ListItemIcon>
            <Icon fontSize="small">schedule</Icon>
          </ListItemIcon>
          Aguardando
        </MenuItem>

        <MenuItem onClick={markDone}>
          <ListItemIcon>
            <Icon fontSize="small">task_alt</Icon>
          </ListItemIcon>
          Feito
        </MenuItem>
      </Menu>

      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (payload: TaskPayload) => {
          await tasksHook.createTask(payload);
          setCreateOpen(false);
        }}
      />
    </Card>
  );
}

export default TasksCard;
