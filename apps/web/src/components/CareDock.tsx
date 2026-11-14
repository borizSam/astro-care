import { useState } from 'react';
import { api, type CareType, type CrewState } from '../api';

interface Action {
  type: CareType;
  icon: string;
  label: string;
  options: { label: string; value: number }[];
  hrp: string;
}

const ACTIONS: Action[] = [
  { type: 'water', icon: '💧', label: 'Water', options: [{ label: '+100 ml', value: 100 }, { label: '+250 ml', value: 250 }, { label: '+500 ml', value: 500 }], hrp: 'Plasma volume, orthostatic tolerance' },
  { type: 'food', icon: '🍽️', label: 'Food', options: [{ label: 'Snack', value: 250 }, { label: 'Meal', value: 700 }], hrp: 'HRP: inadequate nutrition' },
  { type: 'urine', icon: '🚻', label: 'Urine', options: [1, 2, 3, 4, 5, 6, 7, 8].map((c) => ({ label: String(c), value: c })), hrp: 'Hydration, renal stones' },
  { type: 'stool', icon: '🧻', label: 'Stool', options: [1, 2, 3, 4, 5, 6, 7].map((c) => ({ label: `B${c}`, value: c })), hrp: 'GI / microbiome' },
  { type: 'exercise', icon: '🏃', label: 'Exercise', options: [{ label: '15 min', value: 15 }, { label: '30 min', value: 30 }, { label: '60 min', value: 60 }], hrp: 'HRP: bone & fitness loss' },
  { type: 'sleep', icon: '🛏️', label: 'Sleep', options: [4, 5, 6, 7, 8].map((h) => ({ label: `${h} h`, value: h })), hrp: 'HRP: inadequate sleep' },
];

const URINE_COLORS = ['#fdfbe3', '#f9f3b1', '#f5ea7d', '#efdc4f', '#e6c62e', '#d5a521', '#b98319', '#8f5d12'];

export function CareDock({ crew, onChange }: { crew: CrewState; onChange: (c: CrewState) => void }) {
  const [open, setOpen] = useState<CareType | null>(null);
  const [busy, setBusy] = useState(false);

  async function log(type: CareType, value: number) {
    setBusy(true);
    try {
      onChange(await api.care(crew.id, type, value));
      setOpen(null);
    } finally {
      setBusy(false);
    }
  }

  const active = ACTIONS.find((a) => a.type === open);

  return (
    <section className="panel p-4" aria-label="Care actions">
      <div className="label mb-3">Care log</div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ACTIONS.map((a) => (
          <button
            key={a.type}
            onClick={() => setOpen(open === a.type ? null : a.type)}
            aria-expanded={open === a.type}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border text-sm transition ${open === a.type ? 'border-signal bg-signal/10' : 'border-line hover:border-dim'}`}
          >
            <span className="text-2xl" aria-hidden>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>
      {active && (
        <div className="mt-3 rounded-xl border border-line p-3">
          <div className="mb-2 text-xs text-dim">{active.label}: {active.hrp}{active.type === 'urine' && ' · color scale 1–8'}{active.type === 'stool' && ' · Bristol scale'}</div>
          <div className="flex flex-wrap gap-2">
            {active.options.map((o) => (
              <button
                key={o.label}
                disabled={busy}
                onClick={() => log(active.type, o.value)}
                className="min-h-11 min-w-11 rounded-lg border border-line px-3 text-sm hover:border-signal disabled:opacity-50"
                style={active.type === 'urine' ? { background: URINE_COLORS[o.value - 1], color: '#111' } : undefined}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
