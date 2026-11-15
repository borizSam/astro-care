import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Symptom, SymptomDef } from '@astro-care/engine';
import { api, minutesAgo, type CrewState, type Meta, type Scenario } from './api';
import { BodyPanel } from './components/BodyPanel';
import { CREW_STATE, CrewOverlay } from './components/CrewStrip';
import { PvtPanel } from './components/PvtPanel';
import { News2Table } from './components/News2Legend';
import { useTelemetry } from './useTelemetry';

/** Real DONKI solar particle event: GOES-P SEISS >100 MeV, 11 May 2024. */
const STORM_TIME = '2024-05-11T06:00:00Z';
const PVT_SECONDS = 30; // demo length; validated PVT-B is 3 min
const IS_LIVE = new URLSearchParams(location.search).has('live');
const GUEST = 'GUEST';
/** Tasks shown in the console: enough to show the verdict depends on the task. */
const SHOWN_TASKS = ['eva', 'lab'];

const PRESETS: Record<string, { scenario: Scenario; care: [Parameters<typeof api.care>[1], number, number][] }> = {
  rested: { scenario: 'nominal', care: [['sleep', 7.5, 180], ['food', 700, 80], ['water', 500, 60], ['water', 250, 20], ['urine', 2, 15]] },
  dehydrated: { scenario: 'dehydrated', care: [['sleep', 7, 300], ['food', 700, 120], ['water', 100, 150], ['urine', 6, 200]] },
  fatigued: { scenario: 'fatigued', care: [['sleep', 4, 120], ['food', 500, 90], ['water', 600, 40], ['urine', 3, 10]] },
  hypoxic: { scenario: 'hypoxic', care: [['sleep', 7, 200], ['water', 500, 60], ['urine', 2, 30]] },
};

type GuestCheck = NonNullable<NonNullable<ReturnType<typeof useTelemetry>['frames'][string]>['lastCheck']>;

