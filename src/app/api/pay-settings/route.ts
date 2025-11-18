import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { adminDb } from '@/lib/supabase-admin';
import { PaySettings } from '@/lib/pay-calculator';

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

    // Return pay settings (defaults if not set)
    const userData = user as { hourlyRate?: number; payCycle?: 'weekly' | 'biweekly' | 'monthly'; lastPaymentDate?: string };
    const paySettings: PaySettings = {
      hourlyRate: userData.hourlyRate || 0,
      payCycle: userData.payCycle || 'weekly',
      lastPaymentDate: userData.lastPaymentDate || undefined
    };

    return NextResponse.json({ paySettings });
  } catch (error) {
    console.error('Error fetching pay settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pay settings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { hourlyRate, payCycle, lastPaymentDate } = body;

    // Validate input
    if (hourlyRate === undefined || hourlyRate < 0) {
      return NextResponse.json(
        { error: 'Valid hourly rate is required' },
        { status: 400 }
      );
    }

    if (payCycle && !['weekly', 'biweekly', 'monthly'].includes(payCycle)) {
      return NextResponse.json(
        { error: 'Pay cycle must be weekly, biweekly, or monthly' },
        { status: 400 }
      );
    }

    // Validate lastPaymentDate format if provided
    if (lastPaymentDate && !/^\d{4}-\d{2}-\d{2}$/.test(lastPaymentDate)) {
      return NextResponse.json(
        { error: 'Last payment date must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    // Update user with pay settings
    const updateData: Record<string, number | string | null> = {
      hourlyRate: parseFloat(hourlyRate),
    };

    if (payCycle) {
      updateData.payCycle = payCycle;
    }

    if (lastPaymentDate !== undefined) {
      updateData.lastPaymentDate = lastPaymentDate || null;
    }

    await adminDb.users.update(authUser.userId, updateData);

    return NextResponse.json({ 
      message: 'Pay settings updated successfully',
      paySettings: {
        hourlyRate: updateData.hourlyRate,
        payCycle: updateData.payCycle || 'weekly',
        lastPaymentDate: updateData.lastPaymentDate
      }
    });
  } catch (error) {
    console.error('Error updating pay settings:', error);
    return NextResponse.json(
      { error: 'Failed to update pay settings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

