"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FolderOpen, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/app-context"
import { useTranslation } from "@/lib/i18n"

const navigation = [
  { name: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "categories", href: "/dashboard/categories", icon: FolderOpen },
  { name: "articles", href: "/dashboard/articles", icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const { locale } = useApp()
  const t = useTranslation(locale)

  return (
    <aside className="w-64 border-r border-border bg-background">
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {t[item.name as keyof typeof t]}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
