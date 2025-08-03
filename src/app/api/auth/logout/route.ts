import { NextResponse } from 'next/server';

// Use edge runtime for instant response
export const runtime = 'edge';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  
  // Clear the auth cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
  });

  return response;
}
