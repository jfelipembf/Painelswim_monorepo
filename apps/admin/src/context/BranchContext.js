import React, { createContext, useContext, useState, useEffect } from 'react'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { getFirebaseServices } from '../helpers/firebase_helper'
import { useTenant } from './TenantContext'

const BranchContext = createContext(null)

export const useBranch = () => {
  const context = useContext(BranchContext)
  if (!context) {
    throw new Error('useBranch must be used within BranchProvider')
  }
  return context
}

export const BranchProvider = ({ children }) => {
  const { currentTenant } = useTenant()
  const [currentBranch, setCurrentBranch] = useState(null)
  const [branchLoading, setBranchLoading] = useState(true)
  const [userBranches, setUserBranches] = useState([])
  
  const getDb = () => {
    const services = getFirebaseServices()
    return services?.db
  }

  // Carregar branches do tenant atual
  useEffect(() => {
    if (currentTenant?.id) {
      loadBranches(currentTenant.id)
    } else {
      setBranchLoading(false)
    }
  }, [currentTenant])

  const loadBranches = async (tenantId) => {
    try {
      setBranchLoading(true)
      const db = getDb()
      if (!db) {
        setBranchLoading(false)
        return
      }
      
      const branchesRef = collection(db, 'tenants', tenantId, 'branches')
      const snapshot = await getDocs(branchesRef)
      
      const branches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setUserBranches(branches)
      
      // Auto-selecionar primeira branch ou branch do localStorage
      const savedBranchId = localStorage.getItem('currentBranchId')
      let branchToSelect = null
      
      if (savedBranchId) {
        branchToSelect = branches.find(b => b.id === savedBranchId)
      }
      
      if (!branchToSelect && branches.length > 0) {
        branchToSelect = branches[0]
      }
      
      if (branchToSelect) {
        setCurrentBranch(branchToSelect)
        localStorage.setItem('currentBranchId', branchToSelect.id)
      }
      
      setBranchLoading(false)
    } catch (error) {
      console.error('Error loading branches:', error)
      setBranchLoading(false)
    }
  }

  const switchBranch = (branchId) => {
    const branch = userBranches.find(b => b.id === branchId)
    if (branch) {
      setCurrentBranch(branch)
      localStorage.setItem('currentBranchId', branchId)
    }
  }

  const value = {
    currentBranch,
    branchLoading,
    userBranches,
    switchBranch,
    loadBranches,
  }

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
}
