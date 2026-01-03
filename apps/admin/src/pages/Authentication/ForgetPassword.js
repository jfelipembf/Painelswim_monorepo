import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Alert, Card, CardBody, Col, Container, FormFeedback, Input, Label, Row } from "reactstrap";
import intelitecLogo from "../../assets/images/icon_inteli.png";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import withRouter from "components/Common/withRouter";
// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

// action
import { userForgetPassword } from "../../store/actions";

const FORGOT_ERROR_MESSAGES = [
  { matches: ["user not found", "no user record"], friendly: "Usuário não encontrado. Verifique o e-mail informado." },
  { matches: ["too-many-requests"], friendly: "Muitas tentativas. Aguarde alguns instantes e tente novamente." },
  { matches: ["network request failed"], friendly: "Não foi possível conectar. Verifique sua internet e tente novamente." },
];

const translateForgotError = (message) => {
  if (!message) return "";
  const normalized = message.toLowerCase();
  const match = FORGOT_ERROR_MESSAGES.find(({ matches }) =>
    matches.some((keyword) => normalized.includes(keyword))
  );
  return match?.friendly || "Não foi possível enviar as instruções. Tente novamente em instantes.";
};

const successFallback =
  "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.";

const ForgetPasswordPage = props => {
  document.title = "Recuperar Senha | Intelitec - Painel Administrativo";

  const dispatch = useDispatch();

  const validation = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().required("Informe seu e-mail"),
    }),
    onSubmit: (values) => {
      dispatch(userForgetPassword(values, props.history));
    }
  });


  const selectForgotPasswordState = (state) => state.ForgetPassword;
  const ForgotPasswordProperties = createSelector(
    selectForgotPasswordState,
    (forgetPassword) => ({
      forgetError: forgetPassword.forgetError,
      forgetSuccessMsg: forgetPassword.forgetSuccessMsg,
    })
  );

  const { forgetError, forgetSuccessMsg } = useSelector(ForgotPasswordProperties);

  const friendlyError = forgetError ? translateForgotError(forgetError) : "";
  const friendlySuccess = forgetSuccessMsg || successFallback;

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
                        <span style={{ fontSize: "20px", fontWeight: 700, color: "#495057" }}>
                          Intelitec
                        </span>
                      </span>
                    </Link>
                  </h3>
                  <div className="p-3">
                    <h4 className="text-muted font-size-18 mb-3 text-center">Recuperar senha</h4>
                    {forgetError ? (
                      <Alert color="danger" style={{ marginTop: "13px" }}>
                        {friendlyError}
                      </Alert>
                    ) : null}
                    {forgetSuccessMsg ? (
                      <Alert color="success" style={{ marginTop: "13px" }}>
                        {friendlySuccess}
                      </Alert>
                    ) : null}
                    <form className="form-horizontal mt-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        validation.handleSubmit();
                        return false;
                      }}>

                      <div className="mb-3">
                        <Label htmlFor="useremail">E-mail</Label>
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

                      <Row className="mb-3">
                        <div className="col-12 text-end">
                          <button className="btn btn-primary w-md waves-effect waves-light" type="submit">Enviar instruções</button>
                        </div>
                      </Row>
                    </form>
                  </div>
                </CardBody>
              </Card>
              <div className="mt-5 text-center">
                <p>Lembrou a senha? <Link to="/login" className="text-primary"> Entrar</Link> </p>
                © {new Date().getFullYear()} Intelitec
              </div>
            </Col>
          </Row>
        </Container>
      </div>


    </React.Fragment>
  )
}

ForgetPasswordPage.propTypes = {
  history: PropTypes.object,
};

export default withRouter(ForgetPasswordPage);
