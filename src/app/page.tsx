'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import { Calendar, Link2, Upload, Palette, UserPlus, ClipboardEdit, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated and redirect only on first visit
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          setIsAuthenticated(true);
          
          // Only redirect to dashboard if this is the initial page load (not a direct visit)
          // Use sessionStorage to track if user has already been redirected this session
          const hasVisitedHome = sessionStorage.getItem('hasVisitedHome');
          
          if (!hasVisitedHome) {
            // First visit this session - redirect to dashboard
            sessionStorage.setItem('hasVisitedHome', 'true');
            router.push('/dashboard');
          }
          // If hasVisitedHome is true, user came back to home page intentionally, so don't redirect
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [router]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: theme === 'dark' ? '#1A1A1A' : '#FCF5ED' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#C8A5FF' }}></div>
        <p className="mt-4" style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}>Loading...</p>
      </main>
    );
  }

  const bgColor = theme === 'dark' ? '#1A1A1A' : '#ffffff';
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const secondaryTextColor = theme === 'dark' ? '#c0c0c0' : '#666666';
  const accentColor = '#B388FF'; // Brighter neon purple
  const cardBg = theme === 'dark' 
    ? 'rgba(40, 40, 40, 0.4)' // Grey translucent to show glow
    : 'rgba(255, 255, 255, 0.7)';

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Large Background Logo with Breathing Border Glow - Left Side - Hidden on Mobile */}
      <div 
        className="hidden md:block absolute top-1/2 left-0 -translate-x-1/3 -translate-y-1/2 pointer-events-none"
        style={{
          width: '1400px',
          height: '1400px',
        }}
      >
        <div 
          className="absolute inset-0 flex items-center justify-center"
        >
          <svg
            viewBox="0 0 640 640"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              width: '900px',
              height: '900px',
            }}
          >
            <defs>
              {/* Glowing filter for the borders */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="15" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Breathing glow layer - multiple copies with different blur for intensity */}
            <g style={{ 
              animation: 'breatheGlow 4s ease-in-out infinite',
              opacity: theme === 'dark' ? 1 : 0.4
            }}>
              {/* Calendar outline with rounded corners */}
              <rect
                x="120"
                y="140"
                width="320"
                height="360"
                rx="40"
                ry="40"
                stroke={accentColor}
                strokeWidth="28"
                fill="none"
                filter="url(#strongGlow)"
              />
              
              {/* Calendar binding rings */}
              <circle cx="200" cy="140" r="20" fill={accentColor} filter="url(#glow)" />
              <circle cx="320" cy="140" r="20" fill={accentColor} filter="url(#glow)" />
              <circle cx="440" cy="140" r="20" fill={accentColor} filter="url(#glow)" />
              
              {/* Calendar horizontal line separator */}
              <line 
                x1="140" 
                y1="200" 
                x2="420" 
                y2="200" 
                stroke={accentColor} 
                strokeWidth="24"
                strokeLinecap="round"
                filter="url(#glow)"
              />
              
              {/* Clock circle overlapping bottom right */}
              <circle
                cx="400"
                cy="380"
                r="140"
                stroke={accentColor}
                strokeWidth="28"
                fill={theme === 'dark' ? '#1A1A1A' : '#FCF5ED'}
                filter="url(#strongGlow)"
              />
              
              {/* Clock center dot */}
              <circle
                cx="400"
                cy="380"
                r="12"
                fill={accentColor}
                filter="url(#glow)"
              />
              
              {/* Clock hour hand */}
              <line
                x1="400"
                y1="380"
                x2="400"
                y2="290"
                stroke={accentColor}
                strokeWidth="18"
                strokeLinecap="round"
                filter="url(#glow)"
              />
              
              {/* Clock minute hand */}
              <line
                x1="400"
                y1="380"
                x2="470"
                y2="420"
                stroke={accentColor}
                strokeWidth="14"
                strokeLinecap="round"
                filter="url(#glow)"
              />
            </g>
            
            {/* Base layer - static, subtle with glow */}
            <g style={{ opacity: theme === 'dark' ? 0.15 : 0.08 }}>
              <rect
                x="120"
                y="140"
                width="320"
                height="360"
                rx="40"
                ry="40"
                stroke={accentColor}
                strokeWidth="28"
                fill="none"
                filter="url(#strongGlow)"
              />
              <circle cx="200" cy="140" r="20" fill={accentColor} filter="url(#glow)" />
              <circle cx="320" cy="140" r="20" fill={accentColor} filter="url(#glow)" />
              <circle cx="440" cy="140" r="20" fill={accentColor} filter="url(#glow)" />
              <line 
                x1="140" 
                y1="200" 
                x2="420" 
                y2="200" 
                stroke={accentColor} 
                strokeWidth="24"
                strokeLinecap="round"
                filter="url(#glow)"
              />
              <circle
                cx="400"
                cy="380"
                r="140"
                stroke={accentColor}
                strokeWidth="28"
                fill={theme === 'dark' ? '#1A1A1A' : '#FCF5ED'}
                filter="url(#strongGlow)"
              />
              <circle cx="400" cy="380" r="12" fill={accentColor} filter="url(#glow)" />
              <line
                x1="400"
                y1="380"
                x2="400"
                y2="290"
                stroke={accentColor}
                strokeWidth="18"
                strokeLinecap="round"
                filter="url(#glow)"
              />
              <line
                x1="400"
                y1="380"
                x2="470"
                y2="420"
                stroke={accentColor}
                strokeWidth="14"
                strokeLinecap="round"
                filter="url(#glow)"
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative px-8 py-20 text-center max-w-4xl mx-auto opacity-0 animate-[fadeIn_0.8s_ease-in_forwards]">
        <h1 className="text-5xl font-bold mb-6 animate-[slideDown_0.8s_ease-out_0.2s_forwards] opacity-0" style={{ color: accentColor }}>
          Welcome to Schedules
        </h1>
        <p className="text-xl mb-8 animate-[slideDown_0.8s_ease-out_0.4s_forwards] opacity-0" style={{ color: textColor }}>
          Your all-in-one shift scheduling solution with seamless Google Calendar integration
        </p>
        
        <div className="animate-[slideDown_0.8s_ease-out_0.6s_forwards] opacity-0">
          {isAuthenticated ? (
            <Link 
              href="/dashboard"
              className="inline-block px-8 py-3 rounded-2xl sm:rounded-4xl font-semibold text-white"
              style={{ 
                backgroundColor: accentColor,
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, opacity 0.3s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(200, 165, 255, 0.3), 0 10px 10px -5px rgba(200, 165, 255, 0.2)';
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.opacity = '1';
              }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link 
                href="/login?mode=register"
                className="button-hover-effect inline-block px-8 py-3 rounded-2xl sm:rounded-4xl font-semibold text-white hover:shadow-[0_0_30px_rgba(179,136,255,0.6)]"
                style={{ backgroundColor: accentColor }}
              >
                Get Started
              </Link>
              <Link 
                href="/login"
                className="button-hover-effect inline-block px-8 py-3 rounded-2xl sm:rounded-4xl font-semibold hover:shadow-[0_0_30px_rgba(179,136,255,0.4)] hover:bg-[rgba(179,136,255,0.1)]"
                style={{ 
                  border: `2px solid ${accentColor}`, 
                  color: accentColor 
                }}
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-8 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 animate-[fadeIn_0.8s_ease-in_0.8s_forwards] opacity-0" style={{ color: textColor }}>
          How It Works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div 
            className="p-6 rounded-2xl sm:rounded-4xl shadow-lg animate-[slideUp_0.6s_ease-out_1s_forwards] opacity-0 backdrop-blur-md"
            style={{ 
              backgroundColor: theme === 'dark' ? 'rgba(40, 40, 40, 0.4)' : 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${accentColor}60`,
              boxShadow: `0 4px 16px rgba(179, 136, 255, 0.15), inset 0 0 20px rgba(179, 136, 255, 0.08), 0 0 20px rgba(179, 136, 255, 0.1)`,
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 8px 32px rgba(179, 136, 255, 0.3), inset 0 0 30px rgba(179, 136, 255, 0.15), 0 0 40px rgba(179, 136, 255, 0.2)`;
              e.currentTarget.style.border = `1px solid ${accentColor}90`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 16px rgba(179, 136, 255, 0.15), inset 0 0 20px rgba(179, 136, 255, 0.08), 0 0 20px rgba(179, 136, 255, 0.1)`;
              e.currentTarget.style.border = `1px solid ${accentColor}60`;
            }}
          >
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full transition-all duration-300" style={{ backgroundColor: `${accentColor}40` }}>
                <UserPlus size={32} style={{ color: accentColor }} />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center" style={{ color: textColor }}>Create an Account</h3>
            <p className="text-center" style={{ color: secondaryTextColor }}>
              Sign up quickly with your email or connect your Google account for seamless integration.
            </p>
          </div>

          {/* Feature 2 */}
          <div 
            className="p-6 rounded-2xl sm:rounded-4xl shadow-lg animate-[slideUp_0.6s_ease-out_0.8s_forwards] opacity-0 backdrop-blur-md"
            style={{ 
              backgroundColor: theme === 'dark' ? 'rgba(40, 40, 40, 0.4)' : 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${accentColor}60`,
              boxShadow: `0 4px 16px rgba(179, 136, 255, 0.15), inset 0 0 20px rgba(179, 136, 255, 0.08), 0 0 20px rgba(179, 136, 255, 0.1)`,
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 8px 32px rgba(179, 136, 255, 0.3), inset 0 0 30px rgba(179, 136, 255, 0.15), 0 0 40px rgba(179, 136, 255, 0.2)`;
              e.currentTarget.style.border = `1px solid ${accentColor}90`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 16px rgba(179, 136, 255, 0.15), inset 0 0 20px rgba(179, 136, 255, 0.08), 0 0 20px rgba(179, 136, 255, 0.1)`;
              e.currentTarget.style.border = `1px solid ${accentColor}60`;
            }}
          >
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full transition-all duration-300" style={{ backgroundColor: `${accentColor}40` }}>
                <ClipboardEdit size={32} style={{ color: accentColor }} />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center" style={{ color: textColor }}>Manage Your Shifts</h3>
            <p className="text-center" style={{ color: secondaryTextColor }}>
              Create, edit, and organize your work shifts with our intuitive interface. View them in list or calendar format.
            </p>
          </div>

          {/* Feature 3 */}
          <div 
            className="p-6 rounded-2xl sm:rounded-4xl shadow-lg animate-[slideUp_0.6s_ease-out_1.2s_forwards] opacity-0 backdrop-blur-md"
            style={{ 
              backgroundColor: theme === 'dark' ? 'rgba(40, 40, 40, 0.4)' : 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${accentColor}60`,
              boxShadow: `0 4px 16px rgba(179, 136, 255, 0.15), inset 0 0 20px rgba(179, 136, 255, 0.08), 0 0 20px rgba(179, 136, 255, 0.1)`,
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 8px 32px rgba(179, 136, 255, 0.3), inset 0 0 30px rgba(179, 136, 255, 0.15), 0 0 40px rgba(179, 136, 255, 0.2)`;
              e.currentTarget.style.border = `1px solid ${accentColor}90`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 16px rgba(179, 136, 255, 0.15), inset 0 0 20px rgba(179, 136, 255, 0.08), 0 0 20px rgba(179, 136, 255, 0.1)`;
              e.currentTarget.style.border = `1px solid ${accentColor}60`;
            }}
          >
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full transition-all duration-300" style={{ backgroundColor: `${accentColor}40` }}>
                <RefreshCw size={32} style={{ color: accentColor }} />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center" style={{ color: textColor }}>Sync with Google Calendar</h3>
            <p className="text-center" style={{ color: secondaryTextColor }}>
              Connect your Google Calendar to automatically sync your shifts and stay organized across all your devices.
            </p>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="relative px-8 py-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 animate-[fadeIn_0.8s_ease-in_1.6s_forwards] opacity-0" style={{ color: textColor }}>
          Key Features
        </h2>
        
        <div className="space-y-6">
          <div 
            className="p-6 rounded-2xl sm:rounded-4xl shadow-lg animate-[slideUp_0.6s_ease-out_1.6s_forwards] opacity-0 backdrop-blur-md"
            style={{ 
              backgroundColor: theme === 'dark' ? 'rgba(40, 40, 40, 0.4)' : 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${accentColor}60`,
              boxShadow: `0 4px 16px rgba(179, 136, 255, 0.15), inset 0 0 20px rgba(179, 136, 255, 0.08), 0 0 20px rgba(179, 136, 255, 0.1)`,
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = `0 8px 32px rgba(179, 136, 255, 0.25), inset 0 0 30px rgba(179, 136, 255, 0.12), 0 0 30px rgba(179, 136, 255, 0.15)`;
              e.currentTarget.style.border = `1px solid ${accentColor}80`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 16px rgba(179, 136, 255, 0.15), inset 0 0 20px rgba(179, 136, 255, 0.08), 0 0 20px rgba(179, 136, 255, 0.1)`;
              e.currentTarget.style.border = `1px solid ${accentColor}60`;
            }}
          >
            <div className="flex items-center gap-4 mb-2">
              <Calendar size={24} style={{ color: accentColor }} />
              <h3 className="text-xl font-semibold" style={{ color: textColor }}>
                Smart Shift Management
              </h3>
            </div>
            <p style={{ color: secondaryTextColor }}>
              Create and manage shifts with title, description, start/end times, and location. View your schedule in multiple formats.
            </p>
          </div>

          <div 
            className="p-6 rounded-2xl sm:rounded-4xl shadow-md animate-[slideRight_0.6s_ease-out_2s_forwards] opacity-0 backdrop-blur-md"
            style={{ 
              backgroundColor: theme === 'dark' ? 'rgba(40, 40, 40, 0.4)' : 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${accentColor}60`,
              boxShadow: `0 4px 16px rgba(179, 136, 255, 0.15), inset 0 0 20px rgba(179, 136, 255, 0.08), 0 0 20px rgba(179, 136, 255, 0.1)`,
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = `0 8px 32px rgba(179, 136, 255, 0.25), inset 0 0 30px rgba(179, 136, 255, 0.12), 0 0 30px rgba(179, 136, 255, 0.15)`;
              e.currentTarget.style.border = `1px solid ${accentColor}80`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 16px rgba(179, 136, 255, 0.15), inset 0 0 20px rgba(179, 136, 255, 0.08), 0 0 20px rgba(179, 136, 255, 0.1)`;
              e.currentTarget.style.border = `1px solid ${accentColor}60`;
            }}
          >
            <div className="flex items-center gap-4 mb-2">
              <Link2 size={24} style={{ color: accentColor }} />
              <h3 className="text-xl font-semibold" style={{ color: textColor }}>
                Google Calendar Integration
              </h3>
            </div>
            <p style={{ color: secondaryTextColor }}>
              One-click sync with Google Calendar. Your shifts automatically appear in your calendar with all details included.
            </p>
          </div>

          <div 
            className="p-6 rounded-2xl sm:rounded-4xl shadow-md animate-[slideRight_0.6s_ease-out_2.2s_forwards] opacity-0 backdrop-blur-md"
            style={{ 
              backgroundColor: theme === 'dark' ? 'rgba(40, 40, 40, 0.4)' : 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${accentColor}60`,
              boxShadow: `0 4px 16px rgba(179, 136, 255, 0.15), inset 0 0 20px rgba(179, 136, 255, 0.08), 0 0 20px rgba(179, 136, 255, 0.1)`,
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = `0 8px 32px rgba(179, 136, 255, 0.25), inset 0 0 30px rgba(179, 136, 255, 0.12), 0 0 30px rgba(179, 136, 255, 0.15)`;
              e.currentTarget.style.border = `1px solid ${accentColor}80`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 16px rgba(179, 136, 255, 0.15), inset 0 0 20px rgba(179, 136, 255, 0.08), 0 0 20px rgba(179, 136, 255, 0.1)`;
              e.currentTarget.style.border = `1px solid ${accentColor}60`;
            }}
          >
            <div className="flex items-center gap-4 mb-2">
              <Upload size={24} style={{ color: accentColor }} />
              <h3 className="text-xl font-semibold" style={{ color: textColor }}>
                Easy Upload
              </h3>
            </div>
            <p style={{ color: secondaryTextColor }}>
              Import multiple shifts at once by uploading a schedule file. Save time on data entry.
            </p>
          </div>

          <div 
            className="p-6 rounded-2xl sm:rounded-4xl shadow-md animate-[slideRight_0.6s_ease-out_2.4s_forwards] opacity-0 backdrop-blur-md"
            style={{ 
              backgroundColor: theme === 'dark' ? 'rgba(40, 40, 40, 0.4)' : 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${accentColor}60`,
              boxShadow: `0 4px 16px rgba(179, 136, 255, 0.15), inset 0 0 20px rgba(179, 136, 255, 0.08), 0 0 20px rgba(179, 136, 255, 0.1)`,
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = `0 8px 32px rgba(179, 136, 255, 0.25), inset 0 0 30px rgba(179, 136, 255, 0.12), 0 0 30px rgba(179, 136, 255, 0.15)`;
              e.currentTarget.style.border = `1px solid ${accentColor}80`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 16px rgba(179, 136, 255, 0.15), inset 0 0 20px rgba(179, 136, 255, 0.08), 0 0 20px rgba(179, 136, 255, 0.1)`;
              e.currentTarget.style.border = `1px solid ${accentColor}60`;
            }}
          >
            <div className="flex items-center gap-4 mb-2">
              <Palette size={24} style={{ color: accentColor }} />
              <h3 className="text-xl font-semibold" style={{ color: textColor }}>
                Customizable Experience
              </h3>
            </div>
            <p style={{ color: secondaryTextColor }}>
              Switch between light and dark themes to match your preference. Beautiful peacock-themed color scheme.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="px-8 py-20 text-center animate-[fadeIn_0.8s_ease-in_2.6s_forwards] opacity-0">
          <h2 className="text-3xl font-bold mb-6" style={{ color: textColor }}>Ready to Get Started?</h2>
          <p className="text-xl mb-8" style={{ color: secondaryTextColor }}>
            Join Schedules today and take control of your work schedule
          </p>
          <Link 
            href="/login?mode=register"
            className="button-hover-effect inline-block px-10 py-4 rounded-2xl sm:rounded-4xl font-semibold text-white text-lg hover:shadow-[0_0_40px_rgba(179,136,255,0.7)]"
            style={{ backgroundColor: accentColor }}
          >
            Create Your Account
          </Link>
        </section>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideRight {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes breatheGlow {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes buttonHover {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-8px);
          }
        }

        .button-hover-effect {
          animation: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .button-hover-effect:hover {
          animation: buttonHover 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </main>
  );
}
