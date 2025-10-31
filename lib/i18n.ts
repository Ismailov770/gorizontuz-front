export type Locale = "uz" | "ru"

export const translations = {
  uz: {
    // Auth
    login: "Kirish",
    username: "Foydalanuvchi nomi",
    password: "Parol",
    logout: "Chiqish",

    // Navigation
    dashboard: "Boshqaruv paneli",
    categories: "Kategoriyalar",
    articles: "Maqolalar",

    // Actions
    add: "Qo'shish",
    edit: "Tahrirlash",
    delete: "O'chirish",
    save: "Saqlash",
    cancel: "Bekor qilish",
    search: "Qidirish",

    // Categories
    categoryName: "Kategoriya nomi",
    categorySlug: "Slug",
    categoryDescription: "Tavsif",
    articlesCount: "Maqolalar soni",
    addCategory: "Kategoriya qo'shish",
    editCategory: "Kategoriyani tahrirlash",
    deleteCategory: "Kategoriyani o'chirish",

    // Articles
    articleTitle: "Sarlavha",
    articleSlug: "Slug",
    articleContent: "Kontent",
    articleImage: "Rasm URL",
    articleCategory: "Kategoriya",
    published: "Nashr qilingan",
    viewCount: "Ko'rishlar soni",
    addArticle: "Maqola qo'shish",
    editArticle: "Maqolani tahrirlash",
    deleteArticle: "Maqolani o'chirish",

    // Messages
    deleteConfirm: "Rostdan ham o'chirmoqchimisiz?",
    success: "Muvaffaqiyatli",
    error: "Xatolik",
    createdAt: "Yaratilgan",
    updatedAt: "Yangilangan",
  },
  ru: {
    // Auth
    login: "Войти",
    username: "Имя пользователя",
    password: "Пароль",
    logout: "Выйти",

    // Navigation
    dashboard: "Панель управления",
    categories: "Категории",
    articles: "Статьи",

    // Actions
    add: "Добавить",
    edit: "Редактировать",
    delete: "Удалить",
    save: "Сохранить",
    cancel: "Отмена",
    search: "Поиск",

    // Categories
    categoryName: "Название категории",
    categorySlug: "Slug",
    categoryDescription: "Описание",
    articlesCount: "Количество статей",
    addCategory: "Добавить категорию",
    editCategory: "Редактировать категорию",
    deleteCategory: "Удалить категорию",

    // Articles
    articleTitle: "Заголовок",
    articleSlug: "Slug",
    articleContent: "Контент",
    articleImage: "URL изображения",
    articleCategory: "Категория",
    published: "Опубликовано",
    viewCount: "Просмотры",
    addArticle: "Добавить статью",
    editArticle: "Редактировать статью",
    deleteArticle: "Удалить статью",

    // Messages
    deleteConfirm: "Вы уверены, что хотите удалить?",
    success: "Успешно",
    error: "Ошибка",
    createdAt: "Создано",
    updatedAt: "Обновлено",
  },
}

export function useTranslation(locale: Locale) {
  return translations[locale]
}
