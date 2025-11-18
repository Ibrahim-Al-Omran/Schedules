import { Shift } from '@/types/shift';

export interface PaySettings {
  hourlyRate: number;
  payCycle: 'weekly' | 'biweekly' | 'monthly';
  lastPaymentDate?: string; // YYYY-MM-DD format - when the last payment was received
}

export interface ShiftPay {
  shiftId: string;
  date: string;
  hours: number;
  pay: number;
  deducted: boolean; // Whether 30 minutes was deducted
}

/**
 * Convert 12-hour time format to 24-hour format
 */
function convertTo24Hour(timeStr: string): string {
  // If already in 24-hour format (HH:MM), return as is
  if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
    return timeStr;
  }
  
  // Parse 12-hour format (e.g., "10:00 AM" or "2:00 PM")
  const timeParts = timeStr.trim().split(' ');
  const [time, period] = timeParts;
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);
  
  // Convert to 24-hour format
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Calculate hours worked from start and end time
 */
export function calculateHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) {
    console.error('Invalid time values:', { startTime, endTime });
    return 0;
  }
  
  // Convert to 24-hour format if needed
  const start24 = convertTo24Hour(startTime);
  const end24 = convertTo24Hour(endTime);
  
  const [startHour, startMin] = start24.split(':').map(Number);
  const [endHour, endMin] = end24.split(':').map(Number);
  
  // Check for NaN values
  if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
    console.error('Failed to parse time:', { startTime, endTime, start24, end24 });
    return 0;
  }
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Handle overnight shifts (end time is next day)
  let totalMinutes = endMinutes - startMinutes;
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60; // Add 24 hours
  }
  
  return totalMinutes / 60; // Convert to hours
}

/**
 * Calculate pay for a single shift based on the rules:
 * - If 5 hours or below: pay for those hours
 * - If above 5 hours: deduct 30 minutes of pay (per shift)
 */
export function calculateShiftPay(hours: number, hourlyRate: number): { pay: number; deducted: boolean } {
  let payHours = hours;
  let deducted = false;
  
  if (hours > 5) {
    payHours = hours - 0.5; // Deduct 30 minutes
    deducted = true;
  }
  
  return {
    pay: payHours * hourlyRate,
    deducted
  };
}

/**
 * Calculate pay for multiple shifts
 */
export function calculateShiftsPay(shifts: Shift[], hourlyRate: number): ShiftPay[] {
  return shifts.map(shift => {
    // Debug logging
    console.log('Calculating pay for shift:', {
      id: shift.id,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      hourlyRate
    });
    
    const hours = calculateHours(shift.startTime, shift.endTime);
    const { pay, deducted } = calculateShiftPay(hours, hourlyRate);
    
    console.log('Shift calculation result:', {
      hours,
      pay,
      deducted
    });
    
    return {
      shiftId: shift.id,
      date: shift.date,
      hours,
      pay,
      deducted
    };
  });
}

/**
 * Calculate total pay for a period
 */
export function calculateTotalPay(shiftPays: ShiftPay[]): number {
  return shiftPays.reduce((total, shiftPay) => total + shiftPay.pay, 0);
}

/**
 * Calculate total hours for a period
 */
export function calculateTotalHours(shiftPays: ShiftPay[]): number {
  return shiftPays.reduce((total, shiftPay) => total + shiftPay.hours, 0);
}

/**
 * Filter shifts by pay cycle
 */
export function filterShiftsByPayCycle(
  shifts: Shift[],
  payCycle: PaySettings['payCycle'],
  lastPaymentDate?: string
): Shift[] {
  const now = new Date();
  let cycleStart: Date;
  let cycleEnd: Date;
  
  if (lastPaymentDate) {
    // Use last payment date as the start of the current cycle
    const lastPayment = new Date(lastPaymentDate);
    lastPayment.setHours(0, 0, 0, 0);
    
    switch (payCycle) {
      case 'weekly':
        cycleStart = new Date(lastPayment);
        cycleEnd = new Date(lastPayment);
        cycleEnd.setDate(lastPayment.getDate() + 7);
        break;
        
      case 'biweekly':
        cycleStart = new Date(lastPayment);
        cycleEnd = new Date(lastPayment);
        cycleEnd.setDate(lastPayment.getDate() + 14);
        break;
        
      case 'monthly':
        cycleStart = new Date(lastPayment);
        cycleEnd = new Date(lastPayment);
        cycleEnd.setMonth(lastPayment.getMonth() + 1);
        break;
        
      default:
        return shifts;
    }
  } else {
    // Fallback to default calculation if no last payment date
    switch (payCycle) {
      case 'weekly':
        // Start of current week (Sunday)
        cycleStart = new Date(now);
        cycleStart.setDate(now.getDate() - now.getDay());
        cycleStart.setHours(0, 0, 0, 0);
        cycleEnd = new Date(cycleStart);
        cycleEnd.setDate(cycleStart.getDate() + 7);
        break;
        
      case 'biweekly':
        // Start of current biweekly period (every 2 weeks from a reference date)
        // Using first Monday of the year as reference
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const firstMonday = new Date(yearStart);
        firstMonday.setDate(yearStart.getDate() + (1 - yearStart.getDay() + 7) % 7);
        
        const daysSinceStart = Math.floor((now.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24));
        const weeksSinceStart = Math.floor(daysSinceStart / 14);
        
        cycleStart = new Date(firstMonday);
        cycleStart.setDate(firstMonday.getDate() + weeksSinceStart * 14);
        cycleStart.setHours(0, 0, 0, 0);
        cycleEnd = new Date(cycleStart);
        cycleEnd.setDate(cycleStart.getDate() + 14);
        break;
        
      case 'monthly':
        // Start of current month
        cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
        cycleStart.setHours(0, 0, 0, 0);
        cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
        
      default:
        return shifts;
    }
  }
  
  return shifts.filter(shift => {
    // Parse shift date properly (YYYY-MM-DD format)
    const [year, month, day] = shift.date.split('-').map(Number);
    const shiftDate = new Date(year, month - 1, day);
    shiftDate.setHours(0, 0, 0, 0);
    
    const isInRange = shiftDate >= cycleStart && shiftDate < cycleEnd;
    
    // Debug logging (can be removed)
    if (!isInRange && shifts.length > 0) {
      console.log('Shift filtered out:', {
        shiftDate: shiftDate.toISOString().split('T')[0],
        cycleStart: cycleStart.toISOString().split('T')[0],
        cycleEnd: cycleEnd.toISOString().split('T')[0],
        inRange: isInRange
      });
    }
    
    return isInRange;
  });
}

