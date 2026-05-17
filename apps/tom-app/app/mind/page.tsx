export default function MindPage() {
  const sections = [
    { name: 'About me', count: 14 },
    { name: 'People', count: 86 },
    { name: 'Preferences', count: 9 },
    { name: 'Open loops', count: 5 },
    { name: 'Goals', count: 4 },
  ];
  return (
    <>
      <header className='px-5 pt-6 pb-3'>
        <h1 className='text-2xl font-semibold tracking-tight'>Mind</h1>
        <p className='text-sm text-[var(--tom-text-dim)]'>What Tom remembers about you. Edit anything — Tom respects your boundaries.</p>
      </header>
      <main className='flex-1 overflow-y-auto px-5 pb-4'>
        <ul className='space-y-2'>
          {sections.map(s => (
            <li key={s.name} className='rounded-xl bg-[var(--tom-surface)] border border-[var(--tom-border)] p-3 flex justify-between'>
              <span className='text-sm'>{s.name}</span>
              <span className='text-xs text-[var(--tom-text-dim)]'>{s.count} facts</span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
