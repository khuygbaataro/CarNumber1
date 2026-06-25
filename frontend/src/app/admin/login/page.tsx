'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/adminApi';
import { setToken } from '@/lib/auth';
import { t } from '@/lib/labels';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await adminApi.login(email, password);
      setToken(token);
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.login.error);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200"
      >
        <h1 className="text-center text-xl font-bold text-gray-900">
          {t.admin.login.title}
        </h1>

        <div className="mt-6 space-y-4">
          <div>
            <label className="label">{t.admin.login.email}</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="label">{t.admin.login.password}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm font-medium text-accent">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? t.admin.login.submitting : t.admin.login.submit}
        </button>
      </form>
    </div>
  );
}
