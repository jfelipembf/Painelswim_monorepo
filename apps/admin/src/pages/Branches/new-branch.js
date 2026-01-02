import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Form, Input, Label, Row } from "reactstrap";
import { useLocation, useNavigate } from "react-router-dom";

import { useBranches } from "../../hooks/clients/useBranches";
import { useTenants } from "../../hooks/clients/useTenants";

const useQuery = () => new URLSearchParams(useLocation().search);

export const NewBranch = () => {
  document.title = "Nova filial";

  const navigate = useNavigate();
  const query = useQuery();
  const presetTenantId = query.get("tenantId") || "";

  const { createBranch, statusOptions } = useBranches();
  const { loadTenants } = useTenants();

  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({
    tenantId: presetTenantId,
    name: "",
    status: "active",
    timezone: "America/Sao_Paulo",
  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadTenants()
      .then((data) => {
        if (mounted) setTenants(data || []);
      })
      .catch(() => {
        if (mounted) setTenants([]);
      });
    return () => {
      mounted = false;
    };
  }, [loadTenants]);

  const onChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const created = await createBranch(form);
      setSuccess("Filial criada com sucesso.");
      navigate(`/branches/${created.id}`);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Row>
      <Col lg={12}>
        <Card className="mb-4">
          <CardBody>
            {success ? <Alert color="success">{success}</Alert> : null}
            {error ? <Alert color="danger">{error}</Alert> : null}

            <Form onSubmit={onSubmit}>
              <Row className="g-3">
                <Col md={6}>
                  <Label>Academia (Tenant)</Label>
                  <Input type="select" value={form.tenantId} onChange={onChange("tenantId")}>
                    <option value="">Selecione</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Input>
                </Col>

                <Col md={6}>
                  <Label>Nome da filial</Label>
                  <Input value={form.name} onChange={onChange("name")} />
                </Col>

                <Col md={4}>
                  <Label>Status</Label>
                  <Input type="select" value={form.status} onChange={onChange("status")}>
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Input>
                </Col>

                <Col md={4}>
                  <Label>Timezone</Label>
                  <Input value={form.timezone} onChange={onChange("timezone")} />
                </Col>
              </Row>

              <div className="d-flex justify-content-end mt-4">
                <Button color="primary" type="submit" disabled={saving}>
                  Salvar
                </Button>
              </div>
            </Form>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default NewBranch;
