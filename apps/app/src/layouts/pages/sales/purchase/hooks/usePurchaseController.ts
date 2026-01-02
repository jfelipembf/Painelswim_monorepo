import { useCallback, useMemo, useState } from "react";

import { createSale, parseBRLToCents, type CreateSalePayload } from "hooks/sales";
import { useAcquirers } from "hooks/acquirers";
import { useContracts } from "hooks/contracts";
import { useProducts } from "hooks/products";
import { useServices } from "hooks/services";

import { PAYMENT_METHOD_OPTIONS } from "../constants";
import type {
  BranchOption,
  CheckoutItem,
  PaymentMethod,
  PurchasePaymentDraft,
  PurchaseTab,
} from "../types";
import { buildSaleItems, buildSalePayments } from "../utils";

type Params = {
  memberId: string;
  idTenant: string;
  idBranch: string;
  branches: any[];
  authUser: any;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  onSaleSuccess: (saleId: string) => void;
};

export const usePurchaseController = ({
  memberId,
  idTenant,
  idBranch,
  branches,
  authUser,
  showError,
  showSuccess,
  onSaleSuccess,
}: Params) => {
  const { data: acquirers, loading: acquirersLoading, error: acquirersError } = useAcquirers();

  const {
    data: contracts,
    loading: contractsLoading,
    error: contractsError,
  } = useContracts({ idBranch, activeOnly: true });

  const { products } = useProducts();
  const { services } = useServices();

  const [tab, setTab] = useState<PurchaseTab>("contracts");
  const tabValue = tab === "contracts" ? 0 : tab === "products" ? 1 : 2;

  const [contractId, setContractId] = useState<string>("");
  const selectedContract = useMemo(
    () => contracts.find((c) => c.id === contractId) ?? null,
    [contracts, contractId]
  );

  const [allowCrossBranchAccess, setAllowCrossBranchAccess] = useState(false);
  const [allowedBranchIds, setAllowedBranchIds] = useState<string[]>([]);

  const branchOptions = useMemo<BranchOption[]>(
    () =>
      (Array.isArray(branches) ? branches : [])
        .map((branch) => ({
          id: String(branch?.idBranch || ""),
          name: String(branch?.name || ""),
        }))
        .filter((branch) => Boolean(branch.id)),
    [branches]
  );

  const [discountValue, setDiscountValue] = useState<number>(0);

  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [productSelection, setProductSelection] = useState<string>("");
  const [serviceSelection, setServiceSelection] = useState<string>("");

  const contractItem: CheckoutItem | null = useMemo(() => {
    if (!selectedContract) return null;
    return {
      id: "contract-item",
      type: "membership",
      referenceId: selectedContract.id,
      description: selectedContract.name,
      quantity: 1,
      unitPriceCents: selectedContract.priceCents,
      totalCents: selectedContract.priceCents,
    };
  }, [selectedContract]);

  const productItems = useMemo<CheckoutItem[]>(() => {
    return Object.entries(selectedProducts)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return null;
        const quantity = Math.max(1, qty);
        const total = quantity * Number(product.salePriceCents || 0);
        return {
          id: `product-${product.id}`,
          type: "product",
          referenceId: product.id,
          description: product.name,
          unitPriceCents: Number(product.salePriceCents || 0),
          quantity,
          totalCents: total,
        } as CheckoutItem;
      })
      .filter(Boolean) as CheckoutItem[];
  }, [products, selectedProducts]);

  const serviceItems = useMemo<CheckoutItem[]>(() => {
    return Object.entries(selectedServices)
      .filter(([, qty]) => qty > 0)
      .map(([serviceId, qty]) => {
        const service = services.find((s) => s.id === serviceId);
        if (!service) return null;
        const quantity = Math.max(1, qty);
        const total = quantity * Number(service.priceCents || 0);
        return {
          id: `service-${service.id}`,
          type: "service",
          referenceId: service.id,
          description: service.name,
          unitPriceCents: Number(service.priceCents || 0),
          quantity,
          totalCents: total,
        } as CheckoutItem;
      })
      .filter(Boolean) as CheckoutItem[];
  }, [selectedServices, services]);

  const checkoutItems = useMemo<CheckoutItem[]>(() => {
    if (tab === "contracts") {
      return contractItem ? [contractItem] : [];
    }
    if (tab === "products") return productItems;
    if (tab === "services") return serviceItems;
    return [];
  }, [contractItem, productItems, serviceItems, tab]);

  const grossTotalCents = useMemo(
    () => checkoutItems.reduce((acc, item) => acc + Number(item.totalCents || 0), 0),
    [checkoutItems]
  );

  const netTotalCents = useMemo(
    () => Math.max(0, grossTotalCents - discountValue),
    [grossTotalCents, discountValue]
  );

  const [payments, setPayments] = useState<PurchasePaymentDraft[]>([]);

  const paidTotalCents = useMemo(
    () => payments.reduce((acc, p) => acc + Number(p.amountCents || 0), 0),
    [payments]
  );

  const remainingCents = useMemo(
    () => Math.max(0, netTotalCents - paidTotalCents),
    [netTotalCents, paidTotalCents]
  );

  const [submitting, setSubmitting] = useState(false);

  const [dueDateModalOpen, setDueDateModalOpen] = useState(false);
  const [dueDateValue, setDueDateValue] = useState<Date | null>(null);

  const hasItems = checkoutItems.length > 0;
  const requireContractSelection = tab === "contracts" && !selectedContract;
  const canFinalize =
    hasItems &&
    !requireContractSelection &&
    netTotalCents > 0 &&
    paidTotalCents <= netTotalCents &&
    discountValue <= grossTotalCents;

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

  const handleTabChange = (_: unknown, value: number) => {
    setTab(value === 0 ? "contracts" : value === 1 ? "products" : "services");
  };

  const paymentTabValue = useMemo(() => {
    const index = PAYMENT_METHOD_OPTIONS.findIndex((opt) => opt.value === newPaymentMethod);
    return index < 0 ? 0 : index;
  }, [newPaymentMethod]);

  const handlePaymentTabChange = (_: unknown, value: number) => {
    const opt = PAYMENT_METHOD_OPTIONS[value];
    if (opt) setNewPaymentMethod(opt.value);
  };

  const handleSelectContract = (e: any) => {
    const nextId = String(e?.target?.value || "");
    setContractId(nextId);
  };

  const handleToggleCrossBranchAccess = (checked: boolean) => {
    setAllowCrossBranchAccess(checked);
    if (!checked) setAllowedBranchIds([]);
  };

  const setDiscountBRL = (value: string) => {
    setDiscountValue(parseBRLToCents(value));
  };

  const resetNewPaymentFields = () => {
    setNewPaymentAmount("");
    setNewPaymentPixTxid("");
    setNewPaymentTransferBankName("");
    setNewPaymentTransferReference("");
    setNewPaymentCardAcquirer("");
    setNewPaymentCardBrand("");
    setNewPaymentCardInstallments("1");
    setNewPaymentCardAuthCode("");
  };

  const currentEditingPayment = useMemo(() => {
    if (!editingPaymentId) return null;
    return payments.find((p) => p.id === editingPaymentId) ?? null;
  }, [editingPaymentId, payments]);

  const maxPaymentCents = useMemo(() => {
    if (!currentEditingPayment) return remainingCents;
    return remainingCents + Number(currentEditingPayment.amountCents || 0);
  }, [currentEditingPayment, remainingCents]);

  const cancelEditPayment = () => {
    setEditingPaymentId(null);
    resetNewPaymentFields();
  };

  const handleAddPayment = () => {
    const amountCents = parseBRLToCents(newPaymentAmount);
    if (!amountCents) return;
    if (amountCents > maxPaymentCents) return;

    const selectedAcquirer =
      newPaymentMethod === "credit" || newPaymentMethod === "debit"
        ? acquirers.find((a) => String(a.id) === String(newPaymentCardAcquirer))
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

    const id = `p-${Date.now()}`;
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
  };

  const removePayment = (paymentId: string) => {
    if (editingPaymentId && String(paymentId) === String(editingPaymentId)) {
      cancelEditPayment();
    }
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
  };

  const startEditPayment = (payment: PurchasePaymentDraft) => {
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
  };

  const openDueDateModal = () => setDueDateModalOpen(true);
  const closeDueDateModal = () => setDueDateModalOpen(false);

  const setDueDate = (date: Date | null) => setDueDateValue(date);

  const updateProductQuantity = useCallback((productId: string, quantity: number) => {
    setSelectedProducts((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[productId];
      } else {
        next[productId] = quantity;
      }
      return next;
    });
  }, []);

  const updateServiceQuantity = useCallback((serviceId: string, quantity: number) => {
    setSelectedServices((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[serviceId];
      } else {
        next[serviceId] = quantity;
      }
      return next;
    });
  }, []);

  const handleAddProductSelection = () => {
    const productId = productSelection.trim();
    if (!productId) return;
    updateProductQuantity(productId, (selectedProducts[productId] || 0) + 1);
    setProductSelection("");
  };

  const handleAddServiceSelection = () => {
    const serviceId = serviceSelection.trim();
    if (!serviceId) return;
    updateServiceQuantity(serviceId, (selectedServices[serviceId] || 0) + 1);
    setServiceSelection("");
  };

  const handleFinalize = async () => {
    if (!idTenant || !idBranch) {
      throw new Error("Academia ou unidade não identificada.");
    }

    if (!memberId) {
      showError("Cliente não identificado.");
      return;
    }

    if (!checkoutItems.length) {
      showError("Selecione ao menos um item para vender.");
      return;
    }

    if (remainingCents > 0 && !dueDateValue) {
      showError("Informe a data prometida para o saldo devedor.");
      setDueDateModalOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const startAt = new Date().toISOString();
      const dueDate = dueDateValue ? dueDateValue.toISOString() : undefined;

      if (!acquirers.length) {
        throw new Error(acquirersError || "Nenhuma adquirente cadastrada para esta unidade.");
      }

      const { payments: salePayments, feesCents } = buildSalePayments(payments, acquirers);
      const saleItems = buildSaleItems(checkoutItems);

      const salePayload: CreateSalePayload = {
        clientId: memberId,
        idBranch,
        consultantId: String(authUser?.uid || ""),
        consultantName: String(authUser?.displayName || authUser?.email || ""),
        items: saleItems,
        grossTotalCents,
        discountCents: discountValue,
        netTotalCents,
        feesCents,
        paidTotalCents,
        remainingCents,
        dueDate,
        payments: salePayments,
      };

      if (contractItem && selectedContract) {
        salePayload.membership = {
          planId: selectedContract.id,
          planName: selectedContract.name,
          priceCents: selectedContract.priceCents,
          startAt,
          durationType: selectedContract.durationType as any,
          duration: Number(selectedContract.duration || 1),
          allowCrossBranchAccess: Boolean(allowCrossBranchAccess),
          allowedBranchIds: allowCrossBranchAccess
            ? Array.isArray(allowedBranchIds)
              ? allowedBranchIds
              : []
            : undefined,
        };
      }

      const saleId = await createSale(idTenant, idBranch, salePayload);

      showSuccess("Venda finalizada com sucesso!");
      onSaleSuccess(saleId);
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Não foi possível finalizar a venda.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    tab,
    tabValue,
    onTabChange: handleTabChange,
    contract: {
      contractId,
      contracts,
      contractsLoading,
      contractsError,
      selectedContract,
      allowCrossBranchAccess,
      allowedBranchIds,
      onSelectContract: handleSelectContract,
      onToggleCrossBranchAccess: handleToggleCrossBranchAccess,
      onAllowedBranchIdsChange: setAllowedBranchIds,
    },
    branchOptions,
    products: {
      items: productItems,
      products,
      selection: productSelection,
      onSelectionChange: setProductSelection,
      onAddSelection: handleAddProductSelection,
      onUpdateQuantity: updateProductQuantity,
    },
    services: {
      items: serviceItems,
      services,
      selection: serviceSelection,
      onSelectionChange: setServiceSelection,
      onAddSelection: handleAddServiceSelection,
      onUpdateQuantity: updateServiceQuantity,
    },
    checkoutItems,
    totals: {
      grossTotalCents,
      netTotalCents,
      paidTotalCents,
      remainingCents,
    },
    discount: {
      value: discountValue,
      onChange: setDiscountBRL,
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
    acquirers: {
      data: acquirers,
      loading: acquirersLoading,
      error: acquirersError,
    },
    submitting,
    hasItems,
    requireContractSelection,
    canFinalize,
    onFinalize: handleFinalize,
  };
};
