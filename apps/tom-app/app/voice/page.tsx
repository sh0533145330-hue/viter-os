export default function VoicePage() {
  return (
    <>
      <header className='px-5 pt-6 pb-3'>
        <h1 className='text-2xl font-semibold tracking-tight'>Voice</h1>
        <p className='text-sm text-[var(--tom-text-dim)]'>Talk to Tom hands-free. Live transcription with confidence highlighting.</p>
      </header>
      <main className='flex-1 flex flex-col items-center justify-center gap-6 px-5 pb-4'>
        <div className='h-32 w-32 rounded-full bg-[var(--tom-accent)]/30 border border-[var(--tom-accent)] flex items-center justify-center'>
          <div className='h-20 w-20 rounded-full bg-[var(--tom-accent)] flex items-center justify-center text-2xl'>●</div>
        </div>
        <div className='text-sm text-[var(--tom-text-dim)] text-center'>Tap to start. Tom will respond in real time and confirm any external action.</div>
      </main>
    </>
  );
}
