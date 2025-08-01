'use client';

import React, { useState, useEffect } from 'react';
import { Shift } from '@/types/shift';

interface CalendarViewProps {
  shifts: Shift[];
  onDeleteShift?: (shiftId: string) => void;
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

export default function CalendarView({ shifts, onDeleteShift }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [modalContent, setModalContent] = useState<React.ReactElement | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);

  // Get today's date in local timezone
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Generate calendar days
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
      const dateStr = currentDay.toISOString().split('T')[0];
      const dayShifts = shifts.filter(shift => shift.date === dateStr);
      
      days.push({
        date: dateStr,
        isCurrentMonth: currentDay.getMonth() === month,
        shifts: dayShifts,
        isToday: dateStr === todayString,
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        if (direction === 'prev') {
          newDate.setMonth(newDate.getMonth() - 1);
        } else {
          newDate.setMonth(newDate.getMonth() + 1);
        }
        return newDate;
      });
      setIsTransitioning(false);
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
                  <div className="font-bold text-gray-800 text-base">
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
        coworkerList = <p className="text-gray-600 mt-2">{coworkers}</p>;
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
            <div className="text-sm font-medium text-gray-700 mb-1">Working with you:</div>
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
        {/* Delete Button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setModalContent(null);
              setShiftToDelete(shift);
            }}
            className="w-full px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-4xl transition-colors"
            style={{ backgroundColor: '#FDE2E2', 
                  borderColor: '#F5A5A5'}}
          >
            Delete Shift
          </button>
        </div>
      </div>
    );
  };

  const confirmDelete = () => {
    if (shiftToDelete && onDeleteShift && shiftToDelete.id) {
      onDeleteShift(shiftToDelete.id);
    }
    setShiftToDelete(null);
  };

  const cancelDelete = () => {
    setShiftToDelete(null);
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
    <div className="p-2 sm:p-3 md:p-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-3 sm:mb-4 md:mb-6 gap-2 sm:gap-4">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex space-x-1 sm:space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all border border-gray-300"
            style={{ 
              backgroundColor: 'transparent', 
              borderColor: 'transparent' 
            }}
          >
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-all border border-gray-300"
            style={{ 
              backgroundColor: 'transparent', 
              borderColor: 'transparent' 
            }}
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all border border-gray-300"
            style={{ 
              backgroundColor: 'transparent', 
              borderColor: 'transparent' 
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`grid grid-cols-7 gap-px bg-gray-200 transition-opacity duration-200 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500 bg-white">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.slice(0, 1)}</span>
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`min-h-16 sm:min-h-20 md:min-h-28 lg:min-h-32 p-1 sm:p-2 cursor-pointer hover:bg-gray-50 bg-white relative ${
              !day.isCurrentMonth ? 'bg-gray-100 text-gray-400' : ''
            }`}
            onClick={() => setSelectedDay(day)}
          >
            <div className={`text-xs sm:text-sm font-medium ${
              day.isToday 
                ? 'text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center mx-auto text-xs' 
                : 'text-gray-800'
            }`}
            style={day.isToday ? { backgroundColor: '#C8A5FF' } : {}}
            >
              {new Date(day.date + 'T00:00:00').getDate()}
            </div>
            
            {/* Shift indicators */}
            {day.shifts.map((shift, shiftIndex) => (
              <div
                key={shiftIndex}
                className="mt-0.5 sm:mt-1 p-0.5 sm:p-1 text-gray-700 text-xs rounded-lg truncate flex items-center justify-between"
                style={{ backgroundColor: '#E7D8FF', border: '1px solid #C8A5FF' }}
                title={`${shift.startTime} - ${shift.endTime}${shift.uploaded ? ' (Synced to Google Calendar)' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleShiftClick(shift);
                }}
              >
                <span className="hidden sm:inline text-xs">{shift.startTime} - {shift.endTime}</span>
                <span className="sm:hidden text-xs">●</span>
                {shift.uploaded && (
                  <span className="text-green-600 text-xs ml-1" title="Synced to Google Calendar">✓</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Selected Day Details Modal */}
      {selectedDay && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-6 sm:p-4" 
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedDay(null)}
        >
          <div 
            className="bg-white rounded-4xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md max-h-80 sm:max-h-96 overflow-y-auto shadow-xl border mx-4" 
            style={{ borderColor: '#C8A5FF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                style={{ 
                  backgroundColor: 'transparent', 
                  borderColor: 'transparent' 
                }}
              >
                ✕
              </button>
            </div>

            {selectedDay.shifts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No shifts scheduled</p>
            ) : (
              <div className="space-y-3">
                {selectedDay.shifts.map((shift, index) => (
                  <div key={index} className="border border-gray-200 rounded-4xl p-3 sm:p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-base sm:text-lg font-medium text-gray-800">
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </div>
                    
                    {shift.coworkers && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-700">Working with you: </span>
                        <div className="text-sm text-gray-600">
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
                                          <div className="font-bold text-gray-800 text-base">
                                            {coworker.name?.split(' ')[0] || coworker.name}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {coworker.overlapStart} - {coworker.overlapEnd}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  );
                                } else {
                                  return <span className="text-gray-500">No overlapping shifts</span>;
                                }
                              }
                            } catch {
                              // Fallback to simple comma-separated string
                              return <span className="text-gray-600">{shift.coworkers}</span>;
                            }
                            // Fallback to simple comma-separated string
                            return <span className="text-gray-600">{shift.coworkers}</span>;
                          })()}
                        </div>
                      </div>
                    )}
                    
                    {shift.notes && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Notes: </span>
                        <span className="text-sm text-gray-600">{shift.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for Shift Details */}
      {modalContent && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-6 sm:p-4" 
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={() => setModalContent(null)}
        >
          <div 
            className="bg-white rounded-4xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md shadow-xl border mx-4" 
            style={{ borderColor: '#C8A5FF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Shift Details</h3>
              <button
                onClick={() => setModalContent(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                style={{ 
                  backgroundColor: 'transparent', 
                  borderColor: 'transparent' 
                }}
              >
                ✕
              </button>
            </div>

            {modalContent}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {shiftToDelete && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-6 sm:p-4" 
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={cancelDelete}
        >
          <div 
            className="bg-white rounded-4xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md shadow-xl border mx-4" 
            style={{ borderColor: '#C8A5FF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Delete Shift</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this shift?
                <br />
                <span className="font-medium">
                  {shiftToDelete.startTime} - {shiftToDelete.endTime}
                </span>
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-4xl border border-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-4xl transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
