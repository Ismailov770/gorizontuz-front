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
    <div className="space-y-3 px-0 py-1 overflow-x-hidden">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2 gap-2">
          <div className="flex items-center gap-1">
            <h1 className="text-sm font-bold whitespace-nowrap">
              {language === "uz" ? "Maqolalar" : "Статьи"}
            </h1>
            <Badge variant="outline" className="h-5 text-xs px-1">
              {pagination.total}
            </Badge>
          </div>
          <Button 
            onClick={() => router.push("/dashboard/articles/new")}
            size="icon"
            className="h-8 w-8"
            title={language === "uz" ? "Yangi maqola" : "Новая статья"}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Card>
          <CardHeader className="p-2 pb-1">
            <div className="flex gap-1.5 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={language === "uz" ? "Qidirish..." : "Поиск..."}
                  className="h-8 pl-8 pr-2 text-xs w-full min-w-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-8 p-0 justify-center flex-shrink-0">
                  <Filter className="h-3.5 w-3.5" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    {language === "uz" ? "Barchasi" : "Все"}
                  </SelectItem>
                  <SelectItem value="published" className="text-xs">
                    {language === "uz" ? "Nashr" : "Опубл."}
                  </SelectItem>
                  <SelectItem value="draft" className="text-xs">
                    {language === "uz" ? "Qoralama" : "Черновик"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="w-full text-xs">
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead className="w-10 p-1"></TableHead>
                    <TableHead className="p-1">{language === "uz" ? "Sarlavha" : "Заголовок"}</TableHead>
                    <TableHead className="w-20 p-1 text-right">
                      <span className="sr-only">{language === "uz" ? "Harakatlar" : "Действия"}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Skeleton loader
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-md" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-md" />
                            <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-md" />
                            <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-md" />
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
                        <TableCell className="w-8 p-1">
                          {article.imageUrl ? (
                            <img
                              src={getImageUrl(article.imageUrl)}
                              alt=""
                              className="w-7 h-7 object-cover rounded-md"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg'
                              }}
                            />
                          ) : (
                            <div className="w-7 h-7 bg-muted rounded-md flex items-center justify-center">
                              <span className="text-[7px] text-muted-foreground">No img</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="p-1 max-w-0">
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs line-clamp-1 font-medium">
                              {article.title}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Badge variant={article.published ? "default" : "secondary"} className="h-4 px-1 text-[9px] flex-shrink-0">
                                {article.published 
                                  ? (language === "uz" ? "Nashr" : "Опубл.") 
                                  : (language === "uz" ? "Qora" : "Черн.")}
                              </Badge>
                              <span className="text-[9px] text-muted-foreground truncate">
                                {article.category}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-1 w-[90px]">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                router.push(`/dashboard/articles/${article.id}`)
                              }
                              title={language === "uz" ? "Ko'rish" : "Просмотр"}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                router.push(`/dashboard/articles/edit/${article.id}`)
                              }
                              title={language === "uz" ? "Tahrirlash" : "Ред."}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive/90"
                              onClick={() => handleOpenDeleteDialog(article)}
                              title={language === "uz" ? "O'chirish" : "Удалить"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between px-2 py-1.5 border-t">
                <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {pagination.page} / {pagination.totalPages || 1}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || isLoading}
                    className="h-6 w-6 p-0 min-w-0"
                  >
                    <span className="text-xs">{'<'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages || isLoading}
                    className="h-6 w-6 p-0 min-w-0"
                  >
                    <span className="text-xs">{'>'}</span>
                  </Button>
                </div>
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
