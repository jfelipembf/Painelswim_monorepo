import { useCallback, useMemo } from "react";
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import { GENDER_LABELS, ROLE_LABELS, STATUS_LABELS } from "../../../constants";

export const useUsersService = () => {
  const backend = getFirebaseBackend();

  const guardBackend = useCallback(() => {
    if (!backend) {
      throw new Error("Firebase não inicializado. Verifique REACT_APP_DEFAULTAUTH.");
    }
    return backend;
  }, [backend]);

  const createUser = useCallback(
    async (payload) => {
      const service = guardBackend();
      return service.createUserWithDetails(payload);
    },
    [guardBackend]
  );

  const listUsers = useCallback(async () => {
    const service = guardBackend();
    return service.listUsers ? service.listUsers() : [];
  }, [guardBackend]);

  const genderOptions = useMemo(
    () => Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label })),
    []
  );

  const roleOptions = useMemo(
    () => Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
    []
  );

  const statusOptions = useMemo(
    () => Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
    []
  );

  return {
    createUser,
    listUsers,
    genderOptions,
    roleOptions,
    statusOptions,
  };
};
