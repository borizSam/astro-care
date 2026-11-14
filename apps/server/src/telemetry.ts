import { avatarState, news2, type Vitals } from '@astro-care/engine';

/**
 * Simulated real-time wearable telemetry (1 Hz).
 * Each crew member follows a scenario; values drift smoothly toward the scenario target with
 * physiological noise, so the avatar and NEWS2 change gradually like a real sensor stream.
 * In a real mission this module is replaced by the suit / wearable feed.
 */
export type Scenario = 'nominal' | 'dehydrated' | 'fatigued' | 'hypoxic';

type Numeric = Exclude<keyof Vitals, 'consciousness'>;

const TARGETS: Record<Scenario, Record<Numeric, number>> = {
  nominal: { heartRate: 62, systolicBP: 120, spo2: 98, respRate: 14, tempC: 36.6 },
  dehydrated: { heartRate: 96, systolicBP: 104, spo2: 97, respRate: 17, tempC: 37.1 },
  fatigued: { heartRate: 78, systolicBP: 116, spo2: 97, respRate: 15, tempC: 36.6 },
  hypoxic: { heartRate: 118, systolicBP: 112, spo2: 89, respRate: 25, tempC: 36.8 },
};

const NOISE: Record<Numeric, number> = { heartRate: 1.5, systolicBP: 1.2, spo2: 0.3, respRate: 0.4, tempC: 0.03 };
const DECIMALS: Record<Numeric, number> = { heartRate: 0, systolicBP: 0, spo2: 0, respRate: 0, tempC: 1 };

interface Live {
  scenario: Scenario;
  raw: Record<Numeric, number>;
  consciousness: Vitals['consciousness'];
}

const live = new Map<string, Live>();
const baselines = new Map<string, { heartRate: number; systolicBP: number; spo2: number }>();

export function initTelemetry(crew: { id: string; baseline: { heartRate: number; systolicBP: number; spo2: number } }[]) {
  for (const c of crew) {
    baselines.set(c.id, c.baseline);
    live.set(c.id, {
      scenario: 'nominal',
      raw: { ...TARGETS.nominal, heartRate: c.baseline.heartRate, systolicBP: c.baseline.systolicBP, spo2: c.baseline.spo2 },
      consciousness: 'A',
    });
  }
}

function target(id: string, l: Live, baselines: Map<string, { heartRate: number; systolicBP: number; spo2: number }>) {
  const t = { ...TARGETS[l.scenario] };
  if (l.scenario === 'nominal') Object.assign(t, baselines.get(id));
  return t;
}

function gaussian() {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
}

export function tick() {
  for (const [id, l] of live) {
    const t = target(id, l, baselines);
    for (const k of Object.keys(t) as Numeric[]) {
      // move ~12% of the way to target each second + sensor noise
      l.raw[k] += (t[k] - l.raw[k]) * 0.12 + gaussian() * NOISE[k];
    }
    l.raw.spo2 = Math.min(100, l.raw.spo2);
  }
}

export function vitalsNow(id: string): Vitals | null {
  const l = live.get(id);
  if (!l) return null;
  const v = {} as Record<Numeric, number>;
  for (const k of Object.keys(l.raw) as Numeric[]) {
    const p = 10 ** DECIMALS[k];
    v[k] = Math.round(l.raw[k] * p) / p;
  }
  return { ...v, consciousness: l.consciousness };
}

export function snapshot(id: string) {
  const vitals = vitalsNow(id)!;
  return { id, scenario: live.get(id)!.scenario, vitals, news2: news2(vitals), avatar: avatarState(vitals) };
}

export function allSnapshots() {
  return [...live.keys()].map(snapshot);
}

export function setScenario(id: string, s: Scenario) {
  const l = live.get(id);
  if (l) l.scenario = s;
}

export function setConsciousness(id: string, c: Vitals['consciousness']) {
  const l = live.get(id);
  if (l) l.consciousness = c;
}

export const SCENARIOS = Object.keys(TARGETS) as Scenario[];