export default function App() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [crew, setCrew] = useState<CrewState[]>([]);
  const [selected, setSelected] = useState(IS_LIVE ? GUEST : 'C001');
  const [storm, setStorm] = useState(false);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { frames, connected } = useTelemetry();

  const refresh = useCallback(async () => {
    try {
      setCrew(await api.crew());
      setError(null);
    } catch {
      setError('Cannot reach the habitat server. Start it with `npm run dev`.');
    }
  }, []);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => setError('Cannot reach the habitat server.'));
    refresh();
  }, [refresh]);

  const current = crew.find((c) => c.id === selected);

  function selectCrew(id: string) {
    setSelected(id);
    setSymptoms([]);
  }

  const [showCrew, setShowCrew] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  // Presenter shortcuts (ignored while typing or during the reaction test, where Space is used).
  const presetRef = useRef(applyPreset);
  presetRef.current = applyPreset;
  useEffect(() => {
    if (IS_LIVE) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'd') setShowDemo((v) => !v);
      else if (k === 's') setStorm((v) => !v);
      else if (['1', '2', '3', '4'].includes(k)) void presetRef.current(Object.keys(PRESETS)[Number(k) - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const crewMembers = crew.filter((c) => c.id !== GUEST);
  const crewAlerts = crewMembers.filter((c) => (frames[c.id]?.avatar ?? c.avatar) !== 'optimal').length;
  const frame = frames[selected];

  const toggle = (zone: string, s: SymptomDef) =>
    setSymptoms((cur) => (cur.some((x) => x.id === s.id) ? cur.filter((x) => x.id !== s.id) : [...cur, { id: s.id, zone, label: s.label, severity: s.defaultSeverity }]));

  async function applyPreset(name: string) {
    const p = PRESETS[name];
    await api.reset(selected);
    for (const [type, value, ago] of p.care) await api.care(selected, type, value, minutesAgo(ago));
    await api.scenario(selected, p.scenario);
    setSymptoms([]);
    await refresh();
  }

  async function care(type: 'water' | 'food' | 'urine') {
    await api.care(selected, type, type === 'water' ? 250 : type === 'food' ? 700 : 3);
    await refresh();
  }


  // Big screen: announce when a judge finishes the live test on their phone.
  const guestCheck = frames[GUEST]?.lastCheck ?? null;
  const [toast, setToast] = useState<GuestCheck | null>(null);
  const seenGuestId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (IS_LIVE || !frames[GUEST]) return;
    const id = guestCheck?.id ?? null;
    if (seenGuestId.current === undefined) {
      seenGuestId.current = id; // first frame: don't replay an old result
      return;
    }
    if (guestCheck && id !== seenGuestId.current) {
      seenGuestId.current = id;
      setToast(guestCheck);
      const t = window.setTimeout(() => setToast(null), 9000);
      return () => window.clearTimeout(t);
    }
  }, [guestCheck, frames]);

  const vitals = frame?.vitals ?? current?.vitals;
  const news2 = frame?.news2 ?? current?.news2;

  if (IS_LIVE) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-3 p-3">
        <Header subtitle="Live fatigue test" />
        {meta && <PvtPanel crewId={GUEST} tasks={meta.tasks.filter((t) => SHOWN_TASKS.includes(t.id))} symptoms={[]} durationS={PVT_SECONDS} />}
        <p className="label text-center">Your result appears on the big screen</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col gap-4 px-4 py-4">
      <Header
        subtitle="Medical console"
        right={current && <span className="font-mono text-xs text-dim">Crew member: <b className="text-hud">{current.id} · {current.role}</b></span>}
      />

      {error && <div role="alert" className="rounded border border-nogo/50 p-3 font-mono text-sm text-nogo">{error}</div>}

      {meta && current && vitals && news2 && (
        <main className="grid flex-1 gap-4 lg:grid-cols-[1fr_1.15fr]">
          <BodyPanel
            zones={meta.bodyZones}
            symptoms={symptoms}
            onToggle={toggle}
            vitals={vitals}
            news2={news2}
            avatar={frame?.avatar ?? current.avatar}
            live={connected}
            waterMl={current.intake.waterMlLast3h}
            onCare={care}
          />
          <div className="flex flex-col gap-4">
            <PvtPanel
              key={selected}
              crewId={selected}
              tasks={meta.tasks.filter((t) => SHOWN_TASKS.includes(t.id))}
              symptoms={symptoms}
              missionTime={storm ? STORM_TIME : undefined}
              durationS={PVT_SECONDS}
              onVerdict={() => refresh()}
            />
            <News2Table news2={news2} vitals={vitals} />
          </div>
        </main>
      )}

      <AnimatePresence>
        {showCrew && (
          <CrewOverlay
            crew={crewMembers}
            frames={frames}
            selected={selected}
            onSelect={(id) => { selectCrew(id); setShowCrew(false); }}
            onClose={() => setShowCrew(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            role="status"
            className={`fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-xl border-2 bg-void px-6 py-4 text-center shadow-2xl ${toast.verdict === 'GO' ? 'border-hud' : 'border-nogo'}`}
          >
            <div className="label">Live test from a phone</div>
            <div className={`hud-title text-5xl ${toast.verdict === 'GO' ? 'text-hud' : 'text-nogo'}`}>{toast.verdict === 'GO' ? 'GO' : 'NO-GO'}</div>
            {toast.pvt && <div className="font-mono text-sm">median {toast.pvt.medianMs} ms · {toast.pvt.lapses} lapses</div>}
          </motion.div>
        )}
      </AnimatePresence>

      <StatusBar connected={connected} storm={storm} onStorm={setStorm} onCrew={() => setShowCrew(true)} crewAlerts={crewAlerts} />
      {showDemo && <DemoPanel onPreset={applyPreset} onClose={() => setShowDemo(false)} />}
    </div>
  );
}

function Header({ subtitle, right }: { subtitle: string; right?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
          <circle cx="20" cy="20" r="18" fill="none" stroke="#4ade80" strokeWidth="1.5" opacity="0.6" />
          <path d="M20 8 v24 M8 20 h24" stroke="#4ade80" strokeWidth="5" strokeLinecap="round" />
          <circle cx="20" cy="20" r="4" fill="#040706" stroke="#4ade80" strokeWidth="1.5" />
        </svg>
        <h1 className="hud-title text-2xl sm:text-3xl">
          ASTRO-CARE <span className="text-dim">{subtitle}</span>
        </h1>
      </div>
      {right}
    </header>
  );
}

function StatusBar({ connected, storm, onStorm, onCrew, crewAlerts }: { connected: boolean; storm: boolean; onStorm: (v: boolean) => void; onCrew: () => void; crewAlerts: number }) {
  return (
    <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-3 font-mono text-[11px] uppercase tracking-wider text-dim">
      <button
        onClick={onCrew}
        className="flex items-center gap-2 rounded-md border border-hud bg-hud/10 px-3 py-1.5 font-bold text-hud hover:bg-hud/20"
      >
        Crew status
        {crewAlerts > 0 && (
          <span className="rounded-full px-1.5 text-[10px] text-void" style={{ background: CREW_STATE.medium.color }}>
            {crewAlerts} {crewAlerts === 1 ? 'alert' : 'alerts'}
          </span>
        )}
      </button>
      <span>Telemetry link: <b className={connected ? 'text-hud' : 'text-nogo'}>{connected ? 'active' : 'lost'}</b></span>
      <label className="flex cursor-pointer items-center gap-1.5">
        <input type="checkbox" checked={storm} onChange={(e) => onStorm(e.target.checked)} />
        Space weather (NASA DONKI): <b className={storm ? 'text-nogo' : 'text-hud'}>{storm ? 'solar particle storm · 11 May 2024' : 'normal'}</b>
      </label>
    </footer>
  );
}

/** Presenter-only demo panel, toggled with the D key (hidden from the audience by default). */
function DemoPanel({ onPreset, onClose }: { onPreset: (p: string) => void; onClose: () => void }) {
  return (
    <div className="fixed bottom-14 right-4 z-50 rounded-lg border border-amber/60 bg-void/95 p-3 font-mono text-xs shadow-2xl">
      <div className="mb-2 flex items-center justify-between gap-6 text-amber">
        <span>DEMO (presenter)</span>
        <button onClick={onClose} aria-label="Close demo">✕</button>
      </div>
      <div className="flex flex-col gap-1">
        {Object.keys(PRESETS).map((p, i) => (
          <button key={p} onClick={() => onPreset(p)} className="rounded border border-line px-3 py-1 text-left hover:border-amber hover:text-white">
            <kbd className="mr-2 text-amber">{i + 1}</kbd>{p}
          </button>
        ))}
      </div>
      <div className="mt-2 text-[10px] text-dim">D show/hide · 1–4 profile · S storm</div>
    </div>
  );
}
