#!/usr/bin/env node
import('../src/index.ts').catch(() => import('../dist/index.js'));
