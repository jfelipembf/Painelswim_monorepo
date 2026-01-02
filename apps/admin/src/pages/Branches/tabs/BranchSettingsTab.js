import React, { useEffect, useState } from "react";
import { Button, Col, Form, FormGroup, Input, Label, Row } from "reactstrap";
import AvatarUploadCard from "../../../components/Common/AvatarUploadCard";
import { fetchNormalizedAddress } from "../../Users/utils/address";

export const BranchSettingsTab = ({ branch, loading, onSave }) => {
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    timezone: "America/Sao_Paulo",
    cep: "",
    estado: "",
    cidade: "",
    bairro: "",
    numero: "",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    setForm({
      name: branch?.name || "",
      cnpj: branch?.cnpj || "",
      timezone: branch?.timezone || "America/Sao_Paulo",
      cep: branch?.address?.cep || "",
      estado: branch?.address?.estado || branch?.address?.state || "",
      cidade: branch?.address?.cidade || branch?.address?.city || "",
      bairro: branch?.address?.bairro || "",
      numero: branch?.address?.numero || "",
    });
    setLogoPreview(branch?.logoUrl || "");
    setLogoFile(null);
  }, [branch]);

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

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
      logoFile,
    });
  };

  return (
    <Form onSubmit={submit}>
      <Row className="g-4">
        <Col md={4}>
          <Label className="d-block mb-2">Logo</Label>
          <AvatarUploadCard
            imageUrl={logoPreview || undefined}
            defaultImage={null}
            loading={loading}
            onSelectFile={handleLogoSelect}
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
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>CNPJ</Label>
                <Input
                  value={form.cnpj}
                  onChange={(e) => setForm((p) => ({ ...p, cnpj: e.target.value }))}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>Timezone</Label>
                <Input
                  value={form.timezone}
                  onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                />
              </FormGroup>
            </Col>
          </Row>

          <Row className="g-3 mt-1">
            <Col md={4}>
              <FormGroup>
                <Label>CEP</Label>
                <Input
                  value={form.cep}
                  onChange={(e) => setForm((p) => ({ ...p, cep: e.target.value }))}
                  onBlur={handleCepBlur}
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label>Estado</Label>
                <Input
                  value={form.estado}
                  onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label>Cidade</Label>
                <Input
                  value={form.cidade}
                  onChange={(e) => setForm((p) => ({ ...p, cidade: e.target.value }))}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>Bairro</Label>
                <Input
                  value={form.bairro}
                  onChange={(e) => setForm((p) => ({ ...p, bairro: e.target.value }))}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>Número</Label>
                <Input
                  value={form.numero}
                  onChange={(e) => setForm((p) => ({ ...p, numero: e.target.value }))}
                />
              </FormGroup>
            </Col>
          </Row>

          <div className="d-flex justify-content-end mt-3">
            <Button color="primary" type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </Col>
      </Row>
    </Form>
  );
};

export default BranchSettingsTab;
