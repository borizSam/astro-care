import type { AvatarState } from '@astro-care/engine';
import type { CrewState, TelemetryFrame } from '../api';

const STATE: Record<AvatarState, { label: string; color: string }> = {
  optimal: { label: 'NORMAL', color: '#4ade80' },
  low: { label: 'RIESGO BAJO', color: '#eab308' },
  medium: { label: 'RIESGO MEDIO', color: '#f97316' },
  high: { label: 'RIESGO ALTO', color: '#f43f5e' },
};

/** Small hologram silhouette: colour = NEWS2 state, heart beats at the live heart rate. */
function MiniBody({ state, heartRate }: { state: AvatarState; heartRate: number }) {
  const c = STATE[state].color;
  const beat = `${(60 / Math.max(30, heartRate)).toFixed(2)}s`;
  return (
    <svg viewBox="0 0 100 140" className="h-28 w-auto" aria-hidden>
      <defs>
        <radialGradient id={`glow-${state}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={c} stopOpacity="0.28" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="70" rx="48" ry="68" fill={`url(#glow-${state})`}>
        {state === 'high' && <animate attributeName="opacity" values="0.4;1;0.4" dur="0.9s" repeatCount="indefinite" />}
      </ellipse>
      <g fill={c} fillOpacity="0.12" stroke={c} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="50" cy="16" r="10" />
        <path d="M38 30 h24 l14 6 12 30 -6 3 -12 -24 -2 30 4 54 h-9 l-6 -46 h-2 l-6 46 h-9 l4 -54 -2 -30 -12 24 -6 -3 12 -30 z" />
      </g>
      <g stroke={c} strokeOpacity="0.35" strokeWidth="0.6">
        <line x1="50" y1="30" x2="50" y2="78" />
        <line x1="40" y1="50" x2="60" y2="50" />
        <line x1="41" y1="64" x2="59" y2="64" />
      </g>
      <circle cx="54" cy="44" r="4" fill="#f43f5e">
        <animate attributeName="r" values="4;5.6;4;4" keyTimes="0;0.12;0.3;1" dur={beat} repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

interface Props {
  crew: CrewState[];
  frames: Record<string, TelemetryFrame>;
  selected: string;
  onSelect: (id: string) => void;
}

export function CrewStrip({ crew, frames, selected, onSelect }: Props) {
  return (
    <section className="hud" aria-label="Estado de la tripulación">
      <h2 className="hud-title border-b border-line px-4 py-2.5">Estado de la tripulación</h2>
      <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-4">
        {crew.map((c) => {
          const f = frames[c.id];
          const state = f?.avatar ?? c.avatar;
          const v = f?.vitals ?? c.vitals;
          const n = f?.news2.total ?? c.news2.total;
          const last = f?.lastCheck ?? c.lastCheck;
          const s = STATE[state];
          const active = c.id === selected;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              aria-pressed={active}
              className={`grid-bg flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition ${active ? 'border-hud shadow-[0_0_18px] shadow-hud/30' : 'border-line hover:border-dim'}`}
            >
              <MiniBody state={state} heartRate={v.heartRate} />
              <div>
                <div className="hud-title text-lg leading-tight">{c.id}</div>
                <div className="font-mono text-[11px] text-dim">{c.role}</div>
              </div>
              <span className="rounded-full border px-3 py-0.5 font-mono text-[11px] font-bold" style={{ color: s.color, borderColor: s.color }}>
                {s.label}
              </span>
              <div className="flex gap-3 font-mono text-[11px] text-dim">
                <span>NEWS2 <b style={{ color: s.color }}>{n}</b></span>
                <span>♥ <b className="text-white">{v.heartRate}</b></span>
                <span>O₂ <b className="text-white">{v.spo2}%</b></span>
              </div>
              {last && (
                <div className={`font-mono text-[11px] font-bold ${last.verdict === 'GO' ? 'text-hud' : 'text-nogo'}`}>
                  Último test: {last.verdict === 'GO' ? 'GO' : 'NO-GO'} · {last.task.toUpperCase()}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
