'use client';

import { useState, useEffect } from 'react';
import { Shift } from '@/types/shift';

interface CalendarViewProps {
  shifts: Shift[];
}

interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  shifts: Shift[];
  isToday: boolean;
}

export default function CalendarView({ shifts }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const today = new Date().toISOString().split('T')[0];

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
        isToday: dateStr === today,
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatTime = (time: string) => {
    // If time already contains AM/PM, return as is
    if (/AM|PM/i.test(time)) {
      return time;
    }
    
    // Otherwise, assume it's 24-hour format and convert
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`min-h-24 p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
              !day.isCurrentMonth ? 'bg-gray-100 text-gray-400' : ''
            } ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}`}
            onClick={() => setSelectedDay(day)}
          >
            <div className={`text-sm font-medium ${day.isToday ? 'text-blue-600' : ''}`}>
              {new Date(day.date + 'T00:00:00').getDate()}
            </div>
            
            {/* Shift indicators */}
            {day.shifts.map((shift, shiftIndex) => (
              <div
                key={shiftIndex}
                className="mt-1 p-1 bg-blue-100 text-blue-800 text-xs rounded truncate"
                title={`${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`}
              >
                {formatTime(shift.startTime)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Selected Day Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {selectedDay.shifts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No shifts scheduled</p>
            ) : (
              <div className="space-y-3">
                {selectedDay.shifts.map((shift, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-lg font-medium text-gray-900">
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </div>
                    </div>
                    
                    {shift.coworkers && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-700">Coworkers: </span>
                        <div className="text-sm text-gray-600">
                          {(() => {
                            try {
                              // Try to parse as JSON for structured coworker info
                              const coworkerDetails = JSON.parse(shift.coworkers);
                              if (Array.isArray(coworkerDetails) && coworkerDetails.length > 0) {
                                return (
                                  <div className="space-y-1 mt-1">
                                    {coworkerDetails.map((coworker: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded text-xs">
                                        <span className="font-medium">{coworker.name}</span>
                                        <span className="text-gray-500">
                                          {formatTime(coworker.startTime)} - {formatTime(coworker.endTime)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                            } catch {
                              // Fallback to simple comma-separated string
                              return <span>{shift.coworkers}</span>;
                            }
                            // Fallback to simple comma-separated string
                            return <span>{shift.coworkers}</span>;
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
    </div>
  );
}
