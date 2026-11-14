import { useState } from 'react';
import type { News2Breakdown, Vitals } from '@astro-care/engine';

/** NEWS2 bands (Royal College of Physicians 2017) and what the crew does in each. */
const BANDS = [
  { range: '0', label: 'Normal', action: 'Seguir', color: '#4ade80' },
  { range: '1–4', label: 'Bajo', action: 'Vigilar', color: '#eab308' },
  { range: '5–6 o un 3', label: 'Medio', action: 'Avisar médico', color: '#f97316' },
  { range: '≥ 7', label: 'Alto', action: 'Emergencia', color: '#f43f5e' },
];

function bandIndex(n: News2Breakdown) {
  if (n.total >= 7) return 3;
  if (n.total >= 5 || n.anySingleThree) return 2;
  if (n.total >= 1) return 1;
  return 0;
}

const PARAMS: { key: keyof Omit<News2Breakdown, 'total' | 'anySingleThree'>; label: string; value: (v: Vitals) => string; normal: string }[] = [
  { key: 'respRate', label: 'Frecuencia respiratoria', value: (v) => `${v.respRate} /min`, normal: '12–20' },
  { key: 'spo2', label: 'Saturación O₂', value: (v) => `${v.spo2} %`, normal: '≥ 96' },
  { key: 'systolicBP', label: 'Presión sistólica', value: (v) => `${v.systolicBP} mmHg`, normal: '111–219' },
  { key: 'heartRate', label: 'Pulso', value: (v) => `${v.heartRate} lpm`, normal: '51–90' },
  { key: 'tempC', label: 'Temperatura', value: (v) => `${v.tempC.toFixed(1).replace('.', ',')} °C`, normal: '36,1–38,0' },
  { key: 'consciousness', label: 'Consciencia (ACVPU)', value: (v) => (v.consciousness === 'A' ? 'Alerta' : v.consciousness), normal: 'Alerta' },
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
          {open ? 'cerrar' : 'ver tabla'}
        </button>
      </div>

      {open && (
        <div className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-lg border border-hud/60 bg-void/95 p-3 shadow-2xl backdrop-blur" role="dialog" aria-label="Tabla NEWS2">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="label text-hud">Cómo se calcula NEWS2</span>
            <span className="font-mono text-[10px] text-dim">cada parámetro suma 0–3 puntos</span>
          </div>
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="text-left text-[10px] text-dim">
                <th className="pb-1 font-normal">Parámetro</th>
                <th className="pb-1 font-normal">Normal</th>
                <th className="pb-1 text-right font-normal">Ahora</th>
                <th className="pb-1 text-right font-normal">Puntos</th>
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
          <p className="mt-2 text-[10px] text-dim">Escala de alerta temprana que se usa en hospitales (Royal College of Physicians, 2017). La consciencia la marca un compañero.</p>
        </div>
      )}
    </div>
  );
}
