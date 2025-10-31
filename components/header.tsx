"use client"

import { Moon, Sun, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useApp } from "@/contexts/app-context"
import { useTranslation } from "@/lib/i18n"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

export function Header() {
  const { locale, setLocale, theme, setTheme, setIsAuthenticated } = useApp()
  const t = useTranslation(locale)
  const router = useRouter()

  const handleLogout = () => {
    api.clearToken()
    setIsAuthenticated(false)
    router.push("/login")
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-foreground" />
          <h1 className="text-xl font-semibold">{t.dashboard}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocale("uz")}>O'zbekcha</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale("ru")}>Русский</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Switcher */}
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Logout */}
          <Button variant="ghost" onClick={handleLogout}>
            {t.logout}
          </Button>
        </div>
      </div>
    </header>
  )
}
