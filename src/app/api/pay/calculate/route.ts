import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { Shift } from '@/types/shift';
import { 
  calculateShiftsPay, 
  calculateTotalPay, 
  calculateTotalHours,
  filterShiftsByPayCycle,
  PaySettings 
} from '@/lib/pay-calculator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user with pay settings
    const user = await adminDb.users.findById(authUser.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = user as { hourlyRate?: number; payCycle?: 'weekly' | 'biweekly' | 'monthly'; lastPaymentDate?: string };
    const paySettings: PaySettings = {
      hourlyRate: userData.hourlyRate || 0,
      payCycle: userData.payCycle || 'weekly',
      lastPaymentDate: userData.lastPaymentDate || undefined
    };

    if (paySettings.hourlyRate === 0) {
      return NextResponse.json(
        { error: 'Please configure your hourly rate in pay settings' },
        { status: 400 }
      );
    }

    // Get all shifts for the user
    const allShifts = await adminDb.shifts.findMany(
      { userId: authUser.userId },
      { field: 'date', order: 'desc' }
    ) as Shift[];

    // Filter shifts by pay cycle using last payment date
    const cycleShifts = filterShiftsByPayCycle(allShifts, paySettings.payCycle, paySettings.lastPaymentDate);
    
    // Debug logging (remove in production if needed)
    console.log('Pay calculation debug:', {
      totalShifts: allShifts.length,
      cycleShifts: cycleShifts.length,
      payCycle: paySettings.payCycle,
      lastPaymentDate: paySettings.lastPaymentDate,
      sampleShiftDates: allShifts.slice(0, 3).map(s => s.date)
    });
    
    // Calculate pay for each shift
    const shiftPays = calculateShiftsPay(cycleShifts, paySettings.hourlyRate);
    
    // Calculate totals
    const totalPay = calculateTotalPay(shiftPays);
    const totalHours = calculateTotalHours(shiftPays);
    const totalPaidHours = shiftPays.reduce((total, sp) => {
      return total + (sp.hours - (sp.deducted ? 0.5 : 0));
    }, 0);

    return NextResponse.json({
      paySettings,
      shifts: shiftPays,
      totals: {
        totalPay,
        totalHours,
        totalPaidHours,
        shiftCount: shiftPays.length
      },
      cycleStart: getCycleStartDate(paySettings.payCycle, paySettings.lastPaymentDate),
      cycleEnd: getCycleEndDate(paySettings.payCycle, paySettings.lastPaymentDate)
    });
  } catch (error) {
    console.error('Error calculating pay:', error);
    return NextResponse.json(
      { error: 'Failed to calculate pay', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getCycleStartDate(payCycle: PaySettings['payCycle'], lastPaymentDate?: string): string {
  const now = new Date();
  let cycleStart: Date;
  
  if (lastPaymentDate) {
    cycleStart = new Date(lastPaymentDate);
    cycleStart.setHours(0, 0, 0, 0);
  } else {
    switch (payCycle) {
      case 'weekly':
        cycleStart = new Date(now);
        cycleStart.setDate(now.getDate() - now.getDay());
        cycleStart.setHours(0, 0, 0, 0);
        break;
        
      case 'biweekly':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const firstMonday = new Date(yearStart);
        firstMonday.setDate(yearStart.getDate() + (1 - yearStart.getDay() + 7) % 7);
        
        const daysSinceStart = Math.floor((now.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24));
        const weeksSinceStart = Math.floor(daysSinceStart / 14);
        
        cycleStart = new Date(firstMonday);
        cycleStart.setDate(firstMonday.getDate() + weeksSinceStart * 14);
        cycleStart.setHours(0, 0, 0, 0);
        break;
        
      case 'monthly':
        cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
        cycleStart.setHours(0, 0, 0, 0);
        break;
        
      default:
        cycleStart = now;
    }
  }
  
  return cycleStart.toISOString().split('T')[0];
}

function getCycleEndDate(payCycle: PaySettings['payCycle'], lastPaymentDate?: string): string {
  const now = new Date();
  let cycleEnd: Date;
  
  if (lastPaymentDate) {
    const cycleStart = new Date(lastPaymentDate);
    cycleStart.setHours(0, 0, 0, 0);
    
    switch (payCycle) {
      case 'weekly':
        cycleEnd = new Date(cycleStart);
        cycleEnd.setDate(cycleStart.getDate() + 7);
        break;
        
      case 'biweekly':
        cycleEnd = new Date(cycleStart);
        cycleEnd.setDate(cycleStart.getDate() + 14);
        break;
        
      case 'monthly':
        cycleEnd = new Date(cycleStart);
        cycleEnd.setMonth(cycleStart.getMonth() + 1);
        break;
        
      default:
        cycleEnd = now;
    }
  } else {
    switch (payCycle) {
      case 'weekly':
        const cycleStart = new Date(now);
        cycleStart.setDate(now.getDate() - now.getDay());
        cycleStart.setHours(0, 0, 0, 0);
        cycleEnd = new Date(cycleStart);
        cycleEnd.setDate(cycleStart.getDate() + 7);
        break;
        
      case 'biweekly':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const firstMonday = new Date(yearStart);
        firstMonday.setDate(yearStart.getDate() + (1 - yearStart.getDay() + 7) % 7);
        
        const daysSinceStart = Math.floor((now.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24));
        const weeksSinceStart = Math.floor(daysSinceStart / 14);
        
        const biCycleStart = new Date(firstMonday);
        biCycleStart.setDate(firstMonday.getDate() + weeksSinceStart * 14);
        biCycleStart.setHours(0, 0, 0, 0);
        cycleEnd = new Date(biCycleStart);
        cycleEnd.setDate(biCycleStart.getDate() + 14);
        break;
        
      case 'monthly':
        cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
        
      default:
        cycleEnd = now;
    }
  }
  
  return cycleEnd.toISOString().split('T')[0];
}

