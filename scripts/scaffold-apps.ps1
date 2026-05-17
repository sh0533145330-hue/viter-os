param([switch]$Force)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")

function Write-File($path, $content) {
  $dir = Split-Path -Parent $path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  if ((Test-Path $path) -and -not $Force) { return }
  Set-Content -Path $path -Value $content -NoNewline -Encoding UTF8
}

# ---- Next.js apps (tom-app, tim-app) ----
$nextApps = @(
  @{ name = "tom-app"; pkg = "tom"; port = 3001; title = "Tom"; desc = "Tom personal PWA (Next.js 14)."; isPwa = $true },
  @{ name = "tim-app"; pkg = "tim"; port = 3002; title = "Tim"; desc = "Tim team app (Next.js 14)." }
)

foreach ($a in $nextApps) {
  $appRoot = Join-Path $root "apps/$($a.name)"

  $pkgJson = @"
{
  "name": "@vita/app-$($a.pkg)",
  "version": "0.0.0",
  "type": "module",
  "private": true,
  "license": "UNLICENSED",
  "description": "$($a.desc)",
  "scripts": {
    "dev": "next dev -p $($a.port)",
    "build": "next build",
    "start": "next start -p $($a.port)",
    "lint": "biome check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@vita/config": "workspace:*",
    "@vita/observability": "workspace:*",
    "@vita/ui": "workspace:*",
    "next": "^14.2.18",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.17.6",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.3",
    "vitest": "^2.1.4"
  }
}
"@
  Write-File (Join-Path $appRoot "package.json") $pkgJson

  $tsconfig = @"
{
  "extends": "../../packages/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next", "dist"]
}
"@
  Write-File (Join-Path $appRoot "tsconfig.json") $tsconfig

  $nextCfg = @"
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  transpilePackages: ['@vita/ui', '@vita/observability', '@vita/config'],
};

export default nextConfig;
"@
  Write-File (Join-Path $appRoot "next.config.mjs") $nextCfg

  $layoutTsx = @"
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'VitaOS $($a.title)',
  description: 'VitaOS $($a.title).',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
"@
  Write-File (Join-Path $appRoot "app/layout.tsx") $layoutTsx

  $pageTsx = @"
export default function Page() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-8'>
      <h1 className='text-2xl font-semibold'>VitaOS $($a.title)</h1>
      <p className='text-sm opacity-70'>Placeholder. Wired in later epics.</p>
    </main>
  );
}
"@
  Write-File (Join-Path $appRoot "app/page.tsx") $pageTsx

  Write-File (Join-Path $appRoot "app/globals.css") "@tailwind base;`n@tailwind components;`n@tailwind utilities;`n"

  $tailwindCfg = @"
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};

export default config;
"@
  Write-File (Join-Path $appRoot "tailwind.config.ts") $tailwindCfg

  $postcssCfg = @"
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
"@
  Write-File (Join-Path $appRoot "postcss.config.mjs") $postcssCfg

  Write-File (Join-Path $appRoot "next-env.d.ts") "/// <reference types=`"next`" />`n/// <reference types=`"next/image-types/global`" />`n"

  $vitestCfg = @"
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/app-$($a.pkg)',
    environment: 'jsdom',
    include: ['**/*.{test,spec}.{ts,tsx}'],
  },
});
"@
  Write-File (Join-Path $appRoot "vitest.config.ts") $vitestCfg

  Write-File (Join-Path $appRoot "README.md") "# @vita/app-$($a.pkg)`n`n$($a.desc)`n"
}

# ---- Node service apps (MCP servers + workers) ----
$nodeApps = @(
  @{ name = "tom-mcp"; pkg = "tom-mcp"; desc = "Tom MCP server." },
  @{ name = "tim-mcp"; pkg = "tim-mcp"; desc = "Tim MCP server." },
  @{ name = "worker-extractor"; pkg = "worker-extractor"; desc = "L0 to L1 extraction worker." },
  @{ name = "worker-ontology"; pkg = "worker-ontology"; desc = "L1 to L2 ontology worker." },
  @{ name = "worker-engine"; pkg = "worker-engine"; desc = "Workflow runner." },
  @{ name = "worker-notifier"; pkg = "worker-notifier"; desc = "Notifications fan-out." },
  @{ name = "worker-tuner"; pkg = "worker-tuner"; desc = "Fine-tuning worker." }
)

foreach ($a in $nodeApps) {
  $appRoot = Join-Path $root "apps/$($a.name)"

  $pkgJson = @"
{
  "name": "@vita/app-$($a.pkg)",
  "version": "0.0.0",
  "type": "module",
  "private": true,
  "license": "UNLICENSED",
  "description": "$($a.desc)",
  "main": "./dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "biome check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@vita/config": "workspace:*",
    "@vita/observability": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.17.6",
    "tsx": "^4.19.2",
    "typescript": "^5.6.3",
    "vitest": "^2.1.4"
  }
}
"@
  Write-File (Join-Path $appRoot "package.json") $pkgJson

  $tsconfig = @"
{
  "extends": "../../packages/tsconfig/base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
"@
  Write-File (Join-Path $appRoot "tsconfig.json") $tsconfig

  $indexTs = @"
import { createLogger } from '@vita/observability';

const logger = createLogger('$($a.pkg)');

async function main(): Promise<void> {
  logger.info({ event: 'startup' }, '$($a.pkg) starting');

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'graceful shutdown');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, '$($a.pkg) failed to start');
  process.exit(1);
});
"@
  Write-File (Join-Path $appRoot "src/index.ts") $indexTs

  $vitestCfg = @"
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@vita/app-$($a.pkg)',
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
"@
  Write-File (Join-Path $appRoot "vitest.config.ts") $vitestCfg

  Write-File (Join-Path $appRoot "README.md") "# @vita/app-$($a.pkg)`n`n$($a.desc)`n"
}

Write-Host "Apps scaffold complete."
