'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Shift } from '@/types/shift';
import gsap from 'gsap';
import { useTheme } from '@/contexts/ThemeContext';

// Configure GSAP for 120fps (high refresh rate displays)
gsap.ticker.fps(120);

interface CalendarViewProps {
  shifts: Shift[];
  onDeleteShift?: (shiftId: string) => void;
  onUpdateShift?: (shiftId: string, updatedShift: Shift) => void;
}

interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  shifts: Shift[];
  isToday: boolean;
}

interface CoworkerData {
  name: string;
  startTime: string;
  endTime: string;
  overlapStart?: string;
  overlapEnd?: string;
}

export default function CalendarView({ shifts, onDeleteShift, onUpdateShift }: CalendarViewProps) {
  const { theme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [modalContent, setModalContent] = useState<React.ReactElement | null>(null);
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);
  const [shiftToEdit, setShiftToEdit] = useState<Shift | null>(null);
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);
  // Mobile-first: default to week view on mobile, month on desktop
  const [viewMode, setViewMode] = useState<'month' | 'week'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640 ? 'week' : 'month';
    }
    return 'month';
  });
  const modalRef = useRef<HTMLDivElement>(null);
  const dayModalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when any modal is open and restore on close
  useEffect(() => {
    const anyOpen = !!modalContent || !!shiftToDelete || !!shiftToEdit || !!selectedDay;
    if (typeof document !== 'undefined') {
      if (anyOpen) {
        // Get scrollbar width before hiding it
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      } else {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };
  }, [modalContent, shiftToDelete, shiftToEdit, selectedDay]);

  // Get today's date in local timezone (not UTC)
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // Helper function to format date to local YYYY-MM-DD string
  const formatLocalDate = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Generate calendar days for month view
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the beginning of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End at the end of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: CalendarDay[] = [];
    const currentDay = new Date(startDate);
    
    while (currentDay <= endDate) {
      const dateStr = formatLocalDate(currentDay);
      const dayShifts = shifts.filter(shift => shift.date === dateStr);
      const dayMonth = currentDay.getMonth();
      
      days.push({
        date: dateStr,
        // Mark as current month ONLY if the day is in the current month
        isCurrentMonth: dayMonth === month,
        shifts: dayShifts,
        isToday: dateStr === todayString,
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  // Generate week days for week view
  const generateWeekDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = formatLocalDate(date);
      const dayShifts = shifts.filter(shift => shift.date === dateStr);
      
      days.push({
        date: dateStr,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        shifts: dayShifts,
        isToday: dateStr === todayString,
      });
    }
    
    return days;
  };

  const calendarDays = viewMode === 'week' ? generateWeekDays() : generateCalendarDays();
  const calendarGridRef = useRef<HTMLDivElement>(null);

  // Animate calendar days on mount and month change (optimized for 120fps)
  useEffect(() => {
    if (calendarGridRef.current) {
      const days = calendarGridRef.current.querySelectorAll('.calendar-day');
      
      // Kill any existing animations first
      gsap.killTweensOf(days);
      
      // Set immediate state to prevent stretching
      gsap.set(days, { opacity: 0, y: 0, scale: 1 });
      
      gsap.to(
        days,
        {
          opacity: 1,
          duration: 0.3,
          stagger: 0.01,
          ease: 'power1.out',
          force3D: true, // GPU acceleration
          clearProps: 'transform,opacity' // Only clear animation props, keep border colors
        }
      );
    }
  }, [currentDate, viewMode]); // Only animate on month/view change, not shifts

  const navigateMonth = (direction: 'prev' | 'next') => {
    setTimeout(() => {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        if (viewMode === 'week') {
          // For week view, navigate by 7 days
          if (direction === 'prev') {
            newDate.setDate(newDate.getDate() - 7);
          } else {
            newDate.setDate(newDate.getDate() + 7);
          }
        } else {
          // For month view, navigate by month
          if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
          } else {
            newDate.setMonth(newDate.getMonth() + 1);
          }
        }
        return newDate;
      });
    }, 100);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper function to convert time string to minutes for comparison
  const timeToMinutes = (timeStr: string): number => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return 0;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    if (period === 'AM' && hours === 12) hours = 0;
    else if (period === 'PM' && hours !== 12) hours += 12;
    
    return hours * 60 + minutes;
  };

  // Helper function to convert minutes back to time string
  const minutesToTime = (minutes: number): string => {
    const hours24 = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    return `${hours12}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  // Helper function to calculate overlap between two time ranges
  const calculateOverlap = (userStart: string, userEnd: string, coworkerStart: string, coworkerEnd: string) => {
    const userStartMin = timeToMinutes(userStart);
    const userEndMin = timeToMinutes(userEnd);
    const coworkerStartMin = timeToMinutes(coworkerStart);
    const coworkerEndMin = timeToMinutes(coworkerEnd);

    const overlapStart = Math.max(userStartMin, coworkerStartMin);
    const overlapEnd = Math.min(userEndMin, coworkerEndMin);

    if (overlapStart >= overlapEnd) return null; // No overlap

    return {
      start: minutesToTime(overlapStart),
      end: minutesToTime(overlapEnd)
    };
  };

  const renderShift = (shift: Shift) => {
    const { startTime, endTime, coworkers } = shift;
    const formattedTime = `${startTime} - ${endTime}`;
    
    let coworkerList = null;
    try {
      const coworkerDetails = JSON.parse(coworkers || '[]');
      if (Array.isArray(coworkerDetails) && coworkerDetails.length > 0) {
        const overlappingCoworkers = coworkerDetails
          .map((coworker: CoworkerData) => {
            const overlap = calculateOverlap(startTime, endTime, coworker.startTime, coworker.endTime);
            return overlap ? {
              ...coworker,
              overlapStart: overlap.start,
              overlapEnd: overlap.end
            } : null;
          })
          .filter((coworker): coworker is CoworkerData & { overlapStart: string; overlapEnd: string } => 
            coworker !== null
          );

        if (overlappingCoworkers.length > 0) {
          coworkerList = (
            <ul className="space-y-2 mt-3">
              {overlappingCoworkers.map((coworker, idx: number) => (
                <li key={idx} className="border-l-4 pl-3" style={{ borderColor: '#E7D8FF' }}>
                  <div className="font-bold text-base text-gray-800">
                    {coworker.name?.split(' ')[0] || coworker.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {coworker.overlapStart} - {coworker.overlapEnd}
                  </div>
                </li>
              ))}
            </ul>
          );
        }
      }
    } catch {
      // Fallback for non-JSON coworkers
      if (coworkers) {
        coworkerList = <p className="mt-2 text-gray-600">{coworkers}</p>;
      }
    }

    return (
      <div className="calendar-shift">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-medium text-gray-800">{formattedTime}</div>
          {shift.uploaded && (
            <div className="flex items-center text-green-600 text-sm">
              <span className="mr-1">✓</span>
              <span>Synced</span>
            </div>
          )}
        </div>
        {shift.notes && (
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-700">Notes: </span>
            <span className="text-sm text-gray-600">{shift.notes}</span>
          </div>
        )}
        {coworkerList && (
          <div>
            <div className="text-sm font-medium mb-1 text-gray-700">Working with you:</div>
            {coworkerList}
          </div>
        )}
      </div>
    );
  };

  const handleShiftClick = (shift: Shift) => {
    setModalContent(
      <div className="modal">
        {renderShift(shift)}
        {/* Edit and Delete Buttons */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: theme === 'dark' ? '#555' : '#E5E7EB' }}>
          <div className="flex gap-2">
            <button
              onClick={() => {
                closeModalWithAnimation(() => {
                  setModalContent(null);
                  setShiftToEdit(shift);
                });
              }}
              className={`flex-1 px-4 py-2 rounded-xl sm:rounded-4xl transition-colors ${
                theme === 'dark' ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-white bg-blue-500 hover:bg-blue-600'
              }`}
            >
              Edit Shift
            </button>
            <button
              onClick={() => {
                closeModalWithAnimation(() => {
                  setModalContent(null);
                  setShiftToDelete(shift);
                });
              }}
              className="flex-1 px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-xl sm:rounded-4xl transition-colors"
            >
              Delete Shift
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to close modals with animation
  const closeModalWithAnimation = (callback?: () => void) => {
    const target = modalRef.current || dayModalRef.current || deleteModalRef.current;
    if (target) {
      gsap.to(target, {
        opacity: 0,
        scale: 0.8,
        y: 20,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          if (callback) callback();
          else {
            setModalContent(null);
            setSelectedDay(null);
            setShiftToDelete(null);
          }
        }
      });
    } else {
      if (callback) callback();
      else {
        setModalContent(null);
        setSelectedDay(null);
        setShiftToDelete(null);
      }
    }
  };

  // Animate modal entrance (optimized for 120fps)
  useEffect(() => {
    if (modalContent && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.8, y: 20 },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 0.25, 
          ease: 'back.out(1.7)',
          force3D: true // GPU acceleration
        }
      );
    }
  }, [modalContent]);

  // Animate day modal entrance (optimized for 120fps)
  useEffect(() => {
    if (selectedDay && dayModalRef.current) {
      gsap.fromTo(
        dayModalRef.current,
        { opacity: 0, scale: 0.8, y: 20 },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 0.25, 
          ease: 'back.out(1.7)',
          force3D: true // GPU acceleration
        }
      );
    }
  }, [selectedDay]);

  // Animate delete modal entrance (optimized for 120fps)
  useEffect(() => {
    if (shiftToDelete && deleteModalRef.current) {
      gsap.fromTo(
        deleteModalRef.current,
        { opacity: 0, scale: 0.8 },
        { 
          opacity: 1, 
          scale: 1, 
          duration: 0.25, 
          ease: 'back.out(1.7)',
          force3D: true // GPU acceleration
        }
      );
    }
  }, [shiftToDelete]);

  // Animate edit modal entrance (optimized for 120fps)
  useEffect(() => {
    if (shiftToEdit && editModalRef.current) {
      gsap.fromTo(
        editModalRef.current,
        { opacity: 0, scale: 0.8 },
        { 
          opacity: 1, 
          scale: 1, 
          duration: 0.25, 
          ease: 'back.out(1.7)',
          force3D: true // GPU acceleration
        }
      );
    }
  }, [shiftToEdit]);

  const confirmDelete = () => {
    if (shiftToDelete && onDeleteShift && shiftToDelete.id) {
      onDeleteShift(shiftToDelete.id);
    }
    setShiftToDelete(null);
  };

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, shift: Shift) => {
    e.stopPropagation();
    setDraggedShift(shift);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedShift || !draggedShift.id) return;
    
    // Don't do anything if dropped on same date
    if (draggedShift.date === targetDate) {
      setDraggedShift(null);
      return;
    }
    
    const originalDate = draggedShift.date;
    const updatedShift = { ...draggedShift, date: targetDate };
    
    // Optimistically update UI immediately
    if (onUpdateShift) {
      onUpdateShift(draggedShift.id, updatedShift);
    }
    
    setDraggedShift(null);
    
    try {
      // Update shift date in database in the background
      const response = await fetch(`/api/shifts/${draggedShift.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draggedShift,
          date: targetDate,
        }),
      });
      
      if (!response.ok) {
        // If API call fails, revert the change
        console.error('Failed to move shift, reverting...');
        if (onUpdateShift) {
          onUpdateShift(draggedShift.id, { ...updatedShift, date: originalDate });
        }
      }
    } catch (error) {
      console.error('Error moving shift:', error);
      // Revert on error
      if (onUpdateShift) {
        onUpdateShift(draggedShift.id, { ...updatedShift, date: originalDate });
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedShift(null);
  };

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touchStartX = e.touches[0].clientX;
      const handleTouchEnd = (e: TouchEvent) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchDiff = touchStartX - touchEndX;

        if (touchDiff > 50) {
          navigateMonth('next'); // Swipe left to go to next month
        } else if (touchDiff < -50) {
          navigateMonth('prev'); // Swipe right to go to previous month
        }

        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold" style={{ color: theme === 'dark' ? '#FFFFFF' : '#1F2937' }}>
          <span style={{ color: theme === 'dark' ? '#FFFFFF' : '#1F2937' }}>
            {viewMode === 'week' ? (() => {
              // Get the Sunday of the current week
              const sunday = new Date(currentDate);
              sunday.setDate(currentDate.getDate() - currentDate.getDay());
              return `Week of ${monthNames[sunday.getMonth()]} ${sunday.getDate()}, ${sunday.getFullYear()}`;
            })() : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          </span>
        </h2>
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-xl sm:rounded-4xl border overflow-hidden" style={{ borderColor: theme === 'dark' ? '#555' : '#C8A5FF' }}>
            <button
              onClick={() => setViewMode('month')}
              className="px-3 py-1.5 text-xs sm:text-sm transition-all hover:bg-opacity-80"
              style={{ 
                backgroundColor: viewMode === 'month' 
                  ? '#E7D8FF' 
                  : (theme === 'dark' ? '#2A2A2A' : 'white'),
                borderColor: 'transparent',
                color: viewMode === 'month'
                  ? '#000000'
                  : (theme === 'dark' ? 'white' : '#4B5563')
              }}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className="px-3 py-1.5 text-xs sm:text-sm transition-all hover:bg-opacity-80"
              style={{ 
                backgroundColor: viewMode === 'week' 
                  ? '#E7D8FF' 
                  : (theme === 'dark' ? '#2A2A2A' : 'white'),
                borderColor: 'transparent',
                color: viewMode === 'week'
                  ? '#000000'
                  : (theme === 'dark' ? 'white' : '#4B5563')
              }}
            >
              Week
            </button>
          </div>
          
          <div className="flex space-x-1 sm:space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1.5 sm:p-2 rounded-lg transition-all"
            style={{ 
              backgroundColor: 'transparent', 
              borderColor: 'transparent',
              color: theme === 'dark' ? 'white' : '#4B5563'
            }}
          >
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-all"
            style={{ 
              backgroundColor: 'transparent', 
              borderColor: 'transparent',
              color: theme === 'dark' ? 'white' : '#4B5563'
            }}
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1.5 sm:p-2 rounded-lg transition-all"
            style={{ 
              backgroundColor: 'transparent', 
              borderColor: 'transparent',
              color: theme === 'dark' ? 'white' : '#4B5563'
            }}
          >
            →
          </button>
        </div>
        </div>
      </div>

      {/* Calendar Grid - Grid-like with inner borders only */}
      <div ref={calendarGridRef} className={`grid grid-cols-7 overflow-hidden rounded-2xl sm:rounded-4xl`}>
        {/* Day headers */}
        {dayNames.map((day, idx) => (
          <div 
            key={day} 
            className={`p-2 sm:p-3 text-center text-sm sm:text-base font-semibold ${idx < 6 ? 'border-r' : ''} border-b`}
            style={{ 
              backgroundColor: theme === 'dark' ? '#1A1A1A' : '#FCF5ED', 
              borderColor: theme === 'dark' ? '#555' : '#C8A5FF',
              color: theme === 'dark' ? 'white' : '#374151'
            }}
          >
            <span className="hidden sm:inline" style={{ color: theme === 'dark' ? 'white' : '#374151' }}>{day}</span>
            <span className="sm:hidden" style={{ color: theme === 'dark' ? 'white' : '#374151' }}>{day.slice(0, 1)}</span>
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const isRightEdge = (index + 1) % 7 === 0;
          const isBottomEdge = index >= calendarDays.length - 7;
          
          return (
            <div
              key={index}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day.date)}
              className={`calendar-day ${viewMode === 'week' ? 'h-48 sm:h-56 md:h-64 lg:h-72' : 'h-24 sm:h-28 md:h-36 lg:h-40'} p-2 sm:p-3 cursor-pointer relative transition-colors duration-150 ${
                !isRightEdge ? 'border-r' : ''
              } ${!isBottomEdge ? 'border-b' : ''} ${
                !day.isCurrentMonth ? 'opacity-30' : ''
              } ${
                theme === 'dark' 
                  ? 'bg-[#3A3A3A] hover:bg-[#4A4A4A]' 
                  : 'bg-white hover:bg-gray-50'
              }`}
              style={{ borderColor: theme === 'dark' ? '#555' : '#C8A5FF', willChange: 'background-color' }}
              onClick={() => setSelectedDay(day)}
            >
              <div className={`text-sm sm:text-base md:text-lg font-semibold mb-2 ${
                day.isToday 
                  ? 'text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 flex items-center justify-center' 
                  : theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}
              style={day.isToday ? { backgroundColor: '#C8A5FF' } : {}}
              >
                {new Date(day.date + 'T00:00:00').getDate()}
              </div>
              
              {/* Shift indicators */}
              <div className="space-y-1">
                {day.shifts.map((shift, shiftIndex) => (
                  <div
                    key={shiftIndex}
                    draggable
                    onDragStart={(e) => handleDragStart(e, shift)}
                    onDragEnd={handleDragEnd}
                    className={`shift-calendar-item cursor-pointer transition-all hover:scale-105 rounded-lg ${
                      shift.uploaded ? 'shadow-md' : 'shadow-sm'
                    } ${draggedShift?.id === shift.id ? 'opacity-50' : ''}`}
                    style={{ 
                      backgroundColor: shift.uploaded ? '#E7F5E7' : '#F0E7FF',
                      borderLeft: `3px solid ${shift.uploaded ? '#4CAF50' : '#C8A5FF'}`
                    }}
                    title={`${shift.startTime} - ${shift.endTime}${shift.uploaded ? ' (Synced to Google Calendar)' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShiftClick(shift);
                    }}
                  >
                    {/* Mobile: Simple indicator */}
                    <div className="sm:hidden p-1.5 flex items-center justify-between">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: shift.uploaded ? '#4CAF50' : '#C8A5FF' }}></div>
                      {shift.uploaded && (
                        <span className="text-green-600 text-xs font-bold">✓</span>
                      )}
                    </div>
                    
                    {/* Desktop: Full times */}
                    <div className="hidden sm:block p-2">
                      <div className="flex items-center justify-between gap-0.5">
                        <span className={`font-medium text-xs sm:text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{shift.startTime}</span>
                        {shift.uploaded && (
                          <span className="text-green-600 text-xs font-bold">✓</span>
                        )}
                      </div>
                      <span className={`text-xs block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>- {shift.endTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Details Modal */}
      {selectedDay && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center" 
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => closeModalWithAnimation()}
        >
          <div 
            ref={dayModalRef}
            className="rounded-2xl sm:rounded-4xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md max-h-80 sm:max-h-96 overflow-y-auto shadow-2xl border mx-4" 
            style={{ 
              backgroundColor: theme === 'dark' ? '#2F2F2F' : 'white',
              borderColor: theme === 'dark' ? '#444' : '#C8A5FF'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>
                {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <button
                onClick={() => closeModalWithAnimation()}
                className="p-1 rounded-full hover:bg-gray-700"
                style={{ 
                  backgroundColor: 'transparent', 
                  borderColor: 'transparent',
                  color: theme === 'dark' ? 'white' : '#6B7280'
                }}
              >
                ✕
              </button>
            </div>

            {selectedDay.shifts.length === 0 ? (
              <p className="text-center py-4" style={{ color: theme === 'dark' ? 'white' : '#6B7280' }}>No shifts scheduled</p>
            ) : (
              <div className="space-y-3">
                {selectedDay.shifts.map((shift, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-xl sm:rounded-4xl p-3 sm:p-4 ${shift.uploaded ? 'shadow-sm' : ''}`}
                    style={{ 
                      borderColor: theme === 'dark' ? '#555' : '#C8A5FF',
                      backgroundColor: shift.uploaded 
                        ? (theme === 'dark' ? '#3A3A3A' : '#F8F4FF')
                        : (theme === 'dark' ? '#2A2A2A' : 'white')
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-base sm:text-lg font-medium flex items-center gap-2" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>
                        {shift.startTime} - {shift.endTime}
                        {shift.uploaded && (
                          <span className="text-green-600 text-sm font-bold" title="Synced to Google Calendar">✓ Synced</span>
                        )}
                      </div>
                    </div>
                    
                    {shift.coworkers && (
                      <div className="mb-2">
                        <span className="text-sm font-medium" style={{ color: theme === 'dark' ? 'white' : '#374151' }}>Working with you: </span>
                        <div className="text-sm" style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}>
                          {(() => {
                            try {
                              // Try to parse as JSON for structured coworker info
                              const coworkerDetails = JSON.parse(shift.coworkers);
                              if (Array.isArray(coworkerDetails) && coworkerDetails.length > 0) {
                                const overlappingCoworkers = coworkerDetails
                                  .map((coworker: CoworkerData) => {
                                    const overlap = calculateOverlap(shift.startTime, shift.endTime, coworker.startTime, coworker.endTime);
                                    return overlap ? {
                                      ...coworker,
                                      overlapStart: overlap.start,
                                      overlapEnd: overlap.end
                                    } : null;
                                  })
                                  .filter((coworker): coworker is CoworkerData & { overlapStart: string; overlapEnd: string } => 
                                    coworker !== null
                                  );

                                if (overlappingCoworkers.length > 0) {
                                  return (
                                    <ul className="space-y-2 mt-2">
                                      {overlappingCoworkers.map((coworker, idx: number) => (
                                        <li key={idx} className="border-l-4 pl-3" style={{ borderColor: '#E7D8FF' }}>
                                          <div className="font-bold text-base" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>
                                            {coworker.name?.split(' ')[0] || coworker.name}
                                          </div>
                                          <div className="text-sm" style={{ color: theme === 'dark' ? 'white' : '#6B7280' }}>
                                            {coworker.overlapStart} - {coworker.overlapEnd}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  );
                                } else {
                                  return <span style={{ color: theme === 'dark' ? 'white' : '#6B7280' }}>No overlapping shifts</span>;
                                }
                              }
                            } catch {
                              // Fallback to simple comma-separated string
                              return <span style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}>{shift.coworkers}</span>;
                            }
                            // Fallback to simple comma-separated string
                            return <span style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}>{shift.coworkers}</span>;
                          })()}
                        </div>
                      </div>
                    )}
                    
                    {shift.notes && (
                      <div>
                        <span className="text-sm font-medium" style={{ color: theme === 'dark' ? 'white' : '#374151' }}>Notes: </span>
                        <span className="text-sm" style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}>{shift.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Modal for Shift Details */}
      {modalContent && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center" 
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => closeModalWithAnimation()}
        >
          <div 
            ref={modalRef}
            className="rounded-2xl sm:rounded-4xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md shadow-2xl border mx-4" 
            style={{ 
              backgroundColor: theme === 'dark' ? '#2F2F2F' : 'white',
              borderColor: theme === 'dark' ? '#444' : '#C8A5FF'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>Shift Details</h3>
              <button
                onClick={() => closeModalWithAnimation()}
                className="p-1 rounded-full hover:bg-gray-700"
                style={{ 
                  backgroundColor: 'transparent', 
                  borderColor: 'transparent',
                  color: theme === 'dark' ? 'white' : '#6B7280'
                }}
              >
                ✕
              </button>
            </div>

            {modalContent}
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {shiftToDelete && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center" 
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => closeModalWithAnimation(() => setShiftToDelete(null))}
        >
          <div 
            ref={deleteModalRef}
            className="rounded-2xl sm:rounded-4xl p-4 sm:p-6 w-full max-w-xs sm:max-w-sm shadow-2xl border mx-4" 
            style={{ 
              backgroundColor: theme === 'dark' ? '#2F2F2F' : 'white',
              borderColor: theme === 'dark' ? '#444' : '#C8A5FF'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className={`text-lg font-semibold mb-4`} style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>Delete Shift</h3>
              <p className="mb-6" style={{ color: theme === 'dark' ? 'white' : '#4B5563' }}>
                Are you sure you want to delete this shift?
                <br />
                <span className="font-medium" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>
                  {shiftToDelete.startTime} - {shiftToDelete.endTime}
                </span>
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => closeModalWithAnimation(() => setShiftToDelete(null))}
                  className={`flex-1 px-4 py-2 rounded-xl sm:rounded-4xl border transition-colors ${
                    theme === 'dark' 
                      ? 'text-white bg-gray-700 hover:bg-gray-600 border-gray-600' 
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-xl sm:rounded-4xl transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Shift Modal */}
      {shiftToEdit && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center" 
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => closeModalWithAnimation(() => setShiftToEdit(null))}
        >
          <div 
            ref={editModalRef}
            className="rounded-2xl sm:rounded-4xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md shadow-2xl border mx-4" 
            style={{ 
              backgroundColor: theme === 'dark' ? '#2F2F2F' : 'white',
              borderColor: theme === 'dark' ? '#444' : '#C8A5FF'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>Edit Shift</h3>
              <button
                onClick={() => closeModalWithAnimation(() => setShiftToEdit(null))}
                className="p-1 rounded-full hover:bg-gray-700"
                style={{ 
                  backgroundColor: 'transparent', 
                  borderColor: 'transparent',
                  color: theme === 'dark' ? 'white' : '#6B7280'
                }}
              >
                ✕
              </button>
            </div>
            <EditShiftForm 
              shift={shiftToEdit}
              onClose={() => setShiftToEdit(null)}
              theme={theme}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Edit Shift Form Component
function EditShiftForm({ shift, onClose, theme }: { shift: Shift; onClose: () => void; theme: 'light' | 'dark' }) {
  const [formData, setFormData] = useState({
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    coworkers: shift.coworkers || '',
    notes: shift.notes || '',
  });
  const [newCoworkers, setNewCoworkers] = useState(''); // New field for appending only
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to convert 12-hour time to 24-hour for input
  const convertTo24Hour = (time12: string): string => {
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return '';
    
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    
    if (period === 'AM' && hours === 12) hours = 0;
    else if (period === 'PM' && hours !== 12) hours += 12;
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Helper to convert 24-hour time to 12-hour for display
  const convertTo12Hour = (time24: string): string => {
    if (!time24) return '';
    
    // If already in 12-hour format (contains AM/PM), return as is
    if (time24.includes('AM') || time24.includes('PM')) {
      return time24;
    }
    
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const timeLabel = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
        const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push({ label: timeLabel, value: timeValue });
      }
    }
    return times;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Append new coworkers to existing ones
      let updatedCoworkers = formData.coworkers;
      if (newCoworkers.trim()) {
        const existingNames = formData.coworkers ? formData.coworkers.split(',').map(n => n.trim()).filter(n => n) : [];
        const newNames = newCoworkers.split(',').map(n => n.trim()).filter(n => n);
        const allNames = [...existingNames, ...newNames];
        updatedCoworkers = allNames.join(', ');
      }

      const response = await fetch(`/api/shifts/${shift.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          startTime: convertTo12Hour(formData.startTime),
          endTime: convertTo12Hour(formData.endTime),
          coworkers: updatedCoworkers,
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        window.location.reload(); // Refresh to show updated shift
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update shift');
      }
    } catch (error) {
      console.error('Error updating shift:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
          Date
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-xl sm:rounded-4xl focus:outline-none focus:ring-2 focus:ring-purple-200 ${
            theme === 'dark' ? 'text-white bg-gray-700' : 'text-gray-800 bg-white'
          }`}
          style={{ borderColor: theme === 'dark' ? '#555' : '#C8A5FF' }}
          required
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
          Start Time
        </label>
        <select
          value={convertTo24Hour(shift.startTime) || formData.startTime}
          onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-xl sm:rounded-4xl focus:outline-none focus:ring-2 focus:ring-purple-200 ${
            theme === 'dark' ? 'text-white bg-gray-700' : 'text-gray-800 bg-white'
          }`}
          style={{ borderColor: theme === 'dark' ? '#555' : '#C8A5FF' }}
          required
        >
          {generateTimeOptions().map((time) => (
            <option key={time.value} value={time.value}>
              {time.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
          End Time
        </label>
        <select
          value={convertTo24Hour(shift.endTime) || formData.endTime}
          onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-xl sm:rounded-4xl focus:outline-none focus:ring-2 focus:ring-purple-200 ${
            theme === 'dark' ? 'text-white bg-gray-700' : 'text-gray-800 bg-white'
          }`}
          style={{ borderColor: theme === 'dark' ? '#555' : '#C8A5FF' }}
          required
        >
          {generateTimeOptions().map((time) => (
            <option key={time.value} value={time.value}>
              {time.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
          Add Coworkers (optional)
        </label>
        <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Enter names to add, separated by commas (e.g., John, Jane, Mike)
        </div>
        <input
          type="text"
          value={newCoworkers}
          onChange={(e) => setNewCoworkers(e.target.value)}
          placeholder="Add new coworkers..."
          className={`w-full px-3 py-2 border rounded-xl sm:rounded-4xl focus:outline-none focus:ring-2 focus:ring-purple-200 ${
            theme === 'dark' ? 'text-white bg-gray-700' : 'text-gray-800 bg-white'
          }`}
          style={{ borderColor: theme === 'dark' ? '#555' : '#C8A5FF' }}
        />
        {formData.coworkers && (
          <div className="mt-2">
            <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Current coworkers: {formData.coworkers.split(',').filter(n => n.trim()).length} person(s)
            </div>
          </div>
        )}
        {newCoworkers && (
          <div className="mt-2">
            <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Adding:
            </div>
            <div className="flex flex-wrap gap-1">
              {newCoworkers.split(',').filter(name => name.trim()).map((name, idx) => (
                <span 
                  key={idx}
                  className={`px-2 py-1 rounded-lg text-xs ${
                    theme === 'dark' 
                      ? 'bg-green-900 text-green-200' 
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {name.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
          Notes (optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any additional notes..."
          className={`w-full px-3 py-2 border rounded-xl sm:rounded-4xl focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none ${
            theme === 'dark' ? 'text-white bg-gray-700' : 'text-gray-800 bg-white'
          }`}
          style={{ borderColor: theme === 'dark' ? '#555' : '#C8A5FF' }}
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className={`flex-1 px-4 py-2 rounded-xl sm:rounded-4xl border transition-colors ${
            theme === 'dark' 
              ? 'text-white bg-gray-700 hover:bg-gray-600 border-gray-600' 
              : 'text-gray-600 bg-gray-100 hover:bg-gray-200 border-gray-300'
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 px-4 py-2 text-white rounded-xl sm:rounded-4xl transition-colors ${
            loading ? 'opacity-50 cursor-not-allowed bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
