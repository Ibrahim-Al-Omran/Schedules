'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

export default function UploadPage() {
  const { theme } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ 
    message: string; 
    shifts?: unknown[]; 
    success?: boolean; 
    count?: number; 
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/login');
          return;
        }
        setLoading(false);
      } catch {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Starting upload...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Upload response:', data);

      if (response.ok) {
        setResult({
          success: true,
          message: `${data.message}. Created ${data.count} shifts${data.skipped ? `, skipped ${data.skipped} duplicates` : ''}.`,
          count: data.count,
        });
        // Hard refresh to dashboard after successful upload
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2500);
      } else {
        setResult({
          success: false,
          message: data.error || 'Upload failed',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setResult({
        success: false,
        message: 'Upload failed. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#C8A5FF' }}></div>
          <p className={`mt-4 ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 sm:py-12 px-4">
      <div className="max-w-sm sm:max-w-md mx-auto rounded-2xl sm:rounded-4xl shadow-xl p-4 sm:p-6 border" style={{ 
        backgroundColor: theme === 'dark' ? '#444443' : 'white',
        borderColor: theme === 'dark' ? '#555' : '#C8A5FF'
      }}>
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>Upload Schedule</h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}>
            Upload your XLSX schedule file to import shifts
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme === 'dark' ? 'white' : '#374151' }}>
              Choose XLSX File
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
              />
              <div className="w-full px-4 py-3 border rounded-xl sm:rounded-4xl focus-within:ring-2 focus-within:ring-purple-200 cursor-pointer transition-colors"
                style={{ 
                  borderColor: theme === 'dark' ? '#555' : '#C8A5FF',
                  backgroundColor: theme === 'dark' ? '#747474' : 'white',
                  color: theme === 'dark' ? 'white' : '#4B5563'
                }}>
                <span style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}>
                  {file ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)` : "Choose File"}
                </span>
              </div>
            </div>
          </div>

          {file && (
            <div className="p-3 rounded-xl sm:rounded-4xl border bg-green-50" style={{ borderColor: '#10b981' }}>
              <p className="text-sm text-green-700">
                File selected successfully!
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className={`w-full py-2 px-4 rounded-xl sm:rounded-4xl font-medium transition-colors flex items-center justify-center ${
              !file || uploading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : theme === 'dark' 
                  ? 'text-white border hover:bg-gray-700'
                  : 'text-gray-700 border hover:bg-gray-100'
            }`}
            style={!file || uploading ? {} : { backgroundColor: '#E7D8FF', borderColor: theme === 'dark' ? '#666' : '#C8A5FF' }}
          >
            {uploading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {uploading ? 'Processing Schedule...' : 'Upload File'}
          </button>
        </form>

        {result && (
          <div
            className={`mt-4 p-4 rounded-xl sm:rounded-4xl border ${
              result.success
                ? 'bg-green-50'
                : 'bg-red-50'
            }`}
            style={{ borderColor: result.success ? '#10b981' : '#ef4444' }}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {result.success ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.message}
                </p>
                {result.success && result.count && (
                  <p className="text-sm text-green-600 mt-1">
                    Created {result.count} shifts. Redirecting to dashboard...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <a
            href="/dashboard"
            className="text-sm hover:underline"
            style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
