"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Loader2, Tag as TagIcon } from "lucide-react"
import { api, type Tag } from "@/lib/api"
import { useApp } from "@/contexts/app-context"
import { toast } from "sonner"

export default function TagsPage() {
  const { language } = useApp()
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    color: "#3B82F6"
  })

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      setIsLoading(true)
      const data = await api.getTags()
      setTags(data || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
      toast.error(language === "uz" ? "Teglarni yuklashda xatolik" : "Ошибка загрузки тегов")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag)
      setFormData({
        name: tag.name,
        color: tag.color
      })
    } else {
      setEditingTag(null)
      setFormData({
        name: "",
        color: "#3B82F6"
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingTag(null)
    setFormData({ name: "", color: "#3B82F6" })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error(language === "uz" ? "Teg nomini kiriting" : "Введите название тега")
      return
    }

    try {
      setIsSaving(true)
      if (editingTag) {
        await api.updateTag(editingTag.id, formData)
        toast.success(language === "uz" ? "Teg yangilandi" : "Тег обновлен")
      } else {
        await api.createTag(formData)
        toast.success(language === "uz" ? "Teg yaratildi" : "Тег создан")
      }
      handleCloseDialog()
      fetchTags()
    } catch (error: any) {
      console.error('Error saving tag:', error)
      
      let errorMessage = language === "uz" ? "Saqlashda xatolik" : "Ошибка сохранения"
      
      if (error?.message) {
        if (error.message.includes('Duplicate entry')) {
          errorMessage = language === "uz" 
            ? "Bu nom bilan teg allaqachon mavjud" 
            : "Тег с таким названием уже существует"
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingTag) return

    try {
      await api.deleteTag(deletingTag.id)
      toast.success(language === "uz" ? "Teg o'chirildi" : "Тег удален")
      setIsDeleteDialogOpen(false)
      setDeletingTag(null)
      fetchTags()
    } catch (error: any) {
      // Определяем сообщение об ошибке без вывода в консоль
      let errorMessage = language === "uz" ? "O'chirishda xatolik" : "Ошибка удаления"
      
      if (error?.message) {
        if (error.message.includes('Duplicate entry')) {
          // Backend возвращает "Duplicate entry" при попытке удалить тег,
          // который используется в статьях
          errorMessage = language === "uz" 
            ? "Bu teg maqolalarda ishlatilmoqda va uni o'chirib bo'lmaydi" 
            : "Этот тег используется в статьях и его нельзя удалить"
        } else if (error.message.includes('foreign key constraint')) {
          errorMessage = language === "uz"
            ? "Bu teg maqolalarda ishlatilmoqda, avval maqolalardan olib tashlang"
            : "Этот тег используется в статьях, сначала удалите его из статей"
        } else {
          errorMessage = error.message
        }
      }
      
      // Показываем диалог с ошибкой
      toast.error(errorMessage)
    }
  }

  const openDeleteDialog = (tag: Tag) => {
    setDeletingTag(tag)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {language === "uz" ? "Teglar" : "Теги"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === "uz" ? "Maqolalar uchun teglarni boshqarish" : "Управление тегами для статей"}
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          {language === "uz" ? "Yangi teg" : "Новый тег"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              {language === "uz" ? "Barcha teglar" : "Все теги"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tags.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {language === "uz" ? "Teglar topilmadi" : "Теги не найдены"}
              </p>
            ) : (
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full border-2"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div>
                        <p className="font-medium">{tag.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tag.articleCount} {language === "uz" ? "maqola" : "статей"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                        {tag.color}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(tag)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(tag)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag 
                ? (language === "uz" ? "Tegni tahrirlash" : "Редактировать тег")
                : (language === "uz" ? "Yangi teg" : "Новый тег")
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {language === "uz" ? "Nom" : "Название"}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={language === "uz" ? "Teg nomini kiriting" : "Введите название тега"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">
                {language === "uz" ? "Rang" : "Цвет"}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg" style={{ backgroundColor: formData.color + '20' }}>
              <Badge style={{ backgroundColor: formData.color, color: 'white' }}>
                {formData.name || (language === "uz" ? "Namuna" : "Пример")}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {language === "uz" ? "Ko'rinish" : "Предпросмотр"}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              {language === "uz" ? "Bekor qilish" : "Отмена"}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "uz" ? "Saqlash" : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "uz" ? "Tegni o'chirish" : "Удалить тег"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "uz" 
                ? `"${deletingTag?.name}" tegini o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.`
                : `Вы уверены, что хотите удалить тег "${deletingTag?.name}"? Это действие нельзя отменить.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "uz" ? "Bekor qilish" : "Отмена"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === "uz" ? "O'chirish" : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
