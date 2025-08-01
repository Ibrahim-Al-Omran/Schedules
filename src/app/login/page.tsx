'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          router.push('/dashboard');
          router.refresh();
        } else {
          setIsLogin(true);
          setFormData({ name: '', email: '', password: '' });
          alert('Account created successfully! Please log in.');
        }
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Auth error:', error);
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
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 sm:py-8 px-4 sm:px-10 shadow-xl rounded-4xl border" style={{ borderColor: '#C8A5FF' }}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name (As Shown on Schedule)
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="text-gray-800 appearance-none block w-full px-3 py-2 border rounded-4xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    style={{ borderColor: '#C8A5FF' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="text-gray-800 appearance-none block w-full px-3 py-2 border rounded-4xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  style={{ borderColor: '#C8A5FF' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="text-gray-800 appearance-none block w-full px-3 py-2 border rounded-4xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  style={{ borderColor: '#C8A5FF' }}
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
                {loading ? 'Please wait...' : (isLogin ? 'Sign in' : 'Create account')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({ name: '', email: '', password: '' });
                }}
                className="text-gray-600 hover:text-gray-800 px-4 py-2"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
