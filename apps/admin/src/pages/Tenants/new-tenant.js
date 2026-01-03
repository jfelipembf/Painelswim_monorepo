import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Col,
  Form,
  FormFeedback,
  Input,
  Label,
  Row,
} from "reactstrap";
import { useNavigate } from "react-router-dom";

import { useTenants } from "../../hooks/clients/useTenants";
import AvatarUploadCard from "../../components/Common/AvatarUploadCard";
import { fetchNormalizedAddress } from "../Users/utils/address";

export const NewTenant = () => {
  document.title = "Nova academia";

  const navigate = useNavigate();
  const { createTenant, statusOptions } = useTenants();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    cnpj: "",
    status: "trial",
    cep: "",
    estado: "",
    cidade: "",
    bairro: "",
    numero: "",
    responsaveis: [{ name: "", email: "", phone: "" }],
    ownerPassword: "",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const onChange = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const setResponsible = (index, key, value) => {
    setForm((prev) => {
      const next = [...(prev.responsaveis || [])];
      next[index] = { ...(next[index] || {}), [key]: value };
      return { ...prev, responsaveis: next };
    });
  };

  const addResponsible = () => {
    setForm((prev) => ({
      ...prev,
      responsaveis: [...(prev.responsaveis || []), { name: "", email: "", phone: "" }],
    }));
  };

  const removeResponsible = (index) => {
    setForm((prev) => {
      const next = [...(prev.responsaveis || [])];
      next.splice(index, 1);
      return { ...prev, responsaveis: next.length ? next : [{ name: "", email: "", phone: "" }] };
    });
  };

  const handleLogoSelect = (file) => {
    setLogoFile(file || null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoPreview("");
    }
  };

  const handleCepBlur = async () => {
    try {
      const { normalizedCep, address } = await fetchNormalizedAddress(form.cep);
      setForm((prev) => ({ ...prev, cep: normalizedCep }));

      if (!address) return;
      setForm((prev) => ({
        ...prev,
        estado: address.estado || "",
        cidade: address.cidade || "",
        bairro: address.bairro || "",
      }));
    } catch (err) {
      setError(String(err?.message || err));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});
    setSaving(true);
    try {
      const required = {};
      if (!form.name) required.name = "Obrigatório";
      if (!form.cnpj) required.cnpj = "Obrigatório";
      if (!form.cep) required.cep = "Obrigatório";
      if (!form.numero) required.numero = "Obrigatório";
      if (!form.responsaveis?.[0]?.email) required.resp0email = "Obrigatório";
      if (!form.ownerPassword) required.ownerPassword = "Obrigatório";

      if (Object.keys(required).length) {
        setFieldErrors(required);
        throw new Error("Preencha os campos obrigatórios.");
      }

      const created = await createTenant({
        ...form,
        logoFile,
        address: {
          cep: form.cep,
          estado: form.estado,
          cidade: form.cidade,
          bairro: form.bairro,
          numero: form.numero,
        },
        adminEmail: form.responsaveis?.[0]?.email || "",
        ownerName: form.responsaveis?.[0]?.name || "",
        ownerPassword: form.ownerPassword,
      });
      setSuccess("Academia criada com sucesso.");
      navigate(`/tenants/${created.tenantId}`);
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
              <div className="d-flex flex-wrap flex-md-nowrap gap-3 align-items-start mb-3">
                <div className="flex-shrink-0" style={{ minWidth: 200 }}>
                  <Label className="d-block mb-2">Logo</Label>
                  <AvatarUploadCard
                    imageUrl={logoPreview || undefined}
                    defaultImage={null}
                    loading={saving}
                    onSelectFile={handleLogoSelect}
                    accept="image/*"
                    size="lg"
                    variant="rounded"
                    mt={0}
                  />
                </div>

                <div className="flex-grow-1">
                  <Row className="g-4">
                    <Col md={6}>
                      <Label>Nome</Label>
                      <Input
                        value={form.name}
                        onChange={onChange("name")}
                        invalid={Boolean(fieldErrors.name)}
                      />
                      {fieldErrors.name ? (
                        <FormFeedback type="invalid">{fieldErrors.name}</FormFeedback>
                      ) : null}
                    </Col>

                    <Col md={6}>
                      <Label>CNPJ</Label>
                      <Input
                        value={form.cnpj}
                        onChange={onChange("cnpj")}
                        invalid={Boolean(fieldErrors.cnpj)}
                      />
                      {fieldErrors.cnpj ? (
                        <FormFeedback type="invalid">{fieldErrors.cnpj}</FormFeedback>
                      ) : null}
                    </Col>

                    <Col md={6}>
                      <Label>Slug</Label>
                      <Input value={form.slug} onChange={onChange("slug")} />
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
                  </Row>
                </div>
              </div>

              <Row className="g-4 mt-1">
                <Col md={3}>
                  <Label>CEP</Label>
                  <Input
                    value={form.cep}
                    onChange={onChange("cep")}
                    onBlur={handleCepBlur}
                    invalid={Boolean(fieldErrors.cep)}
                  />
                  {fieldErrors.cep ? (
                    <FormFeedback type="invalid">{fieldErrors.cep}</FormFeedback>
                  ) : null}
                </Col>

                <Col md={3}>
                  <Label>Estado</Label>
                  <Input value={form.estado} onChange={onChange("estado")} />
                </Col>

                <Col md={3}>
                  <Label>Cidade</Label>
                  <Input value={form.cidade} onChange={onChange("cidade")} />
                </Col>

                <Col md={3}>
                  <Label>Bairro</Label>
                  <Input value={form.bairro} onChange={onChange("bairro")} />
                </Col>

                <Col md={3}>
                  <Label>Número</Label>
                  <Input
                    value={form.numero}
                    onChange={onChange("numero")}
                    invalid={Boolean(fieldErrors.numero)}
                  />
                  {fieldErrors.numero ? (
                    <FormFeedback type="invalid">{fieldErrors.numero}</FormFeedback>
                  ) : null}
                </Col>
              </Row>

              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="mb-0">Responsáveis</h5>
                  <Button color="secondary" type="button" onClick={addResponsible}>
                    Adicionar
                  </Button>
                </div>

                {form.responsaveis.map((resp, index) => (
                  <Row className="g-3 mb-2" key={`resp-${index}`}>
                    <Col md={4}>
                      <Label>Nome</Label>
                      <Input
                        value={resp?.name || ""}
                        onChange={(e) => setResponsible(index, "name", e.target.value)}
                      />
                    </Col>

                    <Col md={4}>
                      <Label>Email</Label>
                      <Input
                        value={resp?.email || ""}
                        onChange={(e) => setResponsible(index, "email", e.target.value)}
                        invalid={index === 0 && Boolean(fieldErrors.resp0email)}
                      />
                      {index === 0 && fieldErrors.resp0email ? (
                        <FormFeedback type="invalid">{fieldErrors.resp0email}</FormFeedback>
                      ) : null}
                    </Col>

                    {index === 0 ? (
                      <Col md={4}>
                        <Label>Senha do responsável</Label>
                        <Input
                          type="password"
                          value={form.ownerPassword}
                          onChange={onChange("ownerPassword")}
                          invalid={Boolean(fieldErrors.ownerPassword)}
                        />
                        {fieldErrors.ownerPassword ? (
                          <FormFeedback type="invalid">{fieldErrors.ownerPassword}</FormFeedback>
                        ) : null}
                      </Col>
                    ) : null}

                    <Col md={3}>
                      <Label>Telefone</Label>
                      <Input
                        value={resp?.phone || ""}
                        onChange={(e) => setResponsible(index, "phone", e.target.value)}
                      />
                    </Col>

                    <Col md={1} className="d-flex align-items-end">
                      <Button
                        color="danger"
                        type="button"
                        onClick={() => removeResponsible(index)}
                        disabled={form.responsaveis.length <= 1}
                      >
                        X
                      </Button>
                    </Col>
                  </Row>
                ))}
              </div>

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

export default NewTenant;
