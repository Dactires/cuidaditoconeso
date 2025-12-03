'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { initializeFirebase } from './index';

// Define the context shape
interface FirebaseContextType {
  firebase: ReturnType<typeof initializeFirebase>;
}

// Create the context
const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

// Provider component
interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
}) => {
  const firebaseServices = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseContext.Provider value={{ firebase: firebaseServices }}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hooks to use the Firebase services
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context.firebase;
};

export const useFirebaseApp = () => useFirebase().app;
export const useFirestore = () => useFirebase().firestore;
export const useAuth = () => useFirebase().auth;
