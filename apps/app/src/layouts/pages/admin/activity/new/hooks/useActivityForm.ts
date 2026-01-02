import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { FormikHelpers } from "formik";

import { useToast } from "context/ToastContext";
import { useActivities, type Activity, type Objective } from "hooks/activities";

import { uploadImage } from "../../../../../../services/storage";

import { ACTIVITY_FORM_INITIAL_VALUES } from "../constants";
import { buildActivityFormValues, buildActivityPayload } from "../utils";
import type { ActivityFormValues } from "../types";

export const useActivityForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const toast = useToast();

  const { idTenant, getById, create, update } = useActivities();

  const [createdActivity, setCreatedActivity] = useState<Activity | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const formInitialValues = useMemo(
    () => buildActivityFormValues(createdActivity),
    [createdActivity]
  );

  useEffect(() => {
    const run = async () => {
      if (!isEditMode || !id) return;
      try {
        const activity = await getById(id);
        if (!activity) {
          setLocalError("Atividade não encontrada.");
          return;
        }
        setCreatedActivity(activity);
        setObjectives(activity.objectives || []);
        setPhotoUrl(activity.photoUrl);
      } catch (e: any) {
        setLocalError(e?.message || "Erro ao carregar atividade.");
      }
    };

    void run();
  }, [getById, id, isEditMode]);

  const handleSubmit = useCallback(
    async (values: ActivityFormValues, actions: FormikHelpers<ActivityFormValues>) => {
      setLocalError(null);
      try {
        const payload = buildActivityPayload(values, objectives, photoUrl);

        if (isEditMode && createdActivity?.id) {
          await update(createdActivity.id, payload);
          const refreshed = await getById(createdActivity.id);
          setCreatedActivity(refreshed);
          toast.showSuccess("Atividade salva com sucesso.");
          return;
        }

        const newId = await create(payload);
        const created = await getById(newId);
        setCreatedActivity(created);
        toast.showSuccess("Atividade criada com sucesso.");
      } catch (e: any) {
        setLocalError(e?.message || "Erro ao salvar atividade.");
        toast.showError(e?.message || "Erro ao salvar atividade.");
      } finally {
        actions.setSubmitting(false);
      }
    },
    [create, createdActivity, getById, isEditMode, objectives, photoUrl, toast, update]
  );

  const handleSelectPhoto = useCallback(
    async (file: File | null, setFieldValue?: (field: string, value: any) => void) => {
      if (!file) return;
      if (!idTenant) {
        setLocalError("Tenant não identificado.");
        return;
      }

      setPhotoUploading(true);
      setLocalError(null);
      try {
        const result = await uploadImage({
          idTenant,
          file,
          folder: "activities",
          filenamePrefix: createdActivity?.id || "activity",
        });
        setPhotoUrl(result.downloadUrl);
        if (setFieldValue) {
          setFieldValue("photoUrl", result.downloadUrl);
        }

        if (isEditMode && createdActivity?.id) {
          await update(createdActivity.id, { photoUrl: result.downloadUrl });
        }
      } catch (e: any) {
        setLocalError(e?.message || "Erro ao enviar imagem.");
      } finally {
        setPhotoUploading(false);
      }
    },
    [createdActivity?.id, idTenant, isEditMode, update]
  );

  const handleObjectivesChange = useCallback(
    (newObjectives: Objective[]) => {
      setObjectives(newObjectives);
      if (createdActivity) {
        setCreatedActivity({
          ...createdActivity,
          objectives: newObjectives,
        });
      }
    },
    [createdActivity]
  );

  const handleObjectivesSave = useCallback(
    async (nextObjectives: Objective[]) => {
      if (!createdActivity?.id) return;
      await update(createdActivity.id, { objectives: nextObjectives });
      const refreshed = await getById(createdActivity.id);
      setCreatedActivity(refreshed);
      setObjectives(refreshed?.objectives || []);
    },
    [createdActivity?.id, getById, update]
  );

  const handleCancel = useCallback(() => {
    navigate("/admin/activity");
  }, [navigate]);

  return {
    isEditMode,
    createdActivity,
    objectives,
    photoUrl,
    photoUploading,
    localError,
    initialValues: ACTIVITY_FORM_INITIAL_VALUES,
    formInitialValues,
    handleSubmit,
    handleSelectPhoto,
    handleObjectivesChange,
    handleObjectivesSave,
    handleCancel,
  };
};
