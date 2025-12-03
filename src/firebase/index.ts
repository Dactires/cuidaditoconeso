'use client';

import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, Firestore } from 'firebase/firestore';

import { firebaseConfig } from './config';

// Re-export hooks and providers
export * from './provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';

// TODO: Replace with your actual project configuration

const dev = process.env.NODE_ENV === 'development';

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

let firebaseServices: FirebaseServices | null = null;

export function initializeFirebase(): FirebaseServices {
  if (firebaseServices) {
    return firebaseServices;
  }

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  if (dev) {
    // Set up emulators
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
      disableWarnings: true,
    });
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  }

  // Initialize Analytics if supported
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  });

  firebaseServices = { app, auth, firestore };
  return firebaseServices;
}
