'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="text-center py-4 border-t border-gray-200 mt-8">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm">
        <p style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}>
          © 2025{' '}
          <a 
            href="https://linkedin.com/in/ibrahim-al-omran" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-purple-600 hover:underline"
            style={{ color: theme === 'dark' ? '#C8A5FF' : '#9333EA' }}
          >
            Ibrahim Al Omran
          </a>
        </p>
        <div className="flex gap-4">
          <Link 
            href="/privacy" 
            className="hover:underline"
            style={{ color: theme === 'dark' ? '#C8A5FF' : '#9333EA' }}
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
