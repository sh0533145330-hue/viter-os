import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tim — your team co-pilot',
  description: 'Tim is the shared brain of the team. Routes team-level actions through everyone\'s Tom.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0a1410',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <body className='min-h-screen'>
        <div className='max-w-2xl mx-auto h-screen flex flex-col'>{children}</div>
      </body>
    </html>
  );
}
