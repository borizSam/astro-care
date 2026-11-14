import type { Vitals } from './types';

/** NEWS2 parameter scores (Royal College of Physicians, 2017; SpO2 scale 1, room air). */
export interface News2Breakdown {
  respRate: number;
  spo2: number;
  systolicBP: number;
  heartRate: number;
  tempC: number;
  consciousness: number;
  total: number;
  anySingleThree: boolean;
}

export function scoreRespRate(rr: number): number {
  if (rr <= 8) return 3;
  if (rr <= 11) return 1;
  if (rr <= 20) return 0;
  if (rr <= 24) return 2;
  return 3;
}

export function scoreSpo2(spo2: number): number {
  if (spo2 <= 91) return 3;
  if (spo2 <= 93) return 2;
  if (spo2 <= 95) return 1;
  return 0;
}

export function scoreSystolicBP(sbp: number): number {
  if (sbp <= 90) return 3;
  if (sbp <= 100) return 2;
  if (sbp <= 110) return 1;
  if (sbp <= 219) return 0;
  return 3;
}

export function scoreHeartRate(hr: number): number {
  if (hr <= 40) return 3;
  if (hr <= 50) return 1;
  if (hr <= 90) return 0;
  if (hr <= 110) return 1;
  if (hr <= 130) return 2;
  return 3;
}

export function scoreTemp(t: number): number {
  if (t <= 35.0) return 3;
  if (t <= 36.0) return 1;
  if (t <= 38.0) return 0;
  if (t <= 39.0) return 1;
  return 2;
}

export function news2(v: Vitals): News2Breakdown {
  const parts = {
    respRate: scoreRespRate(v.respRate),
    spo2: scoreSpo2(v.spo2),
    systolicBP: scoreSystolicBP(v.systolicBP),
    heartRate: scoreHeartRate(v.heartRate),
    tempC: scoreTemp(v.tempC),
    consciousness: v.consciousness === 'A' ? 0 : 3,
  };
  const values = Object.values(parts);
  return {
    ...parts,
    total: values.reduce((a, b) => a + b, 0),
    anySingleThree: values.some((s) => s === 3),
  };
}
