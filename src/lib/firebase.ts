// ========================================
// Firebase Configuration & Initialization
// ========================================

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { ERROR_MESSAGES } from './constants';
import { env } from '@/config/env';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
};

/**
 * Validate Firebase configuration
 * Throws error if required environment variables are missing
 */
function validateConfig(): void {
  const missing: string[] = [];

  if (!firebaseConfig.apiKey) missing.push('apiKey');
  if (!firebaseConfig.authDomain) missing.push('authDomain');
  if (!firebaseConfig.projectId) missing.push('projectId');
  if (!firebaseConfig.storageBucket) missing.push('storageBucket');
  if (!firebaseConfig.messagingSenderId) missing.push('messagingSenderId');
  if (!firebaseConfig.appId) missing.push('appId');

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase configuration: ${missing.join(', ')}. ` +
        `Please check your .env.local file and restart the server.`
    );
  }
}

/**
 * Initialize Firebase app with error handling
 */
function initializeFirebase(): FirebaseApp | undefined {
  try {
    validateConfig();

    // Check if Firebase is already initialized
    const apps = getApps();
    if (apps.length > 0 && apps[0]) {
      return apps[0];
    }

    return initializeApp(firebaseConfig);
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

// Initialize Firebase only on client side
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;

if (typeof window !== 'undefined') {
  try {
    const initializedApp = initializeFirebase();
    if (initializedApp) {
      app = initializedApp;
      db = getFirestore(app);
      auth = getAuth(app);
      storage = getStorage(app);

      // console.log('✓ Firebase initialized successfully');
    }
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
  }
}

// ========================================
// Exported Getters (Preferred)
// ========================================

/**
 * Get Firebase app instance
 * @throws Error if Firebase is not initialized
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    throw new Error(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED);
  }
  return app;
}

/**
 * Get Firestore instance
 * @throws Error if Firebase is not initialized
 */
export function getDb(): Firestore {
  if (!db) {
    throw new Error(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED);
  }
  return db;
}

/**
 * Get Firebase Auth instance
 * @throws Error if Firebase is not initialized
 */
export function getAuthInstance(): Auth {
  if (!auth) {
    throw new Error(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED);
  }
  return auth;
}

/**
 * Get Firebase Storage instance
 * @throws Error if Firebase is not initialized
 */
export function getStorageInstance(): FirebaseStorage {
  if (!storage) {
    throw new Error(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED);
  }
  return storage;
}

// ========================================
// Backward Compatibility (Direct Exports)
// ========================================

/**
 * @deprecated Use getFirebaseApp() instead
 */
export { app };

/**
 * @deprecated Use getDb() instead
 */
export { db };

/**
 * @deprecated Use getAuthInstance() instead
 */
export { auth };

/**
 * @deprecated Use getStorageInstance() instead
 */
export { storage };

// ========================================
// Re-export Firestore Helpers
// ========================================

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  addDoc,
  onSnapshot,
  runTransaction,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
  type DocumentReference,
  type CollectionReference,
  type QuerySnapshot,
  type DocumentSnapshot,
} from 'firebase/firestore';

// ========================================
// Re-export Auth Helpers
// ========================================

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  type User,
  type UserCredential,
} from 'firebase/auth';

// ========================================
// Re-export Storage Helpers
// ========================================

export {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  type StorageReference,
  type UploadTask,
} from 'firebase/storage';

/**
 * Check if Firebase is initialized
 * Useful for conditional rendering
 */
export function isFirebaseInitialized(): boolean {
  return app !== undefined && db !== undefined && auth !== undefined;
}
