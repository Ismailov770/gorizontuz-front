"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FolderTree, Eye, TrendingUp, Loader2, CheckCircle2, Clock, Plus, Edit } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { api, type Article, type Category } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { language } = useApp()
  const router = useRouter()
  
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [articlesData, categoriesData] = await Promise.all([
          api.getArticles(),
          api.getCategoriesDetailed()
        ])
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

  // Calculate statistics
  const totalArticles = articles.length
  const publishedArticles = articles.filter(a => a.published).length
  const draftArticles = articles.filter(a => !a.published).length
  const totalViews = articles.reduce((sum, article) => sum + (article.viewCount || 0), 0)
  const totalCategories = categories.length

  // Get current month articles
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

  // Get most viewed articles
  const mostViewedArticles = [...articles]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 5)

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
      subtitle: language === "uz" ? "Barcha maqolalar" : "Все статьи",
    },
    {
      title: language === "uz" ? "Bu oyda" : "В этом месяце",
      value: thisMonthArticles.toString(),
      icon: TrendingUp,
      subtitle: language === "uz" ? "Yangi maqolalar" : "Новых статей",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {language === "uz" ? "Boshqaruv paneli" : "Панель управления"}
          </h1>
          <p className="text-muted-foreground">{language === "uz" ? "Tizim statistikasi" : "Статистика системы"}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/dashboard/articles/new')}>
            <Plus className="mr-2 h-4 w-4" />
            {language === "uz" ? "Yangi maqola" : "Новая статья"}
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/categories')}>
            <FolderTree className="mr-2 h-4 w-4" />
            {language === "uz" ? "Kategoriyalar" : "Категории"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
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
                      className="flex items-start justify-between border-b pb-3 last:border-0 cursor-pointer hover:bg-accent/50 rounded-md p-2 -m-2 transition-colors"
                      onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{article.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {new Date(article.createdAt).toLocaleDateString(
                              language === "uz" ? "uz-UZ" : "ru-RU",
                              { year: "numeric", month: "short", day: "numeric" }
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
                      className="flex items-center justify-between border-b pb-3 last:border-0 cursor-pointer hover:bg-accent/50 rounded-md p-2 -m-2 transition-colors"
                      onClick={() => router.push('/dashboard/categories')}
                    >
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{category.slug}</p>
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

      {!isLoading && mostViewedArticles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {language === "uz" ? "Eng ko'p ko'rilgan maqolalar" : "Самые просматриваемые статьи"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostViewedArticles.map((article, index) => (
                <div 
                  key={article.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{article.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{article.category}</span>
                      <Badge variant={article.published ? "default" : "secondary"} className="text-xs">
                        {article.published 
                          ? (language === "uz" ? "Nashr" : "Опубл.") 
                          : (language === "uz" ? "Qoralama" : "Черновик")}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span className="font-semibold">{(article.viewCount || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
