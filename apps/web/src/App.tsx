import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Symptom, SymptomDef } from '@astro-care/engine';
import { api, minutesAgo, type CrewState, type Meta, type Scenario } from './api';
import { BodyPanel } from './components/BodyPanel';
import { CrewStrip } from './components/CrewStrip';
import { PvtPanel } from './components/PvtPanel';
import { QrCard } from './components/QrCard';
import { useTelemetry } from './useTelemetry';

/** Real DONKI solar particle event: GOES-P SEISS >100 MeV, 11 May 2024. */
const STORM_TIME = '2024-05-11T06:00:00Z';
const PVT_SECONDS = 30; // demo length; validated PVT-B is 3 min
const IS_LIVE = new URLSearchParams(location.search).has('live');
const GUEST = 'GUEST';
const MISSION_START = Date.now() - (4 * 3600 + 32 * 60) * 1000;

const PRESETS: Record<string, { scenario: Scenario; care: [Parameters<typeof api.care>[1], number, number][] }> = {
  descansado: { scenario: 'nominal', care: [['sleep', 7.5, 180], ['food', 700, 80], ['water', 500, 60], ['water', 250, 20], ['urine', 2, 15]] },
  deshidratado: { scenario: 'dehydrated', care: [['sleep', 7, 300], ['food', 700, 120], ['water', 100, 150], ['urine', 6, 200]] },
  fatigado: { scenario: 'fatigued', care: [['sleep', 4, 120], ['food', 500, 90], ['water', 600, 40], ['urine', 3, 10]] },
  hipoxia: { scenario: 'hypoxic', care: [['sleep', 7, 200], ['water', 500, 60], ['urine', 2, 30]] },
};

type GuestCheck = NonNullable<NonNullable<ReturnType<typeof useTelemetry>['frames'][string]>['lastCheck']>;

export default function App() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [crew, setCrew] = useState<CrewState[]>([]);
  const [selected, setSelected] = useState(IS_LIVE ? GUEST : 'C001');
  const [storm, setStorm] = useState(false);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [visited, setVisited] = useState(false);
  const [pvtProgress, setPvtProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { frames, connected } = useTelemetry();

  const refresh = useCallback(async () => {
    try {
      setCrew(await api.crew());
      setError(null);
    } catch {
      setError('No se puede conectar con el servidor del hábitat. Arráncalo con `npm run dev`.');
    }
  }, []);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => setError('No se puede conectar con el servidor del hábitat.'));
    refresh();
  }, [refresh]);

  const current = crew.find((c) => c.id === selected);

  function selectCrew(id: string) {
    setSelected(id);
    setSymptoms([]);
    setPvtProgress(0);
    setVisited(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
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

  const qrUrl = useMemo(() => {
    const host = meta?.lanHosts?.[0];
    if (!host) return `${location.origin}/?live`;
    return host.startsWith('http') ? `${host.replace(/\/$/, '')}/?live` : `http://${host}:${location.port}/?live`;
  }, [meta]);

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

  const progress = 20 + (visited || symptoms.length ? 20 : 0) + pvtProgress * 60;
  const vitals = frame?.vitals ?? current?.vitals;
  const news2 = frame?.news2 ?? current?.news2;

  if (IS_LIVE) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-3 p-3">
        <Header subtitle="Test de fatiga en directo" />
        {meta && <PvtPanel crewId={GUEST} tasks={meta.tasks} symptoms={[]} durationS={PVT_SECONDS} />}
        <p className="label text-center">Tu resultado aparece en la pantalla grande</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col gap-4 px-4 py-4">
      <Header
        subtitle="Consola médica"
        right={current && <span className="font-mono text-xs text-dim">Tripulante: <b className="text-hud">{current.id} · {current.role}</b></span>}
      />

      {error && <div role="alert" className="rounded border border-nogo/50 p-3 font-mono text-sm text-nogo">{error}</div>}

      {meta && current && vitals && news2 && (
        <main className="grid flex-1 gap-4 lg:grid-cols-[1fr_1.15fr]">
          <BodyPanel
            zones={meta.bodyZones}
            symptoms={symptoms}
            onToggle={toggle}
            onZoneVisited={() => setVisited(true)}
            vitals={vitals}
            news2={news2}
            avatar={frame?.avatar ?? current.avatar}
            live={connected}
            progress={progress}
            waterMl={current.intake.waterMlLast3h}
            onCare={care}
          />
          <div className="flex flex-col gap-4">
            <PvtPanel
              key={selected}
              crewId={selected}
              tasks={meta.tasks}
              symptoms={symptoms}
              missionTime={storm ? STORM_TIME : undefined}
              durationS={PVT_SECONDS}
              onProgress={setPvtProgress}
              onVerdict={() => refresh()}
            />
            <QrCard url={qrUrl} />
          </div>
        </main>
      )}

      {crew.length > 0 && (
        <CrewStrip crew={crew.filter((c) => c.id !== GUEST)} frames={frames} selected={selected} onSelect={selectCrew} />
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            role="status"
            className={`fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-xl border-2 bg-void px-6 py-4 text-center shadow-2xl ${toast.verdict === 'GO' ? 'border-hud' : 'border-nogo'}`}
          >
            <div className="label">Test en directo desde el móvil</div>
            <div className={`hud-title text-5xl ${toast.verdict === 'GO' ? 'text-hud' : 'text-nogo'}`}>{toast.verdict === 'GO' ? 'GO' : 'NO-GO'}</div>
            {toast.pvt && <div className="font-mono text-sm">mediana {toast.pvt.medianMs} ms · {toast.pvt.lapses} lapsus</div>}
          </motion.div>
        )}
      </AnimatePresence>

      <StatusBar connected={connected} storm={storm} onStorm={setStorm} onPreset={applyPreset} />
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

function StatusBar({ connected, storm, onStorm, onPreset }: { connected: boolean; storm: boolean; onStorm: (v: boolean) => void; onPreset: (p: string) => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const s = Math.floor((now - MISSION_START) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const elapsed = `T+${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line pt-3 font-mono text-[11px] uppercase tracking-wider text-dim">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <span>Diagnóstico del sistema: <b className="text-white">estable</b></span>
        <span>Enlace de telemetría: <b className={connected ? 'text-hud' : 'text-nogo'}>{connected ? 'activo' : 'perdido'}</b></span>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={storm} onChange={(e) => onStorm(e.target.checked)} />
          Clima espacial: <b className={storm ? 'text-nogo' : 'text-hud'}>{storm ? 'evento SEP 11-may-2024 (DONKI)' : 'normal'}</b>
        </label>
        <span>Tiempo de misión: <b className="text-white">{elapsed}</b></span>
      </div>
      <div className="flex items-center gap-1">
        <span>Demo</span>
        {Object.keys(PRESETS).map((p) => (
          <button key={p} onClick={() => onPreset(p)} className="rounded border border-line px-2 py-0.5 normal-case hover:border-hud hover:text-white">{p}</button>
        ))}
      </div>
    </footer>
  );
}
