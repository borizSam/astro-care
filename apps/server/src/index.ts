import cors from '@fastify/cors';
import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import {
  BODY_ZONES,
  TASKS,
  careLevels,
  evaluateCheck,
  pvtStats,
  type Acvpu,
  type CheckInput,
  type PvtResult,
  type Symptom,
  type TaskId,
} from '@astro-care/engine';
import { OSDR_SOURCES, TIMEPOINTS, crewList, labsFor, solarEventAt, spaceWeatherSummary } from './data';
import { addCare, addCheck, checksFor, intakeSummary, resetCrew, type CareType } from './store';
import { SCENARIOS, allSnapshots, initTelemetry, setConsciousness, setScenario, snapshot, tick, vitalsNow, type Scenario } from './telemetry';

const PORT = Number(process.env.PORT ?? 3001);
const TELEMETRY_HZ = 1;
const DEFAULT_LAB_TIMEPOINT = 'R+1';

const app = Fastify({ logger: { level: 'warn' } });
await app.register(cors, { origin: true });

initTelemetry(crewList());
setInterval(tick, 1000 / TELEMETRY_HZ);

function crewOr404(id: string) {
  const c = crewList().find((x) => x.id === id);
  if (!c) throw Object.assign(new Error(`Unknown crew member ${id}`), { statusCode: 404 });
  return c;
}

function crewState(id: string) {
  const c = crewOr404(id);
  const intake = intakeSummary(id);
  return {
    ...c,
    ...snapshot(id),
    intake,
    levels: careLevels(intake.waterMlLast3h, intake.minutesSinceMeal, intake.exerciseMinToday),
    lastCheck: checksFor(id)[0] ?? null,
  };
}

app.get('/api/health', async () => ({ ok: true, name: 'astro-care habitat server' }));

app.get('/api/meta', async () => ({
  tasks: Object.values(TASKS),
  bodyZones: BODY_ZONES,
  timepoints: TIMEPOINTS,
  scenarios: SCENARIOS,
  /** URLs a phone on the same network can open (QR code). PUBLIC_URL overrides, e.g. when running inside WSL. */
  lanHosts: process.env.PUBLIC_URL
    ? [process.env.PUBLIC_URL]
    : Object.values(networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i!.address),
  sources: { osdr: OSDR_SOURCES, donki: 'https://api.nasa.gov (DONKI, CCMC)' },
}));

app.get('/api/crew', async () => crewList().map((c) => crewState(c.id)));
app.get<{ Params: { id: string } }>('/api/crew/:id', async (req) => crewState(req.params.id));

/** Live telemetry for the whole crew (Server-Sent Events, 1 Hz). NEWS2 is computed server-side every tick. */
app.get('/api/telemetry/stream', (req, reply) => {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  const send = () => {
    const frames = allSnapshots().map((f) => {
      const last = checksFor(f.id)[0];
      return { ...f, lastCheck: last ? { id: last.id, verdict: last.verdict, task: last.task, timestamp: last.timestamp, pvt: last.pvt } : null };
    });
    reply.raw.write(`data: ${JSON.stringify(frames)}\n\n`);
  };
  send();
  const id = setInterval(send, 1000 / TELEMETRY_HZ);
  req.raw.on('close', () => clearInterval(id));
});

app.get<{ Params: { id: string }; Querystring: { timepoint?: string } }>('/api/crew/:id/labs', async (req) => {
  crewOr404(req.params.id);
  return { sources: OSDR_SOURCES, rows: labsFor(req.params.id, req.query.timepoint ?? DEFAULT_LAB_TIMEPOINT) };
});

