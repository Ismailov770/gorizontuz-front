'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminUser,
  ApiError,
  fetchAdminUsers,
  isSuperAdmin,
  logoutSuperAdmin,
  registerAdmin,
  updateAdminPassword,
} from '@/lib/superAdminClient';

type CreateAdminForm = {
  username: string;
  email: string;
  password: string;
};

export default function SuperAdminAdminsPage() {
  const router = useRouter();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAdminForm>({
    username: '',
    email: '',
    password: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
  }>({});

  const [passwordModalAdmin, setPasswordModalAdmin] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (!isSuperAdmin()) {
        await logoutSuperAdmin();
        router.replace('/super-admin/login');
        return;
      }

      await loadAdmins();
    }

    init();
  }, []);

  async function loadAdmins() {
    setLoading(true);
    setGlobalError(null);

    try {
      const data = await fetchAdminUsers();
      setAdmins(data);
    } catch (err: any) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        await logoutSuperAdmin();
        router.replace('/super-admin/login');
      } else if (err instanceof ApiError) {
        setGlobalError(err.message || 'Не удалось загрузить список администраторов');
      } else {
        setGlobalError('Ошибка при загрузке администраторов');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    setCreateFieldErrors({});
    setGlobalSuccess(null);

    try {
      await registerAdmin(createForm);
      setShowCreateForm(false);
      setCreateForm({ username: '', email: '', password: '' });
      setGlobalSuccess('Администратор успешно создан');
      await loadAdmins();
    } catch (err: any) {
      if (err instanceof ApiError) {
        const backendMessage: string | undefined = err.data?.message;

        if (backendMessage === 'Only super admin can register new admins') {
          setCreateError('Только супер-админ может создавать новых администраторов');
        } else if (backendMessage === 'Username is already taken') {
          setCreateFieldErrors({ username: 'Имя пользователя уже занято' });
        } else if (backendMessage === 'Email is already in use') {
          setCreateFieldErrors({ email: 'Email уже используется' });
        } else {
          setCreateError(err.message || 'Ошибка при создании администратора');
        }

        if (err.status === 401 || err.status === 403) {
          await logoutSuperAdmin();
          router.replace('/super-admin/login');
        }
      } else {
        setCreateError('Произошла ошибка при создании администратора');
      }
    } finally {
      setCreateLoading(false);
    }
  }

  function openPasswordModal(admin: AdminUser) {
    setPasswordModalAdmin(admin);
    setNewPassword('');
    setPasswordError(null);
  }

  function closePasswordModal() {
    setPasswordModalAdmin(null);
    setNewPassword('');
    setPasswordError(null);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordModalAdmin) return;

    setPasswordLoading(true);
    setPasswordError(null);
    setGlobalSuccess(null);

    try {
      await updateAdminPassword(passwordModalAdmin.id, newPassword);
      setGlobalSuccess('Пароль администратора обновлён');
      closePasswordModal();
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          await logoutSuperAdmin();
          router.replace('/super-admin/login');
        } else {
          setPasswordError(err.message || 'Ошибка при смене пароля');
        }
      } else {
        setPasswordError('Произошла ошибка при смене пароля');
      }
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleLogoutClick() {
    await logoutSuperAdmin();
    router.replace('/super-admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Управление администраторами</h1>

          <button
            onClick={handleLogoutClick}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Выйти
          </button>
        </div>

        {globalError && (
          <div className="mb-4 rounded-md bg-red-100 text-red-800 px-3 py-2 text-sm">
            {globalError}
          </div>
        )}

        {globalSuccess && (
          <div className="mb-4 rounded-md bg-green-100 text-green-800 px-3 py-2 text-sm">
            {globalSuccess}
          </div>
        )}

        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Страница доступна только супер-админу <strong>ergashjon</strong>.
          </div>

          <button
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {showCreateForm ? 'Скрыть форму' : 'Добавить администратора'}
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Новый администратор</h2>

            {createError && (
              <div className="mb-3 rounded-md bg-red-100 text-red-800 px-3 py-2 text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
                {createFieldErrors.username && (
                  <p className="text-xs text-red-600 mt-1">
                    {createFieldErrors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
                {createFieldErrors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {createFieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Пароль
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
                {createFieldErrors.password && (
                  <p className="text-xs text-red-600 mt-1">
                    {createFieldErrors.password}
                  </p>
                )}
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-60"
                >
                  {createLoading ? 'Создание...' : 'Создать администратора'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Список администраторов</h2>
          </div>

          {loading ? (
            <div className="p-4 text-sm text-gray-600">Загрузка администраторов...</div>
          ) : admins.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">
              Администраторы не найдены.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">ID</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Username</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Email</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Статус</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-t">
                      <td className="px-4 py-2">{admin.id}</td>
                      <td className="px-4 py-2">{admin.username}</td>
                      <td className="px-4 py-2">{admin.email}</td>
                      <td className="px-4 py-2">
                        {admin.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Активен
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                            Заблокирован
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        <button
                          onClick={() => openPasswordModal(admin)}
                          className="text-xs px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                        >
                          Сменить пароль
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {passwordModalAdmin && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-3">
                Смена пароля: {passwordModalAdmin.username}
              </h2>

              {passwordError && (
                <div className="mb-3 rounded-md bg-red-100 text-red-800 px-3 py-2 text-sm">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {passwordLoading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
