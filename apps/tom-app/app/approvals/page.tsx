import Link from 'next/link';
import { getPendingApprovals } from '../actions/inbox';
import { readWorkspace, getTomName } from '../lib/workspace';
import { ApprovalsClient } from './approvals-client';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  const [w, approvals] = await Promise.all([readWorkspace(), getPendingApprovals()]);
  const tomName = getTomName(w);
  return (
    <>
      <header className='px-5 pt-6 pb-3 border-b border-[var(--tom-border)]'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-semibold tracking-tight'>Approvals</h1>
          <Link href='/' className='text-xs text-[var(--tom-text-dim)] hover:text-[var(--tom-text)]'>← Home</Link>
        </div>
        <p className='text-xs text-[var(--tom-text-dim)] mt-0.5'>{approvals.length} decision{approvals.length === 1 ? '' : 's'} waiting</p>
      </header>
      <ApprovalsClient initialApprovals={approvals} tomName={tomName} />
    </>
  );
}
