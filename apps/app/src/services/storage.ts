import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { getFirebaseStorage } from "./firebase";

type UploadImageParams = {
  idTenant: string;
  file: File;
  folder: string;
  filenamePrefix?: string;
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
};

export type UploadImageResult = {
  path: string;
  downloadUrl: string;
  contentType: string;
  size: number;
};

const defaultAllowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const safeSlug = (value: string): string =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 64);

const extFromMime = (mime: string): string => {
  const m = String(mime || "").toLowerCase();
  if (m === "image/jpeg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  return "bin";
};

const uniqueId = (): string => {
  const anyCrypto = globalThis.crypto as undefined | { randomUUID?: () => string };
  if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const uploadImage = async ({
  idTenant,
  file,
  folder,
  filenamePrefix,
  maxSizeBytes = 5 * 1024 * 1024,
  allowedMimeTypes = defaultAllowedMimeTypes,
}: UploadImageParams): Promise<UploadImageResult> => {
  if (!idTenant) throw new Error("Tenant é obrigatório.");
  if (!file) throw new Error("Arquivo é obrigatório.");

  const contentType = String(file.type || "");
  if (!allowedMimeTypes.includes(contentType)) {
    throw new Error("Formato de imagem não suportado. Use JPG, PNG ou WEBP.");
  }

  const size = Number(file.size || 0);
  if (size <= 0) {
    throw new Error("Arquivo inválido.");
  }

  if (size > maxSizeBytes) {
    throw new Error("Imagem muito grande.");
  }

  const ext = extFromMime(contentType);
  const prefix = filenamePrefix ? safeSlug(filenamePrefix) : "image";
  const key = `${prefix}_${uniqueId()}.${ext}`;

  const normalizedFolder = safeSlug(folder || "uploads") || "uploads";
  const path = `tenants/${safeSlug(idTenant)}/${normalizedFolder}/${key}`;

  const storage = getFirebaseStorage();
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file, { contentType });
  const downloadUrl = await getDownloadURL(storageRef);

  return {
    path,
    downloadUrl,
    contentType,
    size,
  };
};

export const deleteFileByPath = async (path: string): Promise<void> => {
  const normalized = String(path || "").trim();
  if (!normalized) return;

  const storage = getFirebaseStorage();
  await deleteObject(ref(storage, normalized));
};
