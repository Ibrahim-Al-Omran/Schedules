'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function ForgotPasswordPage() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setEmail('');
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: theme === 'dark' ? '#444443' : 'white' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>Schedules</h1>
          <h2 className="mt-4 sm:mt-6 text-xl sm:text-2xl font-semibold" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>
            Reset your password
          </h2>
          <p className="mt-2 text-sm" style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}>
            Enter your email and we&apos;ll send you a link to reset your password
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-6 sm:py-8 px-4 sm:px-10 shadow-xl rounded-4xl border" style={{ backgroundColor: theme === 'dark' ? '#444443' : 'white', borderColor: '#C8A5FF' }}>
          {success ? (
            <div className="text-center">
              <div className="border rounded-4xl text-green-700 px-4 py-3 mb-4" style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac' }}>
                <p className="font-medium">Check your email!</p>
                <p className="text-sm mt-1">
                  If an account exists with this email, we&apos;ve sent password reset instructions.
                </p>
              </div>
              <p className="text-sm mb-4" style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}>
                Didn&apos;t receive an email? Check your spam folder or try again.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setSuccess(false)}
                  className="w-full flex justify-center py-2 px-4 border rounded-4xl shadow-sm text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                  style={{ backgroundColor: '#E7D8FF', borderColor: '#C8A5FF' }}
                >
                  Send another email
                </button>
                <Link
                  href="/login"
                  className="block w-full text-center py-2 px-4 text-sm font-medium hover:text-gray-800"
                  style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}
                >
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium" style={{ color: theme === 'dark' ? 'white' : '#374151' }}>
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-gray-800 appearance-none block w-full px-3 py-2 border rounded-4xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    style={{ borderColor: '#C8A5FF' }}
                    placeholder="your@email.com"
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
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm hover:text-gray-800"
                  style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}
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
