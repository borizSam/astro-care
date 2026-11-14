import cors from '@fastify/cors';
import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import {
  BODY_ZONES,
  TASKS,
  avatarState,
  careLevels,
  evaluateCheck,
  news2,
  type CheckInput,
  type PvtResult,
  type Symptom,
  type TaskId,
  type Vitals,
} from '@astro-care/engine';
import { OSDR_SOURCES, TIMEPOINTS, crewList, labPanelFor, labsFor, solarEventAt, spaceWeatherSummary } from './data';
import { addCare, addCheck, checksFor, intakeSummary, resetCrew, setVitals, vitalsFor, type CareType } from './store';

const PORT = Number(process.env.PORT ?? 3001);
const app = Fastify({ logger: { level: 'warn' } });
await app.register(cors, { origin: true });

const DEFAULT_VITALS: Vitals = { respRate: 14, spo2: 98, systolicBP: 120, heartRate: 62, tempC: 36.6, consciousness: 'A' };

function crewOr404(id: string) {
  const c = crewList().find((x) => x.id === id);
  if (!c) throw Object.assign(new Error(`Unknown crew member ${id}`), { statusCode: 404 });
  return c;
}

function crewState(id: string) {
  const c = crewOr404(id);
  const vitals = vitalsFor(id) ?? { ...DEFAULT_VITALS, heartRate: c.baseline.heartRate, systolicBP: c.baseline.systolicBP, spo2: c.baseline.spo2, at: null };
  const intake = intakeSummary(id);
  const lastCheck = checksFor(id)[0] ?? null;
  return {
    ...c,
    vitals,
    news2: news2(vitals),
    avatar: avatarState(vitals),
    intake,
    levels: careLevels(intake.waterMlLast3h, intake.minutesSinceMeal, intake.exerciseMinToday),
    lastCheck,
  };
}

app.get('/api/health', async () => ({ ok: true, name: 'astro-care habitat server' }));

app.get('/api/meta', async () => ({
  tasks: Object.values(TASKS),
  bodyZones: BODY_ZONES,
  timepoints: TIMEPOINTS,
  sources: { osdr: OSDR_SOURCES, donki: 'https://api.nasa.gov (DONKI, CCMC)' },
}));

app.get('/api/crew', async () => {
  const sevRank = (s: ReturnType<typeof crewState>) => s.news2.total * 10 + (s.lastCheck?.verdict === 'NO_GO' ? 5 : 0);
  return crewList().map((c) => crewState(c.id)).sort((a, b) => sevRank(b) - sevRank(a));
});

app.get<{ Params: { id: string } }>('/api/crew/:id', async (req) => crewState(req.params.id));

app.get<{ Params: { id: string }; Querystring: { timepoint?: string } }>('/api/crew/:id/labs', async (req) => {
  crewOr404(req.params.id);
  return { sources: OSDR_SOURCES, rows: labsFor(req.params.id, req.query.timepoint) };
});

app.post<{ Params: { id: string }; Body: { type: CareType; value: number; at?: string } }>('/api/crew/:id/care', async (req, reply) => {
  crewOr404(req.params.id);
  const { type, value, at } = req.body ?? ({} as never);
  if (!['water', 'food', 'exercise', 'urine', 'stool', 'sleep'].includes(type) || typeof value !== 'number') {
    return reply.code(400).send({ error: 'type and numeric value required' });
  }
  addCare({ crewId: req.params.id, type, value, at: at ?? new Date().toISOString() });
  return crewState(req.params.id);
});

app.put<{ Params: { id: string }; Body: Vitals }>('/api/crew/:id/vitals', async (req) => {
  crewOr404(req.params.id);
  setVitals(req.params.id, req.body);
  return crewState(req.params.id);
});

app.post<{ Params: { id: string } }>('/api/crew/:id/reset', async (req) => {
  crewOr404(req.params.id);
  resetCrew(req.params.id);
  return crewState(req.params.id);
});

app.get<{ Querystring: { at?: string } }>('/api/space-weather', async (req) => ({
  ...spaceWeatherSummary(),
  activeAt: req.query.at ? solarEventAt(req.query.at) : null,
}));

interface CheckBody {
  task: TaskId;
  vitals: Vitals;
  pvt: PvtResult;
  symptoms: Symptom[];
  sleepHours: number;
  /** mission date used for space weather (demo: 2024-05-11T06:00:00Z) */
  missionTime?: string;
  labTimepoint?: string;
  intakeOverride?: Partial<CheckInput['intake']>;
  save?: boolean;
}

app.post<{ Params: { id: string }; Body: CheckBody }>('/api/crew/:id/check', async (req, reply) => {
  const c = crewOr404(req.params.id);
  const b = req.body;
  if (!b || !TASKS[b.task] || !b.vitals || !b.pvt) return reply.code(400).send({ error: 'task, vitals and pvt required' });
  const intake = intakeSummary(c.id);
  const input: CheckInput = {
    task: b.task,
    vitals: b.vitals,
    baseline: c.baseline,
    pvt: b.pvt,
    pvtBaselineMedianMs: c.pvtBaselineMedianMs,
    intake: { waterMlLast3h: intake.waterMlLast3h, minutesSinceMeal: intake.minutesSinceMeal, minutesSinceVoid: intake.minutesSinceVoid, urineColor: intake.urineColor, ...b.intakeOverride },
    symptoms: b.symptoms ?? [],
    sleepHours: b.sleepHours,
    solarEvent: b.missionTime ? solarEventAt(b.missionTime) : null,
    labs: b.labTimepoint ? labPanelFor(c.id, b.labTimepoint) : undefined,
  };
  setVitals(c.id, b.vitals);
  const result = evaluateCheck(input);
  const record = { ...result, id: randomUUID(), crewId: c.id };
  if (b.save !== false) addCheck(record);
  return { ...record, input };
});

app.get<{ Querystring: { crewId?: string } }>('/api/checks', async (req) => checksFor(req.query.crewId));

await app.listen({ port: PORT, host: '0.0.0.0' });
console.log(`ASTRO-CARE habitat server on http://localhost:${PORT}`);
