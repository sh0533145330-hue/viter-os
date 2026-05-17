import type { QuietHours } from './types.js';

const HHMM = /^(\d{1,2}):(\d{2})$/;

function parseHHMM(s: string): { h: number; m: number } | null {
  const m = HHMM.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(mm)) return null;
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return { h, m: mm };
}

export function getTimezoneOffsetMs(timezone: string, when: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(when);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour === '24' ? '0' : map.hour),
    Number(map.minute),
    Number(map.second ?? '0'),
  );
  return asUtc - when.getTime();
}

export function isQuietTimeNow(quiet: QuietHours, now: Date): boolean {
  const start = parseHHMM(quiet.start);
  const end = parseHHMM(quiet.end);
  if (!start || !end) return false;
  let local: Date;
  try {
    local = new Date(now.getTime() + getTimezoneOffsetMs(quiet.timezone, now));
  } catch {
    local = now;
  }
  const minutesNow = local.getUTCHours() * 60 + local.getUTCMinutes();
  const startMins = start.h * 60 + start.m;
  const endMins = end.h * 60 + end.m;
  if (startMins === endMins) return false;
  if (startMins < endMins) {
    return minutesNow >= startMins && minutesNow < endMins;
  }
  return minutesNow >= startMins || minutesNow < endMins;
}
