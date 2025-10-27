'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CalendarView from '@/components/CalendarView';
import ShiftForm from '@/components/ShiftForm';
import { Shift } from '@/types/shift';
import { AuthUser } from '@/types/user';
import { debounceRequest } from '@/lib/debounce';
import { cachedFetch, preloadCriticalData, warmupCriticalEndpoints, clearCache } from '@/lib/performance';
import { RefreshCw, Moon, Sun, LogOut } from 'lucide-react';
import gsap from 'gsap';
import { useTheme } from '@/contexts/ThemeContext';

// Configure GSAP for 120fps
gsap.ticker.fps(120);

export default function DashboardPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [calendars, setCalendars] = useState<Array<{ id: string; summary: string }>>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string | null>(null);
  const addFormRef = useRef<HTMLDivElement>(null);
  const calendarCardRef = useRef<HTMLDivElement>(null);

  const checkAuth = useCallback(async () => {
    return debounceRequest('auth-check', async () => {
      // Use cached fetch for better performance, but allow force refresh after Google connection
      const shouldSkipCache = new URLSearchParams(window.location.search).get('google_connected') === 'true';
      
      const data = await cachedFetch<{ user: AuthUser }>('/api/auth/me', {
        ttl: shouldSkipCache ? 0 : 60000, // Skip cache if just connected Google Calendar
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
      // Show loading state while connecting
      setLoading(true);
      setFeedbackMessage('Finalizing Google Calendar connection...');
      
      // Clear auth cache to force fresh data from server
      clearCache('auth-status');
      
      // Clean up URL params
      window.history.replaceState({}, '', '/dashboard');
      
      // Force refresh auth data and fetch calendars
      const finalizeConnection = async () => {
        try {
          await checkAuth();
          setGoogleConnected(true);
          await fetchCalendars();
          setFeedbackMessage('Google Calendar connected successfully!');
          setTimeout(() => setFeedbackMessage(null), 3000);
        } catch (error) {
          console.error('Error finalizing connection:', error);
          setFeedbackMessage('Connected, but failed to load calendars. Please refresh.');
          setTimeout(() => setFeedbackMessage(null), 3000);
        } finally {
          setLoading(false);
        }
      };
      
      finalizeConnection();
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

  // Disable body scroll when Add Shift modal is open
  useEffect(() => {
    if (showAddForm) {
      // Get scrollbar width before hiding it
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [showAddForm]);

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
        
        // If Google Calendar is not connected, don't show error - just leave calendars empty
        if (response.status === 400 && errorData.error?.includes('not connected')) {
          console.log('Google Calendar not connected - this is normal for new users');
          setCalendars([]);
        } else if (response.status === 500) {
          console.error('Failed to fetch calendars (500):', errorData);
          // Show user-friendly message for 500 errors
          setFeedbackMessage('Unable to fetch Google Calendar list. Please try disconnecting and reconnecting.');
          setTimeout(() => setFeedbackMessage(null), 5000);
        } else {
          console.error('Failed to fetch calendars:', response.status, errorData);
        }
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
      setFeedbackMessage('Network error fetching calendars. Please check your connection.');
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  const handleShiftAdded = (newShift: Shift) => {
    setShifts(prev => [newShift, ...prev]);
    setShowAddForm(false);
  };

  const handleDeleteShift = async (shiftId: string) => {
    // Optimistic UI: Remove shift immediately from UI
    const deletedShift = shifts.find(shift => shift.id === shiftId);
    setShifts(prev => prev.filter(shift => shift.id !== shiftId));
    setFeedbackMessage('Shift deleted successfully');
    setTimeout(() => setFeedbackMessage(null), 3000);

    // Actual deletion in background
    try {
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // If delete fails, restore the shift
        if (deletedShift) {
          setShifts(prev => [deletedShift, ...prev]);
        }
        const errorData = await response.json();
        setFeedbackMessage(errorData.error || 'Failed to delete shift');
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (error) {
      // If delete fails, restore the shift
      console.error('Error deleting shift:', error);
      if (deletedShift) {
        setShifts(prev => [deletedShift, ...prev]);
      }
      setFeedbackMessage('Failed to delete shift');
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  const handleUpdateShift = (shiftId: string, updatedShift: Shift) => {
    setShifts(prev => 
      prev.map(shift => 
        shift.id === shiftId ? updatedShift : shift
      )
    );
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Clear session storage so user gets redirected to dashboard on next login
      sessionStorage.removeItem('hasVisitedHome');
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
        setGoogleConnecting(true);
        setFeedbackMessage('Connecting to Google Calendar...');
        
        const response = await fetch('/api/google/auth');
        const data = await response.json();
        
        if (response.ok && data.authUrl) {
          setFeedbackMessage('Redirecting to Google...');
          // Small delay so user sees the message
          setTimeout(() => {
            // Hard redirect to Google auth
            window.location.href = data.authUrl;
          }, 500);
        } else {
          setFeedbackMessage(data.error || 'Failed to initiate Google Calendar connection');
          setGoogleConnecting(false);
          setTimeout(() => setFeedbackMessage(null), 3000);
        }
      } catch (error) {
        console.error('Google auth error:', error);
        setFeedbackMessage('Failed to connect to Google Calendar');
        setGoogleConnecting(false);
        setTimeout(() => setFeedbackMessage(null), 3000);
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
    // Optimistic UI: Disconnect immediately
    const wasConnected = googleConnected;
    setGoogleConnected(false);
    setCalendars([]);
    setSelectedCalendar(null);
    setFeedbackMessage('Google Calendar disconnected successfully');
    setTimeout(() => setFeedbackMessage(null), 3000);

    // Actual disconnect in background
    try {
      const response = await fetch('/api/google/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        // If disconnect fails, restore connection state
        setGoogleConnected(wasConnected);
        const errorData = await response.json();
        setFeedbackMessage(errorData.error || 'Failed to disconnect Google Calendar');
        setTimeout(() => setFeedbackMessage(null), 3000);
        // Reload calendars if reconnecting
        if (wasConnected) {
          fetchCalendars();
        }
      }
    } catch (error) {
      // If disconnect fails, restore connection state
      console.error('Error disconnecting Google Calendar:', error);
      setGoogleConnected(wasConnected);
      setFeedbackMessage('Failed to disconnect Google Calendar');
      setTimeout(() => setFeedbackMessage(null), 3000);
      // Reload calendars if reconnecting
      if (wasConnected) {
        fetchCalendars();
      }
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

  // Animate Add Shift modal
  useEffect(() => {
    if (showAddForm && addFormRef.current) {
      gsap.fromTo(
        addFormRef.current,
        { opacity: 0, scale: 0.8, y: 20 },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 0.25, 
          ease: 'back.out(1.7)',
          force3D: true
        }
      );
    }
  }, [showAddForm]);

  // Animate calendar card on mount
  useEffect(() => {
    if (calendarCardRef.current && !loading) {
      gsap.fromTo(
        calendarCardRef.current,
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.5, 
          ease: 'power2.out',
          force3D: true
        }
      );
    }
  }, [loading]);

  // Close modal with animation
  const closeAddFormWithAnimation = () => {
    if (addFormRef.current) {
      gsap.to(addFormRef.current, {
        opacity: 0,
        scale: 0.8,
        y: 20,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => setShowAddForm(false)
      });
    } else {
      setShowAddForm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme === 'dark' ? '#1A1A1A' : 'white' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#C8A5FF' }}></div>
          <p className="mt-4 font-medium" style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}>
            Loading your schedule...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navbar - Rounded on mobile, more rounded on desktop */}
      <div className="pt-2 px-2 sm:pt-4 sm:px-4 lg:px-6">
        <div className="mx-auto">
          <div className="rounded-2xl sm:rounded-4xl shadow-lg border px-4 sm:px-6 py-3 sm:py-4" style={{ 
            backgroundColor: theme === 'dark' ? '#444443' : 'white',
            borderColor: theme === 'dark' ? '#555' : '#C8A5FF'
          }}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
                  <span style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Schedules</span>
                </h1>
                {user && (
                  <p className="text-sm" style={{ color: theme === 'dark' ? '#FFFFFF' : '#4B5563' }}>
                    <span style={{ color: theme === 'dark' ? '#FFFFFF' : '#4B5563' }}>
                      Welcome back, {user.name}
                    </span>
                    <span className="inline-block w-0.5 h-4 ml-1 animate-[blink_1s_ease-in-out_infinite]" style={{ verticalAlign: 'middle', backgroundColor: theme === 'dark' ? '#FFFFFF' : '#4B5563' }}></span>
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 w-full sm:w-auto">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-4xl transition-colors border text-xs sm:text-sm flex items-center gap-1 ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                style={{ 
                  backgroundColor: '#E7D8FF', 
                  borderColor: theme === 'dark' ? '#666' : '#C8A5FF',
                  color: theme === 'dark' ? '#FFFFFF' : '#000000'
                }}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" style={{ color: '#000000' }} />
                ) : (
                  <Moon className="w-4 h-4" style={{ color: '#000000' }} />
                )}
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-4xl transition-colors border text-xs sm:text-sm ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                style={{ 
                  backgroundColor: '#E7D8FF', 
                  borderColor: theme === 'dark' ? '#666' : '#C8A5FF',
                  color: theme === 'dark' ? '#000000' : '#000000'
                }}
              >
                <span className="hidden sm:inline">Add Shift</span>
                <span className="sm:hidden">Add</span>
              </button>
              <button
                onClick={() => router.push('/upload')}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-4xl transition-colors border text-xs sm:text-sm ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                style={{ 
                  backgroundColor: '#E7D8FF', 
                  borderColor: theme === 'dark' ? '#666' : '#C8A5FF',
                  color: theme === 'dark' ? '#FFFFFF' : '#000000'
                }}
              >
                <span className="hidden sm:inline">Upload Schedule</span>
                <span className="sm:hidden">Upload</span>
              </button>
              {googleConnected ? (
                <button
                  onClick={handleDisconnectGoogleCalendar}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-4xl transition-colors border text-xs sm:text-sm ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                  style={{ 
                    backgroundColor: '#E7D8FF', 
                    borderColor: theme === 'dark' ? '#666' : '#C8A5FF',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000'
                  }}
                >
                  <span className="hidden sm:inline">Disconnect Google Calendar</span>
                  <span className="sm:hidden">Disconnect Google</span>
                </button>
              ) : (
                <button
                  onClick={handleUploadToGoogleCalendar}
                  disabled={googleConnecting}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-4xl transition-colors border text-xs sm:text-sm flex items-center ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  } ${googleConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ 
                    backgroundColor: '#E7D8FF', 
                    borderColor: theme === 'dark' ? '#666' : '#C8A5FF',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000'
                  }}
                >
                  {googleConnecting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: '#FFFFFF' }}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span className="hidden sm:inline">{googleConnecting ? 'Connecting...' : 'Connect Google Calendar'}</span>
                  <span className="sm:hidden">{googleConnecting ? 'Connecting...' : 'Connect Google'}</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-4xl transition-colors border text-xs sm:text-sm ml-auto flex items-center gap-1.5 ${
                  theme === 'dark' ? 'hover:bg-red-900' : 'hover:bg-red-100'
                }`}
                style={{ 
                  backgroundColor: '#FDE2E2', 
                  borderColor: theme === 'dark' ? '#666' : '#F5A5A5',
                  color: theme === 'dark' ? '#000000' : '#000000'
                }}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
        {/* Feedback Message */}
        {feedbackMessage && (
          <div className="mb-4 p-3 sm:p-4 rounded-2xl sm:rounded-4xl border animate-pulse max-w-7xl mx-auto" style={{ 
            backgroundColor: '#E7D8FF', 
            borderColor: theme === 'dark' ? '#666' : '#C8A5FF'
          }}>
            <p className="text-center text-sm sm:text-base" style={{ color: '#000000' }}>{feedbackMessage}</p>
          </div>
        )}
        
        {/* Fullscreen Calendar View */}
        <div 
          ref={calendarCardRef}
          className="rounded-2xl sm:rounded-4xl shadow-lg overflow-hidden" 
          style={{ 
            backgroundColor: theme === 'dark' ? '#444443' : 'white'
          }}
        >
          <CalendarView shifts={shifts} onDeleteShift={handleDeleteShift} onUpdateShift={handleUpdateShift} />
        </div>

        {/* Calendar Selection - Native Dropdown */}
        {googleConnected && calendars.length > 0 && (
          <div className="mt-4 p-3 sm:p-4 rounded-2xl sm:rounded-4xl shadow border" style={{ 
            backgroundColor: theme === 'dark' ? '#444443' : 'white',
            borderColor: theme === 'dark' ? '#555' : '#C8A5FF'
          }}>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
              Select Google Calendar:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Native Browser Dropdown */}
              <select
                value={selectedCalendar || ''}
                onChange={(e) => setSelectedCalendar(e.target.value)}
                className={`flex-1 px-3 py-2 text-sm sm:text-base rounded-xl sm:rounded-4xl border focus:ring-2 focus:ring-purple-500 focus:outline-none ${
                  theme === 'dark' ? 'text-white bg-gray-700' : 'text-gray-800 bg-white'
                }`}
                style={{ 
                  borderColor: theme === 'dark' ? '#555' : '#C8A5FF',
                  color: selectedCalendar ? undefined : '#4B5563'
                }}
              >
                <option value="" style={{ color: '#4B5563' }}>Select a calendar</option>
                {calendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.summary}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSync}
                disabled={googleSyncing}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-4xl transition-colors flex items-center justify-center gap-1 border text-xs sm:text-sm ${
                  theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                } ${googleSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ 
                  backgroundColor: '#E7D8FF', 
                  borderColor: theme === 'dark' ? '#666' : '#C8A5FF'
                }}
              >
                {googleSyncing ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2" style={{ borderColor: '#C8A5FF' }}></div>
                    <span className="hidden sm:inline">Syncing...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Sync to Calendar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t py-8 px-8 text-center mt-20" style={{ borderColor: theme === 'dark' ? '#333' : '#E5E7EB' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-4">
            <a 
              href="/privacy" 
              className="hover:underline transition-colors"
              style={{ color: '#B388FF' }}
            >
              Privacy Policy
            </a>
            <span style={{ color: theme === 'dark' ? '#666' : '#9CA3AF' }}>•</span>
            <a 
              href="https://github.com/Ibrahim-Al-Omran/Schedules" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline transition-colors"
              style={{ color: '#B388FF' }}
            >
              GitHub
            </a>
          </div>
          <p className="text-sm" style={{ color: theme === 'dark' ? '#666' : '#9CA3AF' }}>
            © {new Date().getFullYear()} Schedules. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Add Shift Modal */}
      {showAddForm && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-6 sm:p-4" 
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={() => closeAddFormWithAnimation()}
        >
          <div 
            ref={addFormRef}
            className="rounded-2xl sm:rounded-4xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md shadow-xl border mx-4" 
            style={{ 
              backgroundColor: theme === 'dark' ? '#444443' : 'white',
              borderColor: theme === 'dark' ? '#555' : '#C8A5FF'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-4" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>Add New Shift</h2>
            <ShiftForm 
              onShiftAdded={handleShiftAdded}
              onCancel={() => closeAddFormWithAnimation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}