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

import { useState, useEffect } from "react";

// react-router components
import { useLocation, useNavigate } from "react-router-dom";

// @material-ui core components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import Chip from "@mui/material/Chip";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDInput from "components/MDInput";
import MDBadge from "components/MDBadge";
import MDTypography from "components/MDTypography";
import { signOutUser } from "../../../services/auth";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { setActiveBranch } from "../../../redux/slices/branchSlice";
import type { BillingStatus } from "../../../redux/slices/branchSlice";

// Material Dashboard 2 PRO React TS examples components
import Breadcrumbs from "examples/Breadcrumbs";
import NotificationItem from "examples/Items/NotificationItem";
import HeaderDatePicker from "components/HeaderDatePicker";

// Custom styles for DashboardNavbar
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarDesktopMenu,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";

// Material Dashboard 2 PRO React context
import { useMaterialUIController, setTransparentNavbar, setMiniSidenav } from "context";

// Declaring prop types for DashboardNavbar
interface Props {
  absolute?: boolean;
  light?: boolean;
  isMini?: boolean;
}

function DashboardNavbar({ absolute, light, isMini }: Props): JSX.Element {
  const [navbarType, setNavbarType] = useState<
    "fixed" | "absolute" | "relative" | "static" | "sticky"
  >();
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar, darkMode } = controller;
  const [openMenu, setOpenMenu] = useState<any>(false);
  const [openProfileMenu, setOpenProfileMenu] = useState<any>(false);
  const [openBranchMenu, setOpenBranchMenu] = useState<null | HTMLElement>(null);
  const route = useLocation().pathname.split("/").slice(1);
  const navigate = useNavigate();
  const reduxDispatch = useAppDispatch();
  const {
    branches,
    idBranch,
    status: branchStatus,
    billingStatus,
  } = useAppSelector((state) => state.branch);
  const activeBranch = branches.find((branch) => branch.idBranch === idBranch);
  const activeBranchName = activeBranch?.name || (idBranch ? `Unidade ${idBranch}` : "Sem unidade");

  const getBillingChip = (status: BillingStatus) => {
    const config: Record<
      BillingStatus,
      { label: string; color: "success" | "warning" | "error" | "default" }
    > = {
      active: { label: "Ativa", color: "success" },
      past_due: { label: "Pendente", color: "warning" },
      canceled: { label: "Cancelada", color: "error" },
      unknown: { label: "Indefinido", color: "default" },
    };
    const { label, color } = config[status];
    return <Chip label={label} size="small" color={color} />;
  };

  useEffect(() => {
    // Setting the navbar type
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    // A function that sets the transparent state of the navbar.
    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    /** 
     The event listener that's calling the handleTransparentNavbar function when 
     scrolling the window.
    */
    window.addEventListener("scroll", handleTransparentNavbar);

    // Call the handleTransparentNavbar function to set the state with the initial value.
    handleTransparentNavbar();

    // Remove event listener on cleanup
    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const handleOpenMenu = (event: any) => setOpenMenu(event.currentTarget);
  const handleCloseMenu = () => setOpenMenu(false);
  const handleOpenProfileMenu = (event: any) => setOpenProfileMenu(event.currentTarget);
  const handleCloseProfileMenu = () => {
    setOpenProfileMenu(false);
    setOpenBranchMenu(null);
  };
  const handleOpenBranchMenu = (event: any) => setOpenBranchMenu(event.currentTarget);
  const handleCloseBranchMenu = () => setOpenBranchMenu(null);

  const handleProfileNavigate = (path: string) => {
    handleCloseProfileMenu();
    navigate(path);
  };

  const handleLogout = async () => {
    handleCloseProfileMenu();
    try {
      await signOutUser();
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const handleSelectBranch = (
    branchId: string,
    billingStatus?: "active" | "past_due" | "canceled" | "unknown"
  ) => {
    reduxDispatch(
      setActiveBranch({
        idBranch: branchId,
        billingStatus: billingStatus ?? "unknown",
      })
    );
    handleCloseBranchMenu();
    handleCloseProfileMenu();
  };

  // Render the notifications menu
  const renderMenu = () => (
    <Menu
      anchorEl={openMenu}
      anchorReference={null}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      open={Boolean(openMenu)}
      onClose={handleCloseMenu}
      sx={{ mt: 2 }}
    >
      <NotificationItem icon={<Icon>email</Icon>} title="Check new messages" />
      <NotificationItem icon={<Icon>podcasts</Icon>} title="Manage Podcast sessions" />
      <NotificationItem icon={<Icon>shopping_cart</Icon>} title="Payment successfully completed" />
    </Menu>
  );

  const renderProfileMenu = () => (
    <Menu
      anchorEl={openProfileMenu}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      open={Boolean(openProfileMenu)}
      onClose={handleCloseProfileMenu}
      sx={{ mt: 1 }}
    >
      <MenuItem onClick={() => handleProfileNavigate("/collaborators/profile")}>Perfil</MenuItem>
      <MenuItem onClick={() => handleProfileNavigate("/financial/cashier")}>Financeiro</MenuItem>
      <MenuItem onClick={handleOpenBranchMenu}>
        Unidade
        <Icon fontSize="small" sx={{ ml: "auto" }}>
          chevron_right
        </Icon>
      </MenuItem>
      <Divider sx={{ my: 0.5 }} />
      <MenuItem onClick={handleLogout}>Sair</MenuItem>
    </Menu>
  );

  const renderBranchMenu = () => (
    <Menu
      anchorEl={openBranchMenu}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      open={Boolean(openBranchMenu)}
      onClose={handleCloseBranchMenu}
      sx={{ mt: 1 }}
    >
      {branchStatus === "loading" && <MenuItem disabled>Carregando unidades...</MenuItem>}
      {branchStatus !== "loading" && branches.length === 0 && (
        <MenuItem disabled>Nenhuma unidade disponível</MenuItem>
      )}
      {branchStatus !== "loading" &&
        branches.map((branch) =>
          (() => {
            const isActive = branch.idBranch === idBranch;
            return (
              <MenuItem
                key={branch.idBranch}
                selected={isActive}
                onClick={() => handleSelectBranch(branch.idBranch, branch.billingStatus)}
                sx={({ palette, functions }: { palette: any; functions: any }) => ({
                  ...(isActive
                    ? {
                        fontWeight: 700,
                        color: palette.info.main,
                        backgroundColor: functions.rgba(palette.info.main, 0.08),
                      }
                    : {}),
                })}
              >
                <ListItemIcon>
                  <Icon fontSize="small">
                    {isActive ? "check_circle" : "radio_button_unchecked"}
                  </Icon>
                </ListItemIcon>
                <MDBox
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1}
                  width="100%"
                >
                  <MDTypography variant="button" fontWeight={isActive ? "bold" : "regular"}>
                    {branch.name}
                  </MDTypography>
                  {isActive ? (
                    <MDTypography
                      variant="caption"
                      fontWeight="bold"
                      color="info"
                      sx={({ palette, functions }: { palette: any; functions: any }) => ({
                        px: 1,
                        py: 0.25,
                        borderRadius: "md",
                        backgroundColor: functions.rgba(palette.info.main, 0.14),
                      })}
                    >
                      Atual
                    </MDTypography>
                  ) : null}
                </MDBox>
              </MenuItem>
            );
          })()
        )}
    </Menu>
  );

  // Styles for the navbar icons
  const iconsStyle = ({
    palette: { dark, white, text },
    functions: { rgba },
  }: {
    palette: any;
    functions: any;
  }) => ({
    color: () => {
      let colorValue = light || darkMode ? white.main : dark.main;

      if (transparentNavbar && !light) {
        colorValue = darkMode ? rgba(text.main, 0.6) : text.main;
      }

      return colorValue;
    },
  });

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light, darkMode })}
    >
      <Toolbar sx={navbarContainer}>
        <MDBox color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini })}>
          <Breadcrumbs icon="home" title={route[route.length - 1]} route={route} light={light} />
          <IconButton sx={navbarDesktopMenu} onClick={handleMiniSidenav} size="small" disableRipple>
            <Icon fontSize="medium" sx={iconsStyle}>
              {miniSidenav ? "menu_open" : "menu"}
            </Icon>
          </IconButton>
        </MDBox>
        {isMini ? null : (
          <MDBox sx={(theme) => navbarRow(theme, { isMini })}>
            <MDBox pr={1}>
              <HeaderDatePicker />
            </MDBox>
            <MDBox color={light ? "white" : "inherit"}>
              <IconButton
                sx={navbarIconButton}
                size="small"
                disableRipple
                onClick={() => navigate("/touch", { state: { from: location.pathname } })}
              >
                <Icon sx={iconsStyle}>touch_app</Icon>
              </IconButton>
              <IconButton
                sx={navbarIconButton}
                size="small"
                disableRipple
                onClick={handleOpenProfileMenu}
              >
                <Icon sx={iconsStyle}>account_circle</Icon>
              </IconButton>
              {renderProfileMenu()}
              {renderBranchMenu()}
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarMobileMenu}
                onClick={handleMiniSidenav}
              >
                <Icon sx={iconsStyle} fontSize="medium">
                  {miniSidenav ? "menu_open" : "menu"}
                </Icon>
              </IconButton>
              <IconButton
                size="small"
                color="inherit"
                sx={navbarIconButton}
                onClick={handleOpenMenu}
              >
                <MDBadge badgeContent={9} color="error" size="xs" circular>
                  <Icon sx={iconsStyle}>notifications</Icon>
                </MDBadge>
              </IconButton>
              {renderMenu()}
            </MDBox>
          </MDBox>
        )}
      </Toolbar>
    </AppBar>
  );
}

// Declaring default props for DashboardNavbar
DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
};

export default DashboardNavbar;
