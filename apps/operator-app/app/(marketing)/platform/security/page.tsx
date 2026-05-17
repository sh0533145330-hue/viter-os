import { Heading2, Body, GlassCard, FadeIn, Badge } from '@/app/_components/ui';

const securityPkgs = [
  { pkg: '@vita/anonymization', desc: 'PII redactor (HIPAA strict), k-anonymity, Laplace noise, synthetic data, consent manager', tests: 42 },
  { pkg: '@vita/key-custody', desc: 'Envelope encryption with AWS/GCP/KMS providers, key rotation', tests: 18 },
  { pkg: '@vita/security', desc: 'BreakGlass, DSR handler, AbuseManager, ComplianceMapper (SOC2/GDPR/HIPAA)', tests: 27 },
  { pkg: '@vita/observability', desc: 'PII redaction in logs, OTEL trace context, MetricsRegistry, SLOTracker, 11 alert rules, 10 runbooks', tests: 75 },
];

export default function SecurityPage() {
  return (
    <div className='space-y-10'>
      <FadeIn>
        <Badge label='Security' variant='rose' />
        <Heading2 className='mt-3'><span className='gradient-text'>Security, privacy, and compliance</span></Heading2>
        <Body dim className='mt-2'>Defense in depth. PII redaction, encryption at rest and in transit, break-glass procedures, DSR automation, and continuous compliance mapping.</Body>
      </FadeIn>
      <div className='space-y-3'>
        {securityPkgs.map(s => (
          <GlassCard key={s.pkg} className='p-4' hover>
            <div className='flex justify-between items-start'>
              <div><code className='text-[var(--v-rose)] text-sm'>{s.pkg}</code><div className='text-xs text-[var(--v-text-dim)] mt-1'>{s.desc}</div></div>
              <Badge label={`${s.tests} tests`} variant='rose' />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
