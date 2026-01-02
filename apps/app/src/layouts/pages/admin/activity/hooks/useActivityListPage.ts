import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useActivities, type Activity } from "hooks/activities";
import { useConfirmDialog } from "hooks/useConfirmDialog";
import { useToast } from "context/ToastContext";

export const useActivityListPage = () => {
  const navigate = useNavigate();

  const { activities, loading, error, remove } = useActivities();
  const confirmDialog = useConfirmDialog();
  const toast = useToast();

  useEffect(() => {
    document.title = "Lista de atividades";
  }, []);

  const handleNewActivity = useCallback(() => {
    navigate("/admin/activity/new");
  }, [navigate]);

  const handleDelete = useCallback(
    async (activity: Activity) => {
      const id = String(activity?.id || "").trim();
      const name = String(activity?.name || "").trim();
      if (!id) return;

      const ok = await confirmDialog.confirm({
        title: "Excluir atividade",
        description: name ? `Tem certeza que deseja excluir a atividade \"${name}\"?` : undefined,
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmColor: "error",
      });

      if (!ok) return;

      try {
        await remove(id);
        toast.showSuccess("Atividade excluída com sucesso.");
      } catch (err: any) {
        toast.showError(err?.message || "Erro ao excluir atividade");
      }
    },
    [confirmDialog, remove, toast]
  );

  return {
    activities,
    loading,
    error,
    handleDelete,
    handleNewActivity,
    confirmDialog,
  };
};
