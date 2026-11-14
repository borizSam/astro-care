import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Acvpu, Finding, PvtResult, Symptom, TaskId, Vitals } from '@astro-care/engine';
import { Pvt } from '../components/Pvt';
import { api, type CheckResponse, type CrewState, type Meta } from '../api';

const STEPS = ['Task', 'Body', 'Needs', 'Reaction', 'Vitals', 'Verdict'] as const;
type Step = (typeof STEPS)[number];

const DEMO_PVT: Record<'rested' | 'fatigued', PvtResult> = {
  rested: { reactionTimesMs: [238, 251, 244, 262, 249, 255, 241, 258, 247, 252], falseStarts: 0 },
  fatigued: { reactionTimesMs: [301, 344, 389, 312, 455, 330, 371, 298, 402, 336], falseStarts: 2 },
};

interface Props {
  crew: CrewState;
  meta: Meta;
  missionTime?: string;
  labTimepoint: string;
  onCrewChange: (c: CrewState) => void;
  onExit: () => void;
}

export function Readiness({ crew, meta, missionTime, labTimepoint, onCrewChange, onExit }: Props) {
  const [step, setStep] = useState<Step>('Task');
  const [task, setTask] = useState<TaskId>('eva');
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [sleepHours, setSleepHours] = useState<number>(crew.intake.sleepHours ?? 7);
  const [pvt, setPvt] = useState<PvtResult | null>(null);
  const [vitals, setVitals] = useState<Vitals>({ ...crew.vitals });
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const idx = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  const back = () => (idx === 0 ? onExit() : setStep(STEPS[idx - 1]));

  async function evaluate(save = true) {
    setBusy(true);
    try {
      const r = await api.check(crew.id, { task, vitals, pvt: pvt ?? { reactionTimesMs: [], falseStarts: 0 }, symptoms, sleepHours, missionTime, labTimepoint, save });
      setResult(r);
      onCrewChange(await api.member(crew.id));
      setStep('Verdict');
    } finally {
      setBusy(false);
    }
  }

  /** "Done" on a fixable finding: log the corrective action, then recalculate. */
  async function fix(f: Finding) {
    if (f.source === 'hydration' && f.action.toLowerCase().includes('drink')) await api.care(crew.id, 'water', 500);
    else if (f.source === 'hydration') await api.care(crew.id, 'food', 500);
    else if (f.source === 'void') await api.care(crew.id, 'urine', 3);
    else if (f.source === 'urine') await api.care(crew.id, 'water', 500);
    else if (f.source === 'pvt') return setStep('Reaction');
    await evaluate(true);
  }

  const toggleSymptom = (zone: string, s: { id: string; label: string; defaultSeverity: Symptom['severity'] }) =>
    setSymptoms((cur) => (cur.some((x) => x.id === s.id) ? cur.filter((x) => x.id !== s.id) : [...cur, { id: s.id, zone, label: s.label, severity: s.defaultSeverity }]));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <ol className="flex gap-1" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? 'bg-signal' : 'bg-line'}`} aria-current={s === step ? 'step' : undefined} title={s} />
        ))}
      </ol>
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">{step === 'Verdict' ? 'Verdict' : `${idx + 1}. ${stepTitle(step)}`}</h2>
        <span className="label">{crew.id} · {crew.role}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="panel p-5">
          {step === 'Task' && (
            <div className="grid gap-3 sm:grid-cols-3">
              {meta.tasks.map((t) => (
                <button key={t.id} onClick={() => { setTask(t.id); next(); }} className={`min-h-28 rounded-xl border p-4 text-left ${task === t.id ? 'border-signal' : 'border-line hover:border-dim'}`}>
                  <div className="text-2xl" aria-hidden>{t.id === 'eva' ? '🧑‍🚀' : t.id === 'rover' ? '🚙' : '🔬'}</div>
                  <div className="mt-2 font-semibold">{t.label}</div>
                  <div className="mt-1 text-xs text-dim">NO-GO if reaction &gt;{t.pvtMaxSlowdownPct}% slower</div>
                </button>
              ))}
            </div>
          )}

          {step === 'Body' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-dim">Tap anything you feel right now. Leave empty if nothing.</p>
              {meta.bodyZones.map((z) => (
                <fieldset key={z.zone}>
                  <legend className="label mb-2">{z.label}</legend>
                  <div className="flex flex-wrap gap-2">
                    {z.symptoms.map((s) => {
                      const on = symptoms.some((x) => x.id === s.id);
                      return (
                        <button key={s.id} aria-pressed={on} onClick={() => toggleSymptom(z.zone, s)} className={`min-h-11 rounded-full border px-3 text-sm ${on ? 'border-nogo bg-nogo/15' : 'border-line hover:border-dim'}`}>
                          {s.label}{s.hrp && <span className="ml-1 text-[10px] text-dim">· {s.hrp}</span>}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          )}

          {step === 'Needs' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-dim">From your care log (edit it on the home screen):</p>
              <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
                <li className="rounded-lg border border-line p-3">💧 {crew.intake.waterMlLast3h} ml in 3 h</li>
                <li className="rounded-lg border border-line p-3">🍽️ meal {fmtMin(crew.intake.minutesSinceMeal)}</li>
                <li className="rounded-lg border border-line p-3">🚻 void {fmtMin(crew.intake.minutesSinceVoid)}</li>
                <li className="rounded-lg border border-line p-3">urine color {crew.intake.urineColor ?? '–'}/8</li>
              </ul>
              <label className="flex items-center justify-between gap-3">
                <span>Hours slept last night</span>
                <input type="number" min={0} max={14} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} className="w-24 rounded-lg border border-line bg-void px-3 py-2 font-mono" />
              </label>
            </div>
          )}

          {step === 'Reaction' && (
            <div className="flex flex-col gap-4">
              {pvt ? (
                <div className="text-center">
                  <p className="font-mono">{pvt.reactionTimesMs.length} responses · median {median(pvt.reactionTimesMs)} ms · baseline {crew.pvtBaselineMedianMs} ms</p>
                  <button onClick={() => setPvt(null)} className="mt-2 text-sm text-signal underline">Repeat test</button>
                </div>
              ) : (
                <Pvt durationS={60} onDone={setPvt} />
              )}
              <div className="flex flex-wrap justify-center gap-2 border-t border-line pt-3 text-xs">
                <span className="text-dim">Demo shortcut:</span>
                <button onClick={() => setPvt(DEMO_PVT.rested)} className="rounded border border-line px-2 py-1">rested result</button>
                <button onClick={() => setPvt(DEMO_PVT.fatigued)} className="rounded border border-line px-2 py-1">fatigued result</button>
              </div>
            </div>
          )}

          {step === 'Vitals' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['heartRate', 'Heart rate (bpm)'],
                  ['systolicBP', 'Systolic BP (mmHg)'],
                  ['spo2', 'SpO₂ (%)'],
                  ['respRate', 'Resp. rate (/min)'],
                  ['tempC', 'Temperature (°C)'],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="flex items-center justify-between gap-3">
                  <span className="text-sm">{label}</span>
                  <input type="number" step={k === 'tempC' ? 0.1 : 1} value={vitals[k]} onChange={(e) => setVitals({ ...vitals, [k]: Number(e.target.value) })} className="w-24 rounded-lg border border-line bg-void px-3 py-2 font-mono" />
                </label>
              ))}
              <label className="flex items-center justify-between gap-3 sm:col-span-2">
                <span className="text-sm">Consciousness, checked by a crewmate (ACVPU)</span>
                <select value={vitals.consciousness} onChange={(e) => setVitals({ ...vitals, consciousness: e.target.value as Acvpu })} className="rounded-lg border border-line bg-void px-3 py-2">
                  <option value="A">Alert</option>
                  <option value="C">New confusion</option>
                  <option value="V">Responds to voice</option>
                  <option value="P">Responds to pain</option>
                  <option value="U">Unresponsive</option>
                </select>
              </label>
              <p className="text-xs text-dim sm:col-span-2">Your baseline: HR {crew.baseline.heartRate} · SBP {crew.baseline.systolicBP} · SpO₂ {crew.baseline.spo2}%</p>
            </div>
          )}

          {step === 'Verdict' && result && <VerdictView result={result} crew={crew} onFix={fix} busy={busy} missionTime={missionTime} />}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between">
        <button onClick={back} className="min-h-11 rounded-lg border border-line px-4">{idx === 0 ? 'Cancel' : step === 'Verdict' ? 'Edit inputs' : 'Back'}</button>
        {step === 'Vitals' ? (
          <button disabled={busy} onClick={() => evaluate(true)} className="min-h-11 rounded-lg bg-signal px-5 font-semibold text-void disabled:opacity-50">Get verdict</button>
        ) : step === 'Verdict' ? (
          <button onClick={onExit} className="min-h-11 rounded-lg bg-signal px-5 font-semibold text-void">Back to home</button>
        ) : step !== 'Task' ? (
          <button disabled={step === 'Reaction' && !pvt} onClick={next} className="min-h-11 rounded-lg bg-signal px-5 font-semibold text-void disabled:opacity-40">Next</button>
        ) : null}
      </div>
    </div>
  );
}

function VerdictView({ result, crew, onFix, busy, missionTime }: { result: CheckResponse; crew: CrewState; onFix: (f: Finding) => void; busy: boolean; missionTime?: string }) {
  const go = result.verdict === 'GO';
  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      <motion.div
        key={result.id}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className={`rounded-2xl py-8 text-center font-mono text-6xl font-black tracking-widest ${go ? 'bg-go/15 text-go' : 'bg-nogo/15 text-nogo'}`}
      >
        {go ? 'GO' : 'NO-GO'}
        <div className="mt-2 text-sm font-normal tracking-normal text-dim">{result.task.toUpperCase()} · NEWS2 {result.news2}{result.fixableOnly && ' · fixable now'}</div>
      </motion.div>

      {result.blockers.map((f, i) => (
        <FindingRow key={`b${i}`} f={f} kind="block" onFix={onFix} busy={busy} />
      ))}
      {result.advice.length > 0 && <div className="label mt-2">Recommendations</div>}
      {result.advice.map((f, i) => (
        <FindingRow key={`a${i}`} f={f} kind="advice" />
      ))}

      <section className="rounded-xl border border-dashed border-line p-3 font-mono text-xs text-dim" aria-label="Flight readiness certificate">
        <div className="mb-1 text-[10px] uppercase tracking-widest">Flight readiness certificate</div>
        <div>{crew.id} ({crew.role}) · {result.task} · {go ? 'GO' : 'NO-GO'} · {new Date(result.timestamp).toLocaleString()}</div>
        <div>Check ID {result.id.slice(0, 8)} · {missionTime ? `space weather @ ${missionTime.slice(0, 16)}Z (NASA DONKI)` : 'space weather nominal'} · labs NASA OSDR</div>
        <div className="mt-1">Decision support only. Commander / flight surgeon makes the final call.</div>
      </section>
    </div>
  );
}

function FindingRow({ f, kind, onFix, busy }: { f: Finding; kind: 'block' | 'advice'; onFix?: (f: Finding) => void; busy?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-3 rounded-xl border p-3 ${kind === 'block' ? 'border-nogo/50' : 'border-line'}`}>
      <div>
        <div className="text-sm">{f.reason}</div>
        <div className="mt-1 text-sm font-semibold">→ {f.action}</div>
        {f.ref && <div className="mt-1 text-[11px] text-dim">{f.ref}</div>}
      </div>
      {kind === 'block' && f.fixable && onFix && (
        <button disabled={busy} onClick={() => onFix(f)} className="min-h-11 shrink-0 rounded-lg bg-go px-4 font-semibold text-void disabled:opacity-50">Done</button>
      )}
    </div>
  );
}

function stepTitle(s: Step) {
  return { Task: 'Choose the task', Body: 'Body check', Needs: 'Needs before the suit', Reaction: 'Reaction test', Vitals: 'Vitals', Verdict: 'Verdict' }[s];
}

function fmtMin(m: number) {
  return m >= 24 * 60 ? 'not today' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
