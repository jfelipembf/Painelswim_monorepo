import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { getFirebaseDb } from "../../services/firebase";
import { DEFAULT_BRANCH_SETTINGS, normalizeBranchSettings } from "./branchSettings.domain";
import type { BranchAutomationSettings } from "./branchSettings.types";

const settingsRef = (idTenant: string, idBranch: string) =>
  doc(getFirebaseDb(), "tenants", idTenant, "branches", idBranch, "settings", "automation");

export const fetchBranchSettings = async (
  idTenant: string,
  idBranch: string
): Promise<BranchAutomationSettings> => {
  if (!idTenant || !idBranch) {
    return DEFAULT_BRANCH_SETTINGS;
  }

  const snap = await getDoc(settingsRef(idTenant, idBranch));
  if (!snap.exists()) {
    return {
      ...DEFAULT_BRANCH_SETTINGS,
      idTenant,
      idBranch,
    };
  }

  return normalizeBranchSettings({
    ...DEFAULT_BRANCH_SETTINGS,
    ...(snap.data() as Partial<BranchAutomationSettings>),
    idTenant,
    idBranch,
  });
};

export const saveBranchSettings = async (
  idTenant: string,
  idBranch: string,
  settings: Partial<BranchAutomationSettings>
): Promise<void> => {
  if (!idTenant || !idBranch) {
    throw new Error("Tenant/unidade não identificados.");
  }

  const normalized = normalizeBranchSettings({
    ...DEFAULT_BRANCH_SETTINGS,
    ...settings,
    idTenant,
    idBranch,
  });

  await setDoc(
    settingsRef(idTenant, idBranch),
    {
      ...normalized,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};
