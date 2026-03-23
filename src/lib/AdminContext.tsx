'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AdminContext = createContext<{
  isAdmin: boolean
  toggleAdmin: () => void
  isDark: boolean
  toggleTheme: () => void
}>({ isAdmin: true, toggleAdmin: () => {}, isDark: false, toggleTheme: () => {} })

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const toggleAdmin = useCallback(() => setIsAdmin(prev => !prev), [])
  const toggleTheme = useCallback(() => setIsDark(prev => !prev), [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <AdminContext.Provider value={{ isAdmin, toggleAdmin, isDark, toggleTheme }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  return useContext(AdminContext)
}
