'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { useFirestore } from '../provider';

export const useDoc = <T extends DocumentData>(docPath: string) => {
  const db = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const docRef = doc(db, docPath);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<T>) => {
        if (snapshot.exists()) {
          setData({ ...snapshot.data(), id: snapshot.id } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, docPath]);

  return { data, loading, error };
};
