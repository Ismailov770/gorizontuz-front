"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FolderTree, Eye, TrendingUp, Loader2, CheckCircle2, Clock, Plus, Edit } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { api, type Article, type Category, type DashboardStats, type ArticlesAnalyticsResponse, type ArticleAnalytics, getImageUrl } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function DashboardPage() {
  const { language } = useApp()
  const router = useRouter()
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [articlesAnalytics, setArticlesAnalytics] = useState<ArticlesAnalyticsResponse | null>(null)
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'bugun' | 'hafta' | 'oy' | 'yil' | 'barchasi'>('barchasi')
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [statsData, articlesData, categoriesData] = await Promise.all([
          api.getDashboardStats().catch(() => null),
          api.getArticles(),
          api.getCategoriesDetailed()
        ])
        setDashboardStats(statsData)
        setArticles(articlesData || [])
        setCategories(categoriesData || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Separate effect for analytics period changes
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsAnalyticsLoading(true)
        console.log('🔍 Fetching analytics for period:', analyticsPeriod)
        const analyticsData = await api.getArticlesAnalytics(analyticsPeriod).catch(() => null)
        console.log('📊 Analytics response:', {
          period: analyticsPeriod,
          totalArticles: analyticsData?.totalArticles,
          totalViews: analyticsData?.totalViews,
          articlesCount: analyticsData?.articles?.length
        })
        if (analyticsData?.articles && analyticsData.articles.length > 0) {
          console.log('📈 Sample article data:', {
            title: analyticsData.articles[0].title,
            viewCount: analyticsData.articles[0].viewCount,
            viewsToday: analyticsData.articles[0].viewsToday,
            viewsThisWeek: analyticsData.articles[0].viewsThisWeek,
            viewsThisMonth: analyticsData.articles[0].viewsThisMonth
          })
        }
        setArticlesAnalytics(analyticsData)
      } catch (error) {
        console.error('Error fetching analytics data:', error)
      } finally {
        setIsAnalyticsLoading(false)
      }
    }
    
    fetchAnalytics()
  }, [analyticsPeriod])

  // Calculate statistics - use analytics data when available, fallback to calculated
  const totalArticles = articlesAnalytics?.totalArticles ?? dashboardStats?.totalArticles ?? articles.length
  const publishedArticles = dashboardStats?.publishedArticles ?? articles.filter(a => a.published).length
  const draftArticles = dashboardStats?.draftArticles ?? articles.filter(a => !a.published).length
  
  // Use analytics data for views based on selected period
  const totalViews = articlesAnalytics?.totalViews ?? dashboardStats?.totalViews ?? articles.reduce((sum, article) => sum + (article.viewCount || 0), 0)
  
  // For period-specific views, use dashboardStats as fallback since API returns 0 for period-specific values
  const viewsToday = dashboardStats?.viewsToday ?? 0
  const viewsThisWeek = dashboardStats?.viewsThisWeek ?? 0  
  const viewsThisMonth = dashboardStats?.viewsThisMonth ?? 0
  const totalCategories = categories.length

  // Debug logging for calculated values
  console.log('📊 Calculated stats:', {
    period: analyticsPeriod,
    totalViews,
    viewsToday,
    viewsThisWeek,
    viewsThisMonth,
    articlesCount: articlesAnalytics?.articles?.length
  })

  // Get current month articles (fallback)
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const thisMonthArticles = articles.filter(article => {
    const articleDate = new Date(article.createdAt)
    return articleDate.getMonth() === currentMonth && articleDate.getFullYear() === currentYear
  }).length

  // Get recent articles (last 5)
  const recentArticles = [...articles]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Get popular categories (by article count)
  const categoriesWithCount = categories.map(category => ({
    ...category,
    articleCount: articles.filter(a => a.category === category.name).length
  })).sort((a, b) => b.articleCount - a.articleCount).slice(0, 5)

  // Get most viewed articles - use analytics data when available
  const mostViewedArticles = dashboardStats?.topArticlesMonth?.length 
    ? dashboardStats.topArticlesMonth.map((topArticle: any) => {
        const fullArticle = articles.find(a => a.id === topArticle.id)
        return fullArticle ? { ...fullArticle, viewCount: topArticle.viewCount, author: topArticle.author } : null
      }).filter(Boolean) as Article[]
    : [...articles]
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5)

  // Prepare chart data for top articles
  const chartData = articlesAnalytics?.articles
    ?.sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 10)
    .map(article => ({
      name: article.title.length > 20 ? article.title.substring(0, 20) + '...' : article.title,
      fullTitle: article.title,
      views: article.viewCount,
      today: article.viewsToday,
      week: article.viewsThisWeek,
      month: article.viewsThisMonth,
      published: article.published,
      author: article.author
    })) || []

  const stats = [
    {
      title: language === "uz" ? "Jami maqolalar" : "Всего статей",
      value: totalArticles.toString(),
      icon: FileText,
      subtitle: language === "uz" 
        ? `${publishedArticles} nashr qilingan, ${draftArticles} qoralama` 
        : `${publishedArticles} опубликовано, ${draftArticles} черновиков`,
    },
    {
      title: language === "uz" ? "Kategoriyalar" : "Категории",
      value: totalCategories.toString(),
      icon: FolderTree,
      subtitle: language === "uz" ? "Faol kategoriyalar" : "Активных категорий",
    },
    {
      title: language === "uz" ? "Jami ko'rishlar" : "Всего просмотров",
      value: totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews.toString(),
      icon: Eye,
      subtitle: language === "uz" ? "Barcha maqolalar bo'yicha" : "По всем статьям",
    },
    {
      title: language === "uz" ? "Bu oyda" : "В этом месяце",
      value: viewsThisMonth > 0 ? viewsThisMonth.toString() : thisMonthArticles.toString(),
      icon: TrendingUp,
      subtitle: viewsThisMonth > 0 
        ? (language === "uz" ? "Ko'rishlar" : "Просмотров")
        : (language === "uz" ? "Yangi maqolalar" : "Новых статей"),
    },
  ]

  return (
    <div className="space-y-3 px-1 sm:px-0 overflow-x-hidden">
      <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight">
            {language === "uz" ? "Boshqaruv" : "Панель"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {language === "uz" ? "Statistika" : "Статистика"}
          </p>
        </div>
        <div className="flex gap-1.5 w-full sm:w-auto">
          <Button 
            onClick={() => router.push('/dashboard/articles/new')}
            size="sm"
            className="h-8 px-2 text-xs sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">
              {language === "uz" ? "Yangi" : "Новая"}
            </span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/categories')}
            size="sm"
            className="h-8 px-2 text-xs sm:text-sm"
          >
            <FolderTree className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">
              {language === "uz" ? "Kategoriyalar" : "Категории"}
            </span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 sm:gap-3">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-xl font-bold">{stat.value}</div>
              <p className="text-[10px] text-muted-foreground truncate">
                {stat.subtitle}
              </p>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{language === "uz" ? "So'nggi maqolalar" : "Последние статьи"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentArticles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {language === "uz" ? "Maqolalar topilmadi" : "Статьи не найдены"}
                  </p>
                ) : (
                  recentArticles.map((article) => (
                    <div 
                      key={article.id} 
                      className="flex items-start justify-between border-b pb-2 last:border-0 cursor-pointer hover:bg-accent/50 rounded-md p-1.5 transition-colors text-sm"
                      onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{article.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {new Date(article.createdAt).toLocaleDateString(
                              language === "uz" ? "uz-UZ" : "ru-RU",
                              { year: "numeric", month: "2-digit", day: "2-digit" }
                            )}
                          </p>
                          <Badge variant={article.published ? "default" : "secondary"} className="text-xs">
                            {article.published 
                              ? (language === "uz" ? "Nashr" : "Опубл.") 
                              : (language === "uz" ? "Qoralama" : "Черновик")}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground ml-2">
                        <Eye className="h-3 w-3" />
                        <span className="text-xs">{article.viewCount || 0}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === "uz" ? "Mashhur kategoriyalar" : "Популярные категории"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoriesWithCount.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {language === "uz" ? "Kategoriyalar topilmadi" : "Категории не найдены"}
                  </p>
                ) : (
                  categoriesWithCount.map((category) => (
                    <div 
                      key={category.id} 
                      className="flex items-center justify-between border-b pb-3 last:border-0 cursor-pointer hover:bg-accent/50 rounded-md p-2 transition-colors"
                      onClick={() => router.push('/dashboard/categories')}
                    >
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-muted-foreground">URL manzil: {category.slug}</p>
                      </div>
                      <Badge variant="outline">
                        {category.articleCount} {language === "uz" ? "maqola" : "статей"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && (dashboardStats?.topArticlesMonth?.length || dashboardStats?.topArticlesAllTime?.length) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top-3 Month */}
          {dashboardStats?.topArticlesMonth && dashboardStats.topArticlesMonth.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  {language === "uz" ? "Top-3 oy uchun" : "Топ-3 за месяц"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardStats.topArticlesMonth.slice(0, 3).map((article, index) => (
                    <div 
                      key={article.id}
                      className="flex items-center gap-3 p-2 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                    >
                      <span className="text-2xl flex-shrink-0">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{article.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {article.author && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <span>👤</span>
                              {article.author.username}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs font-semibold text-primary">
                            {article.viewCount.toLocaleString()} {language === "uz" ? "ko'rish" : "просмотров"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top-3 All Time */}
          {dashboardStats?.topArticlesAllTime && dashboardStats.topArticlesAllTime.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">👑</span>
                  {language === "uz" ? "Top-3 barcha vaqt" : "Топ-3 за все время"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardStats.topArticlesAllTime.slice(0, 3).map((article, index) => (
                    <div 
                      key={article.id}
                      className="flex items-center gap-3 p-2 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                    >
                      <span className="text-2xl flex-shrink-0">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{article.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {article.author && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <span>👤</span>
                              {article.author.username}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs font-semibold text-primary">
                            {article.viewCount.toLocaleString()} {language === "uz" ? "ko'rish" : "просмотров"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!isLoading && articlesAnalytics && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {language === "uz" ? "Top maqolalar bo'yicha analitika" : "Аналитика по топ статьям"}
              {analyticsPeriod !== 'barchasi' && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({[
                    { value: 'bugun', label: language === "uz" ? "bugun" : "сегодня" },
                    { value: 'hafta', label: language === "uz" ? "hafta" : "неделя" },
                    { value: 'oy', label: language === "uz" ? "oy" : "месяц" },
                    { value: 'yil', label: language === "uz" ? "yil" : "год" }
                  ].find(p => p.value === analyticsPeriod)?.label})
                </span>
              )}
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'bugun', label: language === "uz" ? "Bugun" : "Сегодня" },
                  { value: 'hafta', label: language === "uz" ? "Hafta" : "Неделя" },
                  { value: 'oy', label: language === "uz" ? "Oy" : "Месяц" },
                  { value: 'yil', label: language === "uz" ? "Yil" : "Год" },
                  { value: 'barchasi', label: language === "uz" ? "Barcha vaqt" : "Все время" }
                ].map((period) => (
                  <Button
                    key={period.value}
                    variant={analyticsPeriod === period.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAnalyticsPeriod(period.value as any)}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>
                {language === "uz" ? "Jami maqolalar:" : "Всего статей:"} {articlesAnalytics.totalArticles}
              </span>
              <span>
                {language === "uz" ? "Jami ko'rishlar:" : "Общие просмотры:"} {articlesAnalytics.totalViews.toLocaleString()}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {isAnalyticsLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(label) => {
                    const item = chartData.find(d => d.name === label)
                    if (item) {
                      return `${item.fullTitle}${item.author ? ` (${language === "uz" ? "Muallif" : "Автор"}: ${item.author.username})` : ''}`
                    }
                    return label
                  }}
                  formatter={(value: number, name: string) => {
                    const labels = {
                      views: (() => {
                        const periodLabels = {
                          'bugun': language === "uz" ? "Ko'rishlar (bugun)" : "Просмотры (сегодня)",
                          'hafta': language === "uz" ? "Ko'rishlar (hafta)" : "Просмотры (неделя)",
                          'oy': language === "uz" ? "Ko'rishlar (oy)" : "Просмотры (месяц)",
                          'yil': language === "uz" ? "Ko'rishlar (yil)" : "Просмотры (год)",
                          'barchasi': language === "uz" ? "Ko'rishlar (barcha vaqt)" : "Просмотры (все время)"
                        }
                        return periodLabels[analyticsPeriod] || (language === "uz" ? "Ko'rishlar" : "Просмотры")
                      })(),
                      today: language === "uz" ? "Bugun" : "Сегодня", 
                      week: language === "uz" ? "Hafta" : "Неделя",
                      month: language === "uz" ? "Oy" : "Месяц"
                    }
                    return [value.toLocaleString(), labels[name as keyof typeof labels] || name]
                  }}
                />
                <Bar 
                  dataKey="views" 
                  fill="hsl(var(--primary))" 
                  name="views"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
