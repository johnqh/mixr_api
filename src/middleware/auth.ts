import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { auth } from '../config/firebase';

// Extend Hono's context to include user information
export interface AuthUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}

// Middleware for required authentication
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, {
      message: 'Missing or invalid authorization header',
    });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);

    // Store user info in context
    c.set('user', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    } as AuthUser);

    await next();
  } catch (error) {
    console.error('Token verification error:', error);
    throw new HTTPException(401, {
      message: 'Invalid or expired token',
    });
  }
}

// Middleware for optional authentication
export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await auth.verifyIdToken(token);

      // Store user info in context
      c.set('user', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      } as AuthUser);
    } catch (error) {
      // For optional auth, we don't throw - just continue without user
      console.warn('Optional auth token verification failed:', error);
    }
  }

  await next();
}
