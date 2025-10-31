"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useApp } from "@/contexts/app-context"
import { api, type Category } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"

export default function CategoriesPage() {
  const { language } = useApp()
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  })

  // Fetch categories from API
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
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

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
      })
    } else {
      setEditingCategory(null)
      setFormData({ name: "", slug: "", description: "" })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingCategory(null)
    setFormData({ name: "", slug: "", description: "" })
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, formData)
        toast({
          title: language === 'uz' ? 'Muvaffaqiyatli' : 'Успешно',
          description: language === 'uz' 
            ? 'Kategoriya muvaffaqiyatli yangilandi' 
            : 'Категория успешно обновлена'
        })
      } else {
        await api.createCategory(formData)
        toast({
          title: language === 'uz' ? 'Muvaffaqiyatli' : 'Успешно',
          description: language === 'uz' 
            ? 'Kategoriya muvaffaqiyatli yaratildi' 
            : 'Категория успешно создана'
        })
      }
      await fetchCategories()
      handleCloseDialog()
    } catch (error) {
      console.error('Error saving category:', error)
      toast({
        variant: 'destructive',
        title: language === 'uz' ? 'Xatolik' : 'Ошибка',
        description: language === 'uz' 
          ? 'Kategoriyani saqlashda xatolik yuz berdi' 
          : 'Произошла ошибка при сохранении категории'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return
    
    try {
      setIsDeleting(true)
      await api.deleteCategory(deletingCategory.id)
      toast({
        title: language === 'uz' ? 'Muvaffaqiyatli' : 'Успешно',
        description: language === 'uz' 
          ? 'Kategoriya muvaffaqiyatli o\'chirildi' 
          : 'Категория успешно удалена'
      })
      await fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast({
        variant: 'destructive',
        title: language === 'uz' ? 'Xatolik' : 'Ошибка',
        description: language === 'uz' 
          ? 'Kategoriyani o\'chirishda xatolik yuz berdi' 
          : 'Произошла ошибка при удалении категории'
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setDeletingCategory(null)
      setIsDeleting(false)
    }
  }

  const handleOpenDeleteDialog = (category: Category) => {
    setDeletingCategory(category)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{language === "uz" ? "Kategoriyalar" : "Категории"}</h1>
          <p className="text-muted-foreground">
            {language === "uz" ? "Yangiliklar kategoriyalarini boshqarish" : "Управление категориями новостей"}
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          {language === "uz" ? "Yangi kategoriya" : "Новая категория"}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={language === "uz" ? "Kategoriyalarni qidirish..." : "Поиск категорий..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "uz" ? "Nomi" : "Название"}</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>{language === "uz" ? "Tavsif" : "Описание"}</TableHead>
              <TableHead>{language === "uz" ? "Maqolalar" : "Статьи"}</TableHead>
              <TableHead>{language === "uz" ? "Sana" : "Дата"}</TableHead>
              <TableHead className="text-right">{language === "uz" ? "Amallar" : "Действия"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {language === "uz" ? "Kategoriyalar topilmadi" : "Категории не найдены"}
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-1 text-sm">{category.slug}</code>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {category.description || (
                      <span className="italic text-xs">
                        {language === "uz" ? "Tavsif yo'q" : "Нет описания"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{category.articlesCount || 0}</TableCell>
                  <TableCell>
                    {new Date(category.createdAt).toLocaleDateString(
                      language === "uz" ? "uz-UZ" : "ru-RU",
                      { year: "numeric", month: "short", day: "numeric" }
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(category)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? language === "uz"
                  ? "Kategoriyani tahrirlash"
                  : "Редактировать категорию"
                : language === "uz"
                  ? "Yangi kategoriya"
                  : "Новая категория"}
            </DialogTitle>
            <DialogDescription>
              {language === "uz" ? "Kategoriya ma'lumotlarini kiriting" : "Введите данные категории"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{language === "uz" ? "Nomi" : "Название"}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={language === "uz" ? "Siyosat" : "Политика"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="politics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{language === "uz" ? "Tavsif" : "Описание"}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={language === "uz" ? "Kategoriya tavsifi" : "Описание категории"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isSaving}>
              {language === "uz" ? "Bekor qilish" : "Отмена"}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === "uz" ? "Saqlash" : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "uz" ? "Kategoriyani o'chirish" : "Удалить категорию"}</DialogTitle>
            <DialogDescription>
              {language === "uz"
                ? "Haqiqatan ham bu kategoriyani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi."
                : "Вы действительно хотите удалить эту категорию? Это действие нельзя отменить."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              {language === "uz" ? "Bekor qilish" : "Отмена"}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === "uz" ? "O'chirish" : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
