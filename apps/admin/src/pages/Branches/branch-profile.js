import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Col,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
} from "reactstrap";
import classnames from "classnames";
import { useLocation, useParams } from "react-router-dom";

import { createBranchCustomerPortalSession, getBranchBillingStatus } from "../../services/payments";
import { useTenantBranches } from "../../hooks/clients/useTenantBranches";
import { getTenant } from "../../modules/tenants";

import BranchDetailsTab from "./tabs/BranchDetailsTab";
import BranchBillingTab from "./tabs/BranchBillingTab";

export const BranchProfile = () => {
  document.title = "Perfil da filial";

  const { id } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const tenantIdFromQuery = query.get("tenantId") || "";
  const { getBranchById, updateBranch } = useTenantBranches();

  const [activeTab, setActiveTab] = useState("details");
  const [branch, setBranch] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [error, setError] = useState("");
  const [loadingBranch, setLoadingBranch] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [billing, setBilling] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setError("");
    setLoadingBranch(true);

    getBranchById({ branchId: id, tenantId: tenantIdFromQuery || undefined })
      .then((data) => {
        if (mounted) setBranch(data);
      })
      .catch((err) => {
        if (mounted) setError(String(err?.message || err));
      })
      .finally(() => {
        if (mounted) setLoadingBranch(false);
      });

    return () => {
      mounted = false;
    };
  }, [getBranchById, id, tenantIdFromQuery]);

  useEffect(() => {
    let mounted = true;
    const resolvedTenantId = branch?.tenantId || tenantIdFromQuery;
    if (!resolvedTenantId) {
      setTenant(null);
      return;
    }

    getTenant(resolvedTenantId)
      .then((data) => {
        if (mounted) setTenant(data);
      })
      .catch(() => {
        if (mounted) setTenant(null);
      });

    return () => {
      mounted = false;
    };
  }, [branch?.tenantId, tenantIdFromQuery]);

  const loadBilling = async () => {
    setBillingLoading(true);
    setError("");
    try {
      const data = await getBranchBillingStatus({ branchId: id });
      setBilling(data);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setBillingLoading(false);
    }
  };

  const handleSave = async (updates) => {
    if (!branch?.tenantId) {
      setSaveError("TenantId não encontrado para esta unidade.");
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      await updateBranch({ tenantId: branch.tenantId, branchId: id, updates });
      const refreshed = await getBranchById(id);
      setBranch(refreshed);
      setActiveTab("details");
    } catch (err) {
      setSaveError(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  const openPortal = async () => {
    setError("");
    try {
      const result = await createBranchCustomerPortalSession({
        branchId: id,
        returnUrl: window.location.href,
      });
      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      setError(String(err?.message || err));
    }
  };

  return (
    <Row>
      <Col lg={12}>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {saveError ? <Alert color="danger">{saveError}</Alert> : null}

        <Card className="mb-4">
          <CardBody>
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
              <div>
                <h4 className="mb-1">{branch?.name || "Filial"}</h4>
                <div className="text-muted">ID: {id}</div>
                <div className="text-muted">Tenant: {branch?.tenantId || "—"}</div>
              </div>
              {loadingBranch ? <div className="text-muted">Carregando...</div> : null}
            </div>

            {!loadingBranch && !branch ? (
              <Alert color="warning" className="mb-0">
                Unidade não encontrada.
              </Alert>
            ) : null}

            {branch ? (
              <>

            <Nav tabs>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === "details" })}
                  onClick={() => setActiveTab("details")}
                >
                  Dados
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === "billing" })}
                  onClick={() => {
                    setActiveTab("billing");
                    if (!billing && !billingLoading) {
                      loadBilling();
                    }
                  }}
                >
                  Pagamentos
                </NavLink>
              </NavItem>
            </Nav>

            <TabContent activeTab={activeTab} className="pt-3">
              <TabPane tabId="details">
                <BranchDetailsTab
                  branch={branch}
                  tenant={tenant}
                  saving={saving}
                  onSave={handleSave}
                />
              </TabPane>

              <TabPane tabId="billing">
                <BranchBillingTab
                  branchId={id}
                  billing={billing}
                  billingLoading={billingLoading}
                  onRefresh={loadBilling}
                  onOpenPortal={openPortal}
                  onLoad={loadBilling}
                  error={error}
                />
              </TabPane>
            </TabContent>

              </>
            ) : null}
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default BranchProfile;
