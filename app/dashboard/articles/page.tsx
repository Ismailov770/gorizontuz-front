"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search, Eye, Filter, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApp } from "@/contexts/app-context"
import { useRouter } from "next/navigation"
import { api, type Article, type Category, getImageUrl } from "@/lib/api"

export default function ArticlesPage() {
  const { language } = useApp()
  const router = useRouter()
  
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null)
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  })
  
  // Fetch articles and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const [articlesRes, categoriesRes] = await Promise.all([
          api.getArticles({
            published: statusFilter === 'all' ? undefined : statusFilter === 'published',
            search: searchQuery || undefined
          }),
          api.getCategories()
        ])
        
        setArticles(articlesRes || [])
        setCategories(categoriesRes || [])
        // Since API returns array directly, calculate pagination client-side
        setPagination(prev => ({
          ...prev,
          total: articlesRes?.length || 0,
          totalPages: Math.ceil((articlesRes?.length || 0) / prev.limit)
        }))
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load articles. Please try again later.')
        setArticles([])
        setCategories([])
        toast({
          variant: 'destructive',
          title: language === 'uz' ? 'Xatolik' : 'Ошибка',
          description: language === 'uz' 
            ? 'Maqolalarni yuklashda xatolik yuz berdi' 
            : 'Произошла ошибка при загрузке статей'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [pagination.page, language, statusFilter, searchQuery])
  
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleDelete = async () => {
    if (!deletingArticle) return
    
    try {
      setIsDeleting(true)
      await api.deleteArticle(deletingArticle.id)
      
      setArticles(articles.filter(art => art.id !== deletingArticle.id))
      toast({
        title: language === 'uz' ? 'Muvaffaqiyatli' : 'Успешно',
        description: language === 'uz' 
          ? 'Maqola muvaffaqiyatli o\'chirildi' 
          : 'Статья успешно удалена'
      })
    } catch (err) {
      console.error('Error deleting article:', err)
      toast({
        variant: 'destructive',
        title: language === 'uz' ? 'Xatolik' : 'Ошибка',
        description: language === 'uz'
          ? 'Maqolani o\'chirishda xatolik yuz berdi'
          : 'Произошла ошибка при удалении статьи'
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setDeletingArticle(null)
      setIsDeleting(false)
    }
  }

  const handleOpenDeleteDialog = (article: Article) => {
    setDeletingArticle(article)
    setIsDeleteDialogOpen(true)
  }

  const getStatusBadge = (published: boolean) => {
    if (published) {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          {language === "uz" ? "Nashr qilingan" : "Опубликовано"}
        </Badge>
      )
    }
    return <Badge variant="secondary">{language === "uz" ? "Qoralama" : "Черновик"}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {language === "uz" ? "Maqolalar" : "Статьи"}
            </h1>
            <p className="text-muted-foreground">
              {language === "uz" 
                ? `Jami ${pagination.total} ta maqola` 
                : `Всего ${pagination.total} статей`}
            </p>
          </div>
          <Button 
            onClick={() => router.push("/dashboard/articles/new")}
            className="w-full md:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            {language === "uz" ? "Yangi maqola" : "Новая статья"}
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={language === "uz" ? "Qidirish..." : "Поиск..."}
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder={language === "uz" ? "Holati" : "Статус"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {language === "uz" ? "Barchasi" : "Все"}
                    </SelectItem>
                    <SelectItem value="published">
                      {language === "uz" ? "Nashr qilingan" : "Опубликовано"}
                    </SelectItem>
                    <SelectItem value="draft">
                      {language === "uz" ? "Qoralama" : "Черновик"}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" className="whitespace-nowrap">
                  <Search className="mr-2 h-4 w-4" />
                  {language === "uz" ? "Qidirish" : "Поиск"}
                </Button>
              </div>
            </form>
          </CardHeader>
          
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]"></TableHead>
                    <TableHead>{language === "uz" ? "Sarlavha" : "Заголовок"}</TableHead>
                    <TableHead>{language === "uz" ? "Kategoriya" : "Категория"}</TableHead>
                    <TableHead>{language === "uz" ? "Holat" : "Статус"}</TableHead>
                    <TableHead>{language === "uz" ? "Ko'rishlar" : "Просмотры"}</TableHead>
                    <TableHead>{language === "uz" ? "Sana" : "Дата"}</TableHead>
                    <TableHead className="text-right">
                      {language === "uz" ? "Harakatlar" : "Действия"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Skeleton loader
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Skeleton className="h-9 w-9 rounded-md" />
                            <Skeleton className="h-9 w-9 rounded-md" />
                            <Skeleton className="h-9 w-9 rounded-md" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : !articles || articles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {language === 'uz' 
                          ? 'Maqolalar topilmadi' 
                          : 'Статьи не найдены'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    articles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell>
                          {article.imageUrl ? (
                            <img
                              src={getImageUrl(article.imageUrl)}
                              alt={article.title}
                              className="w-16 h-16 object-cover rounded-md"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg'
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">No img</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {article.title}
                            </span>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {article.slug}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {article.category}
                        </TableCell>
                        <TableCell>{getStatusBadge(article.published)}</TableCell>
                        <TableCell>{article.viewCount?.toLocaleString() || 0}</TableCell>
                        <TableCell>
                          {new Date(article.createdAt).toLocaleDateString(
                            language === "uz" ? "uz-UZ" : "ru-RU",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                router.push(`/dashboard/articles/${article.id}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                router.push(`/dashboard/articles/edit/${article.id}`)
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive/90"
                              onClick={() => handleOpenDeleteDialog(article)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || isLoading}
                >
                  {language === 'uz' ? 'Oldingi' : 'Назад'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || isLoading}
                >
                  {language === 'uz' ? 'Keyingi' : 'Далее'}
                </Button>
              </div>
            </div>
          
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "uz" ? "Maqolani o'chirish" : "Удалить статью"}</DialogTitle>
            <DialogDescription>
              {language === "uz"
                ? "Haqiqatan ham bu maqolani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi."
                : "Вы действительно хотите удалить эту статью? Это действие нельзя отменить."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {language === "uz" ? "Bekor qilish" : "Отмена"}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {language === "uz" ? "O'chirish" : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
