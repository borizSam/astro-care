import { HISTORY_S, type Sample } from '../useTelemetry';

const W = 300;
const H = 44;

interface Series {
  key: keyof Sample;
  label: string;
  unit: string;
  /** fixed scale so a change means the same thing every time */
  min: number;
  max: number;
  /** normal band (NEWS2 score 0) drawn behind the line */
  band: [number, number];
  bad: (v: number) => boolean;
}

const SERIES: Series[] = [
  { key: 'heartRate', label: 'Heart rate', unit: 'bpm', min: 40, max: 130, band: [51, 90], bad: (v) => v > 90 || v < 51 },
  { key: 'spo2', label: 'Oxygen', unit: '%', min: 86, max: 100, band: [96, 100], bad: (v) => v < 96 },
  { key: 'news2', label: 'NEWS2', unit: 'pts', min: 0, max: 9, band: [0, 0.5], bad: (v) => v >= 1 },
];

/** Live trend of the last two minutes: the astronaut sees the change, not just the number. */
export function TrendPanel({ samples }: { samples: Sample[] }) {
  return (
    <section className="hud flex min-w-0 flex-1 flex-col" aria-label="Live trend">
      <h2 className="hud-title flex items-baseline justify-between border-b border-line px-4 py-2.5">
        Trend <span className="label">last {HISTORY_S / 60} min · band = normal</span>
      </h2>
      <div className="flex flex-1 flex-col justify-around gap-1 px-4 py-2">
        {SERIES.map((s) => {
          const y = (v: number) => H - ((Math.min(s.max, Math.max(s.min, v)) - s.min) / (s.max - s.min)) * H;
          const x = (i: number) => W - (samples.length - 1 - i) * (W / (HISTORY_S - 1));
          const pts = samples.map((p, i) => `${x(i).toFixed(1)},${y(p[s.key]).toFixed(1)}`).join(' ');
          const last = samples.at(-1)?.[s.key];
          const first = samples[0]?.[s.key];
          const bad = last !== undefined && s.bad(last);
          const color = bad ? (s.key === 'news2' && last >= 5 ? '#f43f5e' : '#f59e0b') : '#4ade80';
          const delta = last !== undefined && first !== undefined ? last - first : 0;
          return (
            <div key={s.key} className="flex items-center gap-3">
              <div className="w-16 shrink-0">
                <div className="label">{s.label}</div>
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-11 min-w-0 flex-1" role="img" aria-label={`${s.label}: ${last ?? '—'} ${s.unit}`}>
                <rect x="0" width={W} y={y(s.band[1])} height={Math.max(2, y(s.band[0]) - y(s.band[1]))} fill="#4ade80" opacity="0.08" />
                {samples.length > 1 && <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
              </svg>
              <div className="w-24 shrink-0 text-right font-mono tabular-nums">
                <b className="text-xl" style={{ color }}>{last ?? '—'}</b> <span className="text-[10px] text-dim">{s.unit}</span>
                <div className="text-[10px] text-dim">{Math.abs(delta) < 1 ? 'stable' : `${delta > 0 ? '▲ +' : '▼ −'}${Math.abs(Math.round(delta))} in ${samples.length >= 60 ? `${Math.round(samples.length / 60)} min` : `${samples.length} s`}`}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
