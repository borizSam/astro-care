/**
 * Clinical-safety suite: zero tolerance for false negatives.
 * A dangerous state that returns GO is a safety event, so every invariant below must hold for every task.
 * NEWS2 boundaries follow the Royal College of Physicians (2017) chart, SpO2 scale 1.
 */
import { describe, expect, it } from 'vitest';
import { TASKS, evaluateCheck, news2, type CheckInput, type TaskId, type Vitals } from '../src';

const TASK_IDS = Object.keys(TASKS) as TaskId[];
const SURFACE: TaskId[] = ['eva', 'rover'];

const vitals: Vitals = { respRate: 14, spo2: 98, systolicBP: 120, heartRate: 62, tempC: 36.6, consciousness: 'A' };
const base: CheckInput = {
  task: 'eva',
  vitals,
  baseline: { heartRate: 60, systolicBP: 118, spo2: 98 },
  pvt: { reactionTimesMs: [240, 250, 255, 260, 245, 238, 252, 248], falseStarts: 0 },
  pvtBaselineMedianMs: 250,
  intake: { waterMlLast3h: 750, minutesSinceMeal: 90, minutesSinceVoid: 30, urineColor: 2 },
  symptoms: [],
  sleepHours: 7.5,
  solarEvent: null,
};

/** [parameter, value, expected points]: both sides of every RCP band edge. */
const BOUNDARIES: [keyof Omit<Vitals, 'consciousness'>, number, number][] = [
  ['respRate', 8, 3], ['respRate', 9, 1], ['respRate', 11, 1], ['respRate', 12, 0], ['respRate', 20, 0], ['respRate', 21, 2], ['respRate', 24, 2], ['respRate', 25, 3],
  ['spo2', 91, 3], ['spo2', 92, 2], ['spo2', 93, 2], ['spo2', 94, 1], ['spo2', 95, 1], ['spo2', 96, 0],
  ['systolicBP', 90, 3], ['systolicBP', 91, 2], ['systolicBP', 100, 2], ['systolicBP', 101, 1], ['systolicBP', 110, 1], ['systolicBP', 111, 0], ['systolicBP', 219, 0], ['systolicBP', 220, 3],
  ['heartRate', 40, 3], ['heartRate', 41, 1], ['heartRate', 50, 1], ['heartRate', 51, 0], ['heartRate', 90, 0], ['heartRate', 91, 1], ['heartRate', 110, 1], ['heartRate', 111, 2], ['heartRate', 130, 2], ['heartRate', 131, 3],
  ['tempC', 35.0, 3], ['tempC', 35.1, 1], ['tempC', 36.0, 1], ['tempC', 36.1, 0], ['tempC', 38.0, 0], ['tempC', 38.1, 1], ['tempC', 39.0, 1], ['tempC', 39.1, 2],
];

describe('NEWS2 matches the RCP 2017 chart at every band edge', () => {
  it.each(BOUNDARIES)('%s = %d scores %d', (param, value, points) => {
    expect(news2({ ...vitals, [param]: value })[param]).toBe(points);
  });
  it.each(['C', 'V', 'P', 'U'] as const)('ACVPU %s scores 3', (c) => {
    expect(news2({ ...vitals, consciousness: c }).consciousness).toBe(3);
  });
});

describe('no false negatives: dangerous states never return GO, for any task', () => {
  const redParams = BOUNDARIES.filter(([, , p]) => p === 3);
  for (const task of TASK_IDS) {
    it.each(redParams)(`${task}: single red parameter %s = %d → NO-GO`, (param, value) => {
      expect(evaluateCheck({ ...base, task, vitals: { ...vitals, [param]: value } }).verdict).toBe('NO_GO');
    });
    it.each(['C', 'V', 'P', 'U'] as const)(`${task}: not alert (%s) → NO-GO`, (c) => {
      expect(evaluateCheck({ ...base, task, vitals: { ...vitals, consciousness: c } }).verdict).toBe('NO_GO');
    });
    it(`${task}: NEWS2 total 5 from amber parameters only → NO-GO`, () => {
      // RR 21 (+2), HR 111 (+2), temp 38.1 (+1): no single 3
      const v = { ...vitals, respRate: 21, heartRate: 111, tempC: 38.1 };
      expect(news2(v).total).toBe(5);
      expect(evaluateCheck({ ...base, task, vitals: v }).verdict).toBe('NO_GO');
    });
    it(`${task}: severe symptom → NO-GO`, () => {
      const symptoms = [{ id: 'chest-pain', zone: 'chest', label: 'Chest pain', severity: 'severe' as const }];
      expect(evaluateCheck({ ...base, task, symptoms }).verdict).toBe('NO_GO');
    });
    it(`${task}: reaction test not done → NO-GO`, () => {
      expect(evaluateCheck({ ...base, task, pvt: { reactionTimesMs: [], falseStarts: 0 } }).verdict).toBe('NO_GO');
    });
  }
});

describe('missing or malformed data never passes silently', () => {
  it.each(SURFACE)('%s: sleep not logged → NO-GO (never assumed)', (task) => {
    const r = evaluateCheck({ ...base, task, sleepHours: undefined });
    expect(r.verdict).toBe('NO_GO');
    expect(r.blockers.some((b) => b.source === 'sleep')).toBe(true);
  });
  it('lab: sleep not logged is still reported', () => {
    expect(evaluateCheck({ ...base, task: 'lab', sleepHours: undefined }).advice.some((a) => a.source === 'sleep')).toBe(true);
  });
});

describe('PVT-B: false starts count as errors', () => {
  it('fast reactions but many false starts → NO-GO for EVA', () => {
    const r = evaluateCheck({ ...base, pvt: { ...base.pvt, falseStarts: 3 } });
    expect(r.verdict).toBe('NO_GO');
    expect(r.blockers.some((b) => b.source === 'pvt')).toBe(true);
  });
});

describe('external hazards', () => {
  const solarEvent = { sepID: '2024-05-11T02:10:00-SEP-001', eventTime: '2024-05-11T02:10Z', instrument: 'GOES-P: SEISS >100 MeV' };
  it.each(SURFACE)('%s: solar particle event → NO-GO, even for a perfectly healthy astronaut', (task) => {
    const r = evaluateCheck({ ...base, task, solarEvent });
    expect(r.verdict).toBe('NO_GO');
    expect(r.fixableOnly).toBe(false);
  });
});

describe('"fixable on the spot" is never offered for a non-fixable risk', () => {
  it('dehydration + red vital → NO-GO that is not fixable-only', () => {
    const r = evaluateCheck({ ...base, intake: { ...base.intake, waterMlLast3h: 100 }, vitals: { ...vitals, spo2: 90 } });
    expect(r.verdict).toBe('NO_GO');
    expect(r.fixableOnly).toBe(false);
  });
});
