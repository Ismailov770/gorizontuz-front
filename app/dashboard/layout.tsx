"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LayoutDashboard, FileText, FolderTree, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useApp } from "@/contexts/app-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout, language } = useApp()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const navigation = [
    {
      name: language === "uz" ? "Boshqaruv paneli" : "Панель управления",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: language === "uz" ? "Maqolalar" : "Статьи",
      href: "/dashboard/articles",
      icon: FileText,
    },
    {
      name: language === "uz" ? "Kategoriyalar" : "Категории",
      href: "/dashboard/categories",
      icon: FolderTree,
    },
  ]

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">Kunuz Admin</h1>
        </div>
        <nav className="space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleLogout}>
            <LogOut className="mr-2 h-5 w-5" />
            {language === "uz" ? "Chiqish" : "Выход"}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">{language === "uz" ? "Bosh sahifa" : "Главная страница"}</h2>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
