import type { ReactNode } from 'react';

export const metadata = { title: 'VitaOS — set up your context engine' };

export default function OnboardingGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div className='min-h-screen mesh-bg flex items-center justify-center'>
      <div className='w-full max-w-lg mx-auto px-4 py-12'>{children}</div>
    </div>
  );
}
