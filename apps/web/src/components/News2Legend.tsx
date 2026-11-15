import { useState } from 'react';
import type { News2Breakdown, Vitals } from '@astro-care/engine';

/** NEWS2 bands (Royal College of Physicians 2017) and what the crew does in each. */
const BANDS = [
  { range: '0', label: 'Normal', action: 'Continue', color: '#4ade80' },
  { range: '1–4', label: 'Low', action: 'Monitor', color: '#eab308' },
  { range: '5–6 or a 3', label: 'Medium', action: 'Call surgeon', color: '#f97316' },
  { range: '≥ 7', label: 'High', action: 'Emergency', color: '#f43f5e' },
];

function bandIndex(n: News2Breakdown) {
  if (n.total >= 7) return 3;
  if (n.total >= 5 || n.anySingleThree) return 2;
  if (n.total >= 1) return 1;
  return 0;
}

const PARAMS: { key: keyof Omit<News2Breakdown, 'total' | 'anySingleThree'>; label: string; value: (v: Vitals) => string; normal: string }[] = [
  { key: 'respRate', label: 'Respiratory rate', value: (v) => `${v.respRate} /min`, normal: '12–20' },
  { key: 'spo2', label: 'O₂ saturation', value: (v) => `${v.spo2} %`, normal: '≥ 96' },
  { key: 'systolicBP', label: 'Systolic BP', value: (v) => `${v.systolicBP} mmHg`, normal: '111–219' },
  { key: 'heartRate', label: 'Heart rate', value: (v) => `${v.heartRate} bpm`, normal: '51–90' },
  { key: 'tempC', label: 'Temperature', value: (v) => `${v.tempC.toFixed(1)} °C`, normal: '36.1–38.0' },
  { key: 'consciousness', label: 'Consciousness (ACVPU)', value: (v) => (v.consciousness === 'A' ? 'Alert' : v.consciousness), normal: 'Alert' },
];

const POINT_COLOR = ['#7f9a8c', '#eab308', '#f97316', '#f43f5e'];

export function News2Legend({ news2, vitals }: { news2: News2Breakdown; vitals: Vitals }) {
  const [open, setOpen] = useState(false);
  const active = bandIndex(news2);

  return (
    <div className="relative">
      <div className="flex items-stretch gap-1">
        {BANDS.map((b, i) => {
          const on = i === active;
          return (
            <div
              key={b.label}
              className="flex-1 rounded border px-1.5 py-1 text-center font-mono leading-tight transition"
              style={{ borderColor: on ? b.color : 'var(--color-line)', background: on ? `${b.color}22` : 'transparent', opacity: on ? 1 : 0.55 }}
              aria-current={on ? 'true' : undefined}
            >
              <div className="text-[11px] font-bold" style={{ color: b.color }}>{b.range}</div>
              <div className="text-[10px] text-white">{b.label}</div>
              <div className="text-[9px] text-dim">{b.action}</div>
            </div>
          );
        })}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rounded border border-line px-2 font-mono text-[10px] text-dim hover:border-hud hover:text-white"
        >
          {open ? 'close' : 'see table'}
        </button>
      </div>

      {open && (
        <div className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-lg border border-hud/60 bg-void/95 p-3 shadow-2xl backdrop-blur" role="dialog" aria-label="NEWS2 table">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="label text-hud">How NEWS2 is calculated</span>
            <span className="font-mono text-[10px] text-dim">each parameter adds 0–3 points</span>
          </div>
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="text-left text-[10px] text-dim">
                <th className="pb-1 font-normal">Parameter</th>
                <th className="pb-1 font-normal">Normal</th>
                <th className="pb-1 text-right font-normal">Now</th>
                <th className="pb-1 text-right font-normal">Points</th>
              </tr>
            </thead>
            <tbody>
              {PARAMS.map((p) => {
                const pts = news2[p.key];
                return (
                  <tr key={p.key} className="border-t border-line">
                    <td className="py-1">{p.label}</td>
                    <td className="py-1 text-dim">{p.normal}</td>
                    <td className="py-1 text-right text-white">{p.value(vitals)}</td>
                    <td className="py-1 text-right font-bold" style={{ color: POINT_COLOR[pts] }}>+{pts}</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-hud/40">
                <td className="pt-1.5 font-bold" colSpan={3}>Total NEWS2</td>
                <td className="pt-1.5 text-right text-base font-bold" style={{ color: BANDS[active].color }}>{news2.total}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-[10px] text-dim">Early warning score used in hospitals (Royal College of Physicians, 2017). Consciousness is assessed by a crewmate.</p>
        </div>
      )}
    </div>
  );
}
