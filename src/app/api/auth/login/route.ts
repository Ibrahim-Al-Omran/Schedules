import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Optimize for serverless cold starts
export const maxDuration = 10; // Increase timeout for database operations

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Single optimized query - combine user lookup with minimal logging
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      }
    });

    if (!user) {
      // Don't do expensive debugging queries in production
      if (process.env.NODE_ENV === 'development') {
        const totalUsers = await prisma.user.count();
        console.log('Total users in database:', totalUsers);
      }
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create response with token as httpOnly cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      // Add performance metrics for debugging
      ...(process.env.NODE_ENV === 'development' && {
        performance: { responseTime: `${Date.now() - startTime}ms` }
      })
    });

    // Set cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        error: 'Login failed',
        // Add cold start debugging in development
        ...(process.env.NODE_ENV === 'development' && {
          performance: { responseTime: `${Date.now() - startTime}ms` }
        })
      },
      { status: 500 }
    );
  }
  // Note: No prisma.$disconnect() - let connection pooling handle this
}
