import { useCallback } from "react";
import { useUsersService } from "./useUsers";

export const useUsersTableProvider = () => {
  const { listUsers } = useUsersService();

  return useCallback(async () => {
    const data = await listUsers();
    return {
      data: data || [],
      hasMore: false,
    };
  }, [listUsers]);
};
