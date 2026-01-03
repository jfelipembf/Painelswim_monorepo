/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-2-pro-react-ts
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect, useMemo, JSXElementConstructor, Key, ReactElement } from "react";

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";

// Material Dashboard 2 PRO React TS examples
import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";

// Material Dashboard 2 PRO React TS themes
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";

// Material Dashboard 2 PRO React TS Dark Mode themes
import themeDark from "assets/theme-dark";
import themeDarkRTL from "assets/theme-dark/theme-rtl";

// RTL plugins
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

// Material Dashboard 2 PRO React TS routes
import routes from "routes";
import RequireAuth from "routes/RequireAuth";
import RequireBranch from "routes/RequireBranch";
import RequireSubscription from "routes/RequireSubscription";
import RequirePermission from "routes/RequirePermission";

// Material Dashboard 2 PRO React TS contexts
import {
  useMaterialUIController,
  setMiniSidenav,
  setOpenConfigurator,
  setTransparentSidenav,
  setWhiteSidenav,
  setDarkMode,
  setSidenavColor,
} from "context";
import { ToastProvider } from "context/ToastContext";
import { ReferenceDataCacheProvider } from "context/ReferenceDataCacheContext";

import { useAppSelector } from "./redux/hooks";

// Images
import brandWhite from "assets/images/logo-ct.png";
import brandDark from "assets/images/logo-ct-dark.png";

export default function App(): JSX.Element {
  const [controller, dispatch] = useMaterialUIController();
  const {
    miniSidenav,
    direction,
    layout,
    openConfigurator,
    sidenavColor,
    transparentSidenav,
    whiteSidenav,
    darkMode,
  } = controller;

  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState<any>(null);
  const { pathname } = useLocation();

  console.log("[App.tsx] Componente renderizado");
  console.log("[App.tsx] pathname atual:", pathname);
  console.log("[App.tsx] window.location:", window.location.href);

  const {
    permissions,
    allowAll,
    status: permissionsStatus,
  } = useAppSelector((state) => state.permissions);

  // Cache for RTL
  useMemo(() => {
    const pluginRtl: any = rtlPlugin;
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [pluginRtl],
    });

    setRtlCache(cacheRtl);
  }, []);

  // ✅ Force WHITE layout (white sidenav + non-transparent + light mode)
  useEffect(() => {
    setTransparentSidenav(dispatch, false);
    setWhiteSidenav(dispatch, true);

    // opcional: garantir tema claro
    setDarkMode(dispatch, false);

    // opcional: cor de destaque do sidenav (info/primary/dark/...)
    setSidenavColor(dispatch, "info");
  }, [dispatch]);

  // Open sidenav when mouse enter on mini sidenav
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  // Close sidenav when mouse leave mini sidenav
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  // Toggle configurator
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  // Set dir attribute
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Scroll to top on route change
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const publicRoutes = new Set(["/login", "/forgot-password"]);
  const authOnlyRoutes = new Set<string>();

  const wrapRouteElement = (
    routePath: string,
    element: ReactElement<any, string | JSXElementConstructor<any>>,
    permission?: string | string[]
  ) => {
    if (publicRoutes.has(routePath)) {
      return element;
    }

    if (authOnlyRoutes.has(routePath)) {
      return <RequireAuth>{element}</RequireAuth>;
    }

    return (
      <RequireAuth>
        <RequireBranch>
          <RequireSubscription>
            <RequirePermission permission={permission}>{element}</RequirePermission>
          </RequireSubscription>
        </RequireBranch>
      </RequireAuth>
    );
  };

  const getRoutes = (allRoutes: any[]): any =>
    allRoutes.map(
      (route: {
        collapse: any;
        route: string;
        permission?: string | string[];
        component: ReactElement<any, string | JSXElementConstructor<any>>;
        key: Key;
      }) => {
        if (route.collapse) return getRoutes(route.collapse);
        if (route.route)
          return (
            <Route
              path={route.route}
              element={wrapRouteElement(route.route, route.component, route.permission)}
              key={route.key}
            />
          );
        return null;
      }
    );

  const configsButton = (
    <MDBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.25rem"
      height="3.25rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="dark"
      sx={{ cursor: "pointer" }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="small" color="inherit">
        settings
      </Icon>
    </MDBox>
  );

  const selectedTheme = (() => {
    if (direction === "rtl") {
      return darkMode ? themeDarkRTL : themeRTL;
    }

    return darkMode ? themeDark : theme;
  })();

  const appContent = (
    <ThemeProvider theme={selectedTheme}>
      <ToastProvider>
        <ReferenceDataCacheProvider>
          <CssBaseline />
          {layout === "dashboard" && (
            <>
              <Sidenav
                color={sidenavColor}
                brand={(transparentSidenav && !darkMode) || whiteSidenav ? brandDark : brandWhite}
                brandName="Painel Swim"
                routes={routes}
                onMouseEnter={handleOnMouseEnter}
                onMouseLeave={handleOnMouseLeave}
              />
              <Configurator />
              {configsButton}
            </>
          )}

          {layout === "vr" && <Configurator />}

          <Routes>
            {getRoutes(routes)}
            {/* Rota catch-all para outras URLs */}
            <Route
              path="*"
              element={
                (() => {
                  console.log("[App.tsx] Rota catch-all (*) foi matcheada!");
                  console.log("[App.tsx] pathname:", window.location.pathname);
                  return (
                    <Navigate
                      to={
                        allowAll ||
                        (permissionsStatus === "ready" && permissions.dashboards_management_view)
                          ? "/dashboards/management"
                          : "/dashboards/operational"
                      }
                    />
                  );
                })()
              }
            />
          </Routes>
        </ReferenceDataCacheProvider>
      </ToastProvider>
    </ThemeProvider>
  );

  if (direction === "rtl") {
    return <CacheProvider value={rtlCache}>{appContent}</CacheProvider>;
  }

  return appContent;
}
