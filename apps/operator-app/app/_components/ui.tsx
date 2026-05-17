import type { ReactNode } from 'react';

export function GlassCard({ children, className = '', hover = true, glow }: { children: ReactNode; className?: string; hover?: boolean; glow?: 'accent' | 'teal' }) {
  const glowClass = glow === 'accent' ? 'glow-accent' : glow === 'teal' ? 'glow-teal' : '';
  return (
    <div className={`glass ${hover ? 'glass-hover transition-v' : ''} ${glowClass} ${className}`}>
      {children}
    </div>
  );
}

export function GradientOrb({ size = 400, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full opacity-30 blur-3xl ${className}`}
      style={{
        width: size, height: size,
        background: 'radial-gradient(circle, var(--v-accent) 0%, transparent 70%)',
        left: '50%', top: '30%',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className='text-[11px] uppercase tracking-[0.16em] text-[var(--v-text-muted)] font-medium mb-3'>{children}</div>;
}

export function Heading1({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h1 className={`font-display text-3xl md:text-4xl font-semibold tracking-tighter-display leading-tight ${className}`}>{children}</h1>;
}

export function Heading2({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`font-display text-xl md:text-2xl font-semibold tracking-tighter-display leading-tight ${className}`}>{children}</h2>;
}

export function Body({ children, dim = false, className = '' }: { children: ReactNode; dim?: boolean; className?: string }) {
  return <p className={`text-sm leading-relaxed ${dim ? 'text-[var(--v-text-dim)]' : 'text-[var(--v-text)]'} ${className}`}>{children}</p>;
}

export function GradientButton({ children, variant = 'primary', className = '', ...props }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost'; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = 'px-5 py-2.5 rounded-[var(--v-radius)] text-sm font-medium transition-v inline-flex items-center gap-2';
  const styles = variant === 'primary'
    ? 'bg-[var(--v-accent)] text-white hover:brightness-110 glow-accent'
    : variant === 'secondary'
      ? 'glass hover:bg-[var(--v-surface-2)] text-[var(--v-text)]'
      : 'text-[var(--v-text-dim)] hover:text-[var(--v-text)] hover:bg-[var(--v-surface-2)]';
  return <button className={`${base} ${styles} ${className}`} {...props}>{children}</button>;
}

export function Badge({ label, variant = 'default' }: { label: string; variant?: 'default' | 'accent' | 'teal' | 'rose' | 'amber' | 'green' }) {
  const colors = {
    default: 'bg-[var(--v-surface-2)] text-[var(--v-text-dim)]',
    accent: 'bg-[var(--v-accent-soft)] text-[var(--v-accent)]',
    teal: 'bg-[var(--v-teal-soft)] text-[var(--v-teal)]',
    rose: 'bg-[var(--v-rose-soft)] text-[var(--v-rose)]',
    amber: 'bg-[var(--v-amber-soft)] text-[var(--v-amber)]',
    green: 'bg-[var(--v-green-soft)] text-[var(--v-green)]',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[variant]}`}>{label}</span>;
}

export function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className='glass rounded-[var(--v-radius)] overflow-hidden'>
      <div className='flex items-center gap-2 px-4 py-2 border-b border-[var(--v-border)]'>
        <span className='text-[10px] uppercase tracking-widest text-[var(--v-text-muted)]'>{lang}</span>
      </div>
      <pre className='px-4 py-3 text-sm text-[var(--v-text)] overflow-x-auto font-mono'><code>{code}</code></pre>
    </div>
  );
}

export function Metric({ label, value, hint, trend }: { label: string; value: string; hint?: string; trend?: 'up' | 'down' }) {
  return (
    <GlassCard className='p-4'>
      <div className='text-[10px] uppercase tracking-[0.16em] text-[var(--v-text-muted)] mb-1'>{label}</div>
      <div className='text-2xl font-semibold tracking-tight font-display'>{value}</div>
      {hint ? <div className='text-xs text-[var(--v-text-dim)] mt-0.5'>{hint}</div> : null}
      {trend ? <div className={`text-xs mt-0.5 ${trend === 'up' ? 'text-[var(--v-green)]' : 'text-[var(--v-rose)]'}`}>{trend === 'up' ? '\u2191' : '\u2193'}</div> : null}
    </GlassCard>
  );
}

export function StatusDot({ status }: { status: 'ok' | 'warn' | 'err' | 'off' }) {
  const color = status === 'ok' ? 'bg-[var(--v-green)]' : status === 'warn' ? 'bg-[var(--v-amber)]' : status === 'err' ? 'bg-[var(--v-rose)]' : 'bg-[var(--v-text-muted)]';
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />;
}

export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return <div className='animate-fade-up' style={{ animationDelay: `${delay}ms` }}>{children}</div>;
}
