import { useCallback, useState } from "react";

const initialDeleteModal = {
  isOpen: false,
  item: null,
};

/**
 * Hook genérico para carregar dados em tabelas.
 * Recebe outro hook (por exemplo, useMemberList) que devolve uma função de carregamento.
 */
export const useTableData = (useDataProvider) => {
  const provider = useDataProvider();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const [deleteModal, setDeleteModal] = useState(initialDeleteModal);
  const [deleting, setDeleting] = useState(false);

  const loadItems = useCallback(
    async (options = {}) => {
      setLoading(true);
      setError(null);
      try {
        const response = await provider(options);
        setItems(response?.data || []);
        setHasMore(Boolean(response?.hasMore));
        setLoaded(true);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [provider]
  );

  const handleAction = useCallback((action, payload) => {
    if (action === "delete") {
      setDeleteModal({ isOpen: true, item: payload });
    }
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal(initialDeleteModal);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteModal.item || typeof provider?.remove !== "function") {
      closeDeleteModal();
      return;
    }

    setDeleting(true);
    try {
      await provider.remove(deleteModal.item);
      await loadItems();
    } catch (err) {
      console.error("Failed to delete item", err);
    } finally {
      setDeleting(false);
      closeDeleteModal();
    }
  }, [deleteModal.item, closeDeleteModal, loadItems, provider]);

  return {
    members: items,
    membersLoading: loading,
    membersLoaded: loaded,
    membersError: error,
    hasMore,
    loadMembers: loadItems,
    handleAction,
    deleteModal,
    closeDeleteModal,
    handleConfirmDelete,
    deleting,
  };
};
