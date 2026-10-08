'use client';
import { useEffect, useState } from 'react';

export function useResource<T>(load: () => Promise<T>, errorMessage: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    load()
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setError(errorMessage);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [load, errorMessage, revision]);
  return {
    data,
    setData,
    loading,
    error,
    setError,
    reload: () => setRevision((value) => value + 1),
  };
}
