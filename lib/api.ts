// API client for backend communication
// In development, use Next.js proxy to avoid CORS issues
// In production, use the actual backend URL from environment variable
const PROD_API_FALLBACK = 'https://api.gorizontnews.uz';

const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === 'production' ? PROD_API_FALLBACK : '');

const API_BASE_URL = rawBaseUrl
  ? `${rawBaseUrl.replace(/\/+$/, '')}/api`
  : '/api';

const BACKEND_URL =
  rawBaseUrl || (process.env.NODE_ENV === 'production' ? PROD_API_FALLBACK : 'http://localhost:8080');

// Helper function to get full image URL
export const getImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${BACKEND_URL}${imageUrl}`;
};

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  type: string;
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  articlesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string;
}

export interface ArticleImage {
  id: number;
  imageUrl: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  articleCount: number;
}

export interface Author {
  id: number;
  username: string;
  createdAt: string;
}

export type MediaType = "images" | "iframe";

export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  imageUrl: string;
  mediaType: MediaType;
  iframeUrl?: string;
  images: ArticleImage[];
  tags: Tag[];
  viewCount: number;
  published: boolean;
  featured: boolean;
  category: string;
  categoryId: number;
  author?: Author;
  authorName?: string;
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Backend returns array directly, not paginated
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateArticleDto {
  title: string;
  slug: string;
  content: string;
  categoryId: number;
  published: boolean;
  featured?: boolean;
  authorName?: string;
  scheduledAt?: string | null;
  mediaType: MediaType;
  iframeUrl?: string;
  image?: File;
  images?: File[];
  tags?: string[];
}

export interface UpdateArticleDto extends Partial<CreateArticleDto> {
  id: number;
}

export interface ArticlesFilter {
  page?: number;
  limit?: number;
  search?: string;
  published?: boolean;
  categoryId?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    });

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || 'An error occurred');
        (error as any).status = response.status;
        (error as any).data = data;
        throw error;
      }

      return data;
    } catch (error: any) {
      // If it's already an error with status, rethrow it
      if (error.status) throw error;
      
      // Otherwise, create a new error with status 0 to indicate network error
      const networkError = new Error('Network error. Please check your connection.');
      (networkError as any).status = 0;
      throw networkError;
    }
  }

  // Auth
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    console.log('Attempting login with:', { username: credentials.username, password: '***' });
    console.log('API_BASE_URL:', API_BASE_URL);
    
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    console.log('Login response:', { ...response, accessToken: response.accessToken ? '***' : 'missing' });
    this.setToken(response.accessToken);
    return response;
  }

  // Articles
  async getArticles(filters: ArticlesFilter = {}): Promise<Article[]> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.published !== undefined) params.append('published', filters.published.toString());
    if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.order) params.append('order', filters.order);

    const queryString = params.toString();
    return this.request<Article[]>(`/articles${queryString ? '?' + queryString : ''}`);
  }

  async getCategories(): Promise<string[]> {
    return this.request<string[]>('/articles/categories');
  }

  async getArticle(id: number): Promise<Article> {
    return this.request<Article>(`/articles/${id}`);
  }

  async getArticleBySlug(slug: string): Promise<Article> {
    return this.request<Article>(`/articles/slug/${slug}`);
  }

  async createArticle(data: CreateArticleDto): Promise<Article> {
    if (data.images && data.images.length > 0) {
      // Use multipart/form-data endpoint for multiple images
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('slug', data.slug);
      formData.append('content', data.content);
      formData.append('categoryId', data.categoryId.toString());
      formData.append('published', data.published.toString());
      formData.append('featured', (data.featured || false).toString());
      if (data.authorName !== undefined) {
        formData.append('authorName', data.authorName);
        formData.append('author', data.authorName);
      }
      if (data.scheduledAt) formData.append('scheduledAt', data.scheduledAt);
      formData.append('mediaType', data.mediaType);
      if (data.iframeUrl) formData.append('iframeUrl', data.iframeUrl);

      // Add tags
      if (data.tags && data.tags.length > 0) {
        data.tags.forEach(tag => formData.append('tags', tag));
      }

      // Add images
      data.images.forEach(file => formData.append('images', file));

      const response = await fetch(`${API_BASE_URL}/articles/with-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'An error occurred');
      }

      return response.json();
    } else if (data.image) {
      // Use single image endpoint
      const formData = new FormData();
      formData.append('image', data.image);
      
      const params = new URLSearchParams();
      params.append('title', data.title);
      params.append('slug', data.slug);
      params.append('content', data.content);
      params.append('categoryId', data.categoryId.toString());
      params.append('published', data.published.toString());
      params.append('featured', (data.featured || false).toString());
      if (data.authorName !== undefined) {
        params.append('authorName', data.authorName);
        params.append('author', data.authorName);
      }
      if (data.scheduledAt) params.append('scheduledAt', data.scheduledAt);
      params.append('mediaType', data.mediaType);
      if (data.iframeUrl) params.append('iframeUrl', data.iframeUrl);
      if (data.tags && data.tags.length > 0) {
        data.tags.forEach(tag => params.append('tags', tag));
      }

      const response = await fetch(`${API_BASE_URL}/articles/with-image?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'An error occurred');
      }

      return response.json();
    } else {
      // Use JSON endpoint for articles without image (iframe or no media)
      return this.request<Article>('/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: data.title,
          slug: data.slug,
          content: data.content,
          categoryId: data.categoryId,
          published: data.published,
          featured: data.featured || false,
          authorName: data.authorName,
          author: data.authorName,
          scheduledAt: data.scheduledAt,
          mediaType: data.mediaType,
          iframeUrl: data.iframeUrl,
          tags: data.tags,
        }),
      });
    }
  }

  async updateArticle(data: UpdateArticleDto): Promise<Article> {
    if (!data.id) {
      throw new Error('Article ID is required for update');
    }

    if (data.images && data.images.length > 0) {
      // Use multipart/form-data endpoint for multiple images
      const formData = new FormData();
      if (data.title) formData.append('title', data.title);
      if (data.slug) formData.append('slug', data.slug);
      if (data.content) formData.append('content', data.content);
      if (data.categoryId) formData.append('categoryId', data.categoryId.toString());
      if (data.published !== undefined) formData.append('published', data.published.toString());
      if (data.featured !== undefined) formData.append('featured', data.featured.toString());
      if (data.authorName !== undefined) {
        formData.append('authorName', data.authorName);
        formData.append('author', data.authorName);
      }
      if (data.scheduledAt !== undefined && data.scheduledAt !== null) formData.append('scheduledAt', data.scheduledAt);
      if (data.mediaType) formData.append('mediaType', data.mediaType);
      if (data.iframeUrl) formData.append('iframeUrl', data.iframeUrl);

      // Add tags
      if (data.tags && data.tags.length > 0) {
        data.tags.forEach(tag => formData.append('tags', tag));
      }

      // Add images
      data.images.forEach(file => formData.append('images', file));

      const response = await fetch(`${API_BASE_URL}/articles/${data.id}/with-images`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'An error occurred');
      }

      return response.json();
    } else if (data.image) {
      // Use single image endpoint
      const formData = new FormData();
      formData.append('image', data.image);
      
      const params = new URLSearchParams();
      if (data.title) params.append('title', data.title);
      if (data.slug) params.append('slug', data.slug);
      if (data.content) params.append('content', data.content);
      if (data.categoryId) params.append('categoryId', data.categoryId.toString());
      if (data.published !== undefined) params.append('published', data.published.toString());
      if (data.featured !== undefined) params.append('featured', data.featured.toString());
      if (data.authorName !== undefined) {
        params.append('authorName', data.authorName);
        params.append('author', data.authorName);
      }
      if (data.scheduledAt !== undefined && data.scheduledAt !== null) params.append('scheduledAt', data.scheduledAt);
      if (data.mediaType) params.append('mediaType', data.mediaType);
      if (data.iframeUrl) params.append('iframeUrl', data.iframeUrl);
      if (data.tags && data.tags.length > 0) {
        data.tags.forEach(tag => params.append('tags', tag));
      }

      const response = await fetch(`${API_BASE_URL}/articles/${data.id}/with-image?${params.toString()}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'An error occurred');
      }

      return response.json();
    } else {
      // Use JSON endpoint for updates without image
      const updateData: any = {};
      if (data.title) updateData.title = data.title;
      if (data.slug) updateData.slug = data.slug;
      if (data.content) updateData.content = data.content;
      if (data.categoryId) updateData.categoryId = data.categoryId;
      if (data.published !== undefined) updateData.published = data.published;
      if (data.featured !== undefined) updateData.featured = data.featured;
      if (data.authorName !== undefined) {
        updateData.authorName = data.authorName;
        updateData.author = data.authorName;
      }
      if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt;
      if (data.mediaType) updateData.mediaType = data.mediaType;
      if (data.iframeUrl) updateData.iframeUrl = data.iframeUrl;
      if (data.tags !== undefined) updateData.tags = data.tags;

      return this.request<Article>(`/articles/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    }
  }

  async deleteArticle(id: number): Promise<void> {
    return this.request<void>(`/articles/${id}`, {
      method: 'DELETE',
    });
  }

  // Featured Articles Management
  async toggleFeaturedArticle(id: number): Promise<Article> {
    return this.request<Article>(`/admin/articles/${id}/toggle-featured`, {
      method: 'PUT',
    });
  }

  async setFeaturedArticle(id: number, featured: boolean): Promise<Article> {
    return this.request<Article>(`/admin/articles/${id}/set-featured?featured=${featured}`, {
      method: 'PUT',
    });
  }

  async getFeaturedArticlesCount(): Promise<number> {
    return this.request<number>('/admin/articles/featured/count');
  }

  async getNonFeaturedArticlesCount(): Promise<number> {
    return this.request<number>('/admin/articles/non-featured/count');
  }

  // Old Categories API (if you have a separate categories endpoint)
  async getCategoriesDetailed(): Promise<Category[]> {
    return this.request<Category[]>('/categories');
  }

  async createCategory(data: { name: string; slug: string; description?: string }): Promise<Category> {
    return this.request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: number, data: Partial<{ name: string; slug: string; description?: string }>): Promise<Category> {
    return this.request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: number): Promise<void> {
    return this.request<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // File upload
  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'File upload failed');
    }

    return response.json();
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    return this.request<Tag[]>('/tags');
  }

  async createTag(data: { name: string; color: string }): Promise<Tag> {
    return this.request<Tag>('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTag(id: number, data: { name: string; color: string }): Promise<Tag> {
    return this.request<Tag>(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTag(id: number): Promise<void> {
    return this.request<void>(`/tags/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/analytics/dashboard');
  }

  async getArticleStats(id: number): Promise<ArticleStats> {
    return this.request<ArticleStats>(`/analytics/articles/${id}`);
  }

  async getArticlesAnalytics(period?: 'bugun' | 'hafta' | 'oy' | 'yil' | 'barchasi'): Promise<ArticlesAnalyticsResponse> {
    const params = period ? `?period=${period}` : '';
    return this.request<ArticlesAnalyticsResponse>(`/analytics/articles${params}`);
  }

  // Advertisements
  async getAdvertisements(): Promise<Advertisement[]> {
    return this.request<Advertisement[]>('/advertisements');
  }

  async getActiveAdvertisements(): Promise<Advertisement[]> {
    const response = await fetch(`${API_BASE_URL}/advertisements/active`);
    if (!response.ok) throw new Error('Failed to fetch active advertisements');
    return response.json();
  }

  async getAdvertisement(id: number): Promise<Advertisement> {
    return this.request<Advertisement>(`/advertisements/${id}`);
  }

  async createAdvertisement(data: AdvertisementRequest): Promise<Advertisement> {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.linkUrl) formData.append('linkUrl', data.linkUrl);
    if (data.displayOrder !== undefined) formData.append('displayOrder', data.displayOrder.toString());
    if (data.active !== undefined) formData.append('active', data.active.toString());
    if (data.startDate) formData.append('startDate', data.startDate);
    if (data.endDate) formData.append('endDate', data.endDate);
    if (data.image) formData.append('image', data.image);

    const response = await fetch(`${API_BASE_URL}/advertisements`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create advertisement');
    }

    return response.json();
  }

  async updateAdvertisement(id: number, data: Partial<AdvertisementRequest>): Promise<Advertisement> {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.linkUrl !== undefined) formData.append('linkUrl', data.linkUrl);
    if (data.displayOrder !== undefined) formData.append('displayOrder', data.displayOrder.toString());
    if (data.active !== undefined) formData.append('active', data.active.toString());
    if (data.startDate) formData.append('startDate', data.startDate);
    if (data.endDate) formData.append('endDate', data.endDate);
    if (data.image) formData.append('image', data.image);

    const response = await fetch(`${API_BASE_URL}/advertisements/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update advertisement');
    }

    return response.json();
  }

  async deleteAdvertisement(id: number): Promise<void> {
    return this.request<void>(`/advertisements/${id}`, {
      method: 'DELETE',
    });
  }

  async trackAdvertisementClick(id: number): Promise<void> {
    await fetch(`${API_BASE_URL}/advertisements/${id}/track-click`, {
      method: 'POST',
    });
  }

  async trackAdvertisementView(id: number): Promise<void> {
    await fetch(`${API_BASE_URL}/advertisements/${id}/track-view`, {
      method: 'POST',
    });
  }
}

export interface DashboardStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  topArticlesMonth: TopArticle[];
  topArticlesAllTime: TopArticle[];
  viewsTrend: ViewsByDate[];
}

export interface TopArticle {
  id: number;
  title: string;
  slug: string;
  viewCount: number;
  imageUrl: string;
  author: Author;
  authorName?: string;
}

export interface ViewsByDate {
  date: string;
  count: number;
}

export interface ArticleStats {
  articleId: number;
  title: string;
  totalViews: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  viewsByDate: ViewsByDate[];
}

export interface ArticleAnalytics {
  id: number;
  title: string;
  slug: string;
  imageUrl: string;
  viewCount: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  author?: Author;
  authorName?: string;
  createdAt: string;
  publishedAt: string;
  published: boolean;
}

export interface ArticlesAnalyticsResponse {
  articles: ArticleAnalytics[];
  totalArticles: number;
  totalViews: number;
}

export interface Advertisement {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  displayOrder: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
  clickCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdvertisementRequest {
  title: string;
  linkUrl?: string;
  displayOrder?: number;
  active?: boolean;
  startDate?: string;
  endDate?: string;
  image?: File;
}

export const api = new ApiClient();
