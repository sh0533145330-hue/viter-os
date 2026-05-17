'use client';
import { useState } from 'react';
import { Heading2, Body, GradientButton } from '@/app/_components/ui';

const industries = ['Agency / Consulting', 'SaaS', 'E-commerce', 'Professional Services', 'Real Estate', 'Finance', 'Other'];

export default function WorkspacePage() {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  return (
    <div className='animate-fade-up space-y-6'>
      <div className='text-[10px] uppercase tracking-[0.22em] text-[var(--v-text-muted)]'>Step 1 of 6</div>
      <Heading2>Name your workspace</Heading2>
      <Body dim>This becomes your VitaOS instance name and Postgres namespace.</Body>
      <div className='space-y-4'>
        <label className='block'>
          <span className='text-xs text-[var(--v-text-dim)] mb-1 block'>Workspace name</span>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder='e.g. Acme Corp'
            className='w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--v-text)] placeholder:text-[var(--v-text-muted)] focus:outline-none focus:border-[var(--v-accent)] transition-v'
          />
        </label>
        <label className='block'>
          <span className='text-xs text-[var(--v-text-dim)] mb-1 block'>Industry</span>
          <select
            value={industry} onChange={e => setIndustry(e.target.value)}
            className='w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--v-text)] focus:outline-none focus:border-[var(--v-accent)] transition-v appearance-none'
          >
            <option value=''>Select...</option>
            {industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>
      </div>
      <div className='flex justify-between'>
        <a href='/welcome'><GradientButton variant='ghost'>Back</GradientButton></a>
        <a href='/welcome/supabase'><GradientButton variant='primary' disabled={!name}>Continue</GradientButton></a>
      </div>
    </div>
  );
}
