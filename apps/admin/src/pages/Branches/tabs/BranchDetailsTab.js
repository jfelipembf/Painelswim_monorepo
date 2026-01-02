import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Form, FormGroup, Input, Label, Row } from "reactstrap";
import AvatarUploadCard from "../../../components/Common/AvatarUploadCard";
import { fetchNormalizedAddress } from "../../Users/utils/address";

const formatDate = (value) => {
  try {
    return value?.toDate?.()?.toLocaleDateString("pt-BR") || "—";
  } catch {
    return "—";
  }
};

export const BranchDetailsTab = ({ branch, tenant, saving, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    cnpj: "",
    status: "",
    timezone: "America/Sao_Paulo",
    cep: "",
    estado: "",
    cidade: "",
    bairro: "",
    numero: "",
  });

  const fullUrl = useMemo(() => {
    const base = process.env.REACT_APP_APP_URL || "https://app.painelswim.com/";
    const tenantSlug = tenant?.slug || "";
    const branchSlug = branch?.slug || "";
    if (!tenantSlug || !branchSlug) return "—";
    const safeBase = base.endsWith("/") ? base : `${base}/`;
    return `${safeBase}${tenantSlug}/${branchSlug}`;
  }, [branch?.slug, tenant?.slug]);

  useEffect(() => {
    setForm({
      name: branch?.name || "",
      slug: branch?.slug || "",
      cnpj: branch?.cnpj || "",
      status: branch?.status || "",
      timezone: branch?.timezone || "America/Sao_Paulo",
      cep: branch?.address?.cep || "",
      estado: branch?.address?.estado || branch?.address?.state || "",
      cidade: branch?.address?.cidade || branch?.address?.city || "",
      bairro: branch?.address?.bairro || "",
      numero: branch?.address?.numero || "",
    });
    setLogoPreview(branch?.logoUrl || "");
    setLogoFile(null);
    setEditing(false);
  }, [branch?.id]);

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const setField = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleLogoSelect = (file) => {
    setLogoFile(file || null);
    if (logoPreview && logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoPreview(branch?.logoUrl || "");
    }
  };

  const handleCepBlur = async () => {
    try {
      const { normalizedCep, address } = await fetchNormalizedAddress(form.cep);
      setForm((prev) => ({ ...prev, cep: normalizedCep }));
      if (!address) return;
      setForm((prev) => ({
        ...prev,
        estado: address.estado || prev.estado,
        cidade: address.cidade || prev.cidade,
        bairro: address.bairro || prev.bairro,
      }));
    } catch {
      // noop
    }
  };

  const cancelEdit = () => {
    setForm({
      name: branch?.name || "",
      slug: branch?.slug || "",
      cnpj: branch?.cnpj || "",
      status: branch?.status || "",
      timezone: branch?.timezone || "America/Sao_Paulo",
      cep: branch?.address?.cep || "",
      estado: branch?.address?.estado || branch?.address?.state || "",
      cidade: branch?.address?.cidade || branch?.address?.city || "",
      bairro: branch?.address?.bairro || "",
      numero: branch?.address?.numero || "",
    });
    setLogoPreview(branch?.logoUrl || "");
    setLogoFile(null);
    setEditing(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    await onSave?.({
      name: form.name,
      cnpj: form.cnpj,
      timezone: form.timezone,
      address: {
        cep: form.cep,
        estado: form.estado,
        cidade: form.cidade,
        bairro: form.bairro,
        numero: form.numero,
      },
      ...(logoFile ? { logoFile } : {}),
    });
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div className="text-muted">URL completa</div>
          <div>
            <code>{fullUrl}</code>
          </div>
        </div>
        {!editing ? (
          <Button color="light" onClick={() => setEditing(true)}>
            <i className="mdi mdi-pencil"></i>
          </Button>
        ) : (
          <div className="d-flex gap-2">
            <Button color="secondary" onClick={cancelEdit} disabled={saving}>
              Cancelar
            </Button>
            <Button color="primary" onClick={submit} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )}
      </div>

      <Form onSubmit={submit}>
        <Row className="g-4">
          <Col md={4}>
            <Label className="d-block mb-2">Logo</Label>
            <AvatarUploadCard
              imageUrl={logoPreview || undefined}
              defaultImage={null}
              loading={Boolean(saving)}
              onSelectFile={editing ? handleLogoSelect : undefined}
              accept="image/*"
              size="lg"
              variant="rounded"
              mt={0}
            />
          </Col>
          <Col md={8}>
            <Row className="g-3">
              <Col md={6}>
                <FormGroup>
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={setField("name")} disabled={!editing} />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Status</Label>
                  <Input value={form.status || "—"} disabled />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Slug</Label>
                  <Input value={form.slug} disabled />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Timezone</Label>
                  <Input value={form.timezone} onChange={setField("timezone")} disabled={!editing} />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>CNPJ</Label>
                  <Input value={form.cnpj} onChange={setField("cnpj")} disabled={!editing} />
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-3 mt-1">
              <Col md={4}>
                <FormGroup>
                  <Label>CEP</Label>
                  <Input
                    value={form.cep}
                    onChange={setField("cep")}
                    onBlur={editing ? handleCepBlur : undefined}
                    disabled={!editing}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label>Estado</Label>
                  <Input value={form.estado} onChange={setField("estado")} disabled={!editing} />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label>Cidade</Label>
                  <Input value={form.cidade} onChange={setField("cidade")} disabled={!editing} />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Bairro</Label>
                  <Input value={form.bairro} onChange={setField("bairro")} disabled={!editing} />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Número</Label>
                  <Input value={form.numero} onChange={setField("numero")} disabled={!editing} />
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-3 mt-1">
              <Col md={6}>
                <div className="text-muted">Criado em</div>
                <div>{formatDate(branch?.createdAt)}</div>
              </Col>
              <Col md={6}>
                <div className="text-muted">Atualizado em</div>
                <div>{formatDate(branch?.updatedAt)}</div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Form>
    </>
  );
};

export default BranchDetailsTab;
