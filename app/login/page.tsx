"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useApp } from "@/contexts/app-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"

export default function LoginPage() {
  const { login, language } = useApp()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const success = await login(username, password)
      if (success) {
        router.push("/dashboard")
      } else {
        setError(language === "uz" ? "Noto'g'ri login yoki parol" : "Неверный логин или пароль")
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(language === "uz" ? "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring." : "Произошла ошибка. Пожалуйста, попробуйте снова.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4 flex gap-2">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Kunuz Admin</CardTitle>
          <CardDescription>
            {language === "uz"
              ? "Tizimga kirish uchun ma'lumotlaringizni kiriting"
              : "Введите данные для входа в систему"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{language === "uz" ? "Foydalanuvchi nomi" : "Имя пользователя"}</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={language === "uz" ? "admin" : "admin"}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{language === "uz" ? "Parol" : "Пароль"}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "uz" ? "Kutilmoqda..." : "Загрузка..."}
                </>
              ) : (
                language === "uz" ? "Kirish" : "Войти"
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {language === "uz" ? "Demo: admin / admin" : "Демо: admin / admin"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
