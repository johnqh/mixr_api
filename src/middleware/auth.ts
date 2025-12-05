import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { auth, isFirebaseEnabled } from '../config/firebase';

// Extend Hono's context to include user information
export interface AuthUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}

// Development mode mock user
const DEV_USER: AuthUser = {
  uid: 'dev-user-123',
  email: 'dev@mixr.local',
  emailVerified: true,
};

// Middleware for required authentication
export async function requireAuth(c: Context, next: Next) {
  // If Firebase is not enabled (development mode), use mock user
  if (!isFirebaseEnabled) {
    console.log('🔓 Auth bypassed (dev mode) - using mock user');
    c.set('user', DEV_USER);
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, {
      message: 'Missing or invalid authorization header',
    });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth!.verifyIdToken(token);

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
  // If Firebase is not enabled (development mode), optionally use mock user
  if (!isFirebaseEnabled) {
    // In dev mode, we can optionally set a user, or leave it undefined
    // For now, let's not set a user for optional auth in dev mode
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await auth!.verifyIdToken(token);

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
