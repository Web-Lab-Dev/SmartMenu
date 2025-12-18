import 'server-only';

// ========================================
// Firebase Admin SDK (Server-Side Only)
// ========================================
// This file MUST NEVER be imported in client components
// The 'server-only' import above ensures this at build time

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

/**
 * Initialize Firebase Admin SDK (singleton)
 * Only use this in API routes, Server Actions, or Server Components
 */
export function getAdminApp(): App {
  if (adminApp) return adminApp;

  // Check if already initialized
  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0];
    return adminApp;
  }

  // Initialize with service account
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });

  return adminApp;
}

/**
 * Get Firestore Admin instance
 * Only use this in API routes, Server Actions, or Server Components
 */
export function getAdminDb(): Firestore {
  if (adminDb) return adminDb;

  const app = getAdminApp();
  adminDb = getFirestore(app);

  return adminDb;
}
