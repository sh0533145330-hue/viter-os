import { describe, expect, it } from 'vitest';

import { Button } from './Button.js';

describe('Button', () => {
  it('is a function component', () => {
    expect(typeof Button).toBe('function');
  });
});
