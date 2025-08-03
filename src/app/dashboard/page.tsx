'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CalendarView from '@/components/CalendarView';
import ShiftForm from '@/components/ShiftForm';
import { Shift } from '@/types/shift';
import { AuthUser } from '@/types/user';
import { debounceRequest } from '@/lib/debounce';
import { cachedFetch, preloadCriticalData, warmupCriticalEndpoints } from '@/lib/performance';

export default function DashboardPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<{ id: string; summary: string }[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string | null>(null);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    return debounceRequest('auth-check', async () => {
      // Use cached fetch for better performance
      const data = await cachedFetch<{ user: AuthUser }>('/api/auth/me', {
        ttl: 60000, // Cache for 1 minute
        key: 'auth-status'
      });
      
      setUser(data.user);
      // Check if user has Google Calendar connected
      setGoogleConnected(!!data.user.googleAccessToken);
    }).catch(error => {
      console.error('Auth check failed:', error);
      router.push('/login');
    });
  }, [router]);

  const fetchShifts = useCallback(async () => {
    return debounceRequest('fetch-shifts', async () => {
      // Use cached fetch for shifts
      const data = await cachedFetch<{ shifts: Shift[] }>('/api/shifts', {
        ttl: 30000, // Cache for 30 seconds
        key: 'user-shifts'
      });
      
      setShifts(data.shifts || []);
    }).catch(error => {
      console.error('Error fetching shifts:', error);
      // If unauthorized, redirect to login
      if (error.message?.includes('401')) {
        router.push('/login');
      }
    });
  }, [router]);

  // Warm up critical endpoints on component mount
  useEffect(() => {
    warmupCriticalEndpoints();
    preloadCriticalData();
  }, []);

  // Check authentication and fetch data sequentially
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        // First check authentication
        await checkAuth();
        // Then fetch shifts
        await fetchShifts();
      } catch (error) {
        console.error('Dashboard initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
    
    // Check for Google Calendar connection status from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('google_connected') === 'true') {
      setGoogleConnected(true);
      setFeedbackMessage('Google Calendar connected successfully!');
      setTimeout(() => setFeedbackMessage(null), 3000);
      // Clean up URL params
      window.history.replaceState({}, '', '/dashboard');
    } else if (urlParams.get('google_error')) {
      setFeedbackMessage('Failed to connect Google Calendar. Please try again.');
      setTimeout(() => setFeedbackMessage(null), 3000);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [checkAuth, fetchShifts]);

  // Debounced refresh shifts when the component becomes visible again
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Debounce the fetchShifts call
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchShifts();
        }, 500); // 500ms delay
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(timeoutId);
    };
  }, [fetchShifts]);

  const fetchCalendars = async () => {
    try {
      const response = await fetch('/api/google/calendars');
      if (response.ok) {
        const data = await response.json();
        setCalendars(data.calendars || []);
        if (data.calendars.length > 0) {
          setSelectedCalendar(null); // Do not set a default calendar
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch calendars:', response.status, errorData);
        
        // If Google Calendar is not connected, don't show error - just leave calendars empty
        if (response.status === 400 && errorData.error?.includes('not connected')) {
          console.log('Google Calendar not connected - this is normal for new users');
          setCalendars([]);
        }
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
    }
  };

  const handleShiftAdded = (newShift: Shift) => {
    setShifts(prev => [newShift, ...prev]);
    setShowAddForm(false);
  };

  const handleDeleteShift = async (shiftId: string) => {
    return debounceRequest(`delete-shift-${shiftId}`, async () => {
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShifts(prev => prev.filter(shift => shift.id !== shiftId));
        setFeedbackMessage('Shift deleted successfully');
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setFeedbackMessage(errorData.error || 'Failed to delete shift');
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    }).catch(error => {
      console.error('Error deleting shift:', error);
      setFeedbackMessage('Failed to delete shift');
      setTimeout(() => setFeedbackMessage(null), 3000);
    });
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
    if (!googleConnected) {
      // Start Google OAuth flow
      try {
        const response = await fetch('/api/google/auth');
        const data = await response.json();
        
        if (response.ok && data.authUrl) {
          window.location.href = data.authUrl;
        } else {
          alert(data.error || 'Failed to initiate Google Calendar connection');
        }
      } catch (error) {
        console.error('Google auth error:', error);
        alert('Failed to connect to Google Calendar');
      }
    } else {
      // Sync shifts to Google Calendar
      try {
        setGoogleSyncing(true);
        const response = await fetch('/api/google/sync', {
          method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setFeedbackMessage(data.message);
          setTimeout(() => setFeedbackMessage(null), 3000);
          if (data.errors && data.errors.length > 0) {
            console.warn('Some errors occurred:', data.errors);
          }
        } else {
          setFeedbackMessage(data.error || 'Failed to sync with Google Calendar');
          setTimeout(() => setFeedbackMessage(null), 3000);
        }
      } catch (error) {
        console.error('Google sync error:', error);
        setFeedbackMessage('Failed to sync with Google Calendar');
        setTimeout(() => setFeedbackMessage(null), 3000);
      } finally {
        setGoogleSyncing(false);
      }
    }
  };

  const handleSync = async () => {
    if (!selectedCalendar) {
      setFeedbackMessage('Please select a calendar to sync.');
      setTimeout(() => setFeedbackMessage(null), 3000);
      return;
    }

    console.log('Selected Calendar:', selectedCalendar); // Debug log

    try {
      setGoogleSyncing(true);
      const response = await fetch('/api/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId: selectedCalendar }),
      });

      const data = await response.json();
      if (response.ok) {
        setFeedbackMessage(data.message);
      } else {
        setFeedbackMessage(data.error || 'Failed to sync with Google Calendar');
      }
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (error) {
      console.error('Google sync error:', error);
      setFeedbackMessage('Failed to sync with Google Calendar');
      setTimeout(() => setFeedbackMessage(null), 3000);
    } finally {
      setGoogleSyncing(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    try {
      const response = await fetch('/api/google/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setGoogleConnected(false);
        setFeedbackMessage('Google Calendar disconnected successfully');
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setFeedbackMessage(errorData.error || 'Failed to disconnect Google Calendar');
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      setFeedbackMessage('Failed to disconnect Google Calendar');
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  useEffect(() => {
    if (googleConnected) {
      fetchCalendars();
    }
  }, [googleConnected]);

  useEffect(() => {
    if (selectedCalendar) {
      setFeedbackMessage(`Selected calendar: ${calendars.find(c => c.id === selectedCalendar)?.summary}`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  }, [selectedCalendar, calendars]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#C8A5FF' }}></div>
          <p className="mt-4 text-gray-600">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow border-b" style={{ borderColor: '#C8A5FF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Schedules</h1>
              {user && (
                <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowAddForm(true)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-4xl transition-colors text-gray-700 border hover:bg-gray-100 text-xs sm:text-sm"
                style={{ 
                  backgroundColor: '#E7D8FF', 
                  borderColor: '#C8A5FF' 
                }}
              >
                <span className="hidden sm:inline">Add Shift</span>
                <span className="sm:hidden">Add</span>
              </button>
              <button
                onClick={() => router.push('/upload')}
                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-4xl transition-colors text-gray-700 border hover:bg-gray-100 text-xs sm:text-sm"
                style={{ 
                  backgroundColor: '#E7D8FF', 
                  borderColor: '#C8A5FF' 
                }}
              >
                <span className="hidden sm:inline">Upload Schedule</span>
                <span className="sm:hidden">Upload</span>
              </button>
              {googleConnected ? (
                <button
                  onClick={handleDisconnectGoogleCalendar}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-4xl transition-colors text-gray-700 border hover:bg-gray-100 text-xs sm:text-sm"
                  style={{ 
                    backgroundColor: '#E7D8FF', 
                    borderColor: '#C8A5FF' 
                  }}
                >
                  <span className="hidden sm:inline">Disconnect Google Calendar</span>
                  <span className="sm:hidden">Disconnect Google</span>
                </button>
              ) : (
                <button
                  onClick={handleUploadToGoogleCalendar}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-4xl transition-colors text-gray-700 border hover:bg-gray-100 text-xs sm:text-sm"
                  style={{ 
                    backgroundColor: '#E7D8FF', 
                    borderColor: '#C8A5FF' 
                  }}
                >
                  <span className="hidden sm:inline">Connect Google Calendar</span>
                  <span className="sm:hidden">Connect Google</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-4xl transition-colors text-gray-700 border hover:bg-gray-100 text-xs sm:text-sm ml-auto"
                style={{ 
                  backgroundColor: '#FDE2E2', 
                  borderColor: '#F5A5A5' 
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Feedback Message */}
        {feedbackMessage && (
          <div className="mb-4 p-3 sm:p-4 rounded-4xl border animate-pulse" style={{ backgroundColor: '#E7D8FF', borderColor: '#C8A5FF' }}>
            <p className="text-gray-800 text-center text-sm sm:text-base">{feedbackMessage}</p>
          </div>
        )}
        
        {/* Calendar View */}
        <div className="bg-white rounded-4xl shadow border-1" style={{ borderColor: '#C8A5FF' }}>
          <CalendarView shifts={shifts} onDeleteShift={handleDeleteShift} />
        </div>

        {/* Calendar Selection */}
        {googleConnected && calendars.length > 0 && (
          <div className="mt-4 p-4 rounded-4xl bg-white shadow border" style={{ borderColor: '#C8A5FF' }}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Google Calendar:
            </label>
            <div className="flex gap-2">
              <select
                value={selectedCalendar || ''}
                onChange={(e) => setSelectedCalendar(e.target.value)}
                className="flex-1 px-3 py-2 rounded-4xl border focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                style={{ borderColor: '#C8A5FF' }}
              >
                {calendars.map(calendar => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.summary}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSync}
                disabled={googleSyncing}
                className={`px-3 py-2 rounded-4xl transition-colors flex items-center gap-1 text-gray-700 border text-sm ${
                  googleSyncing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ 
                  backgroundColor: '#E7D8FF', 
                  borderColor: '#C8A5FF' 
                }}
              >
                {googleSyncing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#C8A5FF' }}></div>
                    <span className="hidden sm:inline">Syncing...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    🔄 <span>Sync to Calendar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Shift Modal */}
      {showAddForm && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-6 sm:p-4" 
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={() => setShowAddForm(false)}
        >
          <div 
            className="bg-white rounded-4xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md shadow-xl border mx-4" 
            style={{ borderColor: '#C8A5FF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Add New Shift</h2>
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