"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApp } from "@/contexts/app-context"
import { api, type MediaType } from "@/lib/api"
import { toast } from "sonner"
import { ArticleFormEnhanced } from "@/components/article-form-enhanced"

export default function NewArticlePage() {
  const { language } = useApp()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraft, setIsDraft] = useState(false)

  const handleSubmit = async (data: {
    title: string
    slug: string
    content: string
    categoryId: number
    published: boolean
    mediaType: MediaType
    iframeUrl?: string
    images: File[]
    tags: string[]
  }) => {
    try {
      setIsSubmitting(true)
      
      await api.createArticle({
        title: data.title,
        slug: data.slug,
        content: data.content,
        categoryId: data.categoryId,
        published: data.published,
        mediaType: data.mediaType,
        iframeUrl: data.iframeUrl,
        images: data.images,
        tags: data.tags
      })
      
      toast.success(
        data.published
          ? (language === 'uz' ? 'Maqola muvaffaqiyatli nashr qilindi' : 'Статья успешно опубликована')
          : (language === 'uz' ? 'Maqola qoralama sifatida saqlandi' : 'Статья сохранена как черновик')
      )
      
      router.push('/dashboard/articles')
    } catch (error) {
      console.error('Error creating article:', error)
      toast.error(
        language === 'uz'
          ? 'Maqolani saqlashda xatolik yuz berdi'
          : 'Произошла ошибка при сохранении статьи'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {language === "uz" ? "Yangi maqola" : "Новая статья"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {language === "uz" ? "Yangi maqola yaratish" : "Создать новую статью"}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setIsDraft(true)
              const form = document.querySelector('form') as HTMLFormElement
              if (form) form.requestSubmit()
            }}
            disabled={isSubmitting}
          >
            {isSubmitting && isDraft ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {language === "uz" ? "Qoralama" : "Черновик"}
          </Button>
          <Button 
            onClick={() => {
              setIsDraft(false)
              const form = document.querySelector('form') as HTMLFormElement
              if (form) form.requestSubmit()
            }}
            disabled={isSubmitting}
          >
            {isSubmitting && !isDraft ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {language === "uz" ? "Nashr qilish" : "Опубликовать"}
          </Button>
        </div>
      </div>

      <ArticleFormEnhanced
        onSubmit={(data) => handleSubmit({ ...data, published: !isDraft })}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
