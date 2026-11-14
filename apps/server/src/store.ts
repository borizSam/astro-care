import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Vitals, VerdictResult } from '@astro-care/engine';

/** Tiny JSON-file store: survives restarts, zero setup. Swap for SQLite if needed. */
const FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'store.json');

export type CareType = 'water' | 'food' | 'exercise' | 'urine' | 'stool' | 'sleep';

export interface CareEntry {
  crewId: string;
  type: CareType;
  value: number; // ml | kcal | minutes | color 1–8 | Bristol 1–7 | hours
  at: string;
}

export interface CheckRecord extends VerdictResult {
  id: string;
  crewId: string;
}

interface Store {
  care: CareEntry[];
  checks: CheckRecord[];
  vitals: Record<string, Vitals & { at: string }>;
}

let store: Store = existsSync(FILE)
  ? JSON.parse(readFileSync(FILE, 'utf8'))
  : { care: [], checks: [], vitals: {} };

function save() {
  writeFileSync(FILE, JSON.stringify(store, null, 1));
}

export function addCare(e: CareEntry) {
  store.care.push(e);
  save();
  return e;
}

export function careFor(crewId: string) {
  return store.care.filter((c) => c.crewId === crewId);
}

export function setVitals(crewId: string, v: Vitals) {
  store.vitals[crewId] = { ...v, at: new Date().toISOString() };
  save();
}

export function vitalsFor(crewId: string) {
  return store.vitals[crewId] ?? null;
}

export function addCheck(c: CheckRecord) {
  store.checks.unshift(c);
  save();
  return c;
}

export function checksFor(crewId?: string) {
  return crewId ? store.checks.filter((c) => c.crewId === crewId) : store.checks;
}

export function resetCrew(crewId: string) {
  store = {
    care: store.care.filter((c) => c.crewId !== crewId),
    checks: store.checks.filter((c) => c.crewId !== crewId),
    vitals: Object.fromEntries(Object.entries(store.vitals).filter(([k]) => k !== crewId)),
  };
  save();
}

/** Derived intake summary used by the readiness check. */
export function intakeSummary(crewId: string, now = new Date()) {
  const entries = careFor(crewId);
  const t = now.getTime();
  const minutesSince = (type: CareType) => {
    const last = entries.filter((e) => e.type === type).at(-1);
    return last ? Math.round((t - new Date(last.at).getTime()) / 60000) : 24 * 60;
  };
  const waterMlLast3h = entries
    .filter((e) => e.type === 'water' && t - new Date(e.at).getTime() <= 3 * 3600_000)
    .reduce((s, e) => s + e.value, 0);
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const exerciseMinToday = entries
    .filter((e) => e.type === 'exercise' && new Date(e.at) >= startOfDay)
    .reduce((s, e) => s + e.value, 0);
  const lastUrine = entries.filter((e) => e.type === 'urine').at(-1);
  const lastSleep = entries.filter((e) => e.type === 'sleep').at(-1);
  const lastStool = entries.filter((e) => e.type === 'stool').at(-1);
  return {
    waterMlLast3h,
    minutesSinceMeal: minutesSince('food'),
    minutesSinceVoid: minutesSince('urine'),
    minutesSinceStool: minutesSince('stool'),
    urineColor: lastUrine?.value,
    lastBristol: lastStool?.value,
    sleepHours: lastSleep?.value,
    exerciseMinToday,
  };
}
