import { NextResponse, NextRequest } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

async function sendPasswordResetEmail(email: string, resetToken: string, userName: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  // Always log to console for debugging
  console.log(`
    ========================================
    PASSWORD RESET EMAIL
    ========================================
    To: ${email}
    Reset Link: ${resetUrl}
    ========================================
  `);
  
  // Send actual email if Resend is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: email,
        subject: 'Reset Your Password - Schedules',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hi ${userName},</p>
            <p>You requested to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #C8A5FF; 
                        color: #000; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block;
                        font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p>Or copy this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${resetUrl}</p>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              This link will expire in 1 hour.
              <br>
              If you didn't request this, please ignore this email.
            </p>
          </div>
        `,
      });
      
      console.log('✓ Email sent successfully via Resend');
    } catch (error) {
      console.error('✗ Failed to send email via Resend:', error);
      // Don't throw - still return success to user
    }
  } else {
    console.log('ℹ Resend not configured - email only logged to console');
    console.log('ℹ Add RESEND_API_KEY to .env to send actual emails');
  }
  
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email using Supabase
    const user = await adminDb.users.findByEmail(email);

    // Always return success to prevent email enumeration attacks
    // (Don't tell if email exists or not)
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token expires in 1 hour
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    // Update user with reset token
    await adminDb.users.update(user.id, {
      resetToken: hashedToken,
      resetTokenExpiry: resetTokenExpiry.toISOString()
    });

    // Send email with reset link
    await sendPasswordResetEmail(email, resetToken, user.name);

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
