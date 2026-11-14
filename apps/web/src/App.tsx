import { useCallback, useEffect, useState } from 'react';
import { api, minutesAgo, type CrewState, type Meta } from './api';
import { Crew } from './screens/Crew';
import { Home } from './screens/Home';
import { Readiness } from './screens/Readiness';

type View = 'home' | 'test' | 'crew';

/** Real DONKI solar particle event: GOES-P SEISS >100 MeV, 11 May 2024. */
const STORM_TIME = '2024-05-11T06:00:00Z';

const PRESETS = {
  rested: async (id: string) => {
    await api.reset(id);
    await api.care(id, 'sleep', 7.5, minutesAgo(180));
    await api.care(id, 'food', 700, minutesAgo(80));
    await api.care(id, 'water', 500, minutesAgo(60));
    await api.care(id, 'water', 250, minutesAgo(20));
    await api.care(id, 'urine', 2, minutesAgo(15));
    await api.care(id, 'exercise', 30, minutesAgo(120));
  },
  dehydrated: async (id: string) => {
    await api.reset(id);
    await api.care(id, 'sleep', 7, minutesAgo(300));
    await api.care(id, 'food', 700, minutesAgo(120));
    await api.care(id, 'water', 100, minutesAgo(150));
    await api.care(id, 'urine', 6, minutesAgo(200));
  },
  fatigued: async (id: string) => {
    await api.reset(id);
    await api.care(id, 'sleep', 4, minutesAgo(120));
    await api.care(id, 'food', 500, minutesAgo(90));
    await api.care(id, 'water', 600, minutesAgo(40));
    await api.care(id, 'urine', 3, minutesAgo(10));
  },
};

export default function App() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [crew, setCrew] = useState<CrewState[]>([]);
  const [selected, setSelected] = useState('C001');
  const [view, setView] = useState<View>('home');
  const [storm, setStorm] = useState(false);
  const [labTimepoint, setLabTimepoint] = useState('R+1');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setCrew(await api.crew());
      setError(null);
    } catch {
      setError('Habitat server unreachable. Start it with `npm run dev`.');
    }
  }, []);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => setError('Habitat server unreachable. Start it with `npm run dev`.'));
    refresh();
  }, [refresh]);

  const current = crew.find((c) => c.id === selected);
  const updateOne = (c: CrewState) => setCrew((all) => all.map((x) => (x.id === c.id ? c : x)));

  async function applyPreset(p: keyof typeof PRESETS) {
    await PRESETS[p](selected);
    await refresh();
    setView('home');
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-mono text-xl font-black tracking-widest">ASTRO<span className="text-signal">-</span>CARE</h1>
          <span className="hidden text-xs text-dim sm:inline">Artemis lunar surface · offline habitat</span>
        </div>
        <nav className="flex gap-1" aria-label="Main">
          {(['home', 'crew'] as const).map((v) => (
            <button key={v} onClick={() => { setView(v); refresh(); }} aria-current={view === v} className={`min-h-10 rounded-lg px-3 text-sm ${view === v ? 'bg-line' : 'text-dim hover:text-white'}`}>
              {v === 'home' ? 'Me' : 'Crew'}
            </button>
          ))}
        </nav>
      </header>

      <div className="panel flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
        <label className="flex items-center gap-2">
          <span className="label">Crew</span>
          <select value={selected} onChange={(e) => { setSelected(e.target.value); setView('home'); }} className="rounded border border-line bg-void px-2 py-1">
            {crew.map((c) => <option key={c.id} value={c.id}>{c.id} · {c.role}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={storm} onChange={(e) => setStorm(e.target.checked)} />
          <span>Space weather: <b className={storm ? 'text-nogo' : 'text-go'}>{storm ? '11 May 2024 solar storm (DONKI)' : 'nominal'}</b></span>
        </label>
        <label className="flex items-center gap-2">
          <span className="label">Blood test</span>
          <select value={labTimepoint} onChange={(e) => setLabTimepoint(e.target.value)} className="rounded border border-line bg-void px-2 py-1">
            {meta?.timepoints.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <div className="ml-auto flex items-center gap-1">
          <span className="label">Demo</span>
          {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((p) => (
            <button key={p} onClick={() => applyPreset(p)} className="rounded border border-line px-2 py-1 text-xs hover:border-signal">{p}</button>
          ))}
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-nogo/50 p-3 text-sm text-nogo">{error}</div>}

      <main className="flex-1">
        {current && meta && view === 'home' && <Home crew={current} labTimepoint={labTimepoint} onChange={updateOne} onStartTest={() => setView('test')} />}
        {current && meta && view === 'test' && (
          <Readiness key={current.id} crew={current} meta={meta} missionTime={storm ? STORM_TIME : undefined} labTimepoint={labTimepoint} onCrewChange={updateOne} onExit={() => { setView('home'); refresh(); }} />
        )}
        {view === 'crew' && <Crew crew={crew} onSelect={(id) => { setSelected(id); setView('home'); }} />}
      </main>

      <footer className="pb-2 text-center text-[11px] text-dim">
        Data: NASA OSDR OSD-569 / OSD-575 (Inspiration4 crew blood tests) · NASA DONKI space weather · NASA HRP risks · NEWS2 (RCP 2017) · PVT-B. Vitals baselines simulated. Decision support only.
      </footer>
    </div>
  );
}
