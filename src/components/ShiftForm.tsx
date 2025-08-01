'use client';

import { useState } from 'react';
import { Shift } from '@/types/shift';

interface ShiftFormProps {
  onShiftAdded: (shift: Shift) => void;
  onCancel: () => void;
}

export default function ShiftForm({ onShiftAdded, onCancel }: ShiftFormProps) {
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

  // Convert 12-hour time to 24-hour format for storage
  const formatTime24Hour = (time12: string): string => {
    if (!time12) return '';
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return '';
    
    let [, hours, minutes, ampm] = match;
    let hour = parseInt(hours);
    
    if (ampm.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          className="w-full px-3 py-2 border rounded-4xl focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-800"
          style={{ borderColor: '#C8A5FF' }}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <select
            value={formData.startTime}
            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
            className="w-full px-3 py-2 border rounded-4xl focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-800"
            style={{ borderColor: '#C8A5FF' }}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <select
            value={formData.endTime}
            onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
            className="w-full px-3 py-2 border rounded-4xl focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-800"
            style={{ borderColor: '#C8A5FF' }}
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Coworkers
        </label>
        <input
          type="text"
          value={formData.coworkers}
          onChange={(e) => setFormData(prev => ({ ...prev, coworkers: e.target.value }))}
          placeholder="Enter coworker names (comma-separated)"
          className="w-full px-3 py-2 border rounded-4xl focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-800"
          style={{ borderColor: '#C8A5FF' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any additional notes about this shift"
          rows={3}
          className="w-full px-3 py-2 border rounded-4xl focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-800"
          style={{ borderColor: '#C8A5FF' }}
        />
      </div>

      {error && (
        <div className="border rounded-4xl text-red-700 px-4 py-3" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 text-gray-700 py-2 px-4 rounded-4xl transition-colors disabled:opacity-50 border hover:bg-gray-100"
          style={{ backgroundColor: '#E7D8FF', borderColor: '#C8A5FF' }}
        >
          {loading ? 'Creating...' : 'Create Shift'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 text-gray-700 py-2 px-4 rounded-4xl transition-colors border hover:bg-gray-100"
          style={{ backgroundColor: '#f3f4f6', borderColor: '#d1d5db' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
