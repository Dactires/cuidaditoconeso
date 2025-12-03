'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, Query, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { useFirestore } from '../provider';

export const useCollection = <T extends DocumentData>(collectionPath: string) => {
  const db = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const collectionRef = collection(db, collectionPath) as Query<T>;

    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        setData(items);
        setLoading(false);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, collectionPath]);

  return { data, loading, error };
};
