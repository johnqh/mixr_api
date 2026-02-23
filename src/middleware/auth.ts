import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { auth, isFirebaseEnabled } from '../config/firebase';

/** User information extracted from a Firebase auth token */
export interface AuthUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}

/** Development mode mock user used when Firebase is not configured */
const DEV_USER: AuthUser = {
  uid: 'dev-user-123',
  email: 'dev@mixr.local',
  emailVerified: true,
};

/**
 * Middleware that requires a valid Firebase auth token.
 * Sets `c.get('user')` with the authenticated user's info.
 *
 * In development mode (Firebase not configured), automatically uses
 * a mock user to allow testing without auth tokens.
 *
 * @throws HTTPException 401 if the token is missing, invalid, or expired
 */
export async function requireAuth(c: Context, next: Next) {
  if (!isFirebaseEnabled) {
    console.log('Auth bypassed (dev mode) - using mock user');
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

/**
 * Middleware for optional authentication.
 * If a valid auth token is present, sets `c.get('user')`.
 * If no token or an invalid token is present, continues without error.
 *
 * Useful for endpoints that behave differently for authenticated vs anonymous users.
 */
export async function optionalAuth(c: Context, next: Next) {
  if (!isFirebaseEnabled) {
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await auth!.verifyIdToken(token);

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
