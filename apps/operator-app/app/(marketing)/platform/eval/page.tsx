import { Heading2, Body, GlassCard, CodeBlock, FadeIn, Badge } from '@/app/_components/ui';

export default function EvalPage() {
  return (
    <div className='space-y-10'>
      <FadeIn>
        <Badge label='Eval' variant='teal' />
        <Heading2 className='mt-3'><span className='gradient-text'>Evaluation framework</span></Heading2>
        <Body dim className='mt-2'>Define eval suites, run them, assert with a rich DSL. BLEU, ROUGE-lite, semantic similarity. Gates prevent deployment if quality drops. 100 tests.</Body>
      </FadeIn>
      <FadeIn delay={100}>
        <CodeBlock lang='typescript' code={`import { defineEvalSuite, runEval } from '@vita/eval';

const suite = defineEvalSuite({
  name: 'tom-qa-v1',
  description: 'Tom answer quality over real workspace data',
  cases: [
    { input: 'What is our pipeline health?', expected: /\\d+%.*quota/i, category: 'qa' },
    { input: 'Who owns the Acme renewal?', expected: /Sarah|Marcus/, category: 'qa' },
  ],
  assertions: [
    { kind: 'contains', expected: 'citations' },
    { kind: 'bleu', threshold: 0.4 },
    { kind: 'latency', maxMs: 5000 },
  ],
  gate: { passRate: 0.8, avgBleu: 0.35 },
});

const report = await runEval(suite, { model: 'anthropic/claude-3.5-sonnet' });
// → { passed: 0.9, avgBleu: 0.52, gateOpen: true }`} />
      </FadeIn>
    </div>
  );
}
