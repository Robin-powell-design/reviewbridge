'use client'

import { createContext, useContext, useState, useCallback } from 'react'

const AdminContext = createContext<{
  isAdmin: boolean
  toggleAdmin: () => void
}>({ isAdmin: true, toggleAdmin: () => {} })

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(true)
  const toggleAdmin = useCallback(() => setIsAdmin(prev => !prev), [])

  return (
    <AdminContext.Provider value={{ isAdmin, toggleAdmin }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  return useContext(AdminContext)
}
