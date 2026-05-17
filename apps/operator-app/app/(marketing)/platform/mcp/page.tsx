import { Heading2, Body, GlassCard, CodeBlock, FadeIn, Badge } from '@/app/_components/ui';

const tomTools = ['tom.query', 'tom.propose_action', 'tom.update_mind', 'tom.list_objectives', 'tom.list_inbox', 'tom.boundary_send'];
const timTools = ['tim.query', 'tim.list_objectives', 'tim.propose_update', 'tim.team_brief', 'tim.list_members'];

export default function McpPage() {
  return (
    <div className='space-y-10'>
      <FadeIn>
        <Badge label='MCP' variant='teal' />
        <Heading2 className='mt-3'><span className='gradient-text'>Model Context Protocol</span></Heading2>
        <Body dim className='mt-2'>Tom and Tim expose JSON-RPC 2.0 MCP servers. Any MCP-compatible client can call them — Claude Desktop, Cursor, or your own orchestrator.</Body>
      </FadeIn>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <FadeIn>
          <GlassCard className='p-5' glow='accent'>
            <div className='text-sm font-medium gradient-text'>Tom MCP Server</div>
            <div className='text-xs text-[var(--v-text-dim)] mt-1'>Personal co-pilot tools — 12 tests</div>
            <div className='mt-3 space-y-1'>{tomTools.map(t => <div key={t} className='text-xs font-mono text-[var(--v-text-dim)]'>{t}</div>)}</div>
          </GlassCard>
        </FadeIn>
        <FadeIn delay={100}>
          <GlassCard className='p-5' glow='teal'>
            <div className='text-sm font-medium gradient-text'>Tim MCP Server</div>
            <div className='text-xs text-[var(--v-text-dim)] mt-1'>Team coordinator tools — 5 tests</div>
            <div className='mt-3 space-y-1'>{timTools.map(t => <div key={t} className='text-xs font-mono text-[var(--v-text-dim)]'>{t}</div>)}</div>
          </GlassCard>
        </FadeIn>
      </div>

      <FadeIn>
        <CodeBlock lang='json' code={`// Call Tom from any MCP client:\n{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"tom.query","arguments":{"query":"What's our pipeline health?"}}}\n\n// Response:\n{"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"Pipeline at 78% of Q quota...\\n\\nSources:\\n1. HubSpot pipeline report (2026-05-12)"}]}}`} />
      </FadeIn>
    </div>
  );
}
