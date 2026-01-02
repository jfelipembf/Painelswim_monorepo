import { doc, getDoc } from 'firebase/firestore'
import { getFirebaseServices } from './firebase_helper'

const getDb = () => {
  const services = getFirebaseServices()
  if (!services?.db) {
    throw new Error('Firebase not initialized')
  }
  return services.db
}

/**
 * Middleware para verificar se branch está ativa
 */
export const checkBranchAccess = async (tenantId, branchId) => {
  try {
    if (!tenantId || !branchId) {
      return { allowed: false, reason: 'Tenant ou Branch não especificado' }
    }

    const db = getDb()
    
    // Verificar status do tenant
    const tenantRef = doc(db, 'tenants', tenantId)
    const tenantDoc = await getDoc(tenantRef)
    
    if (!tenantDoc.exists()) {
      return { allowed: false, reason: 'Tenant não encontrado' }
    }
    
    const tenantData = tenantDoc.data()
    if (tenantData.status !== 'active') {
      return { allowed: false, reason: 'Tenant inativo' }
    }

    // Verificar status da branch
    const branchRef = doc(db, 'tenants', tenantId, 'branches', branchId)
    const branchDoc = await getDoc(branchRef)
    
    if (!branchDoc.exists()) {
      return { allowed: false, reason: 'Branch não encontrada' }
    }
    
    const branchData = branchDoc.data()
    
    if (branchData.status !== 'active') {
      return { allowed: false, reason: 'Unidade bloqueada pelo administrador' }
    }
    
    if (branchData.billingStatus === 'canceled') {
      return { allowed: false, reason: 'Assinatura cancelada' }
    }
    
    if (branchData.billingStatus === 'past_due') {
      return { allowed: false, reason: 'Pagamento em atraso' }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Error checking branch access:', error)
    return { allowed: false, reason: 'Erro ao verificar acesso' }
  }
}

/**
 * Verifica se usuário tem acesso a uma branch específica
 */
export const checkUserBranchPermission = async (tenantId, branchId, uid) => {
  try {
    const db = getDb()
    const memberRef = doc(db, 'tenants', tenantId, 'members', uid)
    const memberDoc = await getDoc(memberRef)
    
    if (!memberDoc.exists()) {
      return { allowed: false, reason: 'Usuário não é membro deste tenant' }
    }
    
    const memberData = memberDoc.data()
    
    // Owner tem acesso a todas as branches
    if (memberData.role === 'owner') {
      return { allowed: true, role: 'owner' }
    }
    
    // Verificar se tem acesso à branch específica
    if (!memberData.branchIds || !memberData.branchIds.includes(branchId)) {
      return { allowed: false, reason: 'Sem permissão para acessar esta unidade' }
    }
    
    const roleInBranch = memberData.roleByBranch?.[branchId]
    
    return { allowed: true, role: roleInBranch || 'member' }
  } catch (error) {
    console.error('Error checking user branch permission:', error)
    return { allowed: false, reason: 'Erro ao verificar permissões' }
  }
}

/**
 * HOC para proteger rotas que precisam de tenant/branch ativo
 */
export const withBranchGuard = (Component) => {
  return (props) => {
    // Este HOC será usado nos componentes de rota
    // A lógica real de verificação será feita no middleware de rota
    return <Component {...props} />
  }
}
