"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Eye, Upload, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "@/contexts/app-context"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

import type { Category } from "@/lib/api"

type FormData = {
  title: string
  content: string
  categoryId: string
  published: boolean
  slug: string
}

export default function NewArticlePage() {
  const { language } = useApp()
  const router = useRouter()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    categoryId: "",
    published: false,
    slug: "",
  })
  
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'image', string>>>({})

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.getCategoriesDetailed()
        setCategories(data)
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast({
          variant: 'destructive',
          title: language === 'uz' ? 'Xatolik' : 'Ошибка',
          description: language === 'uz' 
            ? 'Kategoriyalarni yuklashda xatolik yuz berdi' 
            : 'Произошла ошибка при загрузке категорий'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCategories()
  }, [language, toast])

  // Generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim()
  }

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  // Process image file (used by both file input and drag & drop)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        image: language === 'uz' 
          ? 'Faqat rasm fayllarini yuklash mumkin' 
          : 'Можно загружать только изображения'
      }))
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setErrors(prev => ({
        ...prev,
        image: language === 'uz' 
          ? 'Rasm hajmi 5MB dan kichik bo\'lishi kerak' 
          : 'Размер изображения должен быть меньше 5MB'
      }))
      return
    }
    
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setErrors(prev => ({ ...prev, image: '' }))
  }

  // Handle drag events
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

  // Remove selected image
  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    const input = document.getElementById('image') as HTMLInputElement
    if (input) input.value = ''
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = language === 'uz' ? 'Sarlavha kiritish majburiy' : 'Заголовок обязателен'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = language === 'uz' ? 'Matn kiritish majburiy' : 'Текст обязателен'
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = language === 'uz' ? 'Kategoriyani tanlang' : 'Выберите категорию'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (published: boolean) => {
    if (!validateForm()) return
    
    try {
      setIsSubmitting(true)
      
      // Submit to API
      await api.createArticle({
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        content: formData.content,
        categoryId: parseInt(formData.categoryId),
        published: published,
        image: imageFile || undefined
      } as any) // Add type assertion to handle the image type
      
      // Show success message
      toast({
        title: language === 'uz' ? 'Muvaffaqiyatli' : 'Успешно',
        description: 
          published
            ? language === 'uz'
              ? 'Maqola muvaffaqiyatli nashr qilindi'
              : 'Статья успешно опубликована'
            : language === 'uz'
            ? 'Maqola qoralama sifatida saqlandi'
            : 'Статья сохранена как черновик'
      })
      
      // Redirect to articles list
      router.push('/dashboard/articles')
      
    } catch (error) {
      console.error('Error creating article:', error)
      toast({
        variant: 'destructive',
        title: language === 'uz' ? 'Xatolik' : 'Ошибка',
        description: language === 'uz'
          ? 'Maqolani saqlashda xatolik yuz berdi'
          : 'Произошла ошибка при сохранении статьи'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update slug when title changes
  useEffect(() => {
    if (formData.title) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(formData.title)
      }))
    }
  }, [formData.title])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
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
            <span className="sr-only">{language === "uz" ? "Orqaga" : "Назад"}</span>
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
        
        <div className="flex gap-2 justify-end sm:justify-normal">
          <div className="hidden sm:flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="min-w-[180px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "uz" ? "Saqlanmoqda..." : "Сохранение..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {language === "uz" ? "Qoralama sifatida saqlash" : "Сохранить как черновик"}
                </>
              )}
            </Button>
            <Button 
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "uz" ? "Nashr qilinmoqda..." : "Публикация..."}
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  {language === "uz" ? "Nashr qilish" : "Опубликовать"}
                </>
              )}
            </Button>
          </div>
          
          <div className="flex sm:hidden gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              title={language === "uz" ? "Saqlash" : "Сохранить"}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="default"
              size="icon"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              title={language === "uz" ? "Nashr qilish" : "Опубликовать"}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
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
                  placeholder={language === "uz" ? "Maqola sarlavhasini kiriting" : "Введите заголовок статьи"}
                />
                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">{language === "uz" ? "Matn" : "Текст"}</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder={language === "uz" ? "Maqola matnini kiriting" : "Введите текст статьи"}
                  rows={8}
                  className="resize-none min-h-[200px] sm:min-h-[300px]"
                />
                {errors.content && <p className="text-sm text-red-600">{errors.content}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
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
                    <SelectValue placeholder={language === "uz" ? "Kategoriyani tanlang" : "Выберите категорию"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && <p className="text-sm text-red-600">{errors.categoryId}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">{language === "uz" ? "Rasm" : "Изображение"}</Label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 transition-colors ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                >
                  <input
                    id="image"
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {!imageFile ? (
                    <label
                      htmlFor="image"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-center">
                        <span className="hidden sm:inline">
                          {language === "uz" 
                            ? "Rasmni bu yerga tashlang yoki yuklash uchun bosing" 
                            : "Перетащите изображение сюда или нажмите для загрузки"}
                        </span>
                        <span className="sm:hidden">
                          {language === "uz" 
                            ? "Rasm yuklang" 
                            : "Загрузите изображение"}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 text-center">
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
                {errors.image && <p className="text-sm text-red-600">{errors.image}</p>}
              </div>
            </CardContent>
          </Card>

          {imagePreview && (
            <Card>
              <CardHeader>
                <CardTitle>{language === "uz" ? "Rasm ko'rinishi" : "Предпросмотр изображения"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full aspect-video rounded-lg border overflow-hidden">
                  <img
                    src={imagePreview}
                    alt={language === "uz" ? "Rasm ko'rinishi" : "Предпросмотр изображения"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
