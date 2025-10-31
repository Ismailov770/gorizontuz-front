"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useApp } from "@/contexts/app-context"
import { useTranslation } from "@/lib/i18n"
import type { Article, CreateArticleDto, Category } from "@/lib/api"

interface ArticleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  article?: Article
  categories: Category[]
  onSave: (data: CreateArticleDto) => Promise<void>
}

export function ArticleDialog({ open, onOpenChange, article, categories, onSave }: ArticleDialogProps) {
  const { locale } = useApp()
  const t = useTranslation(locale)
  const [formData, setFormData] = useState<CreateArticleDto>({
    title: "",
    slug: "",
    content: "",
    published: false,
    categoryId: 0,
  })
  const [imageUrl, setImageUrl] = useState("")

  useEffect(() => {
    if (article) {
      const category = categories.find((c) => c.name === article.category)
      setFormData({
        title: article.title,
        slug: article.slug,
        content: article.content,
        published: article.published,
        categoryId: category?.id || 0,
      })
      setImageUrl(article.imageUrl || "")
    } else {
      setFormData({
        title: "",
        slug: "",
        content: "",
        published: false,
        categoryId: categories[0]?.id || 0,
      })
      setImageUrl("")
    }
  }, [article, categories, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{article ? t.editArticle : t.addArticle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 sm:space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t.articleTitle}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL manzil</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">{t.articleContent}</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">{t.articleImage}</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t.articleCategory}</Label>
              <Select
                value={formData.categoryId.toString()}
                onValueChange={(value) => setFormData({ ...formData, categoryId: Number.parseInt(value) })}
              >
                <SelectTrigger>
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
            <div className="flex items-center gap-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
              />
              <Label htmlFor="published">{t.published}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit">{t.save}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
