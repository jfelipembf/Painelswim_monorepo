import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef } from "react"

// //Import Scrollbar
import SimpleBar from "simplebar-react"

// MetisMenu
import MetisMenu from "metismenujs"
import withRouter from "components/Common/withRouter"
import { Link } from "react-router-dom"
import usePermissions from "../../hooks/usePermissions"

//i18n
import { withTranslation } from "react-i18next"

const SidebarContent = props => {
  const ref = useRef()
  const { hasPermission, hasAnyPermission } = usePermissions()
  const [searchText, setSearchText] = React.useState("")

  // Funções helper recriadas para corrigir erro "not defined"
  const tenant = props.router?.params?.tenant
  const branch = props.router?.params?.branch
  const basePath = tenant && branch ? `/${tenant}/${branch}` : ""

  const buildPath = path => {
    if (!basePath) return path
    if (path === "/#") return path // Maintain dummy links for dropdowns
    return `${basePath}${path}`
  }

  // --- Menu Data Structure ---
  const menuConfig = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "mdi mdi-view-dashboard-outline",
      link: "/#",
      subMenu: [
        {
          id: "dashboard_op",
          label: "Operacional",
          icon: "mdi mdi-view-dashboard-outline",
          link: "/dashboard/operational",
        },
        {
          id: "dashboard_ger",
          label: "Gerencial",
          icon: "mdi mdi-chart-areaspline",
          link: "/dashboard",
          permission: "dashboards_management_view",
        },
      ],
    },
    {
      id: "grade",
      label: "Grade",
      icon: "mdi mdi-table-large",
      link: "/grade",
      permission: "grade_manage",
    },
    {
      id: "clients",
      label: "Clientes",
      icon: "mdi mdi-account-multiple-outline",
      link: "/clients/list",
      permission: "members_manage",
    },
    {
      id: "training_planning",
      label: "Treinos",
      icon: "mdi mdi-swim",
      link: "/training-planning",
      permission: "members_manage",
    },
    {
      id: "admin",
      label: "Administrativos",
      icon: "mdi mdi-office-building-outline",
      link: "/#",
      anyPermission: [
        "collaborators_manage",
        "admin_activities",
        "admin_contracts",
        "admin_areas",
        "admin_roles",
        "admin_catalog",
        "admin_classes",
        "admin_settings",
      ],
      subMenu: [
        {
          id: "staff",
          label: "Colaboradores",
          icon: "mdi mdi-account-multiple-check",
          link: "/collaborators/list",
          permission: "collaborators_manage",
        },
        {
          id: "activities",
          label: "Atividades",
          icon: "mdi mdi-clipboard-text-outline",
          link: "/admin/activity",
          permission: "admin_activities",
        },
        {
          id: "contracts",
          label: "Contratos",
          icon: "mdi mdi-file-document-outline",
          link: "/admin/contracts",
          permission: "admin_contracts",
        },
        {
          id: "classes",
          label: "Turmas",
          icon: "mdi mdi-account-clock-outline",
          link: "/admin/classes",
          permission: "admin_classes",
        },
        {
          id: "areas",
          label: "Áreas",
          icon: "mdi mdi-map-marker-radius-outline",
          link: "/admin/areas",
          permission: "admin_areas",
        },
        {
          id: "roles",
          label: "Cargos e Permissões",
          icon: "mdi mdi-shield-account-outline",
          link: "/admin/roles",
          permission: "admin_roles",
        },
        {
          id: "catalog",
          label: "Produtos e Serviços",
          icon: "mdi mdi-tag-text-outline",
          link: "/admin/catalog",
          permission: "admin_catalog",
        },
      ],
    },
    {
      id: "financial",
      label: "Financeiro",
      icon: "mdi mdi-cash-multiple",
      link: "/#",
      anyPermission: ["financial_cashier", "financial_cashflow", "financial_acquirers"],
      subMenu: [
        {
          id: "cashier",
          label: "Caixa",
          icon: "mdi mdi-cash-register",
          link: "/financial/cashier",
          permission: "financial_cashier",
        },
        {
          id: "cashflow",
          label: "Fluxo de Caixa",
          icon: "mdi mdi-chart-line",
          link: "/financial/cashflow",
          permission: "financial_cashflow",
        },
        {
          id: "acquirers",
          label: "Adquirentes",
          icon: "mdi mdi-credit-card-multiple-outline",
          link: "/financial/acquirers",
          permission: "financial_acquirers",
        },
      ],
    },
    {
      id: "crm",
      label: "CRM",
      icon: "mdi mdi-headset",
      link: "/crm",
      permission: "crm_view",
    },
    {
      id: "management",
      label: "Gerencial",
      icon: "mdi mdi-chart-bar",
      link: "/#",
      anyPermission: [
        "management_event_plan",
        "management_evaluation_levels",
        "management_integrations",
        "management_automations",
      ],
      subMenu: [
        {
          id: "events",
          label: "Planejamento de Eventos",
          icon: "mdi mdi-calendar-star",
          link: "/events/planning",
          permission: "management_event_plan",
        },
        {
          id: "eval_levels",
          label: "Níveis de Avaliação",
          icon: "mdi mdi-chart-timeline-variant",
          link: "/management/evaluation-levels",
          permission: "management_evaluation_levels",
        },
        {
          id: "integrations",
          label: "Integrações",
          icon: "mdi mdi-api",
          link: "/management/integrations",
          permission: "management_integrations",
        },
        {
          id: "automations",
          label: "Automações",
          icon: "mdi mdi-robot-excited-outline",
          link: "/management/automations",
          permission: "management_automations",
        },
        {
          id: "audit",
          label: "Logs de Auditoria",
          icon: "mdi mdi-clipboard-list-outline",
          link: "/management/audit-log",
          permission: "management_audit_log",
        },
      ],
    },
    {
      id: "settings",
      label: "Configurações",
      icon: "mdi mdi-cog-outline",
      link: "/admin/settings",
      permission: "admin_settings",
    },
    {
      id: "evaluation",
      label: "Avaliação",
      icon: "mdi mdi-gesture-tap",
      link: "/evaluation",
      permission: "management_evaluation_run",
    },
    {
      id: "help",
      label: "Central de Ajuda",
      icon: "mdi mdi-help-circle-outline",
      link: "/help",
    },
  ]

  const activateParentDropdown = useCallback(item => {
    item.classList.add("active")
    const parent = item.parentElement
    const parent2El = parent.childNodes[1]

    if (parent2El && parent2El.id !== "side-menu") {
      parent2El.classList.add("mm-show")
    }

    if (parent) {
      parent.classList.add("mm-active")
      const parent2 = parent.parentElement

      if (parent2) {
        parent2.classList.add("mm-show") // ul tag

        const parent3 = parent2.parentElement // li tag

        if (parent3) {
          parent3.classList.add("mm-active") // li
          parent3.childNodes[0].classList.add("mm-active") //a
          const parent4 = parent3.parentElement // ul
          if (parent4) {
            parent4.classList.add("mm-show") // ul
            const parent5 = parent4.parentElement
            if (parent5) {
              parent5.classList.add("mm-show") // li
              parent5.childNodes[0].classList.add("mm-active") // a tag
            }
          }
        }
      }
      scrollElement(item)
      return false
    }
    scrollElement(item)
    return false
  }, [])

  const removeActivation = items => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i]
      const parent = items[i].parentElement

      if (item && item.classList.contains("active")) {
        item.classList.remove("active")
      }
      if (parent) {
        const parent2El = parent.childNodes && parent.childNodes.lenght && parent.childNodes[1] ? parent.childNodes[1] : null
        if (parent2El && parent2El.id !== "side-menu") {
          parent2El.classList.remove("mm-show")
        }

        parent.classList.remove("mm-active")
        const parent2 = parent.parentElement

        if (parent2) {
          parent2.classList.remove("mm-show")

          const parent3 = parent2.parentElement
          if (parent3) {
            parent3.classList.remove("mm-active") // li
            parent3.childNodes[0].classList.remove("mm-active")

            const parent4 = parent3.parentElement // ul
            if (parent4) {
              parent4.classList.remove("mm-show") // ul
              const parent5 = parent4.parentElement
              if (parent5) {
                parent5.classList.remove("mm-show") // li
                parent5.childNodes[0].classList.remove("mm-active") // a tag
              }
            }
          }
        }
      }
    }
  }

  const activeMenu = useCallback(() => {
    const pathName = process.env.PUBLIC_URL + props.router.location.pathname
    let matchingMenuItem = null
    const ul = document.getElementById("side-menu")
    if (!ul) return
    const items = ul.getElementsByTagName("a")
    removeActivation(items)

    for (let i = 0; i < items.length; ++i) {
      if (pathName === items[i].pathname) {
        matchingMenuItem = items[i]
        break
      }
    }
    if (matchingMenuItem) {
      activateParentDropdown(matchingMenuItem)
    }
  }, [props.router.location.pathname, activateParentDropdown])

  useEffect(() => {
    ref.current.recalculate()
  }, [])

  useEffect(() => {
    new MetisMenu("#side-menu")
    return () => {
      // MetisMenu doesn't have a direct destroy but clearing classes helps
      const el = document.getElementById("side-menu")
      if (el) {
        el.classList.remove("metismenu")
      }
    }
  }, [searchText]) // Re-init on search

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
    activeMenu()
  }, [activeMenu])

  function scrollElement(item) {
    if (item) {
      const currentPosition = item.offsetTop
      if (currentPosition > window.innerHeight) {
        ref.current.getScrollElement().scrollTop = currentPosition - 300
      }
    }
  }

  // --- Filtering Logic ---
  const filteredItems = React.useMemo(() => {
    const q = searchText.toLowerCase().trim()

    return menuConfig
      .filter(item => {
        // Permission check
        if (item.permission && !hasPermission(item.permission)) return false
        if (item.anyPermission && !hasAnyPermission(item.anyPermission)) return false
        return true
      })
      .map(item => {
        if (!item.subMenu) return item

        const filteredSub = item.subMenu.filter(sub => {
          // Sub-permission check
          if (sub.permission && !hasPermission(sub.permission)) return false

          // Match sub-item label
          if (!q) return true
          return sub.label.toLowerCase().includes(q)
        })

        // If parent matches query, show all sub-items (or just show parent)
        const parentMatches = item.label.toLowerCase().includes(q)

        if (parentMatches || filteredSub.length > 0) {
          return {
            ...item,
            subMenu: parentMatches && !q ? item.subMenu : filteredSub,
            forceOpen: !!q && filteredSub.length > 0,
          }
        }
        return null
      })
      .filter(Boolean)
  }, [searchText, hasPermission, hasAnyPermission, menuConfig])

  return (
    <React.Fragment>
      <style>
        {`
          .sidebar-search-input::placeholder {
            color: rgba(255, 255, 255, 0.6) !important;
          }
        `}
      </style>
      <SimpleBar style={{ maxHeight: "100%" }} ref={ref}>
        <div id="sidebar-menu">
          {/* Search Bar */}
          <div className="px-3 py-2 mb-2">
            <div className="position-relative">
              <input
                type="text"
                className="form-control form-control-sm ps-4 sidebar-search-input"
                placeholder="Buscar menu..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{
                  fontSize: "12px",
                  height: "32px",
                  backgroundColor: "rgba(255, 255, 255, 0.07)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "4px",
                  color: "white",
                }}
              />
              <i
                className="mdi mdi-magnify position-absolute top-50 start-0 translate-middle-y ms-2 text-white"
                style={{ fontSize: "14px" }}
              ></i>
              {searchText && (
                <i
                  className="mdi mdi-close position-absolute top-50 end-0 translate-middle-y me-2 text-white cursor-pointer"
                  style={{ fontSize: "14px", cursor: "pointer" }}
                  onClick={() => setSearchText("")}
                ></i>
              )}
            </div>
          </div>

          <ul className="metismenu list-unstyled" id="side-menu" key={searchText}>
            {filteredItems.map((item, index) => {
              // Check if this is the help item - add separator before it
              const isHelpItem = item.id === 'help';
              const showSeparator = isHelpItem && index > 0;

              return (
                <React.Fragment key={item.id}>
                  {showSeparator && (
                    <li className="menu-title mt-3 mb-2">
                      <hr className="my-2" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                      <span className="text-uppercase" style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.5px' }}>
                        Suporte
                      </span>
                    </li>
                  )}
                  <li className={item.forceOpen ? "mm-active" : ""}>
                    <Link to={item.subMenu ? "/#" : buildPath(item.link)} className={`${item.subMenu ? "has-arrow" : ""} waves-effect`}>
                      <i className={item.icon}></i>
                      <span>{item.label}</span>
                    </Link>
                    {item.subMenu && (
                      <ul className={`sub-menu ${item.forceOpen ? "mm-show" : ""}`} aria-expanded={false}>
                        {item.subMenu.map(sub => (
                          <li key={sub.id}>
                            <Link to={buildPath(sub.link)}>
                              <i className={sub.icon}></i>
                              <span>{sub.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                </React.Fragment>
              );
            })}
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
