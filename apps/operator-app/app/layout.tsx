import type { ReactNode } from 'react';
import './globals.css';

export const metadata = { title: 'VitaOS', description: 'Your 360 context engine — Tom, Tim, ontology, and AI workforce.' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <body className='min-h-screen mesh-bg antialiased'>{children}</body>
    </html>
  );
}
