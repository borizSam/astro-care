export type Effect = 'ok' | 'advice' | 'block';
export type TaskId = 'eva' | 'rover' | 'lab';
export type Acvpu = 'A' | 'C' | 'V' | 'P' | 'U';
export type Severity = 'mild' | 'moderate' | 'severe';

export interface Task {
  id: TaskId;
  label: string;
  durationH: number;
  /** NO-GO if median reaction time is slower than baseline by more than this % */
  pvtMaxSlowdownPct: number;
  /** NO-GO if lapses (RT > 355 ms) exceed this count */
  maxLapses: number;
  blockedBySolarParticles: boolean;
  /** NO-GO if slept fewer hours than this */
  minSleepH: number;
}

export interface Vitals {
  respRate: number;
  spo2: number;
  systolicBP: number;
  heartRate: number;
  tempC: number;
  consciousness: Acvpu;
}

export interface VitalsBaseline {
  heartRate: number;
  systolicBP: number;
  spo2: number;
}

export interface PvtResult {
  /** reaction times in ms of valid responses */
  reactionTimesMs: number[];
  falseStarts: number;
}

export interface IntakeLog {
  waterMlLast3h: number;
  minutesSinceMeal: number;
  minutesSinceVoid: number;
  urineColor?: number; // 1–8
}

export interface Symptom {
  id: string;
  zone: string;
  label: string;
  severity: Severity;
}

export interface SolarParticleEvent {
  sepID: string;
  eventTime: string;
  instrument: string;
}

export interface LabPanel {
  source: string; // e.g. "NASA OSDR OSD-575"
  timepoint: string; // e.g. "L-3"
  bun?: number;
  creatinine?: number;
  hemoglobin?: number;
  hemoglobinMin?: number;
}

export type FindingSource =
  | 'pvt'
  | 'vitals'
  | 'consciousness'
  | 'hydration'
  | 'meal'
  | 'void'
  | 'urine'
  | 'symptoms'
  | 'sleep'
  | 'bp'
  | 'external'
  | 'labs';

export interface Finding {
  source: FindingSource;
  effect: Effect;
  fixable: boolean;
  reason: string;
  action: string;
  ref?: string;
}

export interface CheckInput {
  task: TaskId;
  vitals: Vitals;
  baseline: VitalsBaseline;
  pvt: PvtResult;
  pvtBaselineMedianMs: number;
  intake: IntakeLog;
  symptoms: Symptom[];
  sleepHours: number;
  solarEvent: SolarParticleEvent | null;
  labs?: LabPanel;
}

export interface VerdictResult {
  verdict: 'GO' | 'NO_GO';
  task: TaskId;
  blockers: Finding[];
  advice: Finding[];
  fixableOnly: boolean;
  news2: number;
  timestamp: string;
}
