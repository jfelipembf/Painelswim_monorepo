import { useCallback, useEffect, useMemo, useState } from "react";

import { useToast } from "context/ToastContext";
import { useConfirmDialog } from "hooks/useConfirmDialog";
import {
  createContract,
  deleteContract,
  updateContract,
  useContracts,
  type Contract,
} from "hooks/contracts";

import { useAppSelector } from "../../../../../redux/hooks";

import { CONTRACT_FORM_INITIAL_VALUES } from "../constants";
import { buildContractPayload, toContractFormValues } from "../utils";
import type { ContractFormValues } from "../types";

export const useContractsPage = () => {
  const idTenant = useAppSelector((state) => state.tenant.idTenant);
  const { idBranch, branches } = useAppSelector((state) => state.branch);

  const { showError, showSuccess } = useToast();

  const {
    data: contracts,
    loading: contractsLoading,
    error: contractsError,
    refetch,
  } = useContracts({ idBranch, activeOnly: false });

  useEffect(() => {
    if (contractsError) {
      showError(contractsError);
    }
  }, [contractsError, showError]);

  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ContractFormValues>({
    ...CONTRACT_FORM_INITIAL_VALUES,
  });
  const [isSaving, setIsSaving] = useState(false);

  const confirmDialog = useConfirmDialog();

  const availableBranches = useMemo(() => {
    return (branches || []).map((b: any) => ({ id: b.idBranch, name: b.name }));
  }, [branches]);

  const handleSelectContract = useCallback((contract: Contract) => {
    setSelectedContractId(contract.id);
    setFormValues(toContractFormValues(contract));
  }, []);

  const handleNewContract = useCallback(() => {
    setSelectedContractId(null);
    setFormValues({ ...CONTRACT_FORM_INITIAL_VALUES });
  }, []);

  const handleDeleteContract = useCallback(
    async (contract: Contract) => {
      if (!idTenant) {
        showError("Academia não identificada.");
        return;
      }

      if (!idBranch) {
        showError("Unidade não identificada.");
        return;
      }

      const ok = await confirmDialog.confirm({
        title: "Excluir contrato",
        description: `Deseja excluir o contrato \"${String(contract?.name || "")}\"?`,
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmColor: "error",
      });

      if (!ok) {
        return;
      }

      setIsSaving(true);
      try {
        await deleteContract(idTenant, idBranch, String(contract.id));
        if (selectedContractId === contract.id) {
          handleNewContract();
        }
        await refetch();
        showSuccess("Contrato excluído!");
      } catch (e: unknown) {
        showError(e instanceof Error ? e.message : "Não foi possível excluir o contrato.");
      } finally {
        setIsSaving(false);
      }
    },
    [
      confirmDialog,
      handleNewContract,
      idBranch,
      idTenant,
      refetch,
      selectedContractId,
      showError,
      showSuccess,
    ]
  );

  const handleFieldValueChange = useCallback((field: keyof ContractFormValues, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!idTenant || !idBranch) {
      showError("Academia ou unidade não identificada.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildContractPayload(formValues, idBranch);

      if (selectedContractId) {
        await updateContract(idTenant, idBranch, selectedContractId, payload);
        showSuccess("Contrato atualizado!");
      } else {
        const id = await createContract(idTenant, idBranch, payload);
        setSelectedContractId(id);
        showSuccess("Contrato criado!");
      }

      await refetch();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Não foi possível salvar o contrato.");
    } finally {
      setIsSaving(false);
    }
  }, [formValues, idBranch, idTenant, refetch, selectedContractId, showError, showSuccess]);

  return {
    contracts,
    contractsLoading,
    contractsError,
    refetch,
    availableBranches,
    selectedContractId,
    formValues,
    isSaving,
    handleSelectContract,
    handleNewContract,
    handleDeleteContract,
    handleFieldValueChange,
    handleSubmit,
    confirmDialog,
    idBranch,
  };
};
