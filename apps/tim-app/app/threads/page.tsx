import Link from 'next/link';
import { readWorkspace, getTimName, getTomName } from '../lib/workspace';

export const dynamic = 'force-dynamic';

export default async function ThreadsPage() {
  const w = await readWorkspace();
  const timName = getTimName(w);
  const tomName = getTomName(w);
  return (
    <>
      <header className='px-5 pt-6 pb-3 border-b border-[var(--tim-border)]'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-semibold tracking-tight'>Threads</h1>
          <Link href='/' className='text-xs text-[var(--tim-text-dim)]'>← Back</Link>
        </div>
        <p className='text-xs text-[var(--tim-text-dim)] mt-0.5'>{timName} routes cross-team conversations.</p>
      </header>
      <div className='flex-1 flex items-center justify-center text-center px-6'>
        <div>
          <div className='text-4xl mb-3'>⟵ ⟶</div>
          <div className='text-sm font-medium'>Threads coming in v2</div>
          <p className='text-xs text-[var(--tim-text-dim)] mt-2 max-w-xs'>
            {timName} will route tasks between team members' {tomName}s via the MCP thread protocol. Each {tomName} instance maintains a private context while {timName} orchestrates shared goals.
          </p>
          <Link href='/' className='text-xs text-[var(--tim-accent)] hover:underline mt-3 inline-block'>← Back to team room</Link>
        </div>
      </div>
    </>
  );
}
