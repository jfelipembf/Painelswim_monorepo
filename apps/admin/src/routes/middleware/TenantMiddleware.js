import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTenant } from '../../context/TenantContext'
import { useBranch } from '../../context/BranchContext'
import { checkBranchAccess, checkUserBranchPermission } from '../../helpers/tenantGuard'

/**
 * Middleware para proteger rotas que precisam de tenant/branch ativo
 */
const TenantMiddleware = ({ children }) => {
  const { currentTenant, tenantLoading } = useTenant()
  const { currentBranch, branchLoading } = useBranch()
  const [accessCheck, setAccessCheck] = useState({ loading: true, allowed: false, reason: '' })

  useEffect(() => {
    const checkAccess = async () => {
      if (tenantLoading || branchLoading) {
        return
      }

      if (!currentTenant || !currentBranch) {
        setAccessCheck({ loading: false, allowed: false, reason: 'Tenant ou Branch não selecionado' })
        return
      }

      // Verificar se branch está ativa e com pagamento em dia
      const result = await checkBranchAccess(currentTenant.id, currentBranch.id)
      setAccessCheck({ loading: false, ...result })
    }

    checkAccess()
  }, [currentTenant, currentBranch, tenantLoading, branchLoading])

  if (accessCheck.loading || tenantLoading || branchLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Carregando...</span>
        </div>
      </div>
    )
  }

  if (!accessCheck.allowed) {
    return (
      <div className="d-flex justify-content-center align-items-center flex-column" style={{ minHeight: '100vh' }}>
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Acesso Negado</h4>
          <p>{accessCheck.reason}</p>
          <hr />
          <p className="mb-0">Entre em contato com o administrador do sistema.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default TenantMiddleware
