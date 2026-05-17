import Link from 'next/link';
import { getInboxMessages } from '../actions/inbox';
import { readWorkspace, getTomName } from '../lib/workspace';

export const dynamic = 'force-dynamic';

export default async function BriefingsPage() {
  const [w, messages] = await Promise.all([readWorkspace(), getInboxMessages(50)]);
  const tomName = getTomName(w);
  const briefings = messages.filter(m => m.role === 'assistant');

  return (
    <>
      <header className='px-5 pt-6 pb-3 border-b border-[var(--tom-border)]'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-semibold tracking-tight'>Briefings</h1>
          <Link href='/' className='text-xs text-[var(--tom-text-dim)] hover:text-[var(--tom-text)]'>← Home</Link>
        </div>
        <p className='text-xs text-[var(--tom-text-dim)] mt-0.5'>What {tomName} has told you.</p>
      </header>
      <div className='flex-1 overflow-y-auto px-4 py-4 space-y-3'>
        {briefings.length === 0 ? (
          <div className='text-center py-12 text-sm text-[var(--tom-text-dim)]'>
            <div className='text-3xl mb-3'>☀</div>
            <p>No briefings yet.</p>
            <Link href='/ask' className='text-[var(--tom-accent)] hover:underline mt-1 inline-block'>Ask {tomName} for a briefing →</Link>
          </div>
        ) : (
          briefings.map(m => (
            <div key={m.id} className='rounded-xl bg-[var(--tom-accent-soft)] border border-[var(--tom-accent)]/30 p-4'>
              <div className='text-[10px] text-[var(--tom-text-dim)] mb-2'>{new Date(m.createdAt).toLocaleString()}</div>
              <p className='text-sm leading-relaxed whitespace-pre-wrap'>{m.content}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}
