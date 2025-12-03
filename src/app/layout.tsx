import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Press_Start_2P, Inter } from 'next/font/google';
import '@fontsource/press-start-2p';

export const metadata: Metadata = {
  title: 'Board Bombers',
  description: 'A strategic card game of risk and reward.',
};

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start-2p',
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
      <body className={cn('antialiased h-full bg-background font-sans', pressStart2P.variable, inter.variable)}>
        <main className="h-full">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
