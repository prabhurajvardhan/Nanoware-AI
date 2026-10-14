import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const ADMIN_APP_NAME = 'nanoware-server';

export class FirebaseAdminConfigurationError extends Error {
  readonly code: 'FIREBASE_SERVICE_ACCOUNT_JSON_MISSING' | 'FIREBASE_SERVICE_ACCOUNT_JSON_INVALID' | 'FIREBASE_PROJECT_MISMATCH';
  constructor(code: 'FIREBASE_SERVICE_ACCOUNT_JSON_MISSING' | 'FIREBASE_SERVICE_ACCOUNT_JSON_INVALID' | 'FIREBASE_PROJECT_MISMATCH') {
    super(code);
    this.name = 'FirebaseAdminConfigurationError';
    this.code = code;
  }
}

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    if (process.env.NODE_ENV === 'production') throw new FirebaseAdminConfigurationError('FIREBASE_SERVICE_ACCOUNT_JSON_MISSING');
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as { project_id?: unknown; client_email?: unknown; private_key?: unknown };
    if (typeof parsed.project_id !== 'string' || typeof parsed.client_email !== 'string' || typeof parsed.private_key !== 'string') throw new Error('invalid service account shape');
    if (parsed.project_id !== firebaseConfig.projectId) throw new FirebaseAdminConfigurationError('FIREBASE_PROJECT_MISMATCH');
    return { projectId: parsed.project_id, clientEmail: parsed.client_email, privateKey: parsed.private_key };
  } catch (error) {
    if (error instanceof FirebaseAdminConfigurationError) throw error;
    throw new FirebaseAdminConfigurationError('FIREBASE_SERVICE_ACCOUNT_JSON_INVALID');
  }
}

export function getFirebaseAdminApp() {
  if (adminApp) return adminApp;
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME);
  if (existing) { adminApp = existing; return adminApp; }
  const serviceAccount = loadServiceAccount();
  adminApp = serviceAccount
    ? initializeApp({ credential: cert(serviceAccount), projectId: firebaseConfig.projectId }, ADMIN_APP_NAME)
    : initializeApp({ projectId: firebaseConfig.projectId }, ADMIN_APP_NAME);
  return adminApp;
}

export function getAdminDb(): Firestore {
  if (adminDb) return adminDb;
  const app = getFirebaseAdminApp();
  adminDb = firebaseConfig.firestoreDatabaseId ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : getFirestore(app);
  return adminDb;
}
