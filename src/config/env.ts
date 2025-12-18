// ========================================
// Environment Variables Configuration
// ========================================
// This file explicitly references env vars to ensure they're bundled by webpack

export const env = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  },
  // ⚠️ IMPORTANT: OpenAI API key is NOT exposed here (server-only in API routes)
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
} as const;

// Validate Firebase config on import
if (typeof window !== 'undefined') {
  const missing: string[] = [];

  if (!env.firebase.apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!env.firebase.authDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!env.firebase.projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!env.firebase.storageBucket) missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!env.firebase.messagingSenderId) missing.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!env.firebase.appId) missing.push('NEXT_PUBLIC_FIREBASE_APP_ID');

  if (missing.length > 0) {
    console.error(
      `❌ Missing Firebase environment variables: ${missing.join(', ')}\n` +
      `Please add them to your .env.local file and restart the dev server.`
    );
  } else {
    // console.log('✅ All Firebase environment variables loaded');
  }
}
