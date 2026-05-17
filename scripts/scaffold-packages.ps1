param([switch]$Force)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")

$ossPackages = @(
  @{ name = "agents"; desc = "OSS MIT. Agent SDK: defineAgent, defineSkill, agent runtime contracts." },
  @{ name = "blocks-builtin"; desc = "OSS MIT. Built-in blocks shipped with the runtime." },
  @{ name = "agents-builtin"; desc = "OSS MIT. Built-in agents (Tom, Tim baseline definitions)." },
  @{ name = "pack-sdk"; desc = "OSS MIT. Knowledge Pack SDK: definePack, pack lifecycle." },
  @{ name = "connector-sdk"; desc = "OSS MIT. Connector SDK: defineConnector, OAuth/webhook contracts." }
)

$closedPackages = @(
  @{ name = "ui"; desc = "Shared design system: primitives, theme, Tom card surface, Org switcher." },
  @{ name = "auth"; desc = "Auth surface: session, roles, identity providers, audit shape." },
  @{ name = "policy"; desc = "Cedar policy engine wrapper for authorization decisions." },
  @{ name = "anonymization"; desc = "PII anonymization for L0 ingest and prompt fan-out." },
  @{ name = "branding"; desc = "Brand identity resolution and white-label tokens." },
  @{ name = "billing"; desc = "Stripe billing helpers and entitlements." },
  @{ name = "voice"; desc = "Voice provider abstraction (Vapi + Twilio)." },
  @{ name = "timeseries"; desc = "Time-series helpers for metrics and counters." },
  @{ name = "eval"; desc = "Eval suite definitions and runner (EP-19)." },
  @{ name = "db"; desc = "Drizzle schemas, migrations, storage abstraction." }
)

function Write-File($path, $content) {
  $dir = Split-Path -Parent $path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  if ((Test-Path $path) -and -not $Force) { return }
  Set-Content -Path $path -Value $content -NoNewline -Encoding UTF8
}

function New-LibPackage($name, $license, $description) {
  $isOss = ($license -eq "MIT")
  $pkgRoot = Join-Path $root "packages/$name"

  $publishLine = if ($isOss) { '"publishConfig": { "access": "public" },' } else { '"private": true,' }

  $pkgJsonLines = @()
  $pkgJsonLines += '{'
  $pkgJsonLines += "  `"name`": `"@vita/$name`","
  $pkgJsonLines += '  "version": "0.0.0",'
  $pkgJsonLines += '  "type": "module",'
  $pkgJsonLines += "  `"license`": `"$license`","
  $pkgJsonLines += "  `"description`": `"$description`","
  $pkgJsonLines += "  $publishLine"
  $pkgJsonLines += '  "main": "./src/index.ts",'
  $pkgJsonLines += '  "module": "./src/index.ts",'
  $pkgJsonLines += '  "types": "./src/index.ts",'
  $pkgJsonLines += '  "exports": {'
  $pkgJsonLines += '    ".": {'
  $pkgJsonLines += '      "types": "./src/index.ts",'
  $pkgJsonLines += '      "import": "./src/index.ts"'
  $pkgJsonLines += '    }'
  $pkgJsonLines += '  },'
  $pkgJsonLines += '  "files": ["dist", "src"],'
  $pkgJsonLines += '  "scripts": {'
  $pkgJsonLines += '    "build": "tsc -b",'
  $pkgJsonLines += '    "clean": "rm -rf dist .turbo *.tsbuildinfo",'
  $pkgJsonLines += '    "lint": "biome check .",'
  $pkgJsonLines += '    "test": "vitest run",'
  $pkgJsonLines += '    "typecheck": "tsc --noEmit"'
  $pkgJsonLines += '  },'
  $pkgJsonLines += '  "devDependencies": {'
  $pkgJsonLines += '    "typescript": "^5.6.3",'
  $pkgJsonLines += '    "vitest": "^2.1.4"'
  $pkgJsonLines += '  }'
  $pkgJsonLines += '}'
  $pkgJson = ($pkgJsonLines -join "`n") + "`n"

  $tsconfigLines = @()
  $tsconfigLines += '{'
  $tsconfigLines += '  "extends": "../tsconfig/library.json",'
  $tsconfigLines += '  "compilerOptions": {'
  $tsconfigLines += '    "outDir": "./dist",'
  $tsconfigLines += '    "rootDir": "./src"'
  $tsconfigLines += '  },'
  $tsconfigLines += '  "include": ["src/**/*"]'
  $tsconfigLines += '}'
  $tsconfig = ($tsconfigLines -join "`n") + "`n"

  $indexTs = "export const VERSION = '0.0.0';`n"

  $vitestLines = @()
  $vitestLines += "import { defineConfig } from 'vitest/config';"
  $vitestLines += ''
  $vitestLines += 'export default defineConfig({'
  $vitestLines += '  test: {'
  $vitestLines += "    name: '@vita/$name',"
  $vitestLines += "    environment: 'node',"
  $vitestLines += "    include: ['src/**/*.{test,spec}.ts'],"
  $vitestLines += '  },'
  $vitestLines += '});'
  $vitestCfg = ($vitestLines -join "`n") + "`n"

  $readme = "# @vita/$name`n`n$description`n"

  Write-File (Join-Path $pkgRoot "package.json") $pkgJson
  Write-File (Join-Path $pkgRoot "tsconfig.json") $tsconfig
  Write-File (Join-Path $pkgRoot "src/index.ts") $indexTs
  Write-File (Join-Path $pkgRoot "vitest.config.ts") $vitestCfg
  Write-File (Join-Path $pkgRoot "README.md") $readme

  if ($isOss) {
    $licensePath = Join-Path $pkgRoot "LICENSE"
    if (-not (Test-Path $licensePath)) {
      Copy-Item (Join-Path $root "packages/core/LICENSE") $licensePath -ErrorAction SilentlyContinue
    }
  }
}

foreach ($p in $ossPackages) {
  New-LibPackage -name $p.name -license "MIT" -description $p.desc
}

foreach ($p in $closedPackages) {
  New-LibPackage -name $p.name -license "UNLICENSED" -description $p.desc
}

Write-Host "Scaffold complete."
