'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sections: Array<{ section: string; items: Array<{ href: string; label: string }> }> = [
  { section: 'Overview', items: [
    { href: '/app', label: 'Home' },
    { href: '/app/briefings', label: 'Briefings' },
    { href: '/app/inbox', label: 'Inbox' },
  ]},
  { section: 'Context', items: [
    { href: '/app/search', label: 'Search & Ask' },
    { href: '/app/ontology', label: 'Ontology' },
    { href: '/app/lineage', label: 'Lineage' },
  ]},
  { section: 'Engine', items: [
    { href: '/app/workflows', label: 'Workflows' },
    { href: '/app/blocks', label: 'Blocks' },
    { href: '/app/agents', label: 'Agents' },
  ]},
  { section: 'Govern', items: [
    { href: '/app/approvals', label: 'Approvals' },
    { href: '/app/policies', label: 'Policies' },
  ]},
  { section: 'Build', items: [
    { href: '/app/library', label: 'Library' },
    { href: '/app/connectors', label: 'Sources' },
  ]},
  { section: 'Admin', items: [
    { href: '/app/settings/billing', label: 'Billing' },
    { href: '/app/settings/team', label: 'Team' },
    { href: '/app/settings/brand', label: 'Brand' },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className='w-56 shrink-0 border-r border-[var(--v-border-subtle)] bg-[var(--v-surface)] flex flex-col'>
      <div className='px-4 py-4 border-b border-[var(--v-border-subtle)]'>
        <Link href='/app' className='flex items-center gap-2.5'>
          <div className='w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--v-accent)] to-[var(--v-teal)] flex items-center justify-center text-white text-xs font-bold shrink-0'>V</div>
          <span className='font-display font-semibold tracking-tighter-display text-sm'>VitaOS</span>
        </Link>
      </div>

      <nav className='flex-1 overflow-y-auto py-2 space-y-0.5'>
        {sections.map(s => (
          <div key={s.section}>
            <div className='px-4 pt-3.5 pb-1 text-[10px] uppercase tracking-[0.18em] text-[var(--v-text-muted)] font-medium'>{s.section}</div>
            {s.items.map(item => {
              const active = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href + '/'));
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 mx-1 text-[13px] rounded-lg transition-v ${
                    active
                      ? 'bg-[var(--v-accent-soft)] text-[var(--v-accent)] font-medium'
                      : 'text-[var(--v-text-dim)] hover:text-[var(--v-text)] hover:bg-[var(--v-surface-2)]'
                  }`}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className='px-4 py-3 border-t border-[var(--v-border-subtle)]'>
        <div className='flex items-center gap-2 text-xs text-[var(--v-text-dim)]'>
          <span className='w-1.5 h-1.5 rounded-full bg-[var(--v-green)] shrink-0' />
          <span>Agents live</span>
        </div>
        <div className='mt-2 flex gap-2'>
          <Link href='/platform/overview' className='text-[10px] text-[var(--v-text-muted)] hover:text-[var(--v-text)] transition-v'>Platform</Link>
          <span className='text-[var(--v-text-muted)]'>·</span>
          <Link href='/welcome' className='text-[10px] text-[var(--v-text-muted)] hover:text-[var(--v-text)] transition-v'>Setup</Link>
        </div>
      </div>
    </aside>
  );
}
