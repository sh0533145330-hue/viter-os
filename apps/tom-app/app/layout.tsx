import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tom — your co-pilot',
  description: 'Tom remembers, reasons, drafts, and acts within your boundaries.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0b1020',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <body className='min-h-screen'>
        <div className='max-w-md mx-auto h-screen flex flex-col'>{children}</div>
      </body>
    </html>
  );
}
