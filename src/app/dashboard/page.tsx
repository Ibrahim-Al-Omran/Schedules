'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CalendarView from '@/components/CalendarView';
import ShiftForm from '@/components/ShiftForm';
import { Shift } from '@/types/shift';
import { AuthUser } from '@/types/user';

export default function DashboardPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();

  // Check authentication and fetch data
  useEffect(() => {
    checkAuth();
    fetchShifts();
  }, []);

  // Also refresh shifts when the component becomes visible again (e.g., after upload)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Debug Dashboard: Page became visible, refreshing shifts');
        fetchShifts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shifts');
      if (response.ok) {
        const data = await response.json();
        console.log('Debug Dashboard: Fetched shifts:', data.shifts);
        setShifts(data.shifts || []);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShiftAdded = (newShift: Shift) => {
    setShifts(prev => [newShift, ...prev]);
    setShowAddForm(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUploadToGoogleCalendar = async () => {
    // TODO: Implement Google Calendar integration
    alert('Google Calendar integration coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Work Schedule</h1>
              {user && (
                <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleUploadToGoogleCalendar}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                📅 Upload to Google Calendar
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Shift
              </button>
              <button
                onClick={() => router.push('/upload')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Upload XLSX
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar View */}
        <div className="bg-white rounded-lg shadow">
          <CalendarView shifts={shifts} />
        </div>
      </div>

      {/* Add Shift Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New Shift</h2>
            <ShiftForm 
              onShiftAdded={handleShiftAdded}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}