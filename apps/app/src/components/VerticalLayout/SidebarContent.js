import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef, useMemo, useState } from "react"
import SimpleBar from "simplebar-react"
import withRouter from "components/Common/withRouter"
import { Link } from "react-router-dom"
import usePermissions from "../../hooks/usePermissions"
import { withTranslation } from "react-i18next"

const SidebarContent = props => {
  const ref = useRef()
  const { hasPermission, hasAnyPermission } = usePermissions()

  // Estado para busca
  const [searchText, setSearchText] = useState("")

  // Estado para controlar QUAIS menus estão abertos (Array de IDs)
  const [expandedMenuItems, setExpandedMenuItems] = useState([])

  const tenant = props.router?.params?.tenant
  const branch = props.router?.params?.branch
  const basePath = tenant && branch ? `/${tenant}/${branch}` : ""
  const currentPath = props.router.location.pathname

  // --- 1. Utilitário de URL ---
  const buildPath = useCallback((path) => {
    if (!path || path === "#") return "#"
    return `${basePath}${path}`.replace(/\/+/g, '/')
  }, [basePath])

  // --- 2. Configuração do Menu ---
  const menuConfig = useMemo(() => [
    {
      id: "dashboard",
      label: props.t("Dashboard"),
      icon: "mdi mdi-view-dashboard-outline",
      // Removemos link direto, é apenas um container agora
      subMenu: [
        { id: "operational", label: props.t("Operacional"), icon: "mdi mdi-view-dashboard-outline", link: "/dashboard/operational" },
        { id: "management", label: props.t("Gerencial"), icon: "mdi mdi-chart-areaspline", link: "/dashboard", permission: "dashboards_management_view" },
      ],
    },
    { id: "grade", label: "Grade", icon: "mdi mdi-table-large", link: "/grade", permission: "grade_manage" },
    { id: "clients", label: "Clientes", icon: "mdi mdi-account-multiple-outline", link: "/clients/list", permission: "members_manage" },
    { id: "trainings", label: "Treinos", icon: "mdi mdi-swim", link: "/training-planning", permission: "members_manage" },
    {
      id: "admin",
      label: "Administrativos",
      icon: "mdi mdi-office-building-outline",
      anyPermission: ["collaborators_manage", "admin_activities", "admin_contracts", "admin_areas", "admin_roles", "admin_catalog", "admin_classes", "admin_settings"],
      subMenu: [
        { id: "collabs", label: "Colaboradores", link: "/collaborators/list", icon: "mdi mdi-account-multiple-check", permission: "collaborators_manage" },
        { id: "activities", label: "Atividades", link: "/admin/activity", icon: "mdi mdi-clipboard-text-outline", permission: "admin_activities" },
        { id: "contracts", label: "Contratos", link: "/admin/contracts", icon: "mdi mdi-file-document-outline", permission: "admin_contracts" },
        { id: "classes", label: "Turmas", link: "/admin/classes", icon: "mdi mdi-account-clock-outline", permission: "admin_classes" },
        { id: "areas", label: "Áreas", link: "/admin/areas", icon: "mdi mdi-map-marker-radius-outline", permission: "admin_areas" },
        { id: "roles", label: "Cargos e Permissões", link: "/admin/roles", icon: "mdi mdi-shield-account-outline", permission: "admin_roles" },
        { id: "catalog", label: "Produtos e Serviços", link: "/admin/catalog", icon: "mdi mdi-tag-text-outline", permission: "admin_catalog" },
      ],
    },
    {
      id: "financial",
      label: "Financeiro",
      icon: "mdi mdi-cash-multiple",
      anyPermission: ["financial_cashier", "financial_cashflow", "financial_acquirers"],
      subMenu: [
        { id: "cashier", label: "Caixa", link: "/financial/cashier", icon: "mdi mdi-cash-register", permission: "financial_cashier" },
        { id: "cashflow", label: "Fluxo de Caixa", link: "/financial/cashflow", icon: "mdi mdi-chart-line", permission: "financial_cashflow" },
        { id: "acquirers", label: "Adquirentes", link: "/financial/acquirers", icon: "mdi mdi-credit-card-multiple-outline", permission: "financial_acquirers" },
      ],
    },
    { id: "crm", label: "CRM", icon: "mdi mdi-headset", link: "/crm", permission: "crm_view" },
    {
      id: "gerencial",
      label: "Gerencial",
      icon: "mdi mdi-chart-bar",
      anyPermission: ["management_event_plan", "management_evaluation_levels", "management_integrations", "management_automations"],
      subMenu: [
        { id: "events", label: "Planejamento de Eventos", link: "/events/planning", icon: "mdi mdi-calendar-star", permission: "management_event_plan" },
        { id: "eval_levels", label: "Níveis de Avaliação", link: "/management/evaluation-levels", icon: "mdi mdi-chart-timeline-variant", permission: "management_evaluation_levels" },
        { id: "integrations", label: "Integrações", link: "/management/integrations", icon: "mdi mdi-api", permission: "management_integrations" },
        { id: "automations", label: "Automações", link: "/management/automations", icon: "mdi mdi-robot-excited-outline", permission: "management_automations" },
        { id: "audit", label: "Logs de Auditoria", link: "/management/audit-log", icon: "mdi mdi-clipboard-list-outline", permission: "management_audit_log" },
      ],
    },
    { id: "settings", label: "Configurações", icon: "mdi mdi-cog-outline", link: "/admin/settings", permission: "admin_settings" },
    { id: "evaluation", label: "Avaliação", icon: "mdi mdi-gesture-tap", link: "/evaluation", permission: "management_evaluation_run" },
    { id: "help", label: "Central de Ajuda", icon: "mdi mdi-help-circle-outline", link: "/help" },
  ], [props.t])

  // --- 3. Filtragem (Busca) ---
  const filteredMenu = useMemo(() => {
    const q = searchText.toLowerCase().trim()

    // Função recursiva para filtrar e marcar itens
    const filterItems = (items) => {
      return items
        .filter(item => {
          // Checagem de permissão
          if (item.permission && !hasPermission(item.permission)) return false
          if (item.anyPermission && !hasAnyPermission(item.anyPermission)) return false
          return true
        })
        .map(item => {
          const matchSelf = item.label.toLowerCase().includes(q)
          let children = []

          if (item.subMenu) {
            children = filterItems(item.subMenu)
          }

          // Se item combina ou tem filhos que combinam, retorna ele
          if (matchSelf || children.length > 0) {
            return { ...item, subMenu: children.length > 0 ? children : item.subMenu }
          }
          return null
        })
        .filter(Boolean)
    }

    return filterItems(menuConfig)
  }, [searchText, menuConfig, hasPermission, hasAnyPermission])


  // --- 4. Gerenciamento de Estado (Abertura/Fechamento) ---

  // Ação de Clique no Pai
  const toggleMenu = (itemId) => {
    setExpandedMenuItems(prev => {
      // Se já está aberto, fecha ele
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId)
      }
      // Se está fechado, abre ele e FECHA os outros (Comportamento Accordion)
      // Se quiser permitir múltiplos abertos, use: return [...prev, itemId]
      return [itemId]
    })
  }

  // Efeito: Monitorar URL para abrir menu correspondente automaticamente
  useEffect(() => {
    // Só roda se NÃO tiver busca ativa (busca controla a abertura sozinha)
    if (!searchText) {
      const parentToOpen = menuConfig.find(item =>
        item.subMenu && item.subMenu.some(sub => buildPath(sub.link) === currentPath)
      )

      if (parentToOpen) {
        setExpandedMenuItems([parentToOpen.id])
      }
    }
  }, [currentPath, searchText, menuConfig, buildPath])

  // Efeito: Monitorar Busca para abrir TODOS os resultados
  useEffect(() => {
    if (searchText) {
      const allParentIds = filteredMenu
        .filter(item => item.subMenu && item.subMenu.length > 0)
        .map(item => item.id)
      setExpandedMenuItems(allParentIds)
    }
  }, [searchText, filteredMenu])


  // --- 5. Renderização Recursiva ---
  const renderItem = (item) => {
    const hasChildren = item.subMenu && item.subMenu.length > 0
    const isExpanded = expandedMenuItems.includes(item.id)

    // Lógica "Active":
    // 1. É a rota atual exata?
    // 2. Ou é um pai cujo filho é a rota atual?
    const isExactRoute = buildPath(item.link) === currentPath
    const isParentOfActive = hasChildren && item.subMenu.some(sub => buildPath(sub.link) === currentPath)

    // Classes CSS manuais para simular o MetisMenu
    const liClass = [
      isExpanded ? "mm-active" : "", // Mantém a seta virada
      (isExactRoute || isParentOfActive) ? "mm-active" : "" // Mantém destacado se for o pai ativo
    ].join(" ")

    const linkClass = [
      hasChildren ? "has-arrow" : "",
      "waves-effect",
      isExactRoute ? "active" : "" // Texto azul/branco brilhante
    ].join(" ")

    return (
      <li key={item.id} className={liClass}>
        <Link
          to={hasChildren ? "#" : buildPath(item.link)}
          className={linkClass}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault() // Impede navegação e # na URL
              toggleMenu(item.id)
            }
          }}
        >
          {item.icon && <i className={item.icon}></i>}
          <span>{item.label}</span>
        </Link>

        {hasChildren && (
          <ul
            className="sub-menu"
            // Controlamos a visibilidade com CSS inline baseado no estado React
            style={{
              display: isExpanded ? "block" : "none",
              height: isExpanded ? "auto" : "0",
              overflow: "hidden"
            }}
          >
            {item.subMenu.map(sub => renderItem(sub))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <React.Fragment>
      {/* CSS Crítico para substituir o MetisMenu CSS JS */}
      <style>{`
        /* Remove animações conflitantes e garante comportamento sólido */
        .sub-menu { 
          list-style: none; 
          padding: 0; 
        }
        
        /* Destaque do Item Ativo */
        #sidebar-menu ul li a.active {
          color: #fff !important;
          background-color: rgba(255, 255, 255, 0.15);
        }
        #sidebar-menu ul li a.active i {
          color: #fff !important;
        }

        /* Input de Busca */
        .sidebar-search-input::placeholder { color: rgba(255, 255, 255, 0.5) !important; }
        .cursor-pointer { cursor: pointer; }
        
        /* Divisor do Ajuda */
        .menu-divider { border-top: 1px solid rgba(255,255,255,0.1); margin: 15px 0; }
      `}</style>

      <SimpleBar style={{ maxHeight: "100%" }} ref={ref}>
        <div id="sidebar-menu">
          {/* Campo de Busca */}
          <div className="px-3 py-2 mb-2">
            <div className="position-relative">
              <input
                type="text"
                className="form-control form-control-sm ps-4 sidebar-search-input"
                placeholder="Buscar menu..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.07)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "white",
                  boxShadow: "none"
                }}
              />
              <i className="mdi mdi-magnify position-absolute top-50 start-0 translate-middle-y ms-2 text-white-50"></i>
              {searchText && (
                <i
                  className="mdi mdi-close position-absolute top-50 end-0 translate-middle-y me-2 text-white-50 cursor-pointer"
                  onClick={() => setSearchText("")}
                ></i>
              )}
            </div>
          </div>

          <ul className="metismenu list-unstyled" id="side-menu">
            <li className="menu-title">{props.t("Menu")}</li>

            {filteredMenu.map(item => {
              if (item.id === 'help') {
                return (
                  <React.Fragment key={item.id}>
                    <li className="menu-divider"></li>
                    <li className="menu-title">Suporte</li>
                    {renderItem(item)}
                  </React.Fragment>
                )
              }
              return renderItem(item)
            })}

            {/* Feedback Visual se a busca não encontrar nada */}
            {filteredMenu.length === 0 && searchText && (
              <li className="text-center text-white-50 mt-4">
                <small>Nenhum menu encontrado.</small>
              </li>
            )}
          </ul>
        </div>
      </SimpleBar>
    </React.Fragment>
  )
}

export default withRouter(withTranslation()(SidebarContent))