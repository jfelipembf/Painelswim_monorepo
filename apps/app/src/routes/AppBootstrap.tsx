import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { clearAuth, setAuthError, setAuthLoading, setAuthUser } from "../redux/slices/authSlice";
import {
  clearBranch,
  setActiveBranch,
  setBranchError,
  setBranchLoading,
  setBranches,
} from "../redux/slices/branchSlice";
import {
  clearPermissions,
  setPermissions,
  setPermissionsError,
  setPermissionsLoading,
} from "../redux/slices/permissionsSlice";
import { setTenant, setTenantError, setTenantLoading } from "../redux/slices/tenantSlice";
import { startAuthListener } from "../services/auth";
import { fetchBranchesForUser, findBranchBySlug } from "../services/branches";
import { fetchUserPermissions } from "../services/permissions";
import { resolveTenantBySlug } from "../services/tenants";
import { getBranchSlugFromPath } from "../utils/branchResolver";

type AppBootstrapProps = {
  children: JSX.Element;
};

const getBranchStorageKey = (idTenant: string): string => `activeBranchId:${idTenant}`;

const readStoredBranchId = (idTenant: string): string | null => {
  if (!idTenant) {
    return null;
  }

  try {
    return localStorage.getItem(getBranchStorageKey(idTenant));
  } catch {
    return null;
  }
};

const writeStoredBranchId = (idTenant: string, idBranch: string): void => {
  if (!idTenant || !idBranch) {
    return;
  }

  try {
    localStorage.setItem(getBranchStorageKey(idTenant), idBranch);
  } catch {
    // Ignore storage errors (private mode, blocked storage, etc).
  }
};

const AppBootstrap = ({ children }: AppBootstrapProps) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { slug, idTenant } = useAppSelector((state) => state.tenant);
  const { user } = useAppSelector((state) => state.auth);
  const { idBranch } = useAppSelector((state) => state.branch);
  const branchFetchKeyRef = useRef<string | null>(null);
  const permissionsFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!slug) {
      return;
    }

    let active = true;
    dispatch(setTenantLoading());

    resolveTenantBySlug(slug)
      .then((tenant) => {
        if (!active) {
          return;
        }
        dispatch(
          setTenant({
            idTenant: tenant.idTenant,
            slug: tenant.slug,
            branding: tenant.branding ?? null,
          })
        );
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Erro ao carregar academia.";
        dispatch(setTenantError(message));
      });

    return () => {
      active = false;
    };
  }, [dispatch, slug]);

  useEffect(() => {
    dispatch(setAuthLoading());

    let unsubscribe = () => {};
    try {
      unsubscribe = startAuthListener((currentUser) => {
        if (currentUser) {
          dispatch(setAuthUser(currentUser));
          return;
        }
        dispatch(clearAuth());
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao iniciar autenticação.";
      dispatch(setAuthError(message));
    }

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!user?.uid) {
      branchFetchKeyRef.current = null;
      dispatch(clearBranch());
      permissionsFetchKeyRef.current = null;
      dispatch(clearPermissions());
      return;
    }

    if (!idTenant) {
      return;
    }

    const fetchKey = `${idTenant}:${user.uid}`;

    if (branchFetchKeyRef.current === fetchKey) {
      return;
    }

    branchFetchKeyRef.current = fetchKey;
    let active = true;
    dispatch(setBranchLoading());

    fetchBranchesForUser(idTenant, user.uid)
      .then(async (branches) => {
        if (!active) {
          return;
        }
        
        dispatch(setBranches(branches));

        if (branches.length === 0) {
          return;
        }

        // Tentar resolver branch slug da URL
        const branchSlugFromUrl = getBranchSlugFromPath(location.pathname);
        let branchFromUrl = null;

        if (branchSlugFromUrl) {
          // Primeiro tentar encontrar nas branches do usuário
          branchFromUrl = branches.find((b) => b.slug === branchSlugFromUrl);
          
          // Se não encontrar, buscar no Firestore (pode ser que o usuário tenha acesso mas não está na lista)
          if (!branchFromUrl) {
            try {
              branchFromUrl = await findBranchBySlug(idTenant, branchSlugFromUrl);
            } catch (error) {
              // Silently fail
            }
          }
        }

        const storedBranchId = readStoredBranchId(idTenant);
        
        const preferred =
          branchFromUrl ||
          branches.find((branch) => branch.idBranch === idBranch) ||
          (storedBranchId
            ? branches.find((branch) => branch.idBranch === storedBranchId)
            : undefined);
        const nextBranch = preferred ?? branches[0];
        
        writeStoredBranchId(idTenant, nextBranch.idBranch);
        dispatch(
          setActiveBranch({
            idBranch: nextBranch.idBranch,
            billingStatus: nextBranch.billingStatus,
          })
        );
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Erro ao carregar unidades.";
        dispatch(setBranchError(message));
      });

    return () => {
      active = false;
    };
  }, [dispatch, idBranch, idTenant, user?.uid]);

  useEffect(() => {
    if (!idTenant || !idBranch) {
      permissionsFetchKeyRef.current = null;
      dispatch(clearPermissions());
      return;
    }

    writeStoredBranchId(idTenant, idBranch);
  }, [idBranch, idTenant]);

  useEffect(() => {
    if (!idTenant || !idBranch || !user?.uid) {
      permissionsFetchKeyRef.current = null;
      dispatch(clearPermissions());
      return;
    }

    const fetchKey = `${idTenant}:${idBranch}:${user.uid}`;
    if (permissionsFetchKeyRef.current === fetchKey) {
      return;
    }

    permissionsFetchKeyRef.current = fetchKey;
    let active = true;
    dispatch(setPermissionsLoading());

    fetchUserPermissions(idTenant, idBranch, user.uid, user.email)
      .then((result) => {
        if (!active) {
          return;
        }
        dispatch(setPermissions(result));
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Erro ao carregar permissoes.";
        dispatch(setPermissionsError(message));
      });

    return () => {
      active = false;
    };
  }, [dispatch, idBranch, idTenant, user?.uid]);

  return children;
};

export default AppBootstrap;
