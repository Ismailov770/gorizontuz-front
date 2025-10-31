// API client for backend communication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL 
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api` 
  : 'http://localhost:8080/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  articlesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  imageUrl: string;
  viewCount: number;
  published: boolean;
  category: string;
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
  image?: File;
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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'An error occurred');
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async login(credentials: LoginCredentials): Promise<{ token: string }> {
    const response = await this.request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(response.token);
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
    if (data.image) {
      // Use multipart/form-data endpoint for image upload
      const formData = new FormData();
      formData.append('image', data.image);
      
      const params = new URLSearchParams();
      params.append('title', data.title);
      params.append('slug', data.slug);
      params.append('content', data.content);
      params.append('categoryId', data.categoryId.toString());
      params.append('published', data.published.toString());

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
      // Use JSON endpoint for articles without image
      return this.request<Article>('/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: data.title,
          slug: data.slug,
          content: data.content,
          categoryId: data.categoryId,
          published: data.published,
        }),
      });
    }
  }

  async updateArticle(data: UpdateArticleDto): Promise<Article> {
    if (data.image) {
      // Use multipart/form-data endpoint for image upload
      const formData = new FormData();
      formData.append('image', data.image);
      
      const params = new URLSearchParams();
      if (data.title) params.append('title', data.title);
      if (data.slug) params.append('slug', data.slug);
      if (data.content) params.append('content', data.content);
      if (data.categoryId) params.append('categoryId', data.categoryId.toString());
      if (data.published !== undefined) params.append('published', data.published.toString());

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
}

export const api = new ApiClient();
