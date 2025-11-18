'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { DollarSign, Clock, Calendar, TrendingUp, Settings, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { PaySettings as PaySettingsType } from '@/lib/pay-calculator';

interface ShiftPay {
  shiftId: string;
  date: string;
  hours: number;
  pay: number;
  deducted: boolean;
}

interface PayData {
  paySettings: {
    hourlyRate: number;
    payCycle: string;
  };
  shifts: ShiftPay[];
  totals: {
    totalPay: number;
    totalHours: number;
    totalPaidHours: number;
    shiftCount: number;
  };
  cycleStart: string;
  cycleEnd: string;
}

interface PayDisplayProps {
  refreshTrigger?: number;
  onSettingsUpdated?: () => void;
}

export default function PayDisplay({ refreshTrigger, onSettingsUpdated }: PayDisplayProps) {
  const { theme } = useTheme();
  const [payData, setPayData] = useState<PayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paySettings, setPaySettings] = useState<PaySettingsType>({
    hourlyRate: 0,
    payCycle: 'weekly',
    lastPaymentDate: undefined
  });
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  const fetchPayData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/pay/calculate');
      
      if (response.ok) {
        const data = await response.json();
        setPayData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to calculate pay');
      }
    } catch (err) {
      console.error('Error fetching pay data:', err);
      setError('Failed to load pay information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayData();
    fetchPaySettings();
  }, [refreshTrigger]);

  const fetchPaySettings = async () => {
    try {
      const response = await fetch('/api/pay-settings');
      if (response.ok) {
        const data = await response.json();
        setPaySettings(data.paySettings);
      }
    } catch (error) {
      console.error('Error fetching pay settings:', error);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
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
        setSettingsFeedback('Settings saved successfully!');
        setTimeout(() => setSettingsFeedback(null), 3000);
        setShowSettings(false);
        fetchPayData();
        if (onSettingsUpdated) {
          onSettingsUpdated();
        }
      } else {
        const error = await response.json();
        setSettingsFeedback(error.error || 'Failed to save settings');
        setTimeout(() => setSettingsFeedback(null), 3000);
      }
    } catch (error) {
      console.error('Error saving pay settings:', error);
      setSettingsFeedback('Failed to save settings');
      setTimeout(() => setSettingsFeedback(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Safely get totals with defaults
  const totals = payData?.totals || {
    totalPay: 0,
    totalHours: 0,
    totalPaidHours: 0,
    shiftCount: 0
  };

  const hasPaySettings = payData && !error;

  return (
    <div className="mt-4 p-3 sm:p-4 rounded-2xl sm:rounded-4xl border shadow" style={{ 
      backgroundColor: theme === 'dark' ? '#444443' : 'white',
      borderColor: theme === 'dark' ? '#555' : '#C8A5FF'
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>
          <DollarSign className="w-5 h-5" />
          Pay Summary
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-sm px-3 py-1 rounded-xl border transition-colors flex items-center gap-1.5"
            style={{ 
              backgroundColor: '#E7D8FF', 
              borderColor: theme === 'dark' ? '#666' : '#C8A5FF',
              color: theme === 'dark' ? '#000000' : '#000000'
            }}
          >
            <Settings className="w-4 h-4" />
            Settings
            {showSettings ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={fetchPayData}
            className="text-sm px-3 py-1 rounded-xl border transition-colors"
            style={{ 
              backgroundColor: '#E7D8FF', 
              borderColor: theme === 'dark' ? '#666' : '#C8A5FF',
              color: theme === 'dark' ? '#000000' : '#000000'
            }}
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#C8A5FF' }}></div>
            ) : (
              'Refresh'
            )}
          </button>
        </div>
      </div>

      {/* Settings Form */}
      {showSettings && (
        <div className="mb-4 p-4 rounded-xl border" style={{ 
            backgroundColor: theme === 'dark' ? '#333' : '#F9FAFB',
            borderColor: theme === 'dark' ? '#555' : '#E5E7EB'
          }}>
            {settingsFeedback && (
              <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: '#E7D8FF' }}>
                <p className="text-sm text-center" style={{ color: '#000000' }}>{settingsFeedback}</p>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
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
                    backgroundColor: theme === 'dark' ? '#444443' : 'white',
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
                    backgroundColor: theme === 'dark' ? '#444443' : 'white',
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
                    backgroundColor: theme === 'dark' ? '#444443' : 'white',
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
                  className={`flex-1 px-4 py-2 rounded-xl border transition-all duration-200 flex items-center justify-center gap-2 ${
                    theme === 'dark' ? 'hover:brightness-110' : 'hover:brightness-95'
                  } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ 
                    backgroundColor: '#E7D8FF', 
                    borderColor: theme === 'dark' ? '#666' : '#C8A5FF',
                    color: '#000000'
                  }}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#C8A5FF' }}></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 transition-transform" />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-xl border transition-colors"
                  style={{ 
                    backgroundColor: theme === 'dark' ? '#555' : '#F3F4F6',
                    borderColor: theme === 'dark' ? '#666' : '#C8A5FF',
                    color: theme === 'dark' ? 'white' : '#000000'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

      {/* Error or No Settings Message */}
      {(error || !hasPaySettings) && (
        <div className="p-4 rounded-xl text-center" style={{ 
          backgroundColor: theme === 'dark' ? '#333' : '#F9FAFB',
          borderColor: theme === 'dark' ? '#555' : '#E5E7EB'
        }}>
          <p className="text-sm" style={{ color: theme === 'dark' ? '#FF6B6B' : '#DC2626' }}>
            {error || 'Please configure your hourly rate in pay settings'}
          </p>
        </div>
      )}

      {/* Pay Data - Only shown when there's valid data */}
      {hasPaySettings && (
        <>
          {/* Cycle Info */}
          <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: theme === 'dark' ? '#333' : '#F9FAFB' }}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} />
              <span className="text-sm font-medium" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>
                {payData?.paySettings?.payCycle ? payData.paySettings.payCycle.charAt(0).toUpperCase() + payData.paySettings.payCycle.slice(1) : 'Weekly'} Cycle
              </span>
            </div>
            <p className="text-xs" style={{ color: theme === 'dark' ? 'white' : '#6B7280' }}>
              {payData?.cycleStart && payData?.cycleEnd ? `${formatDate(payData.cycleStart)} - ${formatDate(payData.cycleEnd)}` : 'No cycle data'}
            </p>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: '#E7D8FF' }}>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4" style={{ color: '#000000' }} />
                <span className="text-xs font-medium" style={{ color: '#000000' }}>Total Pay</span>
              </div>
              <p className="text-xl font-bold" style={{ color: '#000000' }}>
                {formatCurrency(totals.totalPay || 0)}
              </p>
            </div>

            <div className="p-3 rounded-xl" style={{ backgroundColor: '#E7D8FF' }}>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4" style={{ color: '#000000' }} />
                <span className="text-xs font-medium" style={{ color: '#000000' }}>Total Hours</span>
              </div>
              <p className="text-xl font-bold" style={{ color: '#000000' }}>
                {(totals.totalHours || 0).toFixed(2)}h
              </p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-2 rounded-xl" style={{ backgroundColor: theme === 'dark' ? '#333' : '#F9FAFB' }}>
              <p className="text-xs" style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Paid Hours</p>
              <p className="text-sm font-semibold" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>
                {(totals.totalPaidHours || 0).toFixed(2)}h
              </p>
            </div>

            <div className="p-2 rounded-xl" style={{ backgroundColor: theme === 'dark' ? '#333' : '#F9FAFB' }}>
              <p className="text-xs" style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Shifts</p>
              <p className="text-sm font-semibold" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>
                {totals.shiftCount || 0}
              </p>
            </div>
          </div>

          {/* Shifts Breakdown */}
          {payData?.shifts && payData.shifts.length > 0 && (
            <div className="border-t pt-4" style={{ borderColor: theme === 'dark' ? '#555' : '#E5E7EB' }}>
              <h4 className="font-semibold flex items-center gap-2 mb-3 px-1" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>
                <TrendingUp className="w-4 h-4" />
                Shift Breakdown
              </h4>
              <div className="max-h-64 overflow-y-auto">
                {payData.shifts.map((shiftPay) => (
                  <div
                    key={shiftPay.shiftId}
                    className="p-3 rounded-xl mb-2 flex items-center justify-between"
                    style={{ backgroundColor: theme === 'dark' ? '#333' : '#F9FAFB' }}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>
                        {formatDate(shiftPay.date)}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs" style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                          {(shiftPay.hours || 0).toFixed(2)}h
                        </span>
                        {shiftPay.deducted && (
                          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#FDE2E2', color: '#DC2626' }}>
                            -30min
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: theme === 'dark' ? 'white' : '#1F2937' }}>
                        {formatCurrency(shiftPay.pay || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

