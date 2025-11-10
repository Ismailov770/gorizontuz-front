"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { api } from "@/lib/api"

interface AppContextType {
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  language: "uz" | "ru"
  locale: "uz" | "ru"
  setLanguage: (lang: "uz" | "ru") => void
  setLocale: (lang: "uz" | "ru") => void
  theme: "light" | "dark"
  setTheme: (theme: "light" | "dark") => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [language, setLanguageState] = useState<"uz" | "ru">("uz")
  const [theme, setThemeState] = useState<"light" | "dark">("light")

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedAuth = localStorage.getItem("isAuthenticated")
    const savedLanguage = localStorage.getItem("language")
    const savedTheme = localStorage.getItem("theme")

    if (savedAuth === "true") {
      setIsAuthenticated(true)
    }
    if (savedLanguage === "uz" || savedLanguage === "ru") {
      setLanguageState(savedLanguage)
    }
    if (savedTheme === "light" || savedTheme === "dark") {
      setThemeState(savedTheme)
    }
  }, [])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Use the API client which handles the proxy URL
      const response = await api.login({ username, password });
      
      if (!response.accessToken) {
        console.error('No access token received in response:', response);
        throw new Error('Authentication failed: No access token received');
      }
      
      // Token is already stored by the API client (accessToken)
      // Also store refreshToken and user info
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('userId', response.id.toString());
      localStorage.setItem('userRole', response.role);
      localStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  const logout = () => {
    api.clearToken()
    setIsAuthenticated(false)
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
  }

  const setLanguage = (lang: "uz" | "ru") => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const setTheme = (newTheme: "light" | "dark") => {
    setThemeState(newTheme)
  }

  return (
    <AppContext.Provider value={{ 
      isAuthenticated, 
      setIsAuthenticated,
      login, 
      logout, 
      language, 
      locale: language,
      setLanguage, 
      setLocale: setLanguage,
      theme, 
      setTheme 
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
