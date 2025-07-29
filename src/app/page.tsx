'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

export default function HomePage() {
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          // User is authenticated, redirect to dashboard
          router.push('/dashboard');
        } else {
          // User is not authenticated, redirect to login
          router.push('/login');
        }
      } catch {
        // Error checking auth, redirect to login
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: theme === 'dark' ? '#2A2A2A' : '#FCF5ED' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#C8A5FF' }}></div>
      <p className={`mt-4 ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`}>Loading...</p>
    </main>
  );
}
