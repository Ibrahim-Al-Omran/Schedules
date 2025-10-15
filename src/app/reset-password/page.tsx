'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid reset link. Please request a new password reset.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Schedules</h1>
          <h2 className="mt-4 sm:mt-6 text-xl sm:text-2xl font-semibold text-gray-800">
            Set new password
          </h2>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 sm:py-8 px-4 sm:px-10 shadow-xl rounded-4xl border" style={{ borderColor: '#C8A5FF' }}>
          {success ? (
            <div className="text-center">
              <div className="border rounded-4xl text-green-700 px-4 py-3 mb-4" style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac' }}>
                <p className="font-medium">✓ Password reset successful!</p>
                <p className="text-sm mt-1">
                  Redirecting you to login...
                </p>
              </div>
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Click here if not redirected
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center">
              <div className="border rounded-4xl text-red-700 px-4 py-3 mb-4" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
                <p className="font-medium">Invalid reset link</p>
                <p className="text-sm mt-1">
                  This password reset link is invalid or has expired.
                </p>
              </div>
              <div className="space-y-3">
                <Link
                  href="/forgot-password"
                  className="block w-full text-center py-2 px-4 border rounded-4xl shadow-sm text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                  style={{ backgroundColor: '#E7D8FF', borderColor: '#C8A5FF' }}
                >
                  Request new reset link
                </Link>
                <Link
                  href="/login"
                  className="block w-full text-center py-2 px-4 text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-gray-800 appearance-none block w-full px-3 py-2 border rounded-4xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    style={{ borderColor: '#C8A5FF' }}
                    placeholder="Enter new password"
                    minLength={6}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-gray-800 appearance-none block w-full px-3 py-2 border rounded-4xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    style={{ borderColor: '#C8A5FF' }}
                    placeholder="Confirm new password"
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="border rounded-4xl text-red-700 px-4 py-3" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border rounded-4xl shadow-sm text-sm font-medium text-gray-700 transition-colors disabled:opacity-50 hover:bg-gray-100"
                  style={{ backgroundColor: '#E7D8FF', borderColor: '#C8A5FF' }}
                >
                  {loading ? 'Resetting password...' : 'Reset password'}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1A1A1A' }}>
        <div style={{ color: 'white' }}>Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
