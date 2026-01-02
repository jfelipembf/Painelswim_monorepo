import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type TenantStatus = "idle" | "loading" | "ready" | "error";

export type TenantBranding = {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
};

export type TenantState = {
  idTenant: string | null;
  slug: string | null;
  branding: TenantBranding | null;
  status: TenantStatus;
  error: string | null;
};

const initialState: TenantState = {
  idTenant: null,
  slug: null,
  branding: null,
  status: "idle",
  error: null,
};

type SetTenantPayload = {
  idTenant: string;
  slug?: string;
  branding?: TenantBranding | null;
};

const tenantSlice = createSlice({
  name: "tenant",
  initialState,
  reducers: {
    setTenantLoading(state) {
      state.status = "loading";
      state.error = null;
    },
    setTenant(state, action: PayloadAction<SetTenantPayload>) {
      state.idTenant = action.payload.idTenant;
      state.slug = action.payload.slug ?? state.slug;
      state.branding =
        action.payload.branding === undefined ? state.branding : action.payload.branding;
      state.status = "ready";
      state.error = null;
    },
    setTenantSlug(state, action: PayloadAction<string>) {
      state.slug = action.payload;
    },
    setTenantError(state, action: PayloadAction<string>) {
      state.status = "error";
      state.error = action.payload;
    },
    clearTenant(state) {
      state.idTenant = null;
      state.slug = null;
      state.branding = null;
      state.status = "idle";
      state.error = null;
    },
  },
});

export const { setTenantLoading, setTenant, setTenantSlug, setTenantError, clearTenant } =
  tenantSlice.actions;

export default tenantSlice.reducer;
