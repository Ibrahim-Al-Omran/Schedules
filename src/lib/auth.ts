import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

export function getAuthUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}
