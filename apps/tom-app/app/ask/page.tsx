import { readWorkspace, getTomName } from '../lib/workspace';
import { AskClient } from './ask-client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AskPage() {
  const w = await readWorkspace();
  const tomName = getTomName(w);
  return (
    <>
      <header className='px-5 pt-6 pb-3 border-b border-[var(--tom-border)]'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-semibold tracking-tight'>Ask {tomName}</h1>
          <Link href='/' className='text-xs text-[var(--tom-text-dim)] hover:text-[var(--tom-text)]'>← Home</Link>
        </div>
        <p className='text-xs text-[var(--tom-text-dim)] mt-0.5'>Full context: inbox, calendar, deals, docs, and your Mind.</p>
      </header>
      <AskClient tomName={tomName} />
    </>
  );
}
