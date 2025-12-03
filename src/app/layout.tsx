import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { VT323 } from 'next/font/google'

export const metadata: Metadata = {
  title: 'Board Bombers',
  description: 'A strategic card game of risk and reward.',
};

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className={cn('antialiased h-full bg-background', vt323.variable)}>
        <main className="h-full font-sans">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
