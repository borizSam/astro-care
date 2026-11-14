import { describe, expect, it } from 'vitest';
import {
  avatarState,
  evaluateCheck,
  news2,
  scoreLabs,
  type CheckInput,
} from '../src';

const rested: CheckInput = {
  task: 'eva',
  vitals: { respRate: 14, spo2: 98, systolicBP: 120, heartRate: 62, tempC: 36.6, consciousness: 'A' },
  baseline: { heartRate: 60, systolicBP: 118, spo2: 98 },
  pvt: { reactionTimesMs: [240, 250, 255, 260, 245, 238, 252, 248], falseStarts: 0 },
  pvtBaselineMedianMs: 250,
  intake: { waterMlLast3h: 750, minutesSinceMeal: 90, minutesSinceVoid: 30, urineColor: 2 },
  symptoms: [],
  sleepHours: 7.5,
  solarEvent: null,
};

describe('NEWS2', () => {
  it('scores normal vitals as 0', () => {
    expect(news2(rested.vitals).total).toBe(0);
  });
  it('flags single parameter 3', () => {
    const n = news2({ ...rested.vitals, spo2: 90 });
    expect(n.spo2).toBe(3);
    expect(n.anySingleThree).toBe(true);
  });
  it('maps boundaries', () => {
    expect(news2({ ...rested.vitals, respRate: 21 }).respRate).toBe(2);
    expect(news2({ ...rested.vitals, heartRate: 91 }).heartRate).toBe(1);
    expect(news2({ ...rested.vitals, systolicBP: 100 }).systolicBP).toBe(2);
    expect(news2({ ...rested.vitals, tempC: 39.1 }).tempC).toBe(2);
  });
});

describe('verdict', () => {
  it('rested astronaut → GO', () => {
    const r = evaluateCheck(rested);
    expect(r.verdict).toBe('GO');
    expect(r.blockers).toHaveLength(0);
  });

  it('dehydrated before EVA → fixable NO-GO, then GO after drinking', () => {
    const dehydrated = { ...rested, intake: { ...rested.intake, waterMlLast3h: 100, minutesSinceVoid: 200 } };
    const r1 = evaluateCheck(dehydrated);
    expect(r1.verdict).toBe('NO_GO');
    expect(r1.fixableOnly).toBe(true);
    const r2 = evaluateCheck({ ...dehydrated, intake: { ...dehydrated.intake, waterMlLast3h: 600, minutesSinceVoid: 0 } });
    expect(r2.verdict).toBe('GO');
  });

  it('low water is only advice for short lab task', () => {
    const r = evaluateCheck({ ...rested, task: 'lab', intake: { ...rested.intake, waterMlLast3h: 100 } });
    expect(r.verdict).toBe('GO');
    expect(r.advice.some((a) => a.source === 'hydration')).toBe(true);
  });

  it('fatigued (slow PVT, 4 h sleep) → NO-GO for rover, not fixable', () => {
    const fatigued = { ...rested, task: 'rover' as const, sleepHours: 4, pvt: { reactionTimesMs: [300, 320, 380, 410, 310, 330, 360, 305], falseStarts: 1 } };
    const r = evaluateCheck(fatigued);
    expect(r.verdict).toBe('NO_GO');
    expect(r.fixableOnly).toBe(false);
    expect(r.blockers.map((b) => b.source)).toContain('pvt');
  });

  it('same mild slowdown is GO for lab but NO-GO for EVA', () => {
    const pvt = { reactionTimesMs: [285, 290, 295, 300, 288, 292, 296, 290], falseStarts: 0 }; // ~17% slower
    expect(evaluateCheck({ ...rested, task: 'lab', pvt }).verdict).toBe('GO');
    expect(evaluateCheck({ ...rested, task: 'eva', pvt }).verdict).toBe('NO_GO');
  });

  it('solar particle event blocks EVA but not lab', () => {
    const solarEvent = { sepID: '2024-05-11T02:10:00-SEP-001', eventTime: '2024-05-11T02:10Z', instrument: 'GOES-P: SEISS >100 MeV' };
    expect(evaluateCheck({ ...rested, solarEvent }).verdict).toBe('NO_GO');
    expect(evaluateCheck({ ...rested, task: 'lab', solarEvent }).verdict).toBe('GO');
  });

  it('non-alert consciousness always blocks', () => {
    const r = evaluateCheck({ ...rested, task: 'lab', vitals: { ...rested.vitals, consciousness: 'C' } });
    expect(r.verdict).toBe('NO_GO');
  });

  it('moderate symptom blocks EVA, advice for lab', () => {
    const symptoms = [{ id: 'joint-pain', zone: 'joints', label: 'Joint pain', severity: 'moderate' as const }];
    expect(evaluateCheck({ ...rested, symptoms }).verdict).toBe('NO_GO');
    expect(evaluateCheck({ ...rested, task: 'lab', symptoms }).verdict).toBe('GO');
  });
});

describe('labs (OSDR)', () => {
  it('flags high BUN/creatinine ratio as advice only', () => {
    const f = scoreLabs({ source: 'NASA OSDR OSD-575', timepoint: 'R+1', bun: 25, creatinine: 1.0 });
    expect(f).toHaveLength(1);
    expect(f[0].effect).toBe('advice');
  });
});

describe('avatar', () => {
  it('maps NEWS2 to states', () => {
    expect(avatarState(rested.vitals)).toBe('optimal');
    expect(avatarState({ ...rested.vitals, heartRate: 95 })).toBe('low');
    expect(avatarState({ ...rested.vitals, spo2: 90 })).toBe('medium');
    expect(avatarState({ ...rested.vitals, spo2: 90, respRate: 26, systolicBP: 95 })).toBe('high');
  });
});
