import * as admin from "firebase-admin";

type BranchAutomationSettings = {
  idTenant: string;
  idBranch: string;
  inactiveAfterRenewalDays: number;
  attendanceSummaryAtMidnight: boolean;
  abandonmentRiskEnabled: boolean;
  abandonmentRiskDays: number;
  autoCloseCashierAtMidnight: boolean;
  cancelContractsAfterDaysWithoutPayment: number;
};

const DEFAULT_BRANCH_SETTINGS: BranchAutomationSettings = {
  idTenant: "",
  idBranch: "",
  inactiveAfterRenewalDays: 0,
  attendanceSummaryAtMidnight: false,
  abandonmentRiskEnabled: false,
  abandonmentRiskDays: 0,
  autoCloseCashierAtMidnight: false,
  cancelContractsAfterDaysWithoutPayment: 0,
};

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, parsed);
};

const toBoolean = (value: unknown): boolean => Boolean(value);

const normalizeBranchSettings = (
  input: Partial<BranchAutomationSettings>
): BranchAutomationSettings => ({
  idTenant: String(input.idTenant || "").trim(),
  idBranch: String(input.idBranch || "").trim(),
  inactiveAfterRenewalDays: toNumber(input.inactiveAfterRenewalDays),
  attendanceSummaryAtMidnight: toBoolean(input.attendanceSummaryAtMidnight),
  abandonmentRiskEnabled: toBoolean(input.abandonmentRiskEnabled),
  abandonmentRiskDays: toNumber(input.abandonmentRiskDays),
  autoCloseCashierAtMidnight: toBoolean(input.autoCloseCashierAtMidnight),
  cancelContractsAfterDaysWithoutPayment: toNumber(input.cancelContractsAfterDaysWithoutPayment),
});

const resolveBranchSettings = (
  settingsByBranch: Map<string, BranchAutomationSettings>,
  idTenant: string,
  idBranch: string
): BranchAutomationSettings =>
  settingsByBranch.get(idBranch) || {
    ...DEFAULT_BRANCH_SETTINGS,
    idTenant,
    idBranch,
  };

const loadBranchSettingsMap = async (
  db: admin.firestore.Firestore,
  idTenant: string
): Promise<{
  branchDocs: admin.firestore.QueryDocumentSnapshot[];
  settingsByBranch: Map<string, BranchAutomationSettings>;
}> => {
  const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

  const branchDocs = branchesSnap.docs;
  const settingsByBranch = new Map<string, BranchAutomationSettings>();

  if (!branchDocs.length) {
    return { branchDocs, settingsByBranch };
  }

  const refs = branchDocs.map((doc) => doc.ref.collection("settings").doc("automation"));
  const settingsSnaps = await db.getAll(...refs);

  settingsSnaps.forEach((snap, index) => {
    const idBranch = String(branchDocs[index]?.id || "");
    if (!idBranch) return;
    const data = snap.exists ? snap.data() : {};
    settingsByBranch.set(
      idBranch,
      normalizeBranchSettings({
        ...DEFAULT_BRANCH_SETTINGS,
        ...(data as Partial<BranchAutomationSettings>),
        idTenant,
        idBranch,
      })
    );
  });

  branchDocs.forEach((doc) => {
    if (!settingsByBranch.has(doc.id)) {
      settingsByBranch.set(doc.id, {
        ...DEFAULT_BRANCH_SETTINGS,
        idTenant,
        idBranch: doc.id,
      });
    }
  });

  return { branchDocs, settingsByBranch };
};

export { BranchAutomationSettings, loadBranchSettingsMap, resolveBranchSettings };
