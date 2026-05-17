import Link from 'next/link';
import { getInboxMessages } from '../actions/inbox';
import { readWorkspace, getTomName } from '../lib/workspace';

export const dynamic = 'force-dynamic';

function relTime(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return 'just now';
  if (d < 3600000) return `${Math.floor(d / 60000)}m`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h`;
  return `${Math.floor(d / 86400000)}d`;
}

export default async function InboxPage() {
  const [w, messages] = await Promise.all([readWorkspace(), getInboxMessages(30)]);
  const tomName = getTomName(w);
  return (
    <>
      <header className='px-5 pt-6 pb-3 border-b border-[var(--tom-border)]'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-semibold tracking-tight'>Inbox</h1>
          <Link href='/' className='text-xs text-[var(--tom-text-dim)] hover:text-[var(--tom-text)]'>← Home</Link>
        </div>
        <p className='text-xs text-[var(--tom-text-dim)] mt-0.5'>{messages.length} messages</p>
      </header>
      <div className='flex-1 overflow-y-auto px-4 py-4'>
        {messages.length === 0 ? (
          <div className='text-center py-12 text-sm text-[var(--tom-text-dim)]'>
            <div className='text-3xl mb-3'>📭</div>
            <p>No messages yet.</p>
            <Link href='/ask' className='text-[var(--tom-accent)] hover:underline mt-1 inline-block'>Start a conversation →</Link>
          </div>
        ) : (
          <ul className='space-y-2'>
            {messages.map(m => (
              <li key={m.id} className={`rounded-xl border p-3 text-sm ${m.role === 'user' ? 'bg-[var(--tom-surface-2)] border-[var(--tom-border)] ml-4' : 'bg-[var(--tom-accent-soft)] border-[var(--tom-accent)]/30 mr-4'}`}>
                <div className='flex items-center gap-2 mb-1'>
                  <span className='text-[10px] font-medium text-[var(--tom-text-dim)]'>{m.role === 'user' ? 'You' : tomName}</span>
                  <span className='text-[10px] text-[var(--tom-text-dim)]'>{relTime(m.createdAt)}</span>
                </div>
                <p className='leading-relaxed line-clamp-3'>{m.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
