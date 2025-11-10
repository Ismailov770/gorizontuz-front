"# Gorizont Uz - Admin Frontend

Admin panel for Gorizont Uz news portal built with Next.js, React, and TypeScript.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Backend API running on `https://localhost:8080`

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Login
Navigate to [http://localhost:3000/login](http://localhost:3000/login) and use your admin credentials.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Context API

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Utilities
│   ├── api.ts           # API client
│   └── utils.ts         # Helper functions
└── public/              # Static assets
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Backend API URL (optional, defaults to proxy)
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com
```

### API Proxy

The app uses Next.js rewrites to proxy API requests to the backend, avoiding CORS issues during development. See `next.config.mjs` for configuration.

## 🌐 API Integration

The API client is located in `lib/api.ts` and handles:
- Authentication (login, logout)
- Articles management
- Categories management
- File uploads

### Example Usage

```typescript
import { api } from '@/lib/api';

// Login
const response = await api.login({ username, password });

// Get articles
const articles = await api.getArticles({ published: true });

// Create article
const newArticle = await api.createArticle({
  title: 'Article Title',
  slug: 'article-slug',
  content: 'Content...',
  categoryId: 1,
  published: true,
});
```

## 🔐 Authentication

The app uses JWT tokens for authentication:
- **Access Token**: Stored in localStorage
- **Auto-login**: Checks for existing token on app load
- **Protected Routes**: Dashboard requires authentication

## 🎨 Features

- ✅ Bilingual support (Uzbek/Russian)
- ✅ Dark/Light theme
- ✅ Responsive design
- ✅ Article management (CRUD)
- ✅ Category management
- ✅ Image upload
- ✅ Rich text editor
- ✅ Search and filtering

## 🐛 Troubleshooting

### CORS Errors
If you see CORS errors, make sure:
1. Backend is running on `https://localhost:8080`
2. Next.js dev server is restarted after config changes
3. Browser cache is cleared

### SSL Certificate Errors
For local development with HTTPS backend:
1. Accept the self-signed certificate in your browser
2. Or configure your backend to use HTTP in development

## 📝 License

Private project" 
