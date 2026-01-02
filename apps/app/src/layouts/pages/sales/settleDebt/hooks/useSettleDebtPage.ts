import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useToast } from "context/ToastContext";
import { useAppSelector } from "../../../../../redux/hooks";
import { formatCentsBRL, parseBRLToCents } from "hooks/sales";
import { useCashierStatus } from "hooks/cashier";

import { useAcquirers } from "hooks/acquirers";
import {
  applyReceivablePayment,
  updateReceivableDueDate,
  useClientReceivables,
  type Receivable,
} from "hooks/receivables";
import { useClient } from "hooks/clients";

import { PAYMENT_METHOD_OPTIONS } from "../../purchase/constants";
import type { PaymentMethod, PurchasePaymentDraft } from "../../purchase/types";

const buildReceivableOpenCents = (receivable: Receivable): number =>
  Math.max(0, Number(receivable.amountCents || 0) - Number(receivable.amountPaidCents || 0));

export const useSettleDebtPage = () => {
  useEffect(() => {
    document.title = "Quitar saldo";
  }, []);

  const params = useParams();
  const clientId = String(params?.id || "");

  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const cashier = useCashierStatus();

  const idTenant = useAppSelector((state) => state.tenant.idTenant);
  const idBranch = useAppSelector((state) => state.branch.idBranch);

  const { data: client } = useClient(clientId);
  const acquirers = useAcquirers();
  const { data: receivables, loading, error, refetch } = useClientReceivables(clientId);

  const [submitting, setSubmitting] = useState(false);

  const clientName = useMemo(() => {
    if (!client) return "";
    return `${client.firstName || ""} ${client.lastName || ""}`.trim();
  }, [client]);

  const clientDebtCents = useMemo(() => Number((client as any)?.debtCents || 0), [client]);

  const openReceivables = useMemo(() => {
    return [...receivables]
      .filter((r) => String(r.kind || "manual") === "manual")
      .filter((r) => r.status !== "canceled" && buildReceivableOpenCents(r) > 0)
      .sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")));
  }, [receivables]);

  const grossTotalCents = useMemo(() => {
    return openReceivables.reduce((acc, r) => acc + buildReceivableOpenCents(r), 0);
  }, [openReceivables]);

  const netTotalCents = grossTotalCents;

  const [payments, setPayments] = useState<PurchasePaymentDraft[]>([]);

  const paidTotalCents = useMemo(
    () => payments.reduce((acc, p) => acc + Number(p.amountCents || 0), 0),
    [payments]
  );

  const remainingCents = useMemo(
    () => Math.max(0, netTotalCents - paidTotalCents),
    [netTotalCents, paidTotalCents]
  );

  const showDebtMismatch = useMemo(() => {
    return !loading && !submitting && clientDebtCents > 0 && receivables.length === 0;
  }, [clientDebtCents, loading, receivables.length, submitting]);

  const [dueDateModalOpen, setDueDateModalOpen] = useState(false);
  const [dueDateValue, setDueDateValue] = useState<Date | null>(null);

  useEffect(() => {
    if (dueDateValue || !openReceivables.length) return;
    const firstDueDate = openReceivables.find((receivable) => receivable.dueDate)?.dueDate;
    if (!firstDueDate) return;
    const parsed = new Date(firstDueDate);
    if (!Number.isNaN(parsed.getTime())) {
      setDueDateValue(parsed);
    }
  }, [dueDateValue, openReceivables]);

  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>("cash");
  const [newPaymentAmount, setNewPaymentAmount] = useState<string>("");
  const [newPaymentPixTxid, setNewPaymentPixTxid] = useState<string>("");
  const [newPaymentTransferBankName, setNewPaymentTransferBankName] = useState<string>("");
  const [newPaymentTransferReference, setNewPaymentTransferReference] = useState<string>("");
  const [newPaymentCardAcquirer, setNewPaymentCardAcquirer] = useState<string>("");
  const [newPaymentCardBrand, setNewPaymentCardBrand] = useState<string>("");
  const [newPaymentCardInstallments, setNewPaymentCardInstallments] = useState<string>("1");
  const [newPaymentCardAuthCode, setNewPaymentCardAuthCode] = useState<string>("");

  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  const paymentTabValue = useMemo(() => {
    const index = PAYMENT_METHOD_OPTIONS.findIndex((opt) => opt.value === newPaymentMethod);
    return index < 0 ? 0 : index;
  }, [newPaymentMethod]);

  const handlePaymentTabChange = useCallback((_: unknown, value: number) => {
    const opt = PAYMENT_METHOD_OPTIONS[value];
    if (opt) setNewPaymentMethod(opt.value);
  }, []);

  const resetNewPaymentFields = useCallback(() => {
    setNewPaymentAmount("");
    setNewPaymentPixTxid("");
    setNewPaymentTransferBankName("");
    setNewPaymentTransferReference("");
    setNewPaymentCardAcquirer("");
    setNewPaymentCardBrand("");
    setNewPaymentCardInstallments("1");
    setNewPaymentCardAuthCode("");
  }, []);

  const currentEditingPayment = useMemo(() => {
    if (!editingPaymentId) return null;
    return payments.find((p) => p.id === editingPaymentId) ?? null;
  }, [editingPaymentId, payments]);

  const maxPaymentCents = useMemo(() => {
    if (!currentEditingPayment) return remainingCents;
    return remainingCents + Number(currentEditingPayment.amountCents || 0);
  }, [currentEditingPayment, remainingCents]);

  const cancelEditPayment = useCallback(() => {
    setEditingPaymentId(null);
    resetNewPaymentFields();
  }, [resetNewPaymentFields]);

  const handleAddPayment = useCallback(() => {
    const amountCents = parseBRLToCents(newPaymentAmount);
    if (!amountCents) return;
    if (amountCents > maxPaymentCents) {
      showError(`O valor máximo disponível é ${formatCentsBRL(maxPaymentCents)}.`);
      return;
    }

    const selectedAcquirer =
      newPaymentMethod === "credit" || newPaymentMethod === "debit"
        ? acquirers.data.find((a) => String(a.id) === String(newPaymentCardAcquirer))
        : undefined;

    if (editingPaymentId) {
      setPayments((prev) =>
        prev.map((p) => {
          if (p.id !== editingPaymentId) return p;
          return {
            ...p,
            method: newPaymentMethod,
            amountCents,
            pixTxid: newPaymentMethod === "pix" ? newPaymentPixTxid : undefined,
            transferBankName:
              newPaymentMethod === "transfer" ? newPaymentTransferBankName : undefined,
            transferReference:
              newPaymentMethod === "transfer" ? newPaymentTransferReference : undefined,
            cardAcquirerId:
              newPaymentMethod === "credit" || newPaymentMethod === "debit"
                ? String(newPaymentCardAcquirer || "")
                : undefined,
            cardAcquirer:
              newPaymentMethod === "credit" || newPaymentMethod === "debit"
                ? String(selectedAcquirer?.name || "")
                : undefined,
            cardBrand:
              newPaymentMethod === "credit" || newPaymentMethod === "debit"
                ? newPaymentCardBrand
                : undefined,
            cardInstallments:
              newPaymentMethod === "credit" ? Number(newPaymentCardInstallments || 1) : undefined,
            cardAuthCode:
              newPaymentMethod === "credit" || newPaymentMethod === "debit"
                ? newPaymentCardAuthCode
                : undefined,
          };
        })
      );
      cancelEditPayment();
      return;
    }

    const id = `pd-${Date.now()}`;
    const draft: PurchasePaymentDraft = {
      id,
      method: newPaymentMethod,
      amountCents,
      pixTxid: newPaymentMethod === "pix" ? newPaymentPixTxid : undefined,
      transferBankName: newPaymentMethod === "transfer" ? newPaymentTransferBankName : undefined,
      transferReference: newPaymentMethod === "transfer" ? newPaymentTransferReference : undefined,
      cardAcquirerId:
        newPaymentMethod === "credit" || newPaymentMethod === "debit"
          ? String(newPaymentCardAcquirer || "")
          : undefined,
      cardAcquirer:
        newPaymentMethod === "credit" || newPaymentMethod === "debit"
          ? String(selectedAcquirer?.name || "")
          : undefined,
      cardBrand:
        newPaymentMethod === "credit" || newPaymentMethod === "debit"
          ? newPaymentCardBrand
          : undefined,
      cardInstallments:
        newPaymentMethod === "credit" ? Number(newPaymentCardInstallments || 1) : undefined,
      cardAuthCode:
        newPaymentMethod === "credit" || newPaymentMethod === "debit"
          ? newPaymentCardAuthCode
          : undefined,
    };

    setPayments((prev) => [...prev, draft]);
    resetNewPaymentFields();
  }, [
    acquirers.data,
    newPaymentAmount,
    newPaymentCardAcquirer,
    newPaymentCardAuthCode,
    newPaymentCardBrand,
    newPaymentCardInstallments,
    newPaymentMethod,
    newPaymentPixTxid,
    newPaymentTransferBankName,
    newPaymentTransferReference,
    editingPaymentId,
    maxPaymentCents,
    cancelEditPayment,
    resetNewPaymentFields,
    showError,
  ]);

  const removePayment = useCallback(
    (paymentId: string) => {
      if (editingPaymentId && String(paymentId) === String(editingPaymentId)) {
        cancelEditPayment();
      }
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
    },
    [cancelEditPayment, editingPaymentId]
  );

  const startEditPayment = useCallback((payment: PurchasePaymentDraft) => {
    setEditingPaymentId(String(payment?.id || ""));
    setNewPaymentMethod(payment.method);
    setNewPaymentAmount(String((Number(payment?.amountCents || 0) / 100).toFixed(2)));
    setNewPaymentPixTxid(String(payment?.pixTxid || ""));
    setNewPaymentTransferBankName(String(payment?.transferBankName || ""));
    setNewPaymentTransferReference(String(payment?.transferReference || ""));
    setNewPaymentCardAcquirer(String(payment?.cardAcquirerId || ""));
    setNewPaymentCardBrand(String(payment?.cardBrand || ""));
    setNewPaymentCardInstallments(String(payment?.cardInstallments || 1));
    setNewPaymentCardAuthCode(String(payment?.cardAuthCode || ""));
  }, []);

  const openDueDateModal = useCallback(() => setDueDateModalOpen(true), []);
  const closeDueDateModal = useCallback(() => setDueDateModalOpen(false), []);
  const setDueDate = useCallback((date: Date | null) => setDueDateValue(date), []);

  const canFinalize = useMemo(() => {
    return (
      grossTotalCents > 0 &&
      paidTotalCents > 0 &&
      paidTotalCents <= netTotalCents &&
      !loading &&
      !error
    );
  }, [error, grossTotalCents, loading, netTotalCents, paidTotalCents]);

  const handleFinalize = useCallback(async () => {
    if (!cashier.loading && !cashier.isOpen) {
      showError("Caixa fechado. Abra o caixa para registrar pagamentos.");
      return;
    }

    if (!idTenant || !idBranch) {
      showError("Academia ou unidade não identificada.");
      return;
    }

    if (!clientId) {
      showError("Cliente não identificado.");
      return;
    }

    if (!openReceivables.length) {
      showError("Nenhum saldo em aberto encontrado.");
      return;
    }

    if (!paidTotalCents) {
      showError("Adicione um pagamento antes de finalizar.");
      return;
    }

    if (paidTotalCents > netTotalCents) {
      showError("O valor total não pode exceder o saldo em aberto.");
      return;
    }

    if (remainingCents > 0 && !dueDateValue) {
      showError("Informe a data prometida para o saldo devedor.");
      setDueDateModalOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const paidAtIso = new Date().toISOString();
      let remainingPayment = paidTotalCents;
      const stillOpen: Receivable[] = [];

      for (const receivable of openReceivables) {
        const openCents = buildReceivableOpenCents(receivable);
        if (openCents <= 0) continue;

        if (remainingPayment <= 0) {
          stillOpen.push(receivable);
          continue;
        }

        const applied = Math.min(openCents, remainingPayment);
        await applyReceivablePayment(
          idTenant,
          idBranch,
          receivable.id,
          clientId,
          applied,
          paidAtIso
        );
        remainingPayment -= applied;

        if (openCents - applied > 0) {
          stillOpen.push(receivable);
        }
      }

      if (remainingCents > 0 && dueDateValue && stillOpen.length) {
        const dueDateIso = dueDateValue.toISOString();
        await Promise.all(
          stillOpen.map((receivable) =>
            updateReceivableDueDate(idTenant, idBranch, receivable.id, dueDateIso)
          )
        );
      }

      showSuccess("Pagamento(s) registrado(s)!");
      setPayments([]);
      resetNewPaymentFields();
      if (remainingCents <= 0) {
        setDueDateValue(null);
      }
      await refetch();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Não foi possível registrar o pagamento.");
    } finally {
      setSubmitting(false);
    }
  }, [
    cashier.isOpen,
    cashier.loading,
    clientId,
    dueDateValue,
    idBranch,
    idTenant,
    netTotalCents,
    openReceivables,
    paidTotalCents,
    remainingCents,
    refetch,
    resetNewPaymentFields,
    showError,
    showSuccess,
  ]);

  const handleBack = useCallback(() => {
    navigate(`/clients/profile/${clientId}`);
  }, [clientId, navigate]);

  return {
    cashierClosed: !cashier.loading && !cashier.isOpen,
    clientName,
    receivables: openReceivables,
    loading,
    error,
    totals: {
      grossTotalCents,
      netTotalCents,
      paidTotalCents,
      remainingCents,
      discountValue: 0,
    },
    payments: {
      list: payments,
      newPaymentMethod,
      newPaymentAmount,
      newPaymentPixTxid,
      newPaymentTransferBankName,
      newPaymentTransferReference,
      newPaymentCardAcquirer,
      newPaymentCardBrand,
      newPaymentCardInstallments,
      newPaymentCardAuthCode,
      paymentTabValue,
      editingPaymentId,
      maxPaymentCents,
      onPaymentTabChange: handlePaymentTabChange,
      onPaymentAmountChange: setNewPaymentAmount,
      onPaymentPixTxidChange: setNewPaymentPixTxid,
      onPaymentTransferBankNameChange: setNewPaymentTransferBankName,
      onPaymentTransferReferenceChange: setNewPaymentTransferReference,
      onPaymentCardAcquirerChange: setNewPaymentCardAcquirer,
      onPaymentCardBrandChange: setNewPaymentCardBrand,
      onPaymentCardInstallmentsChange: setNewPaymentCardInstallments,
      onPaymentCardAuthCodeChange: setNewPaymentCardAuthCode,
      onAddPayment: handleAddPayment,
      onCancelEditPayment: cancelEditPayment,
      onRemovePayment: removePayment,
      onEditPayment: startEditPayment,
    },
    dueDate: {
      open: dueDateModalOpen,
      value: dueDateValue,
      onOpen: openDueDateModal,
      onClose: closeDueDateModal,
      onChange: setDueDate,
    },
    acquirers,
    submitting,
    canFinalize,
    showDebtMismatch,
    handleFinalize,
    handleBack,
  };
};
