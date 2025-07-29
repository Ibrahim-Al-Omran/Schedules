import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Configure as dynamic since it uses authentication (cookies)
export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: shiftId } = await params;
    const body = await request.json();
    const { date, startTime, endTime, coworkers, notes } = body;

    // Verify ownership and update using Supabase
    const { data: shift, error: findError } = await supabaseAdmin
      .from('Shift')
      .select('id')
      .eq('id', shiftId)
      .eq('userId', authUser.userId)
      .single();

    if (findError || !shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    const { data: updatedShift, error: updateError } = await supabaseAdmin
      .from('Shift')
      .update({
        date,
        startTime,
        endTime,
        coworkers: coworkers || null,
        notes: notes || null,
      })
      .eq('id', shiftId)
      .eq('userId', authUser.userId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ shift: updatedShift });
  } catch (error) {
    console.error('Error updating shift:', error);
    return NextResponse.json(
      { error: 'Failed to update shift' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: shiftId } = await params;

    // Verify ownership and delete using Supabase
    const { data: shift, error: findError } = await supabaseAdmin
      .from('Shift')
      .select('id')
      .eq('id', shiftId)
      .eq('userId', authUser.userId)
      .single();

    if (findError || !shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('Shift')
      .delete()
      .eq('id', shiftId)
      .eq('userId', authUser.userId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift:', error);
    return NextResponse.json(
      { error: 'Failed to delete shift' },
      { status: 500 }
    );
  }
}
