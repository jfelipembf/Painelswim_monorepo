import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";

import { loadBranchSettingsMap, resolveBranchSettings } from "./branchSettings";
import { addDaysDateKeyUtc, chunk, computeEndAtFromStart, isActiveOn, toDateKeyUtc } from "./utils";

export const dailyMembershipSync = onSchedule(
  {
    schedule: "every day 03:10",
    timeZone: "America/Sao_Paulo",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async () => {
    const db = admin.firestore();
    const todayKey = toDateKeyUtc(new Date());

    const tenantsSnap = await db.collection("tenants").get();
    const tenantIds = tenantsSnap.docs.map((d) => d.id);

    logger.info("dailyMembershipSync:start", {
      todayKey,
      tenants: tenantIds.length,
    });

    for (const idTenant of tenantIds) {
      try {
        const [activePausedSnap, pendingSnap, branchData] = await Promise.all([
          db
            .collectionGroup("memberships")
            .where("idTenant", "==", idTenant)
            .where("status", "in", ["active", "paused"])
            .get(),
          db
            .collectionGroup("memberships")
            .where("idTenant", "==", idTenant)
            .where("status", "==", "pending")
            .get(),
          loadBranchSettingsMap(db, idTenant),
        ]);

        const { branchDocs, settingsByBranch } = branchData;

        const activeClientIdsByBranch = new Map<string, Set<string>>();
        const expiredMembershipRefs: admin.firestore.DocumentReference[] = [];
        const resumeMembershipRefs: admin.firestore.DocumentReference[] = [];

        // Ajustes de encadeamento: se um active/paused tem nextMembershipId,
        // alinhar o startAt do próximo
        const chainedAdjustments: {
          nextRef: admin.firestore.DocumentReference;
          nextStartAtIso: string;
          nextEndAt: string | null;
        }[] = [];

        activePausedSnap.docs.forEach((doc) => {
          const m = doc.data() as admin.firestore.DocumentData;
          const clientId = String(m.clientId || "");
          if (!clientId) return;

          const pathParts = doc.ref.path.split("/");
          const derivedBranchId = String(pathParts?.[3] || "");
          const membershipBranchId = String(m.idBranch || derivedBranchId || "");
          if (!membershipBranchId) return;

          const nextMembershipId = String(m?.nextMembershipId || "");
          const branchSettings = resolveBranchSettings(
            settingsByBranch,
            idTenant,
            membershipBranchId
          );
          const graceDays = nextMembershipId ? 0 : branchSettings.inactiveAfterRenewalDays;

          if (isActiveOn(m, todayKey, graceDays)) {
            const set = activeClientIdsByBranch.get(membershipBranchId) || new Set<string>();
            set.add(clientId);
            activeClientIdsByBranch.set(membershipBranchId, set);
          }

          const endAt = String(m?.endAt || "").slice(0, 10);
          const status = String(m?.status || "");
          const effectiveEndAt = endAt && graceDays ? addDaysDateKeyUtc(endAt, graceDays) : endAt;
          if (status !== "canceled" && endAt && effectiveEndAt < todayKey) {
            expiredMembershipRefs.push(doc.ref);
          }

          if (status === "paused") {
            const pauseUntil = String(m?.pauseUntil || "").slice(0, 10);
            if (pauseUntil && pauseUntil < todayKey) {
              resumeMembershipRefs.push(doc.ref);
            }
          }

          if (nextMembershipId && endAt && /^\d{4}-\d{2}-\d{2}$/.test(endAt)) {
            const expectedStartKey = addDaysDateKeyUtc(endAt, 1);
            const expectedStartIso = `${expectedStartKey}T00:00:00.000Z`;
            const nextPath = doc.ref.path.split("/").slice(0, -1).join("/");
            const nextRef = db.doc(`${nextPath}/${nextMembershipId}`);
            chainedAdjustments.push({
              nextRef,
              nextStartAtIso: expectedStartIso,
              nextEndAt: null,
            });
          }
        });

        for (const refs of chunk(expiredMembershipRefs, 400)) {
          const batch = db.batch();
          refs.forEach((ref) => {
            batch.update(ref, {
              status: "expired",
              statusDateKey: todayKey,
              updatedAt: FieldValue.serverTimestamp(),
            });
          });
          await batch.commit();
        }

        for (const refs of chunk(resumeMembershipRefs, 400)) {
          const batch = db.batch();
          refs.forEach((ref) => {
            batch.update(ref, {
              status: "active",
              statusDateKey: todayKey,
              pauseStartAt: FieldValue.delete(),
              pauseUntil: FieldValue.delete(),
              suspensionDaysCurrent: FieldValue.delete(),
              updatedAt: FieldValue.serverTimestamp(),
            });
          });
          await batch.commit();
        }

        // Ativar memberships pending cuja data já chegou e o anterior
        // (se houver) já acabou.
        const activations: {
          membershipRef: admin.firestore.DocumentReference;
          clientRef: admin.firestore.DocumentReference;
          clientId: string;
          membershipId: string;
          allowCrossBranchAccess: boolean;
          allowedBranchIds: string[];
        }[] = [];

        for (const doc of pendingSnap.docs) {
          const m = doc.data() as admin.firestore.DocumentData;
          const clientId = String(m.clientId || "");
          if (!clientId) continue;

          const startKey = String(m?.startAt || "").slice(0, 10);
          if (!startKey || startKey > todayKey) continue;

          const previousId = String(m?.previousMembershipId || "");
          if (previousId) {
            const parentPath = doc.ref.path.split("/").slice(0, -1).join("/");
            const prevRef = db.doc(`${parentPath}/${previousId}`);
            const prevSnap = await prevRef.get();
            if (prevSnap.exists) {
              const prevData = prevSnap.data() as admin.firestore.DocumentData;
              const prevEnd = String(prevData?.endAt || "").slice(0, 10);
              const prevStatus = String(prevData?.status || "");
              const prevStillActive = prevStatus === "active" || prevStatus === "paused";
              if (prevStillActive && (!prevEnd || prevEnd >= todayKey)) {
                continue;
              }
            }
          }

          const allowCrossBranchAccess = Boolean(m?.allowCrossBranchAccess);
          const allowedBranchIds = Array.isArray(m?.allowedBranchIds)
            ? m.allowedBranchIds.map(String)
            : [];

          const clientRef = doc.ref.parent.parent;
          if (!clientRef) {
            continue;
          }

          activations.push({
            membershipRef: doc.ref,
            clientRef,
            clientId,
            membershipId: doc.id,
            allowCrossBranchAccess,
            allowedBranchIds,
          });
        }

        for (const group of chunk(activations, 400)) {
          const batch = db.batch();
          group.forEach((a) => {
            batch.update(a.membershipRef, {
              status: "active",
              statusDateKey: todayKey,
              updatedAt: FieldValue.serverTimestamp(),
            });
            batch.update(a.clientRef, {
              status: "active",
              activeMembershipId: a.membershipId,
              scheduledMembershipId: FieldValue.delete(),
              access: {
                allowCrossBranchAccess: a.allowCrossBranchAccess,
                allowedBranchIds: a.allowedBranchIds,
              },
              updatedAt: FieldValue.serverTimestamp(),
            });
          });
          await batch.commit();
        }

        // Ajustar startAt/endAt do próximo membership (se existir) quando o
        // endAt do atual muda.
        // (Importante para pausas/suspensões que estendem a data final.)
        const adjustmentsToApply: {
          ref: admin.firestore.DocumentReference;
          startAt: string;
          endAt?: string | null;
        }[] = [];

        for (const adj of chainedAdjustments) {
          const nextSnap = await adj.nextRef.get();
          if (!nextSnap.exists) continue;
          const next = nextSnap.data() as admin.firestore.DocumentData;
          const nextStatus = String(next?.status || "");
          if (nextStatus !== "pending") continue;
          const currentStartIso = String(next?.startAt || "");
          if (String(currentStartIso) === String(adj.nextStartAtIso)) continue;

          const durationType = String(next?.durationType || "month");
          const duration = Number(next?.duration || 1);
          const endAt = computeEndAtFromStart(adj.nextStartAtIso, durationType, duration);

          adjustmentsToApply.push({
            ref: adj.nextRef,
            startAt: adj.nextStartAtIso,
            endAt,
          });
        }

        for (const group of chunk(adjustmentsToApply, 400)) {
          const batch = db.batch();
          group.forEach((u) => {
            batch.update(u.ref, {
              startAt: u.startAt,
              endAt: u.endAt ?? FieldValue.delete(),
              updatedAt: FieldValue.serverTimestamp(),
            });
          });
          await batch.commit();
        }

        for (const branchDoc of branchDocs) {
          const idBranch = String(branchDoc.id || "");
          if (!idBranch) continue;

          const clientsSnap = await db
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("clients")
            .get();

          const activeSet = activeClientIdsByBranch.get(idBranch) || new Set<string>();

          const updates: {
            ref: admin.firestore.DocumentReference;
            status: string;
          }[] = [];

          clientsSnap.docs.forEach((doc) => {
            const data = doc.data() as admin.firestore.DocumentData;
            const current = String(data.status || "pending");
            const shouldBeActive = activeSet.has(doc.id);
            const next = shouldBeActive ? "active" : "inactive";
            if (current !== next) {
              updates.push({ ref: doc.ref, status: next });
            }
          });

          for (const group of chunk(updates, 400)) {
            const batch = db.batch();
            group.forEach((u) => {
              batch.update(u.ref, {
                status: u.status,
                updatedAt: FieldValue.serverTimestamp(),
              });
            });
            await batch.commit();
          }
        }

        logger.info("dailyMembershipSync:tenant_done", {
          idTenant,
          membershipsScanned: activePausedSnap.size,
          expiredMemberships: expiredMembershipRefs.length,
          branchesScanned: branchDocs.length,
        });
      } catch (e: unknown) {
        logger.error("dailyMembershipSync:tenant_error", {
          idTenant,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    logger.info("dailyMembershipSync:done", { todayKey });
  }
);
