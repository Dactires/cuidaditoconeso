'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { FirebaseProvider } from './provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export const FirebaseClientProvider: React.FC<FirebaseClientProviderProps> = ({
  children,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Or a loading spinner
  }

  return <FirebaseProvider>{children}</FirebaseProvider>;
};
