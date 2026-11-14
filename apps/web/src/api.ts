import type {
  AvatarState,
  CareLevels,
  LabPanel,
  News2Breakdown,
  PvtResult,
  Symptom,
  SymptomDef,
  Task,
  TaskId,
  VerdictResult,
  Vitals,
  VitalsBaseline,
} from '@astro-care/engine';

export type CareType = 'water' | 'food' | 'exercise' | 'urine' | 'stool' | 'sleep';

export interface CrewState {
  id: string;
  role: string;
  sex: string;
  baseline: VitalsBaseline;
  pvtBaselineMedianMs: number;
  vitals: Vitals & { at: string | null };
  news2: News2Breakdown;
  avatar: AvatarState;
  intake: {
    waterMlLast3h: number;
    minutesSinceMeal: number;
    minutesSinceVoid: number;
    minutesSinceStool: number;
    urineColor?: number;
    lastBristol?: number;
    sleepHours?: number;
    exerciseMinToday: number;
  };
  levels: CareLevels;
  lastCheck: (VerdictResult & { id: string }) | null;
}

export interface Meta {
  tasks: Task[];
  bodyZones: { zone: string; label: string; symptoms: SymptomDef[] }[];
  timepoints: string[];
  sources: { osdr: { id: string; name: string; url: string }[]; donki: string };
}

export interface LabRow {
  analyte: string;
  value: number;
  min: number | null;
  max: number | null;
  units: string;
  timepoint: string;
  outOfRange: boolean;
}

export interface CheckResponse extends VerdictResult {
  id: string;
  crewId: string;
  input: { labs?: LabPanel };
}

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: init?.body ? { 'content-type': 'application/json' } : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  meta: () => j<Meta>('/meta'),
  crew: () => j<CrewState[]>('/crew'),
  member: (id: string) => j<CrewState>(`/crew/${id}`),
  labs: (id: string, timepoint: string) => j<{ rows: LabRow[] }>(`/crew/${id}/labs?timepoint=${encodeURIComponent(timepoint)}`),
  care: (id: string, type: CareType, value: number, at?: string) =>
    j<CrewState>(`/crew/${id}/care`, { method: 'POST', body: JSON.stringify({ type, value, at }) }),
  reset: (id: string) => j<CrewState>(`/crew/${id}/reset`, { method: 'POST' }),
  check: (
    id: string,
    body: { task: TaskId; vitals: Vitals; pvt: PvtResult; symptoms: Symptom[]; sleepHours: number; missionTime?: string; labTimepoint?: string; save?: boolean },
  ) => j<CheckResponse>(`/crew/${id}/check`, { method: 'POST', body: JSON.stringify(body) }),
};

export const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();
