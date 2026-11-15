import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { Finding, PvtResult, Symptom, Task, TaskId } from '@astro-care/engine';
import { api, type CheckResponse } from '../api';

/** No response within this time = lapse (and the test moves on). */
const NO_RESPONSE_MS = 5000;

/** What tapping DONE logs for each fixable finding (others, e.g. an incomplete test, have no one-tap fix). */
const CARE_FIX: Partial<Record<Finding['source'], ['water' | 'food' | 'urine', number]>> = {
  hydration: ['water', 500],
  urine: ['water', 500],
  void: ['urine', 3],
  meal: ['food', 500],
};

type Phase = 'idle' | 'waiting' | 'stimulus' | 'feedback' | 'evaluating' | 'verdict';

interface Props {
  crewId: string;
  tasks: Task[];
  symptoms: Symptom[];
  missionTime?: string;
  durationS: number;
  onProgress?: (p: number) => void;
  onVerdict?: (r: CheckResponse) => void;
}

const fmt = (ms: number) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = Math.floor(ms % 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(r).padStart(3, '0')}`;
};

/**
 * PVT (PVT-B style): random 2–10 s foreperiod, respond as soon as the ring lights up.
 * Responses before the stimulus or < 100 ms after it are false starts.
 * At the end, the GO / NO-GO is computed with the live vitals.
 */
export function PvtPanel({ crewId, tasks, symptoms, missionTime, durationS, onProgress, onVerdict }: Props) {
  const [task, setTask] = useState<TaskId>('eva');
  const [phase, setPhase] = useState<Phase>('idle');
  const [ms, setMs] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const rts = useRef<number[]>([]);
  const falseStarts = useRef(0);
  const stimAt = useRef(0);
  const startAt = useRef(0);
  const timer = useRef(0);
  const raf = useRef(0);
  const noResponse = useRef(0);

  const evaluate = useCallback(
    async (pvt: PvtResult) => {
      setPhase('evaluating');
      const r = await api.check(crewId, { task, pvt, symptoms, consciousness: 'A', missionTime });
      setResult(r);
      setPhase('verdict');
      onVerdict?.(r);
    },
    [crewId, task, symptoms, missionTime, onVerdict],
  );

  const finish = useCallback(() => {
    window.clearTimeout(timer.current);
    window.clearTimeout(noResponse.current);
    cancelAnimationFrame(raf.current);
    onProgress?.(1);
    void evaluate({ reactionTimesMs: rts.current, falseStarts: falseStarts.current });
  }, [evaluate, onProgress]);

  const schedule = useCallback(() => {
    const left = durationS * 1000 - (performance.now() - startAt.current);
    if (left <= 0) return finish();
    setPhase('waiting');
    timer.current = window.setTimeout(() => {
      if (performance.now() - startAt.current >= durationS * 1000) return finish();
      stimAt.current = performance.now();
      setPhase('stimulus');
      const tick = () => {
        setMs(performance.now() - stimAt.current);
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
      // No response: count it as a lapse and keep going (the test must never hang).
      noResponse.current = window.setTimeout(() => {
        cancelAnimationFrame(raf.current);
        rts.current.push(NO_RESPONSE_MS);
        setMs(-2);
        setPhase('feedback');
        window.setTimeout(schedule, 700);
      }, NO_RESPONSE_MS);
    }, 2000 + Math.random() * 8000);
  }, [durationS, finish]);

  const start = () => {
    rts.current = [];
    falseStarts.current = 0;
    setResult(null);
    setMs(0);
    startAt.current = performance.now();
    schedule();
  };

  const respond = useCallback(() => {
    if (phase === 'idle' || phase === 'verdict') return start();
    if (phase === 'waiting') {
      falseStarts.current += 1;
      window.clearTimeout(timer.current);
      setMs(-1);
      setPhase('feedback');
      window.setTimeout(schedule, 700);
    } else if (phase === 'stimulus') {
      window.clearTimeout(noResponse.current);
      cancelAnimationFrame(raf.current);
      const rt = Math.round(performance.now() - stimAt.current);
      if (rt < 100) falseStarts.current += 1;
      else rts.current.push(rt);
      setMs(rt);
      setPhase('feedback');
      window.setTimeout(schedule, 700);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, schedule]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (phase === 'waiting' || phase === 'stimulus')) {
        e.preventDefault();
        respond();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [respond, phase]);

  const running = phase === 'waiting' || phase === 'stimulus' || phase === 'feedback';
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const e = Math.min(1, (performance.now() - startAt.current) / (durationS * 1000));
      setElapsed(e);
      onProgress?.(e);
    }, 200);
    return () => window.clearInterval(id);
  }, [running, durationS, onProgress]);

  useEffect(() => () => { window.clearTimeout(timer.current); window.clearTimeout(noResponse.current); cancelAnimationFrame(raf.current); }, []);

  // Verdict on screen + conditions change (solar storm toggled, symptom tapped, task switched): recompute with the same PVT, no need to repeat the test.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (phase === 'verdict' && rts.current.length) void evaluate({ reactionTimesMs: rts.current, falseStarts: falseStarts.current });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionTime, symptoms, task]);

  async function fix(f: Finding) {
    setBusy(true);
    try {
      const care = CARE_FIX[f.source];
      if (!care) return;
      await api.care(crewId, care[0], care[1]);
      const pvt = { reactionTimesMs: rts.current, falseStarts: falseStarts.current };
      await evaluate(pvt);
    } finally {
      setBusy(false);
    }
  }

  const status = { idle: 'STANDBY', waiting: 'RUNNING · WAIT', stimulus: 'RUNNING · TAP!', feedback: 'RUNNING', evaluating: 'COMPUTING', verdict: 'COMPLETE' }[phase];
  const lit = phase === 'stimulus';
  const go = result?.verdict === 'GO';

  return (
    <section className="hud flex flex-col" aria-label="PVT reaction test">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <h2 className="hud-title">PVT reaction test <span className="text-dim">(based on NASA PVT-B)</span></h2>
        <div className="flex gap-1" role="radiogroup" aria-label="Task">
          {tasks.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={task === t.id}
              disabled={running}
              onClick={() => setTask(t.id)}
              className={`rounded px-2.5 py-1 font-mono text-[11px] uppercase ${task === t.id ? 'bg-hud text-void' : 'border border-line text-dim hover:text-white'} disabled:opacity-50`}
            >
              {t.id === 'eva' ? 'EVA' : t.id === 'rover' ? 'ROVER' : 'LAB'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid flex-1 items-center gap-6 p-5 sm:grid-cols-[auto_1fr]">
        <button
          onPointerDown={phase === 'evaluating' ? undefined : respond}
          aria-label={phase === 'idle' || phase === 'verdict' ? 'Start test' : 'Reaction target'}
          className="relative mx-auto flex h-52 w-52 select-none items-center justify-center rounded-full"
        >
          <motion.span
            className="absolute inset-0 rounded-full border-[10px]"
            animate={{
              borderColor: lit ? '#4ade80' : phase === 'waiting' || phase === 'feedback' ? '#78350f' : '#f59e0b',
              boxShadow: lit ? '0 0 60px #4ade80' : phase === 'idle' || phase === 'verdict' ? '0 0 40px #f59e0b88' : '0 0 0px #0000',
            }}
            transition={{ duration: 0.05 }}
          />
          <span className="absolute inset-4 rounded-full border border-amber/30" />
          <span className={`absolute inset-6 flex items-center justify-center rounded-full ${lit ? 'bg-hud/90' : 'bg-[radial-gradient(circle,#fff7e6,#e9dcc0)]'}`}>
            <span className={`hud-title text-center text-3xl leading-none ${lit ? 'text-void' : 'text-green-700'}`}>
              {phase === 'idle' && <>START<br />TEST</>}
              {phase === 'verdict' && <>REPEAT<br />TEST</>}
              {phase === 'waiting' && <span className="text-xl text-stone-500">WAIT…</span>}
              {phase === 'stimulus' && <>NOW!</>}
              {phase === 'feedback' && <span className="text-xl text-stone-600">{ms === -2 ? 'NO RESPONSE' : ms < 0 ? 'TOO EARLY' : `${ms} ms`}</span>}
              {phase === 'evaluating' && <span className="text-lg text-stone-500">…</span>}
            </span>
          </span>
        </button>

        <div className="flex min-w-0 flex-col gap-4">
          {phase !== 'verdict' ? (
            <>
              <div className="border-y border-dashed border-line py-3">
                <div className="font-mono text-5xl font-bold tabular-nums tracking-tight sm:text-6xl" aria-live="off">
                  {fmt(ms > 0 ? ms : 0)} <span className="text-2xl text-dim">ms</span>
                </div>
              </div>
              <div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-[#fde68a] shadow-[0_0_10px_#fde68a] transition-[width] duration-200" style={{ width: `${(running ? elapsed : phase === 'idle' ? 0 : 1) * 100}%` }} />
                </div>
                <div className="label mt-2">PVT status: {status}</div>
              </div>
              <p className="font-mono text-xs text-dim">
                {durationS} s (demo version; the validated test lasts 3 min) · tap the ring (or press Space) as soon as it turns green · {rts.current.length} responses · {falseStarts.current} false starts
              </p>
            </>
          ) : (
            result && (
              <div className="flex flex-col gap-3" aria-live="polite">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`rounded-lg border py-4 text-center ${go ? 'border-hud bg-hud/10 text-hud' : 'border-nogo bg-nogo/10 text-nogo'}`}
                >
                  <div className="hud-title text-6xl leading-none">{go ? 'GO' : 'NO-GO'}</div>
                  <div className="mt-1 font-mono text-xs text-dim">
                    {tasks.find((t) => t.id === result.task)?.label} · NEWS2 {result.news2}
                    {result.pvt && <> · median {result.pvt.medianMs} ms ({result.pvt.slowdownPct >= 0 ? '+' : ''}{result.pvt.slowdownPct}%)</>}
                  </div>
                </motion.div>
                <ul className="flex max-h-48 flex-col gap-2 overflow-auto">
                  {result.blockers.map((f, i) => (
                    <li key={i} className="flex items-start justify-between gap-2 rounded border border-nogo/40 p-2 font-mono text-xs">
                      <span>{f.reason}<br /><b className="text-white">→ {f.action}</b></span>
                      {f.fixable && CARE_FIX[f.source] && (
                        <button disabled={busy} onClick={() => fix(f)} className="shrink-0 rounded bg-hud px-3 py-1.5 font-bold text-void disabled:opacity-50">DONE</button>
                      )}
                    </li>
                  ))}
                  {result.advice.slice(0, 2).map((f, i) => (
                    <li key={`a${i}`} className="rounded border border-line p-2 font-mono text-xs text-dim">{f.reason} → {f.action}</li>
                  ))}
                </ul>
                <p className="font-mono text-[10px] text-dim">Decision support only. The final call belongs to the commander or flight surgeon.</p>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
