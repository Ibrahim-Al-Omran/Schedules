'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { PaySettings as PaySettingsType } from '@/lib/pay-calculator';
import { Settings, Save } from 'lucide-react';

interface PaySettingsProps {
  onSettingsUpdated?: () => void;
}

export default function PaySettings({ onSettingsUpdated }: PaySettingsProps) {
  const { theme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paySettings, setPaySettings] = useState<PaySettingsType>({
    hourlyRate: 0,
    payCycle: 'weekly',
    lastPaymentDate: undefined
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPaySettings();
  }, []);

  const fetchPaySettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pay-settings');
      if (response.ok) {
        const data = await response.json();
        setPaySettings(data.paySettings);
      }
    } catch (error) {
      console.error('Error fetching pay settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch('/api/pay-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paySettings),
      });

      if (response.ok) {
        setFeedbackMessage('Pay settings saved successfully!');
        setTimeout(() => setFeedbackMessage(null), 3000);
        setShowSettings(false);
        if (onSettingsUpdated) {
          onSettingsUpdated();
        }
      } else {
        const error = await response.json();
        setFeedbackMessage(error.error || 'Failed to save pay settings');
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error saving pay settings:', error);
      setFeedbackMessage('Failed to save pay settings');
      setTimeout(() => setFeedbackMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-2xl border" style={{ 
        backgroundColor: theme === 'dark' ? '#444443' : 'white',
        borderColor: theme === 'dark' ? '#555' : '#C8A5FF'
      }}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: '#C8A5FF' }}></div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`w-full px-4 py-3 rounded-2xl border transition-colors flex items-center justify-between ${
          theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
        }`}
        style={{ 
          backgroundColor: theme === 'dark' ? '#444443' : 'white',
          borderColor: theme === 'dark' ? '#555' : '#C8A5FF',
          color: theme === 'dark' ? 'white' : '#000000'
        }}
      >
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" style={{ color: theme === 'dark' ? 'white' : '#000000' }} />
          <span className="font-medium">Pay Settings</span>
        </div>
        <span className="text-sm" style={{ color: theme === 'dark' ? 'white' : '#000000', opacity: theme === 'dark' ? 1 : 0.7 }}>
          ${paySettings.hourlyRate.toFixed(2)}/{paySettings.payCycle}
        </span>
      </button>

      {showSettings && (
        <div className="mt-4 p-4 rounded-2xl border" style={{ 
          backgroundColor: theme === 'dark' ? '#444443' : 'white',
          borderColor: theme === 'dark' ? '#555' : '#C8A5FF'
        }}>
          {feedbackMessage && (
            <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: '#E7D8FF' }}>
              <p className="text-sm text-center" style={{ color: '#000000' }}>{feedbackMessage}</p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>
                Hourly Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paySettings.hourlyRate}
                onChange={(e) => setPaySettings(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-purple-500 focus:outline-none"
                style={{ 
                  backgroundColor: theme === 'dark' ? '#333' : 'white',
                  borderColor: theme === 'dark' ? '#555' : '#C8A5FF',
                  color: theme === 'dark' ? 'white' : '#000000'
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>
                Pay Cycle
              </label>
              <select
                value={paySettings.payCycle}
                onChange={(e) => setPaySettings(prev => ({ ...prev, payCycle: e.target.value as PaySettingsType['payCycle'] }))}
                className="w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-purple-500 focus:outline-none"
                style={{ 
                  backgroundColor: theme === 'dark' ? '#333' : 'white',
                  borderColor: theme === 'dark' ? '#555' : '#C8A5FF',
                  color: theme === 'dark' ? 'white' : '#000000'
                }}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>
                Last Payment Date (Optional)
              </label>
              <input
                type="date"
                value={paySettings.lastPaymentDate || ''}
                onChange={(e) => setPaySettings(prev => ({ ...prev, lastPaymentDate: e.target.value || undefined }))}
                className="w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-purple-500 focus:outline-none"
                style={{ 
                  backgroundColor: theme === 'dark' ? '#333' : 'white',
                  borderColor: theme === 'dark' ? '#555' : '#C8A5FF',
                  color: theme === 'dark' ? 'white' : '#000000'
                }}
              />
              <p className="text-xs mt-1" style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                Set this to the date you last received payment. The pay cycle will start from this date.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 px-4 py-2 rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ 
                  backgroundColor: '#E7D8FF', 
                  borderColor: theme === 'dark' ? '#666' : '#C8A5FF',
                  color: theme === 'dark' ? '#000000' : '#000000'
                }}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#C8A5FF' }}></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-xl border transition-colors"
                style={{ 
                  backgroundColor: theme === 'dark' ? '#333' : '#F3F4F6',
                  borderColor: theme === 'dark' ? '#555' : '#C8A5FF',
                  color: theme === 'dark' ? 'white' : '#000000'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

