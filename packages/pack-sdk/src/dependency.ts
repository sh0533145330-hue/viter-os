/**
 * `@vita/pack-sdk` — dependency resolution and compatibility checks.
 *
 * Resolves inter-pack dependencies using semver range matching.
 * Detects conflicts (multiple packs requiring incompatible versions)
 * and missing dependencies before publishing or deployment.
 */

import type { DepResolution, PackManifest } from './types.js';

// ---------------------------------------------------------------------------
// Semver helpers (zero-dependency, spec-compliant enough for pack use)
// ---------------------------------------------------------------------------

interface Semver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

const SEMVER_RE =
  /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;

function parseSemver(version: string): Semver | null {
  const m = version.trim().match(SEMVER_RE);
  if (!m) return null;
  return {
    major: Number(m[1]!),
    minor: Number(m[2]!),
    patch: Number(m[3]!),
    prerelease: m[4] ? m[4].split('.') : [],
  };
}

function compareSemver(a: Semver, b: Semver): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;

  // Prereleases sort lower than releases
  if (a.prerelease.length === 0 && b.prerelease.length > 0) return 1;
  if (a.prerelease.length > 0 && b.prerelease.length === 0) return -1;
  const maxLen = Math.max(a.prerelease.length, b.prerelease.length);
  for (let i = 0; i < maxLen; i++) {
    const pa = a.prerelease[i];
    const pb = b.prerelease[i];
    if (pa === undefined && pb !== undefined) return 1;
    if (pa !== undefined && pb === undefined) return -1;
    if (pa !== pb) {
      const na = Number(pa);
      const nb = Number(pb);
      if (!isNaN(na) && !isNaN(nb)) {
        if (na !== nb) return na - nb;
      } else {
        const cmp = String(pa).localeCompare(String(pb));
        if (cmp !== 0) return cmp;
      }
    }
  }
  return 0;
}

