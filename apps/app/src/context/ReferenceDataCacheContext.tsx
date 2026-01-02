import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { collection, onSnapshot, type Unsubscribe } from "firebase/firestore";

import { useAppSelector } from "../redux/hooks";
import { getFirebaseDb } from "../services/firebase";

import type { Activity } from "../modules/activities/activities.types";
import type { Area } from "../modules/areas/areas.types";

type ReferenceDataCacheValue = {
  activitiesById: Record<string, Activity>;
  areasById: Record<string, Area>;
  getActivity: (activityId: string) => Activity | null;
  getArea: (areaId: string) => Area | null;
};

const ReferenceDataCacheContext = createContext<ReferenceDataCacheValue | null>(null);
ReferenceDataCacheContext.displayName = "ReferenceDataCacheContext";

const mapActivities = (
  idTenant: string,
  idBranch: string,
  docs: Array<{ id: string; data: any }>
): Record<string, Activity> => {
  const map: Record<string, Activity> = {};
  docs.forEach(({ id, data }) => {
    map[id] = {
      id,
      idTenant: data?.idTenant || idTenant,
      idBranch: String(data?.idBranch || idBranch),
      name: String(data?.name || ""),
      description: data?.description ? String(data.description) : "",
      color: String(data?.color || ""),
      status: data?.status === "inactive" ? "inactive" : "active",
      shareWithOtherUnits: Boolean(data?.shareWithOtherUnits),
      photoUrl: data?.photoUrl ? String(data.photoUrl) : undefined,
      objectives: [],
      createdAt: data?.createdAt,
      updatedAt: data?.updatedAt,
    };
  });
  return map;
};

const mapAreas = (
  idTenant: string,
  idBranch: string,
  docs: Array<{ id: string; data: any }>
): Record<string, Area> => {
  const map: Record<string, Area> = {};
  docs.forEach(({ id, data }) => {
    map[id] = {
      id,
      idTenant: data?.idTenant || idTenant,
      idBranch: String(data?.idBranch || idBranch),
      name: String(data?.name || ""),
      lengthMeters: Number(data?.lengthMeters || 0),
      widthMeters: Number(data?.widthMeters || 0),
      maxCapacity: Number(data?.maxCapacity || 0),
      inactive: Boolean(data?.inactive),
      createdAt: data?.createdAt,
      updatedAt: data?.updatedAt,
    };
  });
  return map;
};

export function ReferenceDataCacheProvider({ children }: { children: ReactNode }): JSX.Element {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const [activitiesById, setActivitiesById] = useState<Record<string, Activity>>({});
  const [areasById, setAreasById] = useState<Record<string, Area>>({});

  useEffect(() => {
    if (!idTenant || !idBranch) {
      setActivitiesById({});
      setAreasById({});
      return;
    }

    const db = getFirebaseDb();

    const unsubscribers: Unsubscribe[] = [];

    const activitiesRef = collection(db, "tenants", idTenant, "branches", idBranch, "activities");
    unsubscribers.push(
      onSnapshot(activitiesRef, (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
        setActivitiesById(mapActivities(idTenant, idBranch, docs));
      })
    );

    const areasRef = collection(db, "tenants", idTenant, "branches", idBranch, "areas");
    unsubscribers.push(
      onSnapshot(areasRef, (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
        setAreasById(mapAreas(idTenant, idBranch, docs));
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [idBranch, idTenant]);

  const value = useMemo<ReferenceDataCacheValue>(() => {
    return {
      activitiesById,
      areasById,
      getActivity: (activityId: string) => {
        const id = String(activityId || "").trim();
        return id ? activitiesById[id] ?? null : null;
      },
      getArea: (areaId: string) => {
        const id = String(areaId || "").trim();
        return id ? areasById[id] ?? null : null;
      },
    };
  }, [activitiesById, areasById]);

  return (
    <ReferenceDataCacheContext.Provider value={value}>
      {children}
    </ReferenceDataCacheContext.Provider>
  );
}

export const useReferenceDataCache = (): ReferenceDataCacheValue => {
  const ctx = useContext(ReferenceDataCacheContext);
  if (!ctx) {
    throw new Error("useReferenceDataCache deve ser usado dentro de ReferenceDataCacheProvider.");
  }
  return ctx;
};
