import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type BillingStatus = "unknown" | "active" | "past_due" | "canceled";
export type BranchStatus = "idle" | "loading" | "ready" | "error";

export type Branch = {
  idBranch: string;
  name: string;
  billingStatus?: BillingStatus;
};

export type BranchState = {
  idBranch: string | null;
  branches: Branch[];
  billingStatus: BillingStatus;
  status: BranchStatus;
  error: string | null;
};

const initialState: BranchState = {
  idBranch: null,
  branches: [],
  billingStatus: "unknown",
  status: "idle",
  error: null,
};

type SetActiveBranchPayload = {
  idBranch: string;
  billingStatus?: BillingStatus;
};

const branchSlice = createSlice({
  name: "branch",
  initialState,
  reducers: {
    setBranchLoading(state) {
      state.status = "loading";
      state.error = null;
    },
    setBranches(state, action: PayloadAction<Branch[]>) {
      state.branches = action.payload;
      state.status = "ready";
      state.error = null;
    },
    setActiveBranch(state, action: PayloadAction<SetActiveBranchPayload>) {
      state.idBranch = action.payload.idBranch;
      if (action.payload.billingStatus) {
        state.billingStatus = action.payload.billingStatus;
        return;
      }

      const matched = state.branches.find((branch) => branch.idBranch === action.payload.idBranch);
      state.billingStatus = matched?.billingStatus ?? "unknown";
    },
    setBillingStatus(state, action: PayloadAction<BillingStatus>) {
      state.billingStatus = action.payload;
    },
    setBranchError(state, action: PayloadAction<string>) {
      state.status = "error";
      state.error = action.payload;
    },
    clearBranch(state) {
      state.idBranch = null;
      state.branches = [];
      state.billingStatus = "unknown";
      state.status = "idle";
      state.error = null;
    },
  },
});

export const {
  setBranchLoading,
  setBranches,
  setActiveBranch,
  setBillingStatus,
  setBranchError,
  clearBranch,
} = branchSlice.actions;

export default branchSlice.reducer;
