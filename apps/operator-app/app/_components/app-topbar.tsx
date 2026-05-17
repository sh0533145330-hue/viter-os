'use client';
export function Topbar() {
  return (
    <header className='h-11 shrink-0 border-b border-[var(--v-border-subtle)] bg-[var(--v-surface)] flex items-center px-4 gap-3'>
      <input
        type='search'
        placeholder='Ask Tom or search anything  \u2318K'
        className='flex-1 max-w-lg bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--v-text)] placeholder:text-[var(--v-text-muted)] focus:outline-none focus:border-[var(--v-accent)] focus:ring-1 focus:ring-[var(--v-accent-soft)] transition-v'
      />
      <div className='flex items-center gap-2'>
        <div className='w-6 h-6 rounded-full bg-gradient-to-br from-[var(--v-accent)] to-[var(--v-teal)] text-[10px] text-white flex items-center justify-center font-bold'>U</div>
      </div>
    </header>
  );
}
