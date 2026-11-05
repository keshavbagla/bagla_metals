'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Welcome back, ${data.user.name}!`);

      const from = searchParams.get('from');

      if (
        from === 'admin' ||
        data.user.role === 'ADMIN' ||
        data.user.role === 'STAFF'
      ) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (e: any) {
      toast.error(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-steel-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-500/30">
            <span className="text-white text-2xl font-bold">B</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Bagla Metal Traders
          </h1>
          <p className="text-steel-400 text-sm mt-1">
            Circular Road, Hathras
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 shadow-2xl space-y-4"
        >
          <h2 className="text-lg font-semibold text-steel-800 text-center">
            Sign In
          </h2>

          <div>
            <label className="block text-xs font-semibold text-steel-500 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2.5 border border-steel-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="admin@bagla.com"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-steel-500 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full px-3 py-2.5 border border-steel-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-steel-900 flex items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
