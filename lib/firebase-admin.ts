import { initializeApp, getApps, cert } from 'firebase-admin/app';
import firebaseConfig from '../firebase-applet-config.json';

let adminApp: ReturnType<typeof initializeApp> | null = null;

export function getFirebaseAdminApp() {
  if (adminApp) {
    return adminApp;
  }

  // For Vercel/serverless environments, use Application Default Credentials
  // The service account JSON is typically provided via environment variable
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    // Parse the service account JSON if provided as string
    const serviceAccount = typeof serviceAccountJson === 'string' 
      ? JSON.parse(serviceAccountJson) 
      : serviceAccountJson;
    
    adminApp = !getApps().length 
      ? initializeApp({
          credential: cert(serviceAccount),
          projectId: firebaseConfig.projectId,
        })
      : getApps()[0];
  } else {
    // Fallback: Use default credentials (works on Vercel with proper env setup)
    adminApp = !getApps().length 
      ? initializeApp({
          projectId: firebaseConfig.projectId,
        })
      : getApps()[0];
  }

  return adminApp;
}
