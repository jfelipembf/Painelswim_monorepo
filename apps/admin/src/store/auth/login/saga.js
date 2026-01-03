import { call, put, takeEvery, takeLatest } from "redux-saga/effects";

// Login Redux States
import { LOGIN_USER, LOGOUT_USER, SOCIAL_LOGIN } from "./actionTypes";
import { apiError, loginSuccess, logoutUserSuccess } from "./actions";

//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import {
  postFakeLogin,
  postJwtLogin,
} from "../../../helpers/fakebackend_helper";

const fireBaseBackend = getFirebaseBackend();

function* loginUser({ payload: { user, history } }) {
  try {
    console.log("[Admin Login] Iniciando login...", { email: user.email });
    console.log("[Admin Login] process.env:", process.env);
    console.log("[Admin Login] REACT_APP_DEFAULTAUTH:", process.env.REACT_APP_DEFAULTAUTH);
    console.log("[Admin Login] Tipo de REACT_APP_DEFAULTAUTH:", typeof process.env.REACT_APP_DEFAULTAUTH);
    
    // Usar Firebase como padrão se REACT_APP_DEFAULTAUTH não estiver definido
    const authMethod = process.env.REACT_APP_DEFAULTAUTH || "firebase";
    console.log("[Admin Login] Método de autenticação selecionado:", authMethod);
    
    if (authMethod === "firebase") {
      console.log("[Admin Login] Usando Firebase auth");
      console.log("[Admin Login] fireBaseBackend:", fireBaseBackend);
      
      if (!fireBaseBackend) {
        throw new Error("Firebase backend não inicializado");
      }
      
      const response = yield call(
        fireBaseBackend.loginUser,
        user.email,
        user.password
      );
      console.log("[Admin Login] ✅ Resposta do Firebase:", response);
      yield put(loginSuccess(response));
    } else if (authMethod === "jwt") {
      console.log("[Admin Login] Usando JWT auth");
      const response = yield call(postJwtLogin, {
        email: user.email,
        password: user.password,
      });
      localStorage.setItem("authUser", JSON.stringify(response));
      yield put(loginSuccess(response));
    } else if (authMethod === "fake") {
      console.log("[Admin Login] Usando Fake auth");
      const response = yield call(postFakeLogin, {
        email: user.email,
        password: user.password,
      });
      localStorage.setItem("authUser", JSON.stringify(response));
      yield put(loginSuccess(response));
    } else {
      console.error("[Admin Login] ❌ Método de autenticação desconhecido:", authMethod);
      throw new Error(`Método de autenticação desconhecido: ${authMethod}`);
    }
    
    console.log("[Admin Login] ✅ Redirecionando para /dashboard");
    history('/dashboard');
  } catch (error) {
    console.error("[Admin Login] ❌ Erro no login:", error);
    console.error("[Admin Login] Stack trace:", error.stack);
    yield put(apiError(error));
  }
}

function* logoutUser({ payload: { history } }) {
  try {
    localStorage.removeItem("authUser");

    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const response = yield call(fireBaseBackend.logout);
      yield put(logoutUserSuccess(response));
    }
    history('/login');
  } catch (error) {
    yield put(apiError(error));
  }
}

function* socialLogin({ payload: { type, history } }) {
  try {
    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const fireBaseBackend = getFirebaseBackend();
      const response = yield call(fireBaseBackend.socialLoginUser, type);
      if (response) {
        history("/dashboard");
      } else {
        history("/login");
      }
      localStorage.setItem("authUser", JSON.stringify(response));
      yield put(loginSuccess(response));
    }
    const response = yield call(fireBaseBackend.socialLoginUser, type);
    if(response)
    history("/dashboard");
  } catch (error) {
    yield put(apiError(error));
  }
}

function* authSaga() {
  yield takeEvery(LOGIN_USER, loginUser);
  yield takeLatest(SOCIAL_LOGIN, socialLogin);
  yield takeEvery(LOGOUT_USER, logoutUser);
}

export default authSaga;
