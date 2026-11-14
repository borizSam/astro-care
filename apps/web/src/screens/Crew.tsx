import { Avatar } from '../components/Avatar';
import type { CrewState, TelemetryFrame } from '../api';

export function Crew({ crew, frames, onSelect }: { crew: CrewState[]; frames: Record<string, TelemetryFrame>; onSelect: (id: string) => void }) {
  const live = crew
    .map((c) => ({ ...c, ...(frames[c.id] ?? {}) }))
    .sort((a, b) => b.news2.total - a.news2.total);
  return (
    <section aria-label="Crew status">
      <div className="label mb-3">Crew status · sorted by severity</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {live.map((c) => (
          <button key={c.id} onClick={() => onSelect(c.id)} className="panel flex flex-col items-center gap-1 p-3 text-left hover:border-dim">
            <Avatar state={c.avatar} respRate={c.vitals.respRate} size={110} />
            <div className="w-full">
              <div className="font-semibold">{c.id}</div>
              <div className="text-xs text-dim">{c.role}</div>
              <div className="mt-1 flex justify-between font-mono text-xs">
                <span>NEWS2 {c.news2.total}</span>
                <span>♥ {c.vitals.heartRate}</span>
                <span>💧 {c.levels.hydration}%</span>
              </div>
              {c.lastCheck && (
                <div className={`mt-1 text-xs font-bold ${c.lastCheck.verdict === 'GO' ? 'text-go' : 'text-nogo'}`}>
                  {c.lastCheck.verdict.replace('_', '-')} · {c.lastCheck.task}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
