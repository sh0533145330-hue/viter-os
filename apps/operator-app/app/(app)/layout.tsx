import type { ReactNode } from 'react';

export const metadata = { title: 'VitaOS Operator', description: 'Your 360 context engine.' };

export default function AppLayout({ children }: { children: ReactNode }) {
  return <div className='min-h-screen mesh-bg flex'>{children}</div>;
}
