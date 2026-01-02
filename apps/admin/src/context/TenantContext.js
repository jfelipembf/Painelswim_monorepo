import React, { createContext, useContext, useState, useEffect } from 'react'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { getFirebaseServices } from '../helpers/firebase_helper'

const TenantContext = createContext(null)

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}

export const TenantProvider = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState(null)
  const [tenantLoading, setTenantLoading] = useState(true)
  const [userTenants, setUserTenants] = useState([])
  
  const getDb = () => {
    const services = getFirebaseServices()
    return services?.db
  }

  // Detecta tenant por slug na URL ou localStorage
  useEffect(() => {
    const detectTenant = async () => {
      try {
        // 1. Tentar pegar slug da URL (ex: app.painelswim.com/{slug} ou {slug}.painelswim.com)
        const hostname = window.location.hostname
        const pathname = window.location.pathname
        
        let slug = null
        
        // Subdomain detection (ex: unidade1.painelswim.com)
        if (hostname.includes('.painelswim.com') && !hostname.startsWith('app.')) {
          slug = hostname.split('.')[0]
        }
        
        // Path-based detection (ex: app.painelswim.com/unidade1)
        if (!slug && pathname.split('/')[1]) {
          slug = pathname.split('/')[1]
        }
        
        // Fallback: localStorage
        if (!slug) {
          slug = localStorage.getItem('currentTenantSlug')
        }

        if (slug) {
          await loadTenantBySlug(slug)
        } else {
          setTenantLoading(false)
        }
      } catch (error) {
        console.error('Error detecting tenant:', error)
        setTenantLoading(false)
      }
    }

    detectTenant()
  }, [])

  const loadTenantBySlug = async (slug) => {
    try {
      setTenantLoading(true)
      const db = getDb()
      if (!db) {
        setTenantLoading(false)
        return
      }
      
      // Buscar tenant pelo slug
      const slugDocRef = doc(db, 'tenantsBySlug', slug)
      const slugDoc = await getDoc(slugDocRef)
      
      if (!slugDoc.exists()) {
        console.error('Tenant not found for slug:', slug)
        setTenantLoading(false)
        return
      }
      
      const { idTenant } = slugDoc.data()
      
      // Carregar dados completos do tenant
      const tenantDocRef = doc(db, 'tenants', idTenant)
      const tenantDoc = await getDoc(tenantDocRef)
      
      if (tenantDoc.exists()) {
        const tenantData = { id: idTenant, ...tenantDoc.data() }
        setCurrentTenant(tenantData)
        localStorage.setItem('currentTenantSlug', slug)
        localStorage.setItem('currentTenantId', idTenant)
      }
      
      setTenantLoading(false)
    } catch (error) {
      console.error('Error loading tenant:', error)
      setTenantLoading(false)
    }
  }

  const loadUserTenants = async (uid) => {
    try {
      const db = getDb()
      if (!db) return []
      
      // Buscar todos os tenants onde o usuário é membro
      const tenantsQuery = query(
        collection(db, 'tenants'),
        where('members', 'array-contains', uid)
      )
      
      const snapshot = await getDocs(tenantsQuery)
      const tenants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      setUserTenants(tenants)
      return tenants
    } catch (error) {
      console.error('Error loading user tenants:', error)
      return []
    }
  }

  const switchTenant = async (tenantId) => {
    try {
      const db = getDb()
      if (!db) return
      
      const tenantDocRef = doc(db, 'tenants', tenantId)
      const tenantDoc = await getDoc(tenantDocRef)
      
      if (tenantDoc.exists()) {
        const tenantData = { id: tenantId, ...tenantDoc.data() }
        setCurrentTenant(tenantData)
        localStorage.setItem('currentTenantSlug', tenantData.slug)
        localStorage.setItem('currentTenantId', tenantId)
        
        // Redirecionar para a URL do tenant
        window.location.href = `/${tenantData.slug}`
      }
    } catch (error) {
      console.error('Error switching tenant:', error)
    }
  }

  const value = {
    currentTenant,
    tenantLoading,
    userTenants,
    loadTenantBySlug,
    loadUserTenants,
    switchTenant,
  }

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}
