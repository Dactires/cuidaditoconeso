
'use client';

import { useEffect, useState } from 'react';
import { preloadAssets } from '@/lib/assets';
import { useFirebase } from '@/firebase';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const ASSETS_VERSION = "v1.1"; // Change this to force re-download

export default function InitialLoader({ children }: { children: React.ReactNode }) {
  const { firestore, storage } = useFirebase();
  const [status, setStatus] = useState<'checking' | 'downloading' | 'ready'>('checking');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // This component should not run on the server
    if (typeof window === 'undefined') {
      return;
    }

    const alreadyDownloaded = localStorage.getItem('assets_version') === ASSETS_VERSION;
    
    if (alreadyDownloaded) {
      setStatus('ready');
      return;
    }

    setStatus('downloading');

    preloadAssets(firestore, storage, (loaded, total) => {
      setProgress(total > 0 ? Math.round((loaded / total) * 100) : 100);
    }).then(() => {
      localStorage.setItem('assets_version', ASSETS_VERSION);
      // A small delay to let the user see the "100%"
      setTimeout(() => {
        setStatus('ready');
      }, 500);
    });
  }, [firestore, storage]);

  if (status !== 'ready') {
    return (
      <div className="fixed inset-0 bg-background z-[100] flex flex-col items-center justify-center p-4 comic-arena">
        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150, delay: 0.2 }}
          >
            <h1 className="comic-title text-3xl md:text-5xl text-white mb-4">
              Board Bombers
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-sm space-y-4"
          >
            <div className="min-h-[20px] text-center">
              {status === 'checking' && (
                <p className="text-sm text-slate-300 animate-pulse">Verificando datos...</p>
              )}
              {status === 'downloading' && (
                <p className="text-sm text-slate-300">Descargando datos iniciales...</p>
              )}
            </div>
            
            <Progress value={progress} className="h-4 border-2 border-black shadow-[0_3px_0_#020617]" />
            
            <div className="flex justify-between items-center">
                <p className="text-xs text-slate-400">
                    Esto solo tomará un momento.
                </p>
                <p className="font-mono font-bold text-lg text-white">{progress}%</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