app.post<{ Params: { id: string }; Body: { type: CareType; value: number; at?: string } }>('/api/crew/:id/care', async (req, reply) => {
  crewOr404(req.params.id);
  const { type, value, at } = req.body ?? ({} as never);
  if (!['water', 'food', 'exercise', 'urine', 'stool', 'sleep'].includes(type) || typeof value !== 'number') {
    return reply.code(400).send({ error: 'type and numeric value required' });
  }
  addCare({ crewId: req.params.id, type, value, at: at ?? new Date().toISOString() });
  // Simulated physiology: once a dehydrated astronaut has drunk enough, the wearable drifts back to normal.
  if (type === 'water' && snapshot(req.params.id).scenario === 'dehydrated' && intakeSummary(req.params.id).waterMlLast3h >= 500) {
    setScenario(req.params.id, 'nominal');
  }
  return crewState(req.params.id);
});

/** Demo: choose which physiological scenario the simulated wearable follows. */
app.put<{ Params: { id: string }; Body: { scenario: Scenario } }>('/api/crew/:id/scenario', async (req, reply) => {
  crewOr404(req.params.id);
  if (!SCENARIOS.includes(req.body?.scenario)) return reply.code(400).send({ error: `scenario must be one of ${SCENARIOS.join(', ')}` });
  setScenario(req.params.id, req.body.scenario);
  return crewState(req.params.id);
});

app.post<{ Params: { id: string } }>('/api/crew/:id/reset', async (req) => {
  crewOr404(req.params.id);
  resetCrew(req.params.id);
  setScenario(req.params.id, 'nominal');
  setConsciousness(req.params.id, 'A');
  return crewState(req.params.id);
});

app.get<{ Querystring: { at?: string } }>('/api/space-weather', async (req) => ({
  ...spaceWeatherSummary(),
  activeAt: req.query.at ? solarEventAt(req.query.at) : null,
}));

interface CheckBody {
  task: TaskId;
  pvt: PvtResult;
  symptoms: Symptom[];
  sleepHours?: number;
  /** ACVPU observed by a crewmate; the only vital not measured by the wearable */
  consciousness?: Acvpu;
  /** mission date used for space weather (demo: 2024-05-11T06:00:00Z) */
  missionTime?: string;
}

app.post<{ Params: { id: string }; Body: CheckBody }>('/api/crew/:id/check', async (req, reply) => {
  const c = crewOr404(req.params.id);
  const b = req.body;
  if (!b || !TASKS[b.task] || !b.pvt) return reply.code(400).send({ error: 'task and pvt required' });
  if (b.consciousness) setConsciousness(c.id, b.consciousness);
  const vitals = vitalsNow(c.id)!;
  // Guest (judge on the QR code) has no care log: use a neutral, well-hydrated intake so only PVT + vitals decide.
  const intake = c.guest
    ? { waterMlLast3h: 500, minutesSinceMeal: 90, minutesSinceVoid: 30, urineColor: 2, sleepHours: 7 }
    : intakeSummary(c.id);
  const input: CheckInput = {
    task: b.task,
    vitals,
    baseline: c.baseline,
    pvt: b.pvt,
    pvtBaselineMedianMs: c.pvtBaselineMedianMs,
    intake: { waterMlLast3h: intake.waterMlLast3h, minutesSinceMeal: intake.minutesSinceMeal, minutesSinceVoid: intake.minutesSinceVoid, urineColor: intake.urineColor },
    symptoms: b.symptoms ?? [],
    sleepHours: b.sleepHours ?? intake.sleepHours ?? 7,
    solarEvent: b.missionTime ? solarEventAt(b.missionTime) : null,
    // OSDR blood tests are pre/post-flight, not today's: shown as reference, never used for today's verdict
  };
  const record = { ...evaluateCheck(input), id: randomUUID(), crewId: c.id, pvt: pvtStats(b.pvt, c.pvtBaselineMedianMs) };
  addCheck(record);
  return { ...record, input };
});

app.get<{ Querystring: { crewId?: string } }>('/api/checks', async (req) => checksFor(req.query.crewId));

await app.listen({ port: PORT, host: '0.0.0.0' });
console.log(`ASTRO-CARE habitat server on http://localhost:${PORT}`);
