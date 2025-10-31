"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface AppContextType {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  language: "uz" | "ru"
  setLanguage: (lang: "uz" | "ru") => void
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
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL 
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api` 
        : 'http://localhost:8080/api';
      console.log('Logging in to:', `${apiBaseUrl}/auth/login`);
      
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // This is required for sending cookies with cross-origin requests
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Login failed with status:', response.status, 'Response:', errorData);
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      if (!data.token) {
        console.error('No token received in response:', data);
        throw new Error('Authentication failed: No token received');
      }
      
      // Store the token in localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('isAuthenticated', 'true');
      
      // Set the token in the API client
      if (typeof window !== 'undefined') {
        // @ts-ignore - We'll handle this in the API client
        if (window.api?.setToken) {
          window.api.setToken(data.token);
        }
      }
      
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("isAuthenticated")
  }

  const setLanguage = (lang: "uz" | "ru") => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const setTheme = (newTheme: "light" | "dark") => {
    setThemeState(newTheme)
  }

  return (
    <AppContext.Provider value={{ isAuthenticated, login, logout, language, setLanguage, theme, setTheme }}>
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
