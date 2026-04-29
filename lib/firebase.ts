import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// Use the database id correctly
if (firebaseConfig.firestoreDatabaseId) {
   // Wait, getFirestore takes dbId as a string if we import it correctly, but standard web sdk initialized with config already bounds to the project default DB unless multiple DBs are used 
   // getFirestore(app, firebaseConfig.firestoreDatabaseId) works in the latest SDKs
}
// export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// For standard initialization in this environment:
export const firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
