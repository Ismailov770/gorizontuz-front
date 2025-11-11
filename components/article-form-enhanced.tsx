"use client"

import { useState, useEffect } from "react"
import { Upload, X, Plus, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api, type Category, type Tag, type MediaType } from "@/lib/api"
import { useApp } from "@/contexts/app-context"
import { MediaTypeSelector } from "@/components/media-type-selector"
import { YouTubeInput } from "@/components/youtube-input"

interface ArticleFormEnhancedProps {
  onSubmit: (data: {
    title: string
    slug: string
    content: string
    categoryId: number
    published: boolean
    mediaType: MediaType
    iframeUrl?: string
    images: File[]
    tags: string[]
  }) => Promise<void>
  initialData?: {
    title?: string
    slug?: string
    content?: string
    categoryId?: number
    published?: boolean
    mediaType?: MediaType
    iframeUrl?: string
    tags?: string[]
  }
  isSubmitting?: boolean
}

export function ArticleFormEnhanced({ onSubmit, initialData, isSubmitting }: ArticleFormEnhancedProps) {
  const { language } = useApp()
  const [categories, setCategories] = useState<Category[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    content: initialData?.content || "",
    categoryId: initialData?.categoryId?.toString() || "",
    published: initialData?.published || false,
    mediaType: (initialData?.mediaType || "images") as MediaType,
    iframeUrl: initialData?.iframeUrl || "",
  })
  
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || [])
  const [newTagInput, setNewTagInput] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (formData.title && !initialData?.slug) {
      setFormData(prev => ({ ...prev, slug: generateSlug(formData.title) }))
    }
  }, [formData.title])

  const fetchData = async () => {
    try {
      const [categoriesData, tagsData] = await Promise.all([
        api.getCategoriesDetailed(),
        api.getTags()
      ])
      setCategories(categoriesData || [])
      setAvailableTags(tagsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processImageFiles(files)
  }

  const processImageFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) return false
      if (file.size > 10 * 1024 * 1024) return false
      return true
    })

    if (validFiles.length + images.length > 10) {
      setErrors(prev => ({ ...prev, images: language === 'uz' ? 'Maksimal 10 ta rasm' : 'Максимум 10 изображений' }))
      return
    }

    setImages(prev => [...prev, ...validFiles])
    
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
    
    setErrors(prev => ({ ...prev, images: '' }))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    processImageFiles(files)
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const newPreviews = [...imagePreviews]
    
    const [movedImage] = newImages.splice(fromIndex, 1)
    const [movedPreview] = newPreviews.splice(fromIndex, 1)
    
    newImages.splice(toIndex, 0, movedImage)
    newPreviews.splice(toIndex, 0, movedPreview)
    
    setImages(newImages)
    setImagePreviews(newPreviews)
  }

  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim().toLowerCase()
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags(prev => [...prev, trimmedTag])
      setNewTagInput("")
    }
  }

  const removeTag = (tagName: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tagName))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = language === 'uz' ? 'Sarlavha kiritish majburiy' : 'Заголовок обязателен'
    if (!formData.content.trim()) newErrors.content = language === 'uz' ? 'Matn kiritish majburiy' : 'Текст обязателен'
    if (!formData.categoryId) newErrors.categoryId = language === 'uz' ? 'Kategoriyani tanlang' : 'Выберите категорию'
    
    // Validate media
    if (formData.mediaType === 'iframe' && !formData.iframeUrl) {
      newErrors.iframeUrl = language === 'uz' ? 'YouTube URL kiritish majburiy' : 'YouTube URL обязателен'
    }
    if (formData.mediaType === 'images' && images.length === 0) {
      newErrors.images = language === 'uz' ? 'Kamida bitta rasm yuklang' : 'Загрузите хотя бы одно изображение'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    await onSubmit({
      title: formData.title,
      slug: formData.slug || generateSlug(formData.title),
      content: formData.content,
      categoryId: parseInt(formData.categoryId),
      published: formData.published,
      mediaType: formData.mediaType,
      iframeUrl: formData.iframeUrl,
      images,
      tags: selectedTags
    })
  }

  if (isLoadingData) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label htmlFor="slug">{language === "uz" ? "URL manzil" : "URL адрес"}</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="article-slug"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">{language === "uz" ? "Matn" : "Текст"}</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder={language === "uz" ? "Maqola matnini kiriting" : "Введите текст статьи"}
                  rows={12}
                  className="resize-none"
                />
                {errors.content && <p className="text-sm text-red-600">{errors.content}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Media Type Selector */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "uz" ? "Media turi" : "Тип медиа"}</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaTypeSelector
                value={formData.mediaType}
                onChange={(type) => {
                  setFormData({ ...formData, mediaType: type })
                  setErrors(prev => ({ ...prev, images: '', iframeUrl: '' }))
                }}
                language={language}
              />
            </CardContent>
          </Card>

          {/* YouTube Input (shown when iframe is selected) */}
          {formData.mediaType === 'iframe' && (
            <Card>
              <CardHeader>
                <CardTitle>{language === "uz" ? "YouTube video" : "YouTube видео"}</CardTitle>
              </CardHeader>
              <CardContent>
                <YouTubeInput
                  value={formData.iframeUrl}
                  onChange={(url) => setFormData({ ...formData, iframeUrl: url })}
                  error={errors.iframeUrl}
                  language={language}
                />
              </CardContent>
            </Card>
          )}

          {/* Multiple Images Upload (shown when images is selected) */}
          {formData.mediaType === 'images' && (
            <Card>
              <CardHeader>
                <CardTitle>{language === "uz" ? "Rasmlar (maksimal 10 ta)" : "Изображения (максимум 10)"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
              >
                <input
                  id="images"
                  type="file"
                  multiple
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <label htmlFor="images" className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-center">
                    {language === "uz" 
                      ? "Rasmlarni bu yerga tashlang yoki yuklash uchun bosing" 
                      : "Перетащите изображения сюда или нажмите для загрузки"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WebP {language === "uz" ? "gacha" : "до"} 10MB
                  </p>
                </label>
              </div>
              {errors.images && <p className="text-sm text-red-600">{errors.images}</p>}

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        {index > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-6 w-6 p-0"
                            onClick={() => moveImage(index, index - 1)}
                          >
                            ←
                          </Button>
                        )}
                        {index < imagePreviews.length - 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-6 w-6 p-0"
                            onClick={() => moveImage(index, index + 1)}
                          >
                            →
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="h-6 w-6 p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {index === 0 && (
                        <Badge className="absolute bottom-2 left-2" variant="default">
                          {language === "uz" ? "Asosiy" : "Главное"}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "uz" ? "Sozlamalar" : "Настройки"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">{language === "uz" ? "Kategoriya" : "Категория"}</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
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
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "uz" ? "Teglar" : "Теги"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag(newTagInput)
                    }
                  }}
                  placeholder={language === "uz" ? "Teg qo'shish" : "Добавить тег"}
                />
                <Button type="button" size="sm" onClick={() => addTag(newTagInput)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {availableTags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {language === "uz" ? "Mavjud teglar:" : "Доступные теги:"}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                        className="cursor-pointer"
                        style={selectedTags.includes(tag.name) ? { backgroundColor: tag.color } : {}}
                        onClick={() => {
                          if (selectedTags.includes(tag.name)) {
                            removeTag(tag.name)
                          } else {
                            addTag(tag.name)
                          }
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedTags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {language === "uz" ? "Tanlangan teglar:" : "Выбранные теги:"}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => {
                      const tagData = availableTags.find(t => t.name === tag)
                      return (
                        <Badge
                          key={tag}
                          style={tagData ? { backgroundColor: tagData.color } : {}}
                        >
                          {tag}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
