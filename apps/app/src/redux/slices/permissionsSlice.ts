import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type PermissionStatus = "idle" | "loading" | "ready" | "error";

export type PermissionsState = {
  permissions: Record<string, boolean>;
  allowAll: boolean;
  status: PermissionStatus;
  error: string | null;
};

const initialState: PermissionsState = {
  permissions: {},
  allowAll: false,
  status: "idle",
  error: null,
};

type SetPermissionsPayload = {
  permissions: Record<string, boolean>;
  allowAll?: boolean;
};

const permissionsSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    setPermissionsLoading(state) {
      state.status = "loading";
      state.error = null;
    },
    setPermissions(state, action: PayloadAction<SetPermissionsPayload>) {
      state.permissions = action.payload.permissions;
      state.allowAll = Boolean(action.payload.allowAll);
      state.status = "ready";
      state.error = null;
    },
    setPermissionsError(state, action: PayloadAction<string>) {
      state.status = "error";
      state.error = action.payload;
    },
    clearPermissions(state) {
      state.permissions = {};
      state.allowAll = false;
      state.status = "idle";
      state.error = null;
    },
  },
});

export const { setPermissionsLoading, setPermissions, setPermissionsError, clearPermissions } =
  permissionsSlice.actions;

export default permissionsSlice.reducer;
