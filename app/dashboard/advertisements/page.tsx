"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Eye, MousePointer, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApp } from "@/contexts/app-context"
import { api, type Advertisement, getImageUrl } from "@/lib/api"
import { toast } from "sonner"

export default function AdvertisementsPage() {
  const { language } = useApp()
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null)
  const [deletingAd, setDeletingAd] = useState<Advertisement | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    linkUrl: "",
    displayOrder: 0,
    active: true,
    startDate: "",
    endDate: ""
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  useEffect(() => {
    loadAdvertisements()
  }, [])

  const loadAdvertisements = async () => {
    try {
      setIsLoading(true)
      const data = await api.getAdvertisements()
      setAdvertisements(data)
    } catch (error) {
      console.error('Error loading advertisements:', error)
      toast.error(language === 'uz' ? 'Reklamalarni yuklashda xatolik' : 'Ошибка загрузки рекламы')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (ad?: Advertisement) => {
    if (ad) {
      setEditingAd(ad)
      setFormData({
        title: ad.title || "",
        linkUrl: ad.linkUrl || "",
        displayOrder: ad.displayOrder || 0,
        active: ad.active ?? true,
        startDate: ad.startDate ? ad.startDate.slice(0, 16) : "",
        endDate: ad.endDate ? ad.endDate.slice(0, 16) : ""
      })
      setImagePreview("")
    } else {
      setEditingAd(null)
      setFormData({
        title: "",
        linkUrl: "",
        displayOrder: 0,
        active: true,
        startDate: "",
        endDate: ""
      })
      setImagePreview("")
    }
    setImageFile(null)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error(language === 'uz' ? 'Sarlavha kiritish majburiy' : 'Название обязательно')
      return
    }

    if (!editingAd && !imageFile) {
      toast.error(language === 'uz' ? 'Rasm yuklash majburiy' : 'Изображение обязательно')
      return
    }

    try {
      setIsSaving(true)
      
      const data = {
        title: formData.title,
        linkUrl: formData.linkUrl || undefined,
        displayOrder: formData.displayOrder,
        active: formData.active,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        image: imageFile || undefined
      }

      if (editingAd) {
        await api.updateAdvertisement(editingAd.id, data)
        toast.success(language === 'uz' ? 'Reklama yangilandi' : 'Реклама обновлена')
      } else {
        await api.createAdvertisement(data as any)
        toast.success(language === 'uz' ? 'Reklama yaratildi' : 'Реклама создана')
      }

      setIsDialogOpen(false)
      loadAdvertisements()
    } catch (error) {
      console.error('Error saving advertisement:', error)
      toast.error(language === 'uz' ? 'Saqlashda xatolik' : 'Ошибка при сохранении')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingAd) return

    try {
      await api.deleteAdvertisement(deletingAd.id)
      toast.success(language === 'uz' ? "Reklama o'chirildi" : 'Реклама удалена')
      setIsDeleteDialogOpen(false)
      setDeletingAd(null)
      loadAdvertisements()
    } catch (error) {
      console.error('Error deleting advertisement:', error)
      toast.error(language === 'uz' ? "O'chirishda xatolik" : 'Ошибка при удалении')
    }
  }

  const toggleActive = async (ad: Advertisement) => {
    try {
      await api.updateAdvertisement(ad.id, { active: !ad.active })
      toast.success(language === 'uz' ? 'Status yangilandi' : 'Статус обновлен')
      loadAdvertisements()
    } catch (error) {
      console.error('Error toggling active:', error)
      toast.error(language === 'uz' ? 'Xatolik' : 'Ошибка')
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {language === "uz" ? "Reklama boshqaruvi" : "Управление рекламой"}
          </h1>
          <p className="text-muted-foreground">
            {language === "uz" ? "Bannerlarni boshqarish" : "Управление баннерами"}
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          {language === "uz" ? "Yangi banner" : "Новый баннер"}
        </Button>
      </div>

      <div className="grid gap-4">
        {advertisements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {language === "uz" ? "Bannerlar topilmadi" : "Баннеры не найдены"}
            </CardContent>
          </Card>
        ) : (
          advertisements.map(ad => (
            <Card key={ad.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={getImageUrl(ad.imageUrl)}
                    alt={ad.title}
                    className="w-32 h-20 object-cover rounded border"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{ad.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{language === "uz" ? "Tartib" : "Порядок"}: {ad.displayOrder}</span>
                      {ad.linkUrl && (
                        <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-xs">
                          {ad.linkUrl}
                        </a>
                      )}
                    </div>
                    {(ad.startDate || ad.endDate) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {ad.startDate && <span>{new Date(ad.startDate).toLocaleDateString()}</span>}
                        {ad.startDate && ad.endDate && <span> - </span>}
                        {ad.endDate && <span>{new Date(ad.endDate).toLocaleDateString()}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <Eye className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-sm font-semibold">{ad.viewCount}</span>
                    </div>
                    <div className="text-center">
                      <MousePointer className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-sm font-semibold">{ad.clickCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={ad.active ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleActive(ad)}
                    >
                      {ad.active 
                        ? (language === "uz" ? "Faol" : "Активен")
                        : (language === "uz" ? "Nofaol" : "Неактивен")}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(ad)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDeletingAd(ad)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAd 
                ? (language === "uz" ? "Bannerni tahrirlash" : "Редактировать баннер")
                : (language === "uz" ? "Yangi banner" : "Новый баннер")}
            </DialogTitle>
            <DialogDescription>
              {editingAd
                ? (language === "uz" ? "Banner ma'lumotlarini yangilang" : "Обновите данные баннера")
                : (language === "uz" ? "Yangi reklama banneri yarating" : "Создайте новый рекламный баннер")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{language === "uz" ? "Sarlavha" : "Название"}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={language === "uz" ? "Banner nomi" : "Название баннера"}
              />
            </div>

            <div>
              <Label htmlFor="image">{language === "uz" ? "Rasm/GIF" : "Изображение/GIF"}</Label>
              <Input
                id="image"
                type="file"
                accept="image/*,.gif"
                onChange={handleImageChange}
              />
              {(imagePreview || editingAd?.imageUrl) && (
                <img
                  src={imagePreview || (editingAd ? getImageUrl(editingAd.imageUrl) : "")}
                  alt="Preview"
                  className="mt-2 w-full h-32 object-cover rounded border"
                />
              )}
            </div>

            <div>
              <Label htmlFor="linkUrl">{language === "uz" ? "Havola (ixtiyoriy)" : "Ссылка (опционально)"}</Label>
              <Input
                id="linkUrl"
                type="url"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="displayOrder">{language === "uz" ? "Tartib" : "Порядок отображения"}</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">{language === "uz" ? "Boshlanish sanasi" : "Дата начала"}</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">{language === "uz" ? "Tugash sanasi" : "Дата окончания"}</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="active">{language === "uz" ? "Faol" : "Активен"}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {language === "uz" ? "Bekor qilish" : "Отмена"}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "uz" ? "Saqlash" : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "uz" ? "Bannerni o'chirish" : "Удалить баннер"}</DialogTitle>
            <DialogDescription>
              {language === "uz" 
                ? "Haqiqatan ham bu bannerni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi."
                : "Вы действительно хотите удалить этот баннер? Это действие нельзя отменить."}
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
  )
}
