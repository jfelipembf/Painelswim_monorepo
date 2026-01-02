import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import branchReducer from "./slices/branchSlice";
import permissionsReducer from "./slices/permissionsSlice";
import tenantReducer from "./slices/tenantSlice";
import dateReducer from "./slices/dateSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tenant: tenantReducer,
    branch: branchReducer,
    permissions: permissionsReducer,
    date: dateReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
