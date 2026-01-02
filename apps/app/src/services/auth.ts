import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import type { AuthUser } from "../redux/slices/authSlice";
import { getFirebaseAuth, getProvisioningAuth } from "./firebase";

export type SignInPayload = {
  email: string;
  password: string;
  idTenant: string;
  idBranch?: string;
};

export type AuthListener = (user: AuthUser | null) => void;

const mapFirebaseUser = (user: User): AuthUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
});

const mapAuthError = (error: unknown): string => {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code?: string }).code || "");
    switch (code) {
      case "auth/invalid-email":
        return "E-mail inválido.";
      case "auth/email-already-in-use":
        return "E-mail já está cadastrado.";
      case "auth/user-disabled":
        return "Usuário desativado.";
      case "auth/user-not-found":
      case "auth/invalid-credential":
        return "E-mail ou senha inválidos.";
      case "auth/wrong-password":
        return "E-mail ou senha inválidos.";
      case "auth/weak-password":
        return "A senha precisa ter pelo menos 6 caracteres.";
      case "auth/requires-recent-login":
        return "Faça login novamente para alterar a senha.";
      case "auth/operation-not-allowed":
        return "Operação não permitida. Verifique o provedor de autenticação.";
      case "auth/too-many-requests":
        return "Muitas tentativas. Tente novamente mais tarde.";
      case "auth/network-request-failed":
        return "Falha de rede. Verifique sua conexão.";
      default:
        return "Não foi possível autenticar.";
    }
  }

  return "Não foi possível autenticar.";
};

export const startAuthListener = (onChange: AuthListener): (() => void) => {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      onChange(null);
      return;
    }

    onChange(mapFirebaseUser(user));
  });
};

export const signInWithEmail = async (payload: SignInPayload): Promise<AuthUser> => {
  const { email, password, idTenant, idBranch } = payload;
  void idTenant;
  void idBranch;

  const auth = getFirebaseAuth();
  try {
    const credentials = await signInWithEmailAndPassword(auth, email, password);
    return mapFirebaseUser(credentials.user);
  } catch (error: unknown) {
    throw new Error(mapAuthError(error));
  }
};

export const signOutUser = async (): Promise<void> => {
  const auth = getFirebaseAuth();
  await signOut(auth);
};

export const getTemporaryPassword = (): string => "123456";

export const createAuthUser = async (email: string, password: string): Promise<string> => {
  if (!email || !password) {
    throw new Error("E-mail e senha são obrigatórios.");
  }

  const provisioningAuth = getProvisioningAuth();
  try {
    const credentials = await createUserWithEmailAndPassword(provisioningAuth, email, password);
    await signOut(provisioningAuth);
    return credentials.user.uid;
  } catch (error: unknown) {
    throw new Error(mapAuthError(error));
  }
};

export const updateCurrentUserPassword = async (newPassword: string): Promise<void> => {
  if (!newPassword) {
    throw new Error("Informe a nova senha.");
  }

  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  try {
    await updatePassword(user, newPassword);
  } catch (error: unknown) {
    throw new Error(mapAuthError(error));
  }
};
