"use client"

import { useState, use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Pencil, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApp } from "@/contexts/app-context"
import { api, type MediaType, type ArticleImage } from "@/lib/api"
import { toast } from "sonner"
import { ArticleFormEnhanced } from "@/components/article-form-enhanced"

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params)
  const articleId = parseInt(resolvedParams.id)
  
  if (isNaN(articleId)) {
    throw new Error('Invalid article ID')
  }
  const { language } = useApp()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialData, setInitialData] = useState<{
    title: string
    slug: string
    content: string
    categoryId: number
    published: boolean
    featured: boolean
    authorName?: string
    scheduledAt?: string
    mediaType: MediaType
    iframeUrl?: string
    tags: string[]
    existingImages?: ArticleImage[]
  } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [article, categoriesData] = await Promise.all([
          api.getArticle(articleId),
          api.getCategoriesDetailed()
        ])
        
        // Find category ID by name since API returns category name in article
        const category = categoriesData.find(cat => cat.name === article.category)
        
        setInitialData({
          title: article.title,
          slug: article.slug || article.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
          content: article.content,
          categoryId: category?.id || 1,
          published: article.published,
          featured: article.featured || false,
          authorName: article.authorName || article.author?.username || "",
          scheduledAt: article.scheduledAt ? article.scheduledAt.slice(0, 16) : "",
          mediaType: article.mediaType || (article.iframeUrl ? 'iframe' : 'images'),
          iframeUrl: article.iframeUrl || '',
          tags: article.tags?.map(tag => tag.name) || [],
          existingImages: article.images || []
        })
      } catch (error) {
        console.error('Error fetching article:', error)
        toast.error(
          language === 'uz' 
            ? 'Maqolani yuklashda xatolik yuz berdi' 
            : 'Произошла ошибка при загрузке статьи'
        )
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [articleId, language])

  const handleSubmit = async (data: {
    title: string
    slug: string
    content: string
    categoryId: number
    published: boolean
    featured?: boolean
    authorName?: string
    scheduledAt?: string
    mediaType: MediaType
    iframeUrl?: string
    images: File[]
    tags: string[]
  }) => {
    if (isNaN(articleId)) {
      console.error('Invalid article ID:', resolvedParams.id)
      toast.error(language === 'uz' ? 'Xatolik: Noto\u2018g\u2018ri maqola ID si' : 'Error: Invalid article ID')
      return
    }
    
    // Convert categoryId to number if it's a string
    const articleData = {
      ...data,
      categoryId: typeof data.categoryId === 'string' ? parseInt(data.categoryId) : data.categoryId,
      authorName: data.authorName,
      scheduledAt: data.scheduledAt || undefined,
      id: articleId
    }
    try {
      setIsSubmitting(true)
      
      // Call the API to update the article
      await api.updateArticle(articleData)
      
      // Show success message
      toast.success(
        data.published
          ? (language === 'uz' ? 'Maqola muvaffaqiyatli yangilandi va nashr qilindi' : 'Статья успешно обновлена и опубликована')
          : (language === 'uz' ? 'Maqola muvaffaqiyatli yangilandi' : 'Статья успешно обновлена')
      )
      
      // Redirect to articles list
      router.push('/dashboard/articles')
      router.refresh()
    } catch (error: any) {
      console.error('Error updating article:', error)
      
      if (error.status === 409) {
        toast.error(
          language === 'uz'
            ? `"${error.data?.message}" slogi bilan maqola allaqachon mavjud. Iltimos, boshqa slug tanlang.`
            : `Статья со слагом "${error.data?.message}" уже существует. Пожалуйста, выберите другой слаг.`
        )
      } else {
        const errorMessage = error.data?.message || error.message
        toast.error(
          language === 'uz'
            ? `Maqolani yangilashda xatolik: ${errorMessage}`
            : `Ошибка при обновлении статьи: ${errorMessage}`
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !initialData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {language === "uz" ? "Maqolani tahrirlash" : "Редактировать статью"}
            </h1>
            <p className="text-muted-foreground">ID: {articleId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            type="button"
            variant="outline" 
            disabled={isSubmitting}
            onClick={() => {
              const form = document.querySelector('form') as HTMLFormElement
              if (form) {
                const formData = new FormData(form)
                const data = Object.fromEntries(formData.entries())
                handleSubmit({
                  ...data,
                  categoryId: parseInt(data.categoryId as string),
                  published: false,
                  mediaType: data.mediaType as MediaType,
                  images: [],
                  tags: data.tags ? JSON.parse(data.tags as string) : []
                } as any)
              }
            }}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {language === "uz" ? "Qoralama sifatida saqlash" : "Сохранить как черновик"}
          </Button>
          <Button 
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              const form = document.querySelector('form') as HTMLFormElement
              if (form) {
                const formData = new FormData(form)
                const data = Object.fromEntries(formData.entries())
                handleSubmit({
                  ...data,
                  categoryId: parseInt(data.categoryId as string),
                  published: true,
                  mediaType: data.mediaType as MediaType,
                  images: [],
                  tags: data.tags ? JSON.parse(data.tags as string) : []
                } as any)
              }
            }}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
            {language === "uz" ? "Nashr qilish" : "Опубликовать"}
          </Button>
        </div>
      </div>

      <div id="article-form">
        <ArticleFormEnhanced
          onSubmit={handleSubmit}
          initialData={initialData}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
