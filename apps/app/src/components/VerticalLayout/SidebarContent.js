import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef } from "react"

// //Import Scrollbar
import SimpleBar from "simplebar-react"

// MetisMenu
import MetisMenu from "metismenujs"
import withRouter from "components/Common/withRouter"
import { Link } from "react-router-dom"

//i18n
import { withTranslation } from "react-i18next"

const SidebarContent = props => {
  const ref = useRef();


  // Funções helper recriadas para corrigir erro "not defined"
  const tenant = props.router?.params?.tenant
  const branch = props.router?.params?.branch
  const basePath = tenant && branch ? `/${tenant}/${branch}` : ""

  const buildPath = path => {
    if (!basePath) return path
    return `${basePath}${path}`
  }
  const activateParentDropdown = useCallback((item) => {
    item.classList.add("active");
    const parent = item.parentElement;
    const parent2El = parent.childNodes[1];

    if (parent2El && parent2El.id !== "side-menu") {
      parent2El.classList.add("mm-show");
    }

    if (parent) {
      parent.classList.add("mm-active");
      const parent2 = parent.parentElement;

      if (parent2) {
        parent2.classList.add("mm-show"); // ul tag

        const parent3 = parent2.parentElement; // li tag

        if (parent3) {
          parent3.classList.add("mm-active"); // li
          parent3.childNodes[0].classList.add("mm-active"); //a
          const parent4 = parent3.parentElement; // ul
          if (parent4) {
            parent4.classList.add("mm-show"); // ul
            const parent5 = parent4.parentElement;
            if (parent5) {
              parent5.classList.add("mm-show"); // li
              parent5.childNodes[0].classList.add("mm-active"); // a tag
            }
          }
        }
      }
      scrollElement(item);
      return false;
    }
    scrollElement(item);
    return false;
  }, []);

  const removeActivation = (items) => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i];
      const parent = items[i].parentElement;

      if (item && item.classList.contains("active")) {
        item.classList.remove("active");
      }
      if (parent) {
        const parent2El =
          parent.childNodes && parent.childNodes.lenght && parent.childNodes[1]
            ? parent.childNodes[1]
            : null;
        if (parent2El && parent2El.id !== "side-menu") {
          parent2El.classList.remove("mm-show");
        }

        parent.classList.remove("mm-active");
        const parent2 = parent.parentElement;

        if (parent2) {
          parent2.classList.remove("mm-show");

          const parent3 = parent2.parentElement;
          if (parent3) {
            parent3.classList.remove("mm-active"); // li
            parent3.childNodes[0].classList.remove("mm-active");

            const parent4 = parent3.parentElement; // ul
            if (parent4) {
              parent4.classList.remove("mm-show"); // ul
              const parent5 = parent4.parentElement;
              if (parent5) {
                parent5.classList.remove("mm-show"); // li
                parent5.childNodes[0].classList.remove("mm-active"); // a tag
              }
            }
          }
        }
      }
    }
  };

  const activeMenu = useCallback(() => {
    const pathName = process.env.PUBLIC_URL + props.router.location.pathname;
    let matchingMenuItem = null;
    const ul = document.getElementById("side-menu");
    const items = ul.getElementsByTagName("a");
    removeActivation(items);

    for (let i = 0; i < items.length; ++i) {
      if (pathName === items[i].pathname) {
        matchingMenuItem = items[i];
        break;
      }
    }
    if (matchingMenuItem) {
      activateParentDropdown(matchingMenuItem);
    }
  }, [props.router.location.pathname, activateParentDropdown]);

  useEffect(() => {
    ref.current.recalculate();
  }, []);

  useEffect(() => {
    new MetisMenu("#side-menu");
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    activeMenu();
  }, [activeMenu]);

  function scrollElement(item) {
    if (item) {
      const currentPosition = item.offsetTop;
      if (currentPosition > window.innerHeight) {
        ref.current.getScrollElement().scrollTop = currentPosition - 300;
      }
    }
  }

  return (
    <React.Fragment>
      <SimpleBar style={{ maxHeight: "100%" }} ref={ref}>
        <div id="sidebar-menu">
          <ul className="metismenu list-unstyled" id="side-menu">
            <li className="menu-title">{props.t("Main")} </li>
            <li>
              <Link to={buildPath("/dashboard")} className="waves-effect">
                <i className="mdi mdi-view-dashboard"></i>

                <span>{props.t("Dashboard")}</span>
              </Link>
            </li>
            <li>
              <Link to={buildPath("/grade")} className="waves-effect">
                <i className="mdi mdi-table-large"></i>
                <span>Grade</span>
              </Link>
            </li>
            <li>
              <Link to={buildPath("/clients/list")} className="waves-effect">
                <i className="mdi mdi-account-multiple-outline"></i>
                <span>Clientes</span>
              </Link>
            </li>
            <li>
              <Link to="/#" className="has-arrow waves-effect">
                <i className="mdi mdi-office-building-outline"></i>
                <span>Administrativos</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to={buildPath("/collaborators/list")}>
                    <i className="mdi mdi-account-multiple-check"></i>
                    <span>Colaboradores</span>
                  </Link>
                </li>
                <li>
                  <Link to={buildPath("/admin/activity")}>
                    <i className="mdi mdi-clipboard-text-outline"></i>
                    <span>Atividades</span>
                  </Link>
                </li>
                <li>
                  <Link to={buildPath("/admin/contracts")}>
                    <i className="mdi mdi-file-document-outline"></i>
                    <span>Contratos</span>
                  </Link>
                </li>
                <li>
                  <Link to={buildPath("/admin/classes")}>
                    <i className="mdi mdi-account-clock-outline"></i>
                    <span>Turmas</span>
                  </Link>
                </li>
                <li>
                  <Link to={buildPath("/admin/areas")}>
                    <i className="mdi mdi-map-marker-radius-outline"></i>
                    <span>Áreas</span>
                  </Link>
                </li>
                <li>
                  <Link to={buildPath("/admin/roles")}>
                    <i className="mdi mdi-shield-account-outline"></i>
                    <span>Cargos e Permissões</span>
                  </Link>
                </li>
                <li>
                  <Link to={buildPath("/admin/catalog")}>
                    <i className="mdi mdi-tag-text-outline"></i>
                    <span>Produtos e Serviços</span>
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link to="/#" className="has-arrow waves-effect">
                <i className="mdi mdi-cash-multiple"></i>
                <span>Financeiro</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to={buildPath("/financial/cashier")}>
                    <i className="mdi mdi-cash-register"></i>
                    <span>Caixa</span>
                  </Link>
                </li>
                <li>
                  <Link to={buildPath("/financial/cashflow")}>
                    <i className="mdi mdi-chart-line"></i>
                    <span>Fluxo de Caixa</span>
                  </Link>
                </li>
                <li>
                  <Link to={buildPath("/financial/acquirers")}>
                    <i className="mdi mdi-credit-card-multiple-outline"></i>
                    <span>Adquirentes</span>
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link to={buildPath("/crm")} className="waves-effect">
                <i className="mdi mdi-headset"></i>
                <span>CRM</span>
              </Link>
            </li>
            <li>
              <Link to="/#" className="has-arrow waves-effect">
                <i className="mdi mdi-chart-bar"></i>
                <span>Gerencial</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to={buildPath("/events/planning")}>
                    <i className="mdi mdi-calendar-star"></i>
                    <span>Planejamento de Eventos</span>
                  </Link>
                </li>
                <li>
                  <Link to={buildPath("/management/evaluation-levels")}>
                    <i className="mdi mdi-chart-timeline-variant"></i>
                    <span>Níveis de Avaliação</span>
                  </Link>
                </li>

                {/* <li>
                  <Link to={buildPath("/management/integrations")}>
                    <i className="mdi mdi-api"></i>
                    <span>Integrações</span>
                  </Link>
                </li>
                <li>
                  <Link to={buildPath("/management/automations")}>
                    <i className="mdi mdi-robot-excited-outline"></i>
                    <span>Automações</span>
                  </Link>
                </li> */}
              </ul>
            </li>
            <li>
              <Link to={buildPath("/admin/settings")} className="waves-effect">
                <i className="mdi mdi-cog-outline"></i>
                <span>Configurações</span>
              </Link>
            </li>
            <li>
              <Link to={buildPath("/evaluation")} className="waves-effect">
                <i className="mdi mdi-gesture-tap"></i>
                <span>Avaliação</span>
              </Link>
            </li>
          </ul>
        </div>
      </SimpleBar>
    </React.Fragment>
  )
}

SidebarContent.propTypes = {
  location: PropTypes.object,
  t: PropTypes.any,
}

export default withRouter(withTranslation()(SidebarContent))
