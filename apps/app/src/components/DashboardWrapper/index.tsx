import { useState, useEffect, useRef } from "react";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import CircularProgress from "@mui/material/CircularProgress";

interface DashboardWrapperProps {
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  title?: string;
}

function DashboardWrapper({
  children,
  loading = false,
  error = null,
  title,
}: DashboardWrapperProps) {
  const [isReady, setIsReady] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const prevLoadingRef = useRef<boolean>(loading);

  useEffect(() => {
    const prevLoading = prevLoadingRef.current;
    prevLoadingRef.current = loading;

    // Only mark as ready after at least one real loading cycle completed.
    const finishedFirstLoad = prevLoading && !loading && !error;

    if (finishedFirstLoad) {
      const timer = setTimeout(() => {
        setIsReady(true);
        setHasLoadedOnce(true);
        setTimeout(() => setShowContent(true), 50);
      }, 100);
      return () => clearTimeout(timer);
    }

    if (error) {
      setIsReady(false);
      setShowContent(false);
    }

    if (!hasLoadedOnce && loading) {
      setIsReady(false);
      setShowContent(false);
    }
  }, [loading, error, hasLoadedOnce]);

  if ((loading || !hasLoadedOnce) && !isReady && !error) {
    return (
      <MDBox
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
        gap={2}
      >
        <CircularProgress color="info" />
        <MDTypography variant="button" color="text" fontWeight="regular">
          Carregando{title ? ` ${title}` : ""}...
        </MDTypography>
      </MDBox>
    );
  }

  if (error) {
    return (
      <MDBox
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
        gap={2}
      >
        <MDTypography variant="h6" color="error" fontWeight="medium">
          Erro ao carregar{title ? ` ${title}` : ""}
        </MDTypography>
        <MDTypography variant="button" color="text" fontWeight="regular">
          {error}
        </MDTypography>
      </MDBox>
    );
  }

  return (
    <MDBox
      sx={{
        position: "relative",
        opacity: showContent ? 1 : 0,
        transition: "opacity 0.2s ease-in-out",
        minHeight: loading && !hasLoadedOnce ? "60vh" : "auto",
      }}
    >
      {loading ? (
        <MDBox
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 2,
            pointerEvents: "none",
            opacity: 0.9,
          }}
        >
          <CircularProgress color="info" size={18} />
        </MDBox>
      ) : null}
      {children}
    </MDBox>
  );
}

export default DashboardWrapper;
