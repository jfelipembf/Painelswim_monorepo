import { useEffect, useRef, useState } from "react";

import { fetchAddressByCep, isCepComplete, sanitizeCep, type CepAddress } from "utils/cep";

type CepLookupState = {
  address: CepAddress | null;
  loading: boolean;
  error: string | null;
};

const initialState: CepLookupState = {
  address: null,
  loading: false,
  error: null,
};

export const useCepLookup = (cep: string): CepLookupState => {
  const [state, setState] = useState<CepLookupState>(initialState);
  const lastCepRef = useRef<string>("");

  useEffect(() => {
    const normalized = sanitizeCep(cep);
    if (!isCepComplete(normalized)) {
      lastCepRef.current = "";
      setState(initialState);
      return;
    }

    if (lastCepRef.current === normalized) {
      return;
    }

    let active = true;
    lastCepRef.current = normalized;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetchAddressByCep(normalized)
      .then((address) => {
        if (!active) {
          return;
        }
        if (!address) {
          setState({ address: null, loading: false, error: "CEP nao encontrado." });
          return;
        }
        setState({ address, loading: false, error: null });
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setState({ address: null, loading: false, error: "Nao foi possivel consultar o CEP." });
      });

    return () => {
      active = false;
    };
  }, [cep]);

  return state;
};
