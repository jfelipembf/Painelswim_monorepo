import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";
export type AuthRole = "owner" | "manager" | "staff" | "viewer";

export type AuthUser = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  role?: AuthRole;
  idTenant?: string;
  branchIds?: string[];
};

export type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthLoading(state) {
      state.status = "loading";
      state.error = null;
    },
    setAuthUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.status = "authenticated";
      state.error = null;
    },
    clearAuth(state) {
      state.user = null;
      state.status = "unauthenticated";
      state.error = null;
    },
    setAuthError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.status = "unauthenticated";
    },
  },
});

export const { setAuthLoading, setAuthUser, clearAuth, setAuthError } = authSlice.actions;

export default authSlice.reducer;
