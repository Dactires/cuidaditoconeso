import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Inter, Bangers } from 'next/font/google';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { MusicProvider } from '@/hooks/use-music-player';

export const metadata: Metadata = {
  title: 'Board Bombers',
  description: 'A strategic card game of risk and reward.',
};

const bangers = Bangers({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bangers',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className={cn('antialiased h-full bg-background font-body', bangers.variable, inter.variable)}>
        <FirebaseClientProvider>
            <MusicProvider>
              <main className="h-full">{children}</main>
              <Toaster />
            </MusicProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
