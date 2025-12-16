'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ApiError,
  isSuperAdmin,
  loginSuperAdmin,
} from '@/lib/superAdminClient';

export default function SuperAdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('ergashjon');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin()) {
      router.replace('/super-admin/admins');
    }
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginSuperAdmin(username, password);
      router.replace('/super-admin/admins');
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.data?.code === 'NOT_SUPER_ADMIN' || err.message === 'Нет прав доступа') {
          setError('Нет прав доступа');
        } else if (err.status === 401 || err.status === 400) {
          setError('Неверный логин или пароль');
        } else {
          setError(err.message || 'Произошла ошибка при входе');
        }
      } else {
        setError('Произошла ошибка. Попробуйте ещё раз.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          Вход супер-админа
        </h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 text-red-800 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Логин
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
