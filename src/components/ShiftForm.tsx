'use client';

import { useState } from 'react';
import { Shift } from '@/types/shift';
import { useTheme } from '@/contexts/ThemeContext';

interface ShiftFormProps {
  onShiftAdded: (shift: Shift) => void;
  onCancel: () => void;
}

export default function ShiftForm({ onShiftAdded, onCancel }: ShiftFormProps) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    coworkers: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Convert 24-hour time to 12-hour format for display
  const formatTime12Hour = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Generate time options in AM/PM format
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
      // Convert times to 12-hour format before sending
      const submitData = {
        ...formData,
        startTime: formatTime12Hour(formData.startTime),
        endTime: formatTime12Hour(formData.endTime),
      };

      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const data = await response.json();
        onShiftAdded(data.shift);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create shift');
      }
    } catch (error) {
      console.error('Error creating shift:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
            Start Time
          </label>
          <select
            value={formData.startTime}
            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-xl sm:rounded-4xl focus:outline-none focus:ring-2 focus:ring-purple-200 ${
              theme === 'dark' ? 'text-white bg-gray-700' : 'text-gray-800 bg-white'
            }`}
            style={{ borderColor: theme === 'dark' ? '#555' : '#C8A5FF' }}
            required
          >
            <option value="">Select time</option>
            {generateTimeOptions().map(time => (
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
            value={formData.endTime}
            onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-xl sm:rounded-4xl focus:outline-none focus:ring-2 focus:ring-purple-200 ${
              theme === 'dark' ? 'text-white bg-gray-700' : 'text-gray-800 bg-white'
            }`}
            style={{ borderColor: theme === 'dark' ? '#555' : '#C8A5FF' }}
            required
          >
            <option value="">Select time</option>
            {generateTimeOptions().map(time => (
              <option key={time.value} value={time.value}>
                {time.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
          Coworkers
        </label>
        <input
          type="text"
          value={formData.coworkers}
          onChange={(e) => setFormData(prev => ({ ...prev, coworkers: e.target.value }))}
          placeholder="Enter coworker names (comma-separated)"
          className={`w-full px-3 py-2 border rounded-xl sm:rounded-4xl focus:outline-none focus:ring-2 focus:ring-purple-200 ${
            theme === 'dark' ? 'text-white bg-gray-700' : 'text-gray-800 bg-white'
          }`}
          style={{ borderColor: theme === 'dark' ? '#555' : '#C8A5FF' }}
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any additional notes about this shift"
          rows={3}
          className={`w-full px-3 py-2 border rounded-xl sm:rounded-4xl focus:outline-none focus:ring-2 focus:ring-purple-200 ${
            theme === 'dark' ? 'text-white bg-gray-700' : 'text-gray-800 bg-white'
          }`}
          style={{ borderColor: theme === 'dark' ? '#555' : '#C8A5FF' }}
        />
      </div>

      {error && (
        <div className="border rounded-xl sm:rounded-4xl text-red-700 px-4 py-3" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 py-2 px-4 rounded-xl sm:rounded-4xl transition-colors disabled:opacity-50 border ${
            theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={{ backgroundColor: '#E7D8FF', borderColor: theme === 'dark' ? '#666' : '#C8A5FF' }}
        >
          {loading ? 'Creating...' : 'Create Shift'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`flex-1 py-2 px-4 rounded-xl sm:rounded-4xl transition-colors border ${
            theme === 'dark' ? 'text-white bg-gray-600 hover:bg-gray-500' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
          style={{ borderColor: theme === 'dark' ? '#666' : '#d1d5db' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
