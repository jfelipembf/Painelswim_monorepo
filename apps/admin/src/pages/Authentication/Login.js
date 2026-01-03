import React from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, Label, Form, Alert, Input, FormFeedback } from "reactstrap";
import intelitecLogo from "../../assets/images/icon_inteli.png";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import PropTypes from "prop-types";

// Formik validation
import * as Yup from "yup";
import { useFormik } from "formik";
import withRouter from 'components/Common/withRouter';

// actions
import { loginUser } from "../../store/actions";

const ERROR_MESSAGES = [
  { matches: ["invalid password", "invalid email", "wrong password"], friendly: "E-mail ou senha inválidos." },
  { matches: ["user not found", "no user record"], friendly: "Usuário não encontrado. Verifique o e-mail informado." },
  { matches: ["too-many-requests"], friendly: "Muitas tentativas. Aguarde alguns instantes antes de tentar novamente." },
  { matches: ["network request failed"], friendly: "Não foi possível conectar. Verifique sua internet e tente novamente." },
];

const translateLoginMessage = (message) => {
  if (!message) return "";
  const normalized = message.toLowerCase();
  const matched = ERROR_MESSAGES.find(({ matches }) => matches.some((keyword) => normalized.includes(keyword)));
  return matched?.friendly || "Não foi possível entrar. Tente novamente em instantes.";
};

const Login = (props) => {
  document.title = "Login | Intelitec - Painel Administrativo";

  const dispatch = useDispatch();

  const validation = useFormik({
    // enableReinitialize : use this  flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().required("Informe seu e-mail"),
      password: Yup.string().required("Informe sua senha"),
    }),
    onSubmit: (values) => {
      dispatch(loginUser(values, props.router.navigate));
    }
  });


  const selectLoginState = (state) => state.Login;
  const LoginProperties = createSelector(selectLoginState, (login) => ({
    error: login.error,
  }));

  const {
    error
  } = useSelector(LoginProperties);

  const friendlyErrorMessage = error ? translateLoginMessage(error) : "";

  return (
    <React.Fragment>
      <div className="account-pages my-5 pt-sm-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} xl={5}>
              <Card className="overflow-hidden">
                <CardBody className="pt-0">

                  <h3 className="text-center mt-5 mb-4">
                    <Link to="/" className="d-block auth-logo text-decoration-none">
                      <span className="d-flex align-items-center justify-content-center gap-2">
                        <img src={intelitecLogo} alt="Intelitec" height="48" />
                        <span style={{ fontSize: "20px", fontWeight: 700, color: "#495057" }}>Intelitec</span>
                      </span>
                    </Link>
                  </h3>

                  <div className="p-3">
                    <h4 className="text-muted font-size-18 mb-1 text-center">Bem-vindo de volta!</h4>
                    <p className="text-muted text-center">Entre para acessar o Painel Intelitec.</p>
                    <Form
                      className="form-horizontal mt-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        validation.handleSubmit();
                        return false;
                      }}
                    >
                      {error ? <Alert color="danger">{friendlyErrorMessage}</Alert> : null}
                      <div className="mb-3">
                        <Label htmlFor="username">E-mail</Label>
                        <Input
                          name="email"
                          className="form-control"
                          placeholder="Digite seu e-mail"
                          type="email"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.email || ""}
                          invalid={
                            validation.touched.email && validation.errors.email ? true : false
                          }
                        />
                        {validation.touched.email && validation.errors.email ? (
                          <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label htmlFor="userpassword">Senha</Label>
                        <Input
                          name="password"
                          value={validation.values.password || ""}
                          type="password"
                          placeholder="Digite sua senha"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          invalid={
                            validation.touched.password && validation.errors.password ? true : false
                          }
                        />
                        {validation.touched.password && validation.errors.password ? (
                          <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                        ) : null}
                      </div>
                      <Row className="mb-3 mt-4 align-items-center">
                        <Col xs="6">
                          <div className="form-check">
                            <input type="checkbox" className="form-check-input" id="customControlInline" />
                            <label className="form-check-label" htmlFor="customControlInline">
                              Lembrar acesso
                            </label>
                          </div>
                        </Col>
                        <Col xs="6" className="text-end">
                          <button className="btn btn-primary w-md waves-effect waves-light" type="submit">
                            Entrar
                          </button>
                        </Col>
                      </Row>
                      <Row className="form-group mb-0">
                        <Col xs="12" className="mt-4 text-center text-md-start">
                          <Link to="/forgot-password" className="text-muted">
                            <i className="mdi mdi-lock"></i> Esqueceu sua senha?
                          </Link>
                        </Col>
                      </Row>
                    </Form>
                  </div>
                </CardBody>
              </Card>
              <div className="mt-5 text-center">
                © {new Date().getFullYear()} Intelitec
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
}

export default withRouter(Login);

Login.propTypes = {
  history: PropTypes.object,
};
