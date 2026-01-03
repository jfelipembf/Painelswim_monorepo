import { useState } from 'react'
import { getFirebaseBackend } from '../../helpers/firebase_helper'
import { 
  createTenant,
  getTenant,
  listTenants,
  getTenantBranches,
  toggleTenantStatus,
  toggleBranchStatus,
  updateBranchBillingStatus,
  createBranch,
} from '../../modules/tenants'

/**
 * Hook para gerenciamento de tenants (painel owner)
 */
export const useTenantManagement = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCreateTenant = async (tenantData, ownerData) => {
    try {
      setLoading(true)
      setError(null)
      const result = await createTenant(tenantData, ownerData)
      setLoading(false)
      return result
    } catch (err) {
      setError(err.message)
      setLoading(false)
      throw err
    }
  }

  const handleGetTenant = async (tenantId) => {
    try {
      setLoading(true)
      setError(null)
      const tenant = await getTenant(tenantId)
      setLoading(false)
      return tenant
    } catch (err) {
      setError(err.message)
      setLoading(false)
      throw err
    }
  }

  const handleListAllTenants = async () => {
    try {
      setLoading(true)
      setError(null)
      const tenants = await listTenants()
      setLoading(false)
      return tenants
    } catch (err) {
      setError(err.message)
      setLoading(false)
      throw err
    }
  }

  const handleGetTenantBranches = async (tenantId) => {
    try {
      setLoading(true)
      setError(null)
      const branches = await getTenantBranches(tenantId)
      setLoading(false)
      return branches
    } catch (err) {
      setError(err.message)
      setLoading(false)
      throw err
    }
  }

  const handleToggleTenantStatus = async (tenantId, status) => {
    try {
      setLoading(true)
      setError(null)
      await toggleTenantStatus(tenantId, status)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
      throw err
    }
  }

  const handleToggleBranchStatus = async (tenantId, branchId, status) => {
    try {
      setLoading(true)
      setError(null)
      await toggleBranchStatus(tenantId, branchId, status)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
      throw err
    }
  }

  const handleUpdateBillingStatus = async (tenantId, branchId, billingStatus) => {
    try {
      setLoading(true)
      setError(null)
      await updateBranchBillingStatus(tenantId, branchId, billingStatus)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
      throw err
    }
  }

  const handleCreateBranch = async (tenantId, branchData) => {
    try {
      setLoading(true)
      setError(null)
      const backend = getFirebaseBackend()
      if (!backend) {
        throw new Error('Firebase não inicializado. Verifique REACT_APP_DEFAULTAUTH.')
      }

      let logoUrl = branchData.logoUrl || ''
      if (branchData.logoFile) {
        const path = `tenants/${tenantId}/branches/logo/${Date.now()}-${branchData.logoFile.name}`
        const upload = await backend.uploadFile({
          path,
          file: branchData.logoFile,
          contentType: branchData.logoFile.type,
        })
        logoUrl = upload?.url || ''
      }

      const branchId = await createBranch(tenantId, {
        ...branchData,
        logoUrl,
      })
      setLoading(false)
      return branchId
    } catch (err) {
      setError(err.message)
      setLoading(false)
      throw err
    }
  }

  return {
    loading,
    error,
    createTenant: handleCreateTenant,
    getTenant: handleGetTenant,
    listAllTenants: handleListAllTenants,
    getTenantBranches: handleGetTenantBranches,
    toggleTenantStatus: handleToggleTenantStatus,
    toggleBranchStatus: handleToggleBranchStatus,
    updateBillingStatus: handleUpdateBillingStatus,
    createBranch: handleCreateBranch,
  }
}
