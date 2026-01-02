import { useCallback, useEffect, useState } from "react";

import { useAppSelector } from "../../redux/hooks";

import type {
  EventPlan,
  EventPlanPayload,
  EventType,
  EventTypePayload,
} from "../../modules/eventPlan";
import {
  createEventPlan,
  createEventType,
  deleteEventPlan,
  deleteEventType,
  fetchEventPlans,
  fetchEventTypes,
  normalizeEventPlanPayload,
  normalizeEventTypePayload,
  updateEventPlan,
  updateEventType,
  validateEventPlanPayload,
  validateEventTypePayload,
} from "../../modules/eventPlan";

import { hasEvaluationsForEventPlan } from "../../modules/evaluations";
import { hasTestResultsForEventPlan } from "../../modules/tests";

import { HARD_CODED_EVENT_TYPES, normalizeEventTypeKey } from "../../constants/eventPlanTypes";

export const useEventPlan = () => {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [eventPlans, setEventPlans] = useState<EventPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!idTenant || !idBranch) return;

    setLoading(true);
    setError(null);

    try {
      const [types, plans] = await Promise.all([
        fetchEventTypes(idTenant, idBranch),
        fetchEventPlans(idTenant, idBranch),
      ]);

      const existingKeys = new Set(
        (Array.isArray(types) ? types : []).map((t) => normalizeEventTypeKey(String(t?.name || "")))
      );

      const missing = HARD_CODED_EVENT_TYPES.filter((t) => !existingKeys.has(t.key));
      if (missing.length) {
        for (const m of missing) {
          await createEventType(idTenant, idBranch, {
            name: m.name,
            className: m.className,
            inactive: false,
          });
        }

        const [nextTypes, nextPlans] = await Promise.all([
          fetchEventTypes(idTenant, idBranch),
          fetchEventPlans(idTenant, idBranch),
        ]);
        setEventTypes(nextTypes);
        setEventPlans(nextPlans);
        return;
      }

      setEventTypes(types);
      setEventPlans(plans);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erro ao carregar planejamento de eventos");
    } finally {
      setLoading(false);
    }
  }, [idBranch, idTenant]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createType = useCallback(
    async (payload: EventTypePayload): Promise<string> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const errors = validateEventTypePayload(payload);
      if (errors.length) throw new Error(errors[0]);

      const normalized = normalizeEventTypePayload(payload);
      const id = await createEventType(idTenant, idBranch, normalized);
      await refetch();
      return id;
    },
    [idBranch, idTenant, refetch]
  );

  const updateType = useCallback(
    async (eventTypeId: string, payload: Partial<EventTypePayload>): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const current = eventTypes.find((t) => t.id === eventTypeId);
      if (current) {
        const key = normalizeEventTypeKey(String(current.name || ""));
        const isHardcoded = HARD_CODED_EVENT_TYPES.some((t) => t.key === key);
        if (isHardcoded) throw new Error("Este tipo é fixo do sistema e não pode ser alterado.");
      }

      if (payload.name !== undefined) {
        const errors = validateEventTypePayload({ name: payload.name });
        if (errors.length) throw new Error(errors[0]);
      }

      await updateEventType(idTenant, idBranch, eventTypeId, {
        name: payload.name !== undefined ? String(payload.name || "").trim() : undefined,
        className:
          payload.className !== undefined ? String(payload.className || "").trim() : undefined,
        inactive: payload.inactive !== undefined ? Boolean(payload.inactive) : undefined,
      });
      await refetch();
    },
    [eventTypes, idBranch, idTenant, refetch]
  );

  const removeType = useCallback(
    async (eventTypeId: string): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const current = eventTypes.find((t) => t.id === eventTypeId);
      if (current) {
        const key = normalizeEventTypeKey(String(current.name || ""));
        const isHardcoded = HARD_CODED_EVENT_TYPES.some((t) => t.key === key);
        if (isHardcoded) throw new Error("Este tipo é fixo do sistema e não pode ser excluído.");
      }

      await deleteEventType(idTenant, idBranch, eventTypeId);
      await refetch();
    },
    [eventTypes, idBranch, idTenant, refetch]
  );

  const createPlan = useCallback(
    async (payload: EventPlanPayload): Promise<string> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const errors = validateEventPlanPayload(payload);
      if (errors.length) throw new Error(errors[0]);

      const normalized = normalizeEventPlanPayload({
        ...payload,
        idBranch: idBranch,
      });

      const id = await createEventPlan(idTenant, idBranch, normalized);
      await refetch();
      return id;
    },
    [idBranch, idTenant, refetch]
  );

  const updatePlan = useCallback(
    async (eventPlanId: string, payload: Partial<EventPlanPayload>): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const [hasEvaluations, hasTests] = await Promise.all([
        hasEvaluationsForEventPlan(idTenant, idBranch, eventPlanId),
        hasTestResultsForEventPlan(idTenant, idBranch, eventPlanId),
      ]);

      if (hasEvaluations || hasTests) {
        throw new Error("Não é possível alterar um evento com avaliações ou testes registrados.");
      }

      await updateEventPlan(idTenant, idBranch, eventPlanId, {
        ...payload,
        idBranch: payload.idBranch !== undefined ? idBranch : undefined,
      });
      await refetch();
    },
    [idBranch, idTenant, refetch]
  );

  const removePlan = useCallback(
    async (eventPlanId: string): Promise<void> => {
      if (!idTenant || !idBranch) throw new Error("Tenant/unidade é obrigatório.");

      const [hasEvaluations, hasTests] = await Promise.all([
        hasEvaluationsForEventPlan(idTenant, idBranch, eventPlanId),
        hasTestResultsForEventPlan(idTenant, idBranch, eventPlanId),
      ]);

      if (hasEvaluations || hasTests) {
        throw new Error("Não é possível excluir: alguns alunos já realizaram o evento.");
      }

      await deleteEventPlan(idTenant, idBranch, eventPlanId);
      await refetch();
    },
    [idBranch, idTenant, refetch]
  );

  return {
    idTenant,
    idBranch,
    eventTypes,
    eventPlans,
    loading,
    error,
    refetch,
    createType,
    updateType,
    removeType,
    createPlan,
    updatePlan,
    removePlan,
  };
};
