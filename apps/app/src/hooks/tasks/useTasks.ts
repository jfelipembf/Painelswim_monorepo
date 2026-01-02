import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import { fetchCollaboratorByAuthUid } from "../../modules/collaborators";
import { fetchClientById } from "../../modules/clients";
import {
  createTask,
  fetchTasksForDate,
  setTaskStatus as setTaskStatusDb,
  toDateKey,
  toggleTaskCompletedForAssignee,
} from "../../modules/tasks";
import type { Task, TaskPayload } from "../../modules/tasks";

export type TaskWithRefs = Task & {
  collaboratorsResolved?: Array<{ id: string; name: string; photoUrl?: string }>;
  clientResolved?: { id: string; name: string; photoUrl?: string } | null;
};

export const useTasks = (params?: { dueDate?: Date; enabled?: boolean }) => {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);
  const { user } = useAppSelector((state) => state.auth);
  const { allowAll, permissions } = useAppSelector((state) => state.permissions);

  const canManageAll = Boolean(allowAll || permissions?.dashboards_management_view);

  const dueDateKey = toDateKey(params?.dueDate ?? new Date());
  const enabled = params?.enabled ?? true;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCollaboratorId, setCurrentCollaboratorId] = useState<string | null>(null);

  const resolveCurrentCollaborator = useCallback(async () => {
    if (!idTenant || !user?.uid) {
      setCurrentCollaboratorId(null);
      return null;
    }

    const collaborator = await fetchCollaboratorByAuthUid(idTenant, user.uid);
    const id = collaborator?.id ? String(collaborator.id) : null;
    setCurrentCollaboratorId(id);
    return id;
  }, [idTenant, user?.uid]);

  const refetch = useCallback(async () => {
    if (!enabled || !idTenant || !idBranch) {
      setTasks([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const collaboratorId = await resolveCurrentCollaborator();
      if (!collaboratorId) {
        setTasks([]);
        return;
      }

      const list = await fetchTasksForDate({
        idTenant,
        idBranch,
        dueDateKey,
        assigneeId: collaboratorId,
      });
      setTasks(list);
    } catch (e: unknown) {
      setTasks([]);
      setError(e instanceof Error ? e.message : "Erro ao carregar tarefas.");
    } finally {
      setLoading(false);
    }
  }, [canManageAll, dueDateKey, enabled, idBranch, idTenant, resolveCurrentCollaborator]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const toggleCompleted = useCallback(
    async (taskId: string, completed: boolean) => {
      if (!idTenant || !idBranch) return;
      const collaboratorId = currentCollaboratorId || (await resolveCurrentCollaborator());
      if (!collaboratorId) return;

      await toggleTaskCompletedForAssignee({
        idTenant,
        idBranch,
        taskId,
        assigneeId: collaboratorId,
        completed,
      });

      await refetch();
    },
    [currentCollaboratorId, idBranch, idTenant, refetch, resolveCurrentCollaborator]
  );

  const setTaskStatus = useCallback(
    async (taskId: string, status?: string) => {
      if (!idTenant || !idBranch || !taskId) return;
      await setTaskStatusDb({ idTenant, idBranch, taskId, status });
      await refetch();
    },
    [idBranch, idTenant, refetch]
  );

  const handleCreate = useCallback(
    async (payload: TaskPayload) => {
      if (!idTenant || !idBranch) throw new Error("Academia/unidade não identificadas.");
      await createTask(idTenant, idBranch, payload, { createdByUserId: user?.uid });
      await refetch();
    },
    [idBranch, idTenant, refetch, user?.uid]
  );

  const resolved = useMemo(() => {
    const list = Array.isArray(tasks) ? tasks : [];
    return list as TaskWithRefs[];
  }, [tasks]);

  const resolveClient = useCallback(
    async (clientId?: string) => {
      if (!idTenant || !idBranch || !clientId) return null;
      const client = await fetchClientById(idTenant, idBranch, clientId);
      if (!client) return null;
      const name = `${String(client.firstName || "").trim()} ${String(
        client.lastName || ""
      ).trim()}`
        .trim()
        .replace(/\s+/g, " ");
      return {
        id: String(client.id),
        name: name || "Aluno",
        photoUrl: client.photoUrl,
      };
    },
    [idBranch, idTenant]
  );

  return {
    idTenant,
    idBranch,
    dueDateKey,
    tasks: resolved,
    loading,
    error,
    canManageAll,
    currentCollaboratorId,
    resolveClient,
    refetch,
    toggleCompleted,
    setTaskStatus,
    createTask: handleCreate,
  };
};
