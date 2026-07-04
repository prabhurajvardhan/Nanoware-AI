import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json';

let adminApp: ReturnType<typeof initializeApp> | null = null;
let adminDb: Firestore | null = null;

export function getFirebaseAdminApp() {
  if (adminApp) {
    return adminApp;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
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
    adminApp = !getApps().length 
      ? initializeApp({
          projectId: firebaseConfig.projectId,
        })
      : getApps()[0];
  }

  return adminApp;
}

export function getAdminDb(): Firestore {
  if (adminDb) {
    return adminDb;
  }
  
  getFirebaseAdminApp();
  adminDb = getFirestore();
  
  // Use custom database ID if specified
  if (firebaseConfig.firestoreDatabaseId) {
    adminDb = getFirestore(adminApp!, firebaseConfig.firestoreDatabaseId);
  }
  
  return adminDb;
}
