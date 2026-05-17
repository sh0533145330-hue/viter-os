import type { ReactNode } from 'react';

export const metadata = { title: 'VitaOS — the platform', description: 'CLI, MCP, SDK, Packs, Eval — everything that makes VitaOS extensible.' };

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className='min-h-screen'>
      <nav className='border-b border-[var(--v-border-subtle)] bg-[var(--v-glass-bg)] backdrop-blur-md sticky top-0 z-50'>
        <div className='max-w-5xl mx-auto px-6 h-12 flex items-center justify-between'>
          <a href='/' className='font-display font-semibold tracking-tighter-display text-sm gradient-text'>VitaOS</a>
          <div className='flex gap-4 text-xs text-[var(--v-text-dim)]'>
            {['overview', 'cli', 'mcp', 'packs', 'eval', 'sdk', 'security'].map(p => (
              <a key={p} href={`/platform/${p}`} className='capitalize hover:text-[var(--v-text)] transition-v'>{p}</a>
            ))}
          </div>
          <a href='/welcome' className='text-xs text-[var(--v-accent)] hover:underline'>Launch app</a>
        </div>
      </nav>
      <main className='max-w-5xl mx-auto px-6 py-12'>{children}</main>
    </div>
  );
}
