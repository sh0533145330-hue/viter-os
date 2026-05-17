import { describe, it, expect } from 'vitest';
import { parseArgs } from './args.js';

describe('parseArgs', () => {
  it('parses command alone', () => {
    expect(parseArgs(['doctor'])).toEqual({ command: 'doctor', subcommand: undefined, positional: [], flags: {} });
  });

  it('parses command + subcommand + name', () => {
    const r = parseArgs(['new', 'block', 'hello-world']);
    expect(r.command).toBe('new');
    expect(r.subcommand).toBe('block');
    expect(r.positional).toEqual(['hello-world']);
  });

  it('parses long flag with value', () => {
    const r = parseArgs(['new', 'block', 'x', '--dir', '/tmp/out']);
    expect(r.flags['dir']).toBe('/tmp/out');
  });

  it('parses bare long flag as boolean', () => {
    const r = parseArgs(['new', 'block', 'x', '--force']);
    expect(r.flags['force']).toBe(true);
  });

  it('treats short flag as boolean', () => {
    const r = parseArgs(['help', '-h']);
    expect(r.flags['h']).toBe(true);
  });

  it('defaults to help when empty', () => {
    expect(parseArgs([]).command).toBe('help');
  });
});
