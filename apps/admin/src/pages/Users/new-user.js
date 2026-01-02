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

import { useFormik } from "formik";

import { NEW_USER_INITIAL_VALUES } from "./constants";
import { newUserSchema } from "./validations/newUserValidation";
import { fetchNormalizedAddress } from "./utils/address";
import { useUsersService } from "./hooks/useUsers";
import AvatarUploadCard from "../../components/Common/AvatarUploadCard";

const NewUser = () => {
  document.title = "Novo Usuário";

  const { createUser, genderOptions, roleOptions, statusOptions } = useUsersService();

  const [photoFile, setPhotoFile] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: NEW_USER_INITIAL_VALUES,
    validationSchema: newUserSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setError("");
      setSuccess("");

      try {
        await createUser({
          email: values.email,
          password: "123456",
          firstName: values.firstName,
          lastName: values.lastName,
          gender: values.gender,
          birthDate: values.birthDate,
          phone: values.phone,
          role: values.role,
          status: values.status,
          address: {
            cep: values.cep,
            estado: values.estado,
            cidade: values.cidade,
            bairro: values.bairro,
            numero: values.numero,
          },
          photoFile,
        });

        setSuccess("Usuário criado com sucesso (senha padrão: 123456).")
        resetForm();
        setPhotoFile(null);
      } catch (e) {
        setError(e?.message || String(e));
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handlePhotoSelect = (file) => {
    setPhotoFile(file);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    } else {
      setPhotoPreview("");
    }
  };

  const handleCepBlur = async () => {
    try {
      const { normalizedCep, address } = await fetchNormalizedAddress(validation.values.cep);
      validation.setFieldValue("cep", normalizedCep);

      if (!address) return;

      validation.setFieldValue("estado", address.estado || "");
      validation.setFieldValue("cidade", address.cidade || "");
      validation.setFieldValue("bairro", address.bairro || "");
    } catch (e) {
      setError(e?.message || String(e));
    }
  };

  return (
    <React.Fragment>
      <Row>
        <Col lg={12}>
          <Card className="mb-4">
            <CardBody>
              {success ? <Alert color="success">{success}</Alert> : null}
              {error ? <Alert color="danger">{error}</Alert> : null}

              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  validation.handleSubmit();
                  return false;
                }}
              >
                <div className="d-flex flex-wrap flex-md-nowrap gap-3 align-items-start">
                  <div className="flex-shrink-0" style={{ minWidth: 200 }}>
                    <Label className="d-block mb-2">Foto</Label>
                    <AvatarUploadCard
                      imageUrl={photoPreview || undefined}
                      defaultImage={null}
                      loading={validation.isSubmitting}
                      onSelectFile={handlePhotoSelect}
                      accept="image/*"
                      size="lg"
                      variant="rounded"
                      mt={0}
                    />
                  </div>

                  <div className="flex-grow-1">
                    <Row className="g-4">
                      <Col md="6">
                        <Label>Nome</Label>
                        <Input
                          name="firstName"
                          value={validation.values.firstName}
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          invalid={
                            validation.touched.firstName &&
                            Boolean(validation.errors.firstName)
                          }
                        />
                        {validation.touched.firstName && validation.errors.firstName ? (
                          <FormFeedback type="invalid">{validation.errors.firstName}</FormFeedback>
                        ) : null}
                      </Col>

                      <Col md="6">
                        <Label>Sobrenome</Label>
                        <Input
                          name="lastName"
                          value={validation.values.lastName}
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          invalid={
                            validation.touched.lastName &&
                            Boolean(validation.errors.lastName)
                          }
                        />
                        {validation.touched.lastName && validation.errors.lastName ? (
                          <FormFeedback type="invalid">{validation.errors.lastName}</FormFeedback>
                        ) : null}
                      </Col>

                      <Col md="4">
                        <Label>Sexo</Label>
                        <Input
                          type="select"
                          name="gender"
                          value={validation.values.gender}
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                        >
                          <option value="">Selecione</option>
                          {genderOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Input>
                      </Col>

                      <Col md="4">
                        <Label>Data de Nascimento</Label>
                        <Input
                          type="date"
                          name="birthDate"
                          value={validation.values.birthDate}
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                        />
                      </Col>

                      <Col md="4">
                        <Label>Status</Label>
                        <Input
                          type="select"
                          name="status"
                          value={validation.values.status}
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Input>
                      </Col>

                      <Col md="6">
                        <Label>Email</Label>
                        <Input
                          name="email"
                          value={validation.values.email}
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          invalid={
                            validation.touched.email &&
                            Boolean(validation.errors.email)
                          }
                        />
                        {validation.touched.email && validation.errors.email ? (
                          <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                        ) : null}
                      </Col>

                      <Col md="6">
                        <Label>Telefone</Label>
                        <Input
                          name="phone"
                          value={validation.values.phone}
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          invalid={
                            validation.touched.phone &&
                            Boolean(validation.errors.phone)
                          }
                        />
                        {validation.touched.phone && validation.errors.phone ? (
                          <FormFeedback type="invalid">{validation.errors.phone}</FormFeedback>
                        ) : null}
                      </Col>

                      <Col md="6">
                        <Label>Cargo</Label>
                        <Input
                          type="select"
                          name="role"
                          value={validation.values.role}
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          invalid={
                            validation.touched.role &&
                            Boolean(validation.errors.role)
                          }
                        >
                          <option value="">Selecione</option>
                          {roleOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Input>
                        {validation.touched.role && validation.errors.role ? (
                          <FormFeedback type="invalid">{validation.errors.role}</FormFeedback>
                        ) : null}
                      </Col>
                    </Row>
                  </div>
                </div>

                <Row className="g-3 mt-3">
                  <Col md="3">
                    <Label>CEP</Label>
                    <Input
                      name="cep"
                      value={validation.values.cep}
                      onChange={validation.handleChange}
                      onBlur={handleCepBlur}
                    />
                  </Col>

                  <Col md="3">
                    <Label>Estado</Label>
                    <Input
                      name="estado"
                      value={validation.values.estado}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                    />
                  </Col>

                  <Col md="3">
                    <Label>Cidade</Label>
                    <Input
                      name="cidade"
                      value={validation.values.cidade}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                    />
                  </Col>

                  <Col md="3">
                    <Label>Bairro</Label>
                    <Input
                      name="bairro"
                      value={validation.values.bairro}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                    />
                  </Col>

                  <Col md="3">
                    <Label>Número</Label>
                    <Input
                      name="numero"
                      value={validation.values.numero}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                    />
                  </Col>
                </Row>

                <div className="d-flex gap-2 justify-content-end">
                  <Button
                    color="primary"
                    type="submit"
                    disabled={validation.isSubmitting}
                  >
                    Criar usuário
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default NewUser;
