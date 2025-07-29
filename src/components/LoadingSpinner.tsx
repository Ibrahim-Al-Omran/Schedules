'use client';

import { useTheme } from '@/contexts/ThemeContext';

export default function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const { theme } = useTheme();
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-t-purple-600`}
        style={{ borderColor: theme === 'dark' ? '#444443' : '#D1D5DB', borderTopColor: '#9333EA' }}
      ></div>
    </div>
  );
}

export function PageLoader() {
  const { theme } = useTheme();
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme === 'dark' ? '#000000' : 'white' }}>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4" style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}>Loading...</p>
      </div>
    </div>
  );
}

export function SectionLoader({ message = "Loading..." }: { message?: string }) {
  const { theme } = useTheme();
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-2 text-sm" style={{ color: theme === 'dark' ? 'white' : '#6B7280' }}>{message}</p>
      </div>
    </div>
  );
}
