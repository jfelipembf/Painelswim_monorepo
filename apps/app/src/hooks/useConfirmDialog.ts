import { useCallback, useRef, useState } from "react";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "info" | "error" | "success" | "warning" | "dark";
};

type State = ConfirmOptions & { open: boolean };

const DEFAULT_STATE: State = {
  open: false,
  title: "",
  description: undefined,
  confirmLabel: "Confirmar",
  cancelLabel: "Cancelar",
  confirmColor: "error",
};

export const useConfirmDialog = () => {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setState({
      open: true,
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel ?? "Confirmar",
      cancelLabel: options.cancelLabel ?? "Cancelar",
      confirmColor: options.confirmColor ?? "error",
    });

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleCancel = useCallback(() => {
    setState(DEFAULT_STATE);
    resolverRef.current?.(false);
    resolverRef.current = null;
  }, []);

  const handleConfirm = useCallback(() => {
    setState(DEFAULT_STATE);
    resolverRef.current?.(true);
    resolverRef.current = null;
  }, []);

  return {
    dialogProps: {
      open: state.open,
      title: state.title,
      description: state.description,
      confirmLabel: state.confirmLabel,
      cancelLabel: state.cancelLabel,
      confirmColor: state.confirmColor,
    },
    confirm,
    handleCancel,
    handleConfirm,
  };
};
