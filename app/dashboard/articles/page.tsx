"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search, Filter, Loader2, Video, Star } from "lucide-react"
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
  const [allArticles, setAllArticles] = useState<Article[]>([]) // Store all articles for client-side filtering
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [featuredFilter, setFeaturedFilter] = useState<string>("all")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null)
  const [isTogglingFeatured, setIsTogglingFeatured] = useState<number | null>(null)
  
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
            published: statusFilter === 'all' ? undefined : statusFilter === 'published'
            // Removed search parameter to get all articles
          }),
          api.getCategories()
        ])
        
        setAllArticles(articlesRes) // Store all articles
        setCategories(categoriesRes.map((c) => c.toString()))
        
      } catch (error) {
        console.error('Error fetching articles:', error)
        setError(language === 'uz' 
          ? 'Maqolalarni yuklashda xatolik yuz berdi' 
          : 'Произошла ошибка при загрузке статей'
        )
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [language, statusFilter]) // Remove searchQuery dependency
  
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Filter articles based on search query, status filter, and featured filter
  useEffect(() => {
    if (!allArticles.length) return;
    
    let filtered = [...allArticles];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(article => 
        statusFilter === 'published' ? article.published : !article.published
      );
    }
    
    // Apply featured filter
    if (featuredFilter !== 'all') {
      filtered = filtered.filter(article => 
        featuredFilter === 'featured' ? article.featured : !article.featured
      );
    }
    
    // Apply search query if it exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) || 
        (article.category && article.category.toLowerCase().includes(query)) ||
        (article.author && article.author.username.toLowerCase().includes(query))
      );
    }
    
    setArticles(filtered);
    setPagination(prev => ({
      ...prev,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / prev.limit)
    }));
  }, [allArticles, searchQuery, statusFilter, featuredFilter]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // No need to make API call, the useEffect will handle filtering
    setPagination(prev => ({ ...prev, page: 1 }));
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

  const handleToggleFeatured = async (article: Article) => {
    try {
      setIsTogglingFeatured(article.id)
      const updatedArticle = await api.toggleFeaturedArticle(article.id)
      
      // Update the article in both arrays
      setAllArticles(prev => prev.map(art => 
        art.id === article.id ? updatedArticle : art
      ))
      
      toast({
        title: language === 'uz' ? 'Muvaffaqiyatli' : 'Успешно',
        description: updatedArticle.featured 
          ? (language === 'uz' ? 'Maqola tavsiya etilgan maqolalar ro\'yxatiga qo\'shildi' : 'Статья добавлена в рекомендуемые')
          : (language === 'uz' ? 'Maqola tavsiya etilgan maqolalar ro\'yxatidan olib tashlandi' : 'Статья удалена из рекомендуемых')
      })
    } catch (err) {
      console.error('Error toggling featured status:', err)
      toast({
        variant: 'destructive',
        title: language === 'uz' ? 'Xatolik' : 'Ошибка',
        description: language === 'uz'
          ? 'Maqola holatini o\'zgartirishda xatolik yuz berdi'
          : 'Произошла ошибка при изменении статуса статьи'
      })
    } finally {
      setIsTogglingFeatured(null)
    }
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
          <CardHeader className="p-4 pb-3">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={language === "uz" ? "Qidirish..." : "Поиск..."}
                  className="h-10 pl-10 pr-3 text-sm w-full min-w-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-32 px-3 justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm">
                      {statusFilter === 'all' ? (language === "uz" ? "Barchasi" : "Все") :
                       statusFilter === 'published' ? (language === "uz" ? "Nashr" : "Опубл.") :
                       (language === "uz" ? "Qoralama" : "Черновик")}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">
                    {language === "uz" ? "Barchasi" : "Все"}
                  </SelectItem>
                  <SelectItem value="published" className="text-sm">
                    {language === "uz" ? "Nashr qilingan" : "Опубликованные"}
                  </SelectItem>
                  <SelectItem value="draft" className="text-sm">
                    {language === "uz" ? "Qoralama" : "Черновики"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                <SelectTrigger className="h-10 w-32 px-3 justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    <span className="text-sm">
                      {featuredFilter === 'all' ? (language === "uz" ? "Barchasi" : "Все") :
                       featuredFilter === 'featured' ? (language === "uz" ? "Tavsiya" : "Рекомен.") :
                       (language === "uz" ? "Oddiy" : "Обычные")}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">
                    {language === "uz" ? "Barchasi" : "Все"}
                  </SelectItem>
                  <SelectItem value="featured" className="text-sm">
                    {language === "uz" ? "Tavsiya etilgan" : "Рекомендуемые"}
                  </SelectItem>
                  <SelectItem value="regular" className="text-sm">
                    {language === "uz" ? "Oddiy maqolalar" : "Обычные"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="h-12">
                    <TableHead className="w-16 p-3"></TableHead>
                    <TableHead className="p-3 font-medium">{language === "uz" ? "Sarlavha" : "Заголовок"}</TableHead>
                    <TableHead className="w-20 p-3 text-center">{language === "uz" ? "Tavsiya" : "Рекомен."}</TableHead>
                    <TableHead className="w-32 p-3 text-right">
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
                        <TableCell className="text-center"><Skeleton className="h-6 w-6 rounded-full mx-auto" /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-md" />
                            <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-md" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : !articles || articles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {language === 'uz' 
                          ? 'Maqolalar topilmadi' 
                          : 'Статьи не найдены'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    articles.map((article) => (
                      <TableRow key={article.id} className="h-16">
                        <TableCell className="w-16 p-3">
                          {article.mediaType === 'iframe' ? (
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-950 rounded-md flex items-center justify-center">
                              <Video className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                          ) : article.imageUrl ? (
                            <img
                              src={getImageUrl(article.imageUrl)}
                              alt=""
                              className="w-12 h-12 object-cover rounded-md"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg'
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">No img</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="p-3 max-w-0">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm line-clamp-2 font-medium leading-5">
                              {article.title}
                            </span>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant={article.published ? "default" : "secondary"} className="h-5 px-2 text-xs flex-shrink-0">
                                {article.published 
                                  ? (language === "uz" ? "Nashr" : "Опубл.") 
                                  : (language === "uz" ? "Qoralama" : "Черновик")}
                              </Badge>
                              {!article.published && article.scheduledAt && new Date(article.scheduledAt) > new Date() && (
                                <Badge variant="outline" className="h-5 px-2 text-[10px] flex-shrink-0">
                                  {language === "uz" ? "Rejalashtirilgan" : "Запланирована"}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground truncate">
                                {article.category}
                              </span>
                              {article.author && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <span>👤</span>
                                  {article.authorName || article.author.username}
                                </span>
                              )}
                              {article.tags && article.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {article.tags.slice(0, 2).map((tag) => (
                                    <Badge 
                                      key={tag.id} 
                                      variant="outline" 
                                      className="h-5 px-2 text-xs"
                                      style={{ borderColor: tag.color, color: tag.color }}
                                    >
                                      {tag.name}
                                    </Badge>
                                  ))}
                                  {article.tags.length > 2 && (
                                    <span className="text-[8px] text-muted-foreground">+{article.tags.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-3 w-20 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                            onClick={() => handleToggleFeatured(article)}
                            disabled={isTogglingFeatured === article.id}
                            title={article.featured 
                              ? (language === "uz" ? "Tavsiyadan olib tashlash" : "Убрать из рекомендуемых")
                              : (language === "uz" ? "Tavsiya qilish" : "Добавить в рекомендуемые")
                            }
                          >
                            {isTogglingFeatured === article.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Star 
                                className={`h-4 w-4 ${article.featured 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-muted-foreground hover:text-yellow-400'
                                }`} 
                              />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="p-3 w-32">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0"
                              onClick={() =>
                                router.push(`/dashboard/articles/${article.id}`)
                              }
                              title={language === "uz" ? "Tahrirlash" : "Редактировать"}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
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
