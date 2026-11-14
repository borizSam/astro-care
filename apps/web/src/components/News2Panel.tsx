import type { News2Breakdown, Vitals } from '@astro-care/engine';

const ROWS: { key: keyof Omit<News2Breakdown, 'total' | 'anySingleThree'>; label: string; unit: string; value: (v: Vitals) => string | number }[] = [
  { key: 'heartRate', label: 'Heart rate', unit: 'bpm', value: (v) => v.heartRate },
  { key: 'spo2', label: 'SpO₂', unit: '%', value: (v) => v.spo2 },
  { key: 'respRate', label: 'Resp. rate', unit: '/min', value: (v) => v.respRate },
  { key: 'systolicBP', label: 'Systolic BP', unit: 'mmHg', value: (v) => v.systolicBP },
  { key: 'tempC', label: 'Temperature', unit: '°C', value: (v) => v.tempC.toFixed(1) },
  { key: 'consciousness', label: 'Consciousness', unit: '', value: (v) => (v.consciousness === 'A' ? 'Alert' : v.consciousness) },
];

const SCORE_COLOR = ['text-dim', 'text-yellow-400', 'text-orange-400', 'text-nogo'];

function risk(n: News2Breakdown) {
  if (n.total >= 7) return { label: 'High risk', color: 'text-nogo', bg: 'bg-nogo/15' };
  if (n.total >= 5 || n.anySingleThree) return { label: 'Medium risk', color: 'text-orange-400', bg: 'bg-orange-400/15' };
  if (n.total >= 1) return { label: 'Low risk', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
  return { label: 'Normal', color: 'text-go', bg: 'bg-go/10' };
}

/** NEWS2 computed automatically from live telemetry, with the per-parameter score. */
export function News2Panel({ vitals, news2, live }: { vitals: Vitals; news2: News2Breakdown; live: boolean }) {
  const r = risk(news2);
  return (
    <section className="panel p-4" aria-label="NEWS2 live score">
      <div className="mb-3 flex items-center justify-between">
        <span className="label">NEWS2 · automatic</span>
        <span className={`flex items-center gap-1.5 font-mono text-[10px] ${live ? 'text-go' : 'text-nogo'}`}>
          <span className={`inline-block h-2 w-2 rounded-full ${live ? 'animate-pulse bg-go' : 'bg-nogo'}`} />
          {live ? 'LIVE 1 Hz' : 'NO SIGNAL'}
        </span>
      </div>
      <div className={`mb-3 flex items-baseline justify-between rounded-xl px-4 py-3 ${r.bg}`} aria-live="polite">
        <span className={`font-mono text-5xl font-black ${r.color}`}>{news2.total}</span>
        <span className={`font-semibold ${r.color}`}>{r.label}</span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {ROWS.map((row) => {
            const s = news2[row.key];
            return (
              <tr key={row.key} className="border-t border-line">
                <td className="py-1.5 text-dim">{row.label}</td>
                <td className="py-1.5 text-right font-mono tabular-nums">
                  {row.value(vitals)} <span className="text-[10px] text-dim">{row.unit}</span>
                </td>
                <td className={`w-10 py-1.5 text-right font-mono font-bold ${SCORE_COLOR[s]}`}>+{s}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[10px] text-dim">NEWS2, Royal College of Physicians 2017. Consciousness is set by a crewmate (ACVPU).</p>
    </section>
  );
}
