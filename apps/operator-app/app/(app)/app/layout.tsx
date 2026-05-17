import type { ReactNode } from 'react';
import { Sidebar } from '@/app/_components/app-sidebar';
import { Topbar } from '@/app/_components/app-topbar';

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div className='flex min-h-screen w-full'>
      <Sidebar />
      <div className='flex-1 flex flex-col min-w-0'>
        <Topbar />
        <main className='flex-1 overflow-y-auto px-6 py-5'>{children}</main>
      </div>
    </div>
  );
}
