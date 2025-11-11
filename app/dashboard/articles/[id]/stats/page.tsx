"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, TrendingUp, Calendar, Loader2, ArrowLeft } from "lucide-react"
import { api, type ArticleStats } from "@/lib/api"
import { useApp } from "@/contexts/app-context"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function ArticleStatsPage() {
  const { language } = useApp()
  const params = useParams()
  const router = useRouter()
  const articleId = parseInt(params.id as string)
  
  const [stats, setStats] = useState<ArticleStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (articleId) {
      fetchStats()
    }
  }, [articleId])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const data = await api.getArticleStats(articleId)
      setStats(data)
    } catch (error) {
      console.error('Error fetching article stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === "uz" ? "Orqaga" : "Назад"}
        </Button>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              {language === "uz" ? "Statistika topilmadi" : "Статистика не найдена"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statsCards = [
    {
      title: language === "uz" ? "Jami ko'rishlar" : "Всего просмотров",
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: "text-blue-500"
    },
    {
      title: language === "uz" ? "Bugun" : "Сегодня",
      value: stats.viewsToday.toLocaleString(),
      icon: Calendar,
      color: "text-green-500"
    },
    {
      title: language === "uz" ? "Bu hafta" : "На этой неделе",
      value: stats.viewsThisWeek.toLocaleString(),
      icon: TrendingUp,
      color: "text-orange-500"
    },
    {
      title: language === "uz" ? "Bu oyda" : "В этом месяце",
      value: stats.viewsThisMonth.toLocaleString(),
      icon: TrendingUp,
      color: "text-purple-500"
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === "uz" ? "Orqaga" : "Назад"}
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{stats.title}</h1>
          <p className="text-sm text-muted-foreground">
            {language === "uz" ? "Maqola statistikasi" : "Статистика статьи"}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Line Chart */}
      {stats.viewsByDate && stats.viewsByDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {language === "uz" ? "Ko'rishlar dinamikasi (30 kun)" : "Динамика просмотров (30 дней)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={stats.viewsByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getDate()}/${date.getMonth() + 1}`
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString(
                      language === "uz" ? "uz-UZ" : "ru-RU",
                      { year: "numeric", month: "2-digit", day: "2-digit" }
                    )
                  }}
                  formatter={(value: number) => [value, language === "uz" ? "Ko'rishlar" : "Просмотров"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Bar Chart */}
      {stats.viewsByDate && stats.viewsByDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {language === "uz" ? "Kunlik ko'rishlar" : "Просмотры по дням"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.viewsByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getDate()}/${date.getMonth() + 1}`
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString(
                      language === "uz" ? "uz-UZ" : "ru-RU",
                      { year: "numeric", month: "2-digit", day: "2-digit" }
                    )
                  }}
                  formatter={(value: number) => [value, language === "uz" ? "Ko'rishlar" : "Просмотров"]}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
