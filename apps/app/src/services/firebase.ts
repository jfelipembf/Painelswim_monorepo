import { FirebaseApp, FirebaseOptions, getApps, initializeApp } from "firebase/app";
import { Auth, connectAuthEmulator, getAuth } from "firebase/auth";
import { Firestore, connectFirestoreEmulator, getFirestore, setLogLevel } from "firebase/firestore";
import { FirebaseStorage, connectStorageEmulator, getStorage } from "firebase/storage";

const readEnvValue = (...keys: string[]): string => {
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }
  return "";
};

export const firebaseConfig: FirebaseOptions = {
  apiKey: readEnvValue("REACT_APP_FIREBASE_API_KEY", "REACT_APP_APIKEY"),
  authDomain: readEnvValue("REACT_APP_FIREBASE_AUTH_DOMAIN", "REACT_APP_AUTHDOMAIN"),
  projectId: readEnvValue("REACT_APP_FIREBASE_PROJECT_ID", "REACT_APP_PROJECTID"),
  storageBucket: readEnvValue("REACT_APP_FIREBASE_STORAGE_BUCKET", "REACT_APP_STORAGEBUCKET"),
  messagingSenderId: readEnvValue(
    "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
    "REACT_APP_MESSAGINGSENDERID"
  ),
  appId: readEnvValue("REACT_APP_FIREBASE_APP_ID", "REACT_APP_APPID"),
  measurementId: readEnvValue("REACT_APP_FIREBASE_MEASUREMENT_ID", "REACT_APP_MEASUREMENTID"),
};

export const hasFirebaseConfig = (): boolean =>
  Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);

const toBooleanFlag = (value: string): boolean => String(value || "").toLowerCase() === "true";

const toPort = (value: string, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const shouldUseEmulators = (): boolean => toBooleanFlag(readEnvValue("REACT_APP_USE_EMULATORS"));
const shouldDebugFirestore = (): boolean =>
  toBooleanFlag(readEnvValue("REACT_APP_FIRESTORE_DEBUG"));

const emulatorHost = readEnvValue("REACT_APP_FIREBASE_EMULATOR_HOST") || "localhost";
const authEmulatorPort = toPort(readEnvValue("REACT_APP_FIREBASE_AUTH_EMULATOR_PORT"), 9099);
const firestoreEmulatorPort = toPort(readEnvValue("REACT_APP_FIRESTORE_EMULATOR_PORT"), 8080);
const storageEmulatorPort = toPort(readEnvValue("REACT_APP_FIREBASE_STORAGE_EMULATOR_PORT"), 9199);

const authEmulators = new WeakSet<Auth>();
const firestoreEmulators = new WeakSet<Firestore>();
const storageEmulators = new WeakSet<FirebaseStorage>();
let firestoreLoggingEnabled = false;

const ensureFirestoreDebug = (): void => {
  if (!shouldDebugFirestore() || firestoreLoggingEnabled) return;
  setLogLevel("debug");
  firestoreLoggingEnabled = true;
};

const ensureAuthEmulator = (auth: Auth): void => {
  if (!shouldUseEmulators() || authEmulators.has(auth)) return;
  connectAuthEmulator(auth, `http://${emulatorHost}:${authEmulatorPort}`, {
    disableWarnings: true,
  });
  authEmulators.add(auth);
};

const ensureFirestoreEmulator = (db: Firestore): void => {
  if (!shouldUseEmulators() || firestoreEmulators.has(db)) return;
  connectFirestoreEmulator(db, emulatorHost, firestoreEmulatorPort);
  firestoreEmulators.add(db);
};

const ensureStorageEmulator = (storage: FirebaseStorage): void => {
  if (!shouldUseEmulators() || storageEmulators.has(storage)) return;
  connectStorageEmulator(storage, emulatorHost, storageEmulatorPort);
  storageEmulators.add(storage);
};

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;
let provisioningApp: FirebaseApp | null = null;
let provisioningAuth: Auth | null = null;

const getFirebaseApp = (): FirebaseApp => {
  if (firebaseApp) {
    return firebaseApp;
  }

  console.log("[Firebase] Verificando configuração...");
  console.log("[Firebase] Config:", {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : "MISSING",
    authDomain: firebaseConfig.authDomain || "MISSING",
    projectId: firebaseConfig.projectId || "MISSING",
    storageBucket: firebaseConfig.storageBucket || "MISSING",
  });

  if (!hasFirebaseConfig()) {
    console.error("[Firebase] ❌ Configuração ausente!");
    throw new Error("Configuração do Firebase ausente. Verifique o arquivo .env.");
  }

  console.log("[Firebase] ✅ Inicializando Firebase App...");
  firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  console.log("[Firebase] ✅ Firebase App inicializado");
  return firebaseApp;
};

export const getFirebaseAuth = (): Auth => {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseApp());
  }
  ensureAuthEmulator(firebaseAuth);
  return firebaseAuth;
};

export const getFirebaseDb = (): Firestore => {
  if (!firebaseDb) {
    console.log("[Firebase] Inicializando Firestore...");
    firebaseDb = getFirestore(getFirebaseApp());
    console.log("[Firebase] ✅ Firestore inicializado");
  }
  ensureFirestoreDebug();
  ensureFirestoreEmulator(firebaseDb);
  return firebaseDb;
};

export const getFirebaseStorage = (): FirebaseStorage => {
  if (!firebaseStorage) {
    firebaseStorage = getStorage(getFirebaseApp());
  }
  ensureStorageEmulator(firebaseStorage);
  return firebaseStorage;
};

const getProvisioningApp = (): FirebaseApp => {
  if (provisioningApp) {
    return provisioningApp;
  }

  if (!hasFirebaseConfig()) {
    throw new Error("Configuração do Firebase ausente. Verifique o arquivo .env.");
  }

  const existing = getApps().find((app) => app.name === "collaborator-provision");
  provisioningApp = existing ?? initializeApp(firebaseConfig, "collaborator-provision");
  return provisioningApp;
};

export const getProvisioningAuth = (): Auth => {
  if (!provisioningAuth) {
    provisioningAuth = getAuth(getProvisioningApp());
  }
  ensureAuthEmulator(provisioningAuth);
  return provisioningAuth;
};
