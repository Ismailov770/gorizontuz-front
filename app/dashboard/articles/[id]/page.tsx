"use client"

import { useState, use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Eye, Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useApp } from "@/contexts/app-context"
import { api, type Category, getImageUrl } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { language } = useApp()
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    categoryId: "",
    published: false,
    imageUrl: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [article, categoriesData] = await Promise.all([
          api.getArticle(parseInt(id)),
          api.getCategoriesDetailed()
        ])
        
        // Find category ID by name since API returns category name in article
        const category = categoriesData.find(cat => cat.name === article.category)
        
        setFormData({
          title: article.title,
          content: article.content,
          categoryId: category?.id.toString() || "",
          published: article.published,
          imageUrl: article.imageUrl || "",
        })
        setCategories(categoriesData)
      } catch (error) {
        console.error('Error fetching article:', error)
        toast({
          variant: 'destructive',
          title: language === 'uz' ? 'Xatolik' : 'Ошибка',
          description: language === 'uz' 
            ? 'Maqolani yuklashda xatolik yuz berdi' 
            : 'Произошла ошибка при загрузке статьи'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [id, language, toast])

  // Handle image file selection
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: language === 'uz' ? 'Xatolik' : 'Ошибка',
        description: language === 'uz' 
          ? 'Faqat rasm fayllarini yuklash mumkin' 
          : 'Можно загружать только изображения'
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: language === 'uz' ? 'Xatolik' : 'Ошибка',
        description: language === 'uz' 
          ? 'Rasm hajmi 5MB dan kichik bo\'lishi kerak' 
          : 'Размер изображения должен быть меньше 5MB'
      })
      return
    }
    
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSave = async (published: boolean) => {
    try {
      setIsSubmitting(true)
      await api.updateArticle({
        id: parseInt(id),
        title: formData.title,
        content: formData.content,
        categoryId: parseInt(formData.categoryId),
        published: published,
        image: imageFile || undefined
      })
      
      toast({
        title: language === 'uz' ? 'Muvaffaqiyatli' : 'Успешно',
        description: language === 'uz' 
          ? 'Maqola muvaffaqiyatli yangilandi' 
          : 'Статья успешно обновлена'
      })
      
      router.push("/dashboard/articles")
    } catch (error) {
      console.error('Error updating article:', error)
      toast({
        variant: 'destructive',
        title: language === 'uz' ? 'Xatolik' : 'Ошибка',
        description: language === 'uz' 
          ? 'Maqolani yangilashda xatolik yuz berdi' 
          : 'Произошла ошибка при обновлении статьи'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
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
            <p className="text-muted-foreground">ID: {id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {language === "uz" ? "Qoralama sifatida saqlash" : "Сохранить как черновик"}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
            {language === "uz" ? "Nashr qilish" : "Опубликовать"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "uz" ? "Maqola mazmuni" : "Содержание статьи"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{language === "uz" ? "Sarlavha" : "Заголовок"}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">{language === "uz" ? "Matn" : "Текст"}</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={15}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "uz" ? "Maqola sozlamalari" : "Настройки статьи"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">{language === "uz" ? "Kategoriya" : "Категория"}</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "uz" ? "Rasm" : "Изображение"}</Label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                >
                  <input
                    id="image-upload"
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {!imageFile ? (
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-center">
                        {language === "uz" 
                          ? "Yangi rasm yuklash" 
                          : "Загрузить новое изображение"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, GIF {language === "uz" ? "gacha" : "до"} 5MB
                      </p>
                    </label>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{imageFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {(imagePreview || formData.imageUrl) && (
            <Card>
              <CardHeader>
                <CardTitle>{language === "uz" ? "Rasm ko'rinishi" : "Предпросмотр изображения"}</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={imagePreview || getImageUrl(formData.imageUrl) || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full rounded-lg border object-cover"
                  style={{ aspectRatio: "16/9" }}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg'
                  }}
                />
                {imagePreview && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {language === "uz" ? "Yangi rasm (saqlanmagan)" : "Новое изображение (не сохранено)"}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
