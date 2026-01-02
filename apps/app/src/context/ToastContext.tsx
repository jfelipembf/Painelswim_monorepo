import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

import Snackbar from "@mui/material/Snackbar";

import MDAlert from "components/MDAlert";
import MDBox from "components/MDBox";

export type ToastVariant = "success" | "info" | "warning" | "error";

type ToastOptions = {
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  showToast: (message: string, options?: ToastOptions) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
};

const DEFAULT_DURATION = 5000;
const STACK_OFFSET = 72;
const STACK_BASE = 24;

const ToastContext = createContext<ToastContextValue | null>(null);
ToastContext.displayName = "ToastContext";

const createToastId = (): string => `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const mapVariantToColor = (variant: ToastVariant): "success" | "info" | "warning" | "error" => {
  switch (variant) {
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "error";
    default:
      return "info";
  }
};

function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    if (!message) {
      return;
    }
    const toast: ToastItem = {
      id: createToastId(),
      message,
      variant: options?.variant ?? "info",
      duration: options?.duration,
    };
    setToasts((prev) => [...prev, toast]);
  }, []);

  const showSuccess = useCallback(
    (message: string, duration?: number) => showToast(message, { variant: "success", duration }),
    [showToast]
  );

  const showError = useCallback(
    (message: string, duration?: number) => showToast(message, { variant: "error", duration }),
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => showToast(message, { variant: "warning", duration }),
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => showToast(message, { variant: "info", duration }),
    [showToast]
  );

  const value = useMemo(
    () => ({ showToast, showSuccess, showError, showWarning, showInfo }),
    [showToast, showSuccess, showError, showWarning, showInfo]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open
          autoHideDuration={toast.duration ?? DEFAULT_DURATION}
          onClose={(_, reason) => {
            if (reason === "clickaway") {
              return;
            }
            removeToast(toast.id);
          }}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{ top: STACK_BASE + index * STACK_OFFSET }}
        >
          <MDBox>
            <MDAlert color={mapVariantToColor(toast.variant)} sx={{ marginBottom: 0 }}>
              {toast.message}
            </MDAlert>
          </MDBox>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
}

const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider.");
  }
  return context;
};

export { ToastProvider, useToast };