function satisfies(version: string, range: string): boolean {
  const v = parseSemver(version);
  if (!v) return false;

  // Handle simple ranges: ^1.2.3, ~1.2.3, >=1.2.3, 1.2.x, *, exact
  const trimmed = range.trim();

  // Exact match
  if (/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(trimmed)) {
    const r = parseSemver(trimmed);
    return r !== null && compareSemver(v, r) === 0;
  }

  // Caret: ^1.2.3 → >=1.2.3 <2.0.0 (or ^0.2.3 → >=0.2.3 <0.3.0, ^0.0.3 → >=0.0.3 <0.0.4)
  if (trimmed.startsWith('^')) {
    const r = parseSemver(trimmed.slice(1));
    if (!r) return false;
    const lower = r;
    let upper: Semver;
    if (r.major !== 0) {
      upper = { major: r.major + 1, minor: 0, patch: 0, prerelease: [] };
    } else if (r.minor !== 0) {
      upper = { major: 0, minor: r.minor + 1, patch: 0, prerelease: [] };
    } else {
      upper = { major: 0, minor: 0, patch: r.patch + 1, prerelease: [] };
    }
    return compareSemver(v, lower) >= 0 && compareSemver(v, upper) < 0;
  }

  // Tilde: ~1.2.3 → >=1.2.3 <1.3.0
  if (trimmed.startsWith('~')) {
    const r = parseSemver(trimmed.slice(1));
    if (!r) return false;
    const lower = r;
    const upper = { major: r.major, minor: r.minor + 1, patch: 0, prerelease: [] };
    return compareSemver(v, lower) >= 0 && compareSemver(v, upper) < 0;
  }

  // >=
  if (trimmed.startsWith('>=')) {
    const r = parseSemver(trimmed.slice(2).trim());
    return r !== null && compareSemver(v, r) >= 0;
  }

  // >
  if (trimmed.startsWith('>')) {
    const r = parseSemver(trimmed.slice(1).trim());
    return r !== null && compareSemver(v, r) > 0;
  }

  // <=
  if (trimmed.startsWith('<=')) {
    const r = parseSemver(trimmed.slice(2).trim());
    return r !== null && compareSemver(v, r) <= 0;
  }

  // <
  if (trimmed.startsWith('<')) {
    const r = parseSemver(trimmed.slice(1).trim());
    return r !== null && compareSemver(v, r) < 0;
  }

  // Wildcard: 1.2.x or 1.x or *
  if (trimmed.includes('x') || trimmed.includes('*')) {
    const parts = trimmed.replace(/\*/g, 'x').split('.');
    if (parts.length !== 3) return false;
    for (let i = 0; i < 3; i++) {
      const p = parts[i];
      if (p === 'x' || p === '*') continue;
      const n = Number(p);
      if (isNaN(n)) return false;
      const actual = i === 0 ? v.major : i === 1 ? v.minor : v.patch;
      if (actual !== n) return false;
    }
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Dependency resolution
// ---------------------------------------------------------------------------

/**
 * Given a list of pack manifests and a map of available versions per pack key,
 * resolve the dependency graph and return which versions satisfy all constraints.
 *
 * Uses a simple topological approach: for each pack, check its dependencies
 * against the pool, pick the highest version that satisfies each range, and
 * report conflicts or missing deps.
 */
export async function resolveDependencies(
  packs: PackManifest[],
  available: Map<string, string[]>,
): Promise<DepResolution> {
  const resolved: Record<string, string> = {};
  const conflicts: string[] = [];
  const missing: string[] = [];

  // Build a map of the packs we're trying to resolve
  const packMap = new Map<string, PackManifest>();
  for (const p of packs) {
    packMap.set(p.key, p);
    // Use declared version or default to '0.0.0' for the pack itself
    resolved[p.key] = p.version ?? '0.0.0';
  }

  // For each pack, check its dependencies
  for (const pack of packs) {
    for (const [depKey, range] of Object.entries(pack.dependencies)) {
      const versions = available.get(depKey);

      if (!versions || versions.length === 0) {
        const msg = `Missing dependency "${depKey}" required by pack "${pack.key}"`;
        if (!missing.includes(msg)) {
          missing.push(msg);
        }
        continue;
      }

      // Find the highest version that satisfies the range
      const parsedVersions = versions
        .map((v) => parseSemver(v))
        .filter((v): v is Semver => v !== null)
        .sort((a, b) => compareSemver(b, a)); // highest first

      let foundVersion: string | null = null;
      for (const sv of parsedVersions) {
        const verStr = `${sv.major}.${sv.minor}.${sv.patch}${
          sv.prerelease.length > 0 ? '-' + sv.prerelease.join('.') : ''
        }`;
        if (satisfies(verStr, range)) {
          foundVersion = verStr;
          break;
        }
      }

      if (!foundVersion) {
        const msg = `No version of "${depKey}" satisfies range "${range}" (required by "${pack.key}")`;
        if (!missing.includes(msg)) {
          missing.push(msg);
        }
        continue;
      }

      // Check for conflicts: if already resolved to a different version
      const existing = resolved[depKey];
      if (existing && existing !== foundVersion) {
        // Both versions must satisfy all ranges that required them
        const conflictMsg = `Conflict: "${depKey}" resolved to ${existing} but pack "${pack.key}" requires ${foundVersion} (range: ${range})`;
        if (!conflicts.includes(conflictMsg)) {
          conflicts.push(conflictMsg);
        }
      }

      resolved[depKey] = foundVersion;
    }
  }

  return { resolved, conflicts, missing };
}

// ---------------------------------------------------------------------------
// Compatibility check
// ---------------------------------------------------------------------------

/**
 * Check whether a pack's declared dependencies are compatible with
 * a set of already-resolved versions. Returns a list of incompatibility
 * messages (empty = compatible).
 */
export async function checkCompatibility(
  pack: PackManifest,
  resolvedVersions: Map<string, string>,
): Promise<string[]> {
  const issues: string[] = [];

  for (const [depKey, range] of Object.entries(pack.dependencies)) {
    const resolvedVersion = resolvedVersions.get(depKey);
    if (!resolvedVersion) {
      issues.push(`Dependency "${depKey}" is not resolved`);
      continue;
    }

    if (!satisfies(resolvedVersion, range)) {
      issues.push(
        `Dependency "${depKey}"@${resolvedVersion} does not satisfy range "${range}"`,
      );
    }
  }

  return issues;
}
