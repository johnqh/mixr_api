import admin from 'firebase-admin';
import { env } from './env';

let firebaseInitialized = false;
let firebaseAuth: admin.auth.Auth | null = null;

// Check if Firebase credentials are properly configured (not placeholders)
const hasValidFirebaseConfig =
  env.FIREBASE_PROJECT_ID &&
  env.FIREBASE_PROJECT_ID !== 'your-project-id' &&
  env.FIREBASE_CLIENT_EMAIL &&
  env.FIREBASE_CLIENT_EMAIL.includes('@') &&
  env.FIREBASE_PRIVATE_KEY &&
  !env.FIREBASE_PRIVATE_KEY.includes('...');

// Initialize Firebase Admin SDK only if credentials are valid
if (hasValidFirebaseConfig && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    firebaseAuth = admin.auth();
    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.warn('⚠️  Firebase initialization failed. Running in development mode without authentication.');
    console.warn('   To enable authentication, configure valid Firebase credentials in .env.local');
  }
} else {
  console.warn('⚠️  Firebase credentials not configured. Running in development mode without authentication.');
  console.warn('   Protected endpoints will be accessible without auth tokens.');
}

export const auth = firebaseAuth;
export const isFirebaseEnabled = firebaseInitialized;
export default admin;
