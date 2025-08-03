import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function POST(req: Request) {
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

    console.log('Login attempt for email:', email);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Database URL exists:', !!process.env.DATABASE_URL);
    console.log('Database URL preview:', process.env.DATABASE_URL?.substring(0, 20) + '...');

    // Test database connection first
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      throw dbError;
    }

    // Find user by email using Prisma ORM
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      }
    });

    console.log('User found:', !!user);
    
    // Additional debugging: check if any users exist at all
    if (!user) {
      const totalUsers = await prisma.user.count();
      console.log('Total users in database:', totalUsers);
      
      // Check if there's a user with similar email (case issues?)
      const similarUsers = await prisma.user.findMany({
        where: {
          email: {
            contains: email.toLowerCase(),
            mode: 'insensitive'
          }
        },
        select: { email: true }
      });
      console.log('Users with similar email:', similarUsers);
    }

    if (!user) {
      console.log('No user found with email:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('User found, checking password...');
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValidPassword);

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
    });

    response.headers.set('Access-Control-Allow-Origin', 'https://schedules-ashen.vercel.app');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

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
    const err = error as Error;
    console.error('Login error details:', {
      message: err.message,
      stack: err.stack,
      environment: process.env.NODE_ENV,
      jwtSecretSet: !!process.env.JWT_SECRET,
      databaseUrlSet: !!process.env.DATABASE_URL,
    });
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
  // Removed prisma.$disconnect() - let connection pooling handle this
}
