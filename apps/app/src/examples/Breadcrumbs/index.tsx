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

import { ReactNode } from "react";

// react-router-dom components
import { Link } from "react-router-dom";

// @mui material components
import { Breadcrumbs as MuiBreadcrumbs } from "@mui/material";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Declaring props types for the Breadcrumbs
interface Props {
  icon: ReactNode;
  title: string;
  route: string | string[];
  light?: boolean;
  [key: string]: any;
}

function Breadcrumbs({ icon, title, route, light }: Props): JSX.Element {
  const rawRoute = Array.isArray(route)
    ? route
    : String(route || "")
        .split("/")
        .filter(Boolean);
  const normalizedRoute = rawRoute.map((part) => String(part || "").trim()).filter(Boolean);

  const isLikelyId = (value: string) => {
    const v = String(value || "").trim();
    if (!v) return false;
    if (/^\d+$/.test(v)) return true;
    if (/^[a-f0-9-]{24,}$/i.test(v)) return true;
    if (/^[a-z0-9]{16,}$/i.test(v)) return true;
    return false;
  };

  const LABELS_PT: Record<string, string> = {
    dashboards: "Dashboards",
    operational: "Operacional",
    management: "Gerencial",
    financial: "Financeiro",
    "financial-dashboard": "Financeiro",

    grade: "Grade",

    collaborators: "Colaboradores",
    collaborator: "Colaborador",

    clients: "Clientes",
    members: "Clientes",
    member: "Cliente",

    list: "Lista",
    new: "Novo",

    admin: "Administrativo",
    activity: "Atividades",
    activities: "Atividades",
    contracts: "Contratos",
    schedules: "Turmas",
    areas: "Áreas",
    roles: "Cargos e permissões",
    catalog: "Produtos e serviços",
    settings: "Configurações",

    profile: "Perfil",
    sales: "Vendas",
    purchase: "Venda",
    "settle-debt": "Quitar saldo",
    cashier: "Caixa",
    cashflow: "Fluxo de caixa",
    acquirers: "Adquirentes",
    crm: "CRM",
    "event-plan": "Planejamento de eventos",
    tests: "Testes",
    "evaluation-levels": "Níveis de avaliação",
    integrations: "Integrações",
    touch: "Touch",

    login: "Login",
    "forgot-password": "Esqueci a senha",

    dashboard: "Dashboard",
  };

  const toLabel = (segment: string) => {
    const key = String(segment || "").trim();
    const normalized = key.toLowerCase();
    const mapped = LABELS_PT[normalized];
    const label = mapped || key.replace(/-/g, " ");
    if (!label) return "";
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const filtered = normalizedRoute.filter((seg) => !isLikelyId(seg));

  const lastSeg = normalizedRoute[normalizedRoute.length - 1] || "";
  const prevSeg = normalizedRoute[normalizedRoute.length - 2] || "";
  const isClientProfileIdRoute =
    prevSeg.toLowerCase() === "profile" &&
    (normalizedRoute.includes("clients") || normalizedRoute.includes("members")) &&
    isLikelyId(lastSeg);

  const effectiveTitle = isClientProfileIdRoute ? "Perfil" : toLabel(String(title || ""));
  const routes = filtered.slice(0, -1);

  return (
    <MDBox mr={{ xs: 0, xl: 8 }}>
      <MuiBreadcrumbs
        sx={{
          "& .MuiBreadcrumbs-separator": {
            color: ({ palette: { white, grey } }) => (light ? white.main : grey[600]),
          },
        }}
      >
        <Link to="/">
          <MDTypography
            component="span"
            variant="body2"
            color={light ? "white" : "dark"}
            opacity={light ? 0.8 : 0.5}
            sx={{ lineHeight: 0 }}
          >
            <Icon>{icon}</Icon>
          </MDTypography>
        </Link>
        {routes.map((el: string, idx: number) => (
          <Link to={`/${filtered.slice(0, idx + 1).join("/")}`} key={`${el}-${idx}`}>
            <MDTypography
              component="span"
              variant="button"
              fontWeight="regular"
              textTransform="capitalize"
              color={light ? "white" : "dark"}
              opacity={light ? 0.8 : 0.5}
              sx={{ lineHeight: 0 }}
            >
              {toLabel(el)}
            </MDTypography>
          </Link>
        ))}
        <MDTypography
          variant="button"
          fontWeight="regular"
          textTransform="capitalize"
          color={light ? "white" : "dark"}
          sx={{ lineHeight: 0 }}
        >
          {effectiveTitle}
        </MDTypography>
      </MuiBreadcrumbs>
      <MDTypography
        fontWeight="bold"
        textTransform="capitalize"
        variant="h6"
        color={light ? "white" : "dark"}
        noWrap
      >
        {effectiveTitle}
      </MDTypography>
    </MDBox>
  );
}

// Declaring default props for Breadcrumbs
Breadcrumbs.defaultProps = {
  light: false,
};

export default Breadcrumbs;
