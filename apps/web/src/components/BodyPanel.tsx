import { useRef, useState } from 'react';
import type { News2Breakdown, Symptom, SymptomDef, Vitals, AvatarState } from '@astro-care/engine';
import { Avatar3D, type Anchor } from './Avatar3D';
import { News2Legend } from './News2Legend';

/** Hotspot positions on the model (metres, feet at y = 0). */
const ANCHORS: Anchor[] = [
  { id: 'head', pos: [0, 1.7, 0.03] },
  { id: 'chest', pos: [0.03, 1.27, 0.12] },
  { id: 'abdomen', pos: [0, 1.02, 0.12] },
  { id: 'skin', pos: [0.46, 1.28, 0] },
  { id: 'joints', pos: [-0.11, 0.5, 0.06] },
  { id: 'hr', pos: [0.03, 1.27, 0.12] },
];

function risk(n: News2Breakdown) {
  if (n.total >= 7) return { label: 'HIGH RISK', color: 'text-nogo' };
  if (n.total >= 5 || n.anySingleThree) return { label: 'MEDIUM RISK', color: 'text-orange-400' };
  if (n.total >= 1) return { label: 'LOW RISK', color: 'text-yellow-400' };
  return { label: 'NORMAL', color: 'text-hud' };
}

interface Props {
  zones: { zone: string; label: string; symptoms: SymptomDef[] }[];
  symptoms: Symptom[];
  onToggle: (zone: string, s: SymptomDef) => void;
  vitals: Vitals;
  news2: News2Breakdown;
  avatar: AvatarState;
  live: boolean;
  waterMl: number;
  onCare: (type: 'water' | 'food' | 'urine') => void;
}

export function BodyPanel({ zones, symptoms, onToggle, vitals, news2, avatar, live, waterMl, onCare }: Props) {
  const els = useRef<Record<string, HTMLElement | null>>({});
  const [open, setOpen] = useState<string | null>(null);
  const r = risk(news2);
  // eyes share the head hotspot (too close to tap separately)
  const hotspots = zones.filter((z) => z.zone !== 'eyes');
  const group = (zone: string) => zones.filter((z) => z.zone === zone || (zone === 'head' && z.zone === 'eyes'));
  const openGroup = open ? group(open) : [];

  return (
    <section className="hud flex flex-col" aria-label="Symptom selection">
      <h2 className="hud-title border-b border-line px-4 py-2.5">Symptom selection</h2>

      <div className="grid-bg relative min-h-[380px] flex-1 overflow-hidden">
        <Avatar3D state={avatar} heartRate={vitals.heartRate} respRate={vitals.respRate} spo2={vitals.spo2} anchors={ANCHORS} anchorEls={els} />

        {hotspots.map((z) => {
          const active = symptoms.some((s) => group(z.zone).some((g) => g.zone === s.zone));
          return (
            <button
              key={z.zone}
              ref={(n) => { els.current[z.zone] = n; }}
              onClick={() => setOpen(open === z.zone ? null : z.zone)}
              aria-label={`${z.label}${active ? ' (symptom marked)' : ''}`}
              aria-expanded={open === z.zone}
              className="invisible absolute left-0 top-0 -ml-5 -mt-5 flex h-10 w-10 items-center justify-center"
            >
              <span className={`hotspot-ring absolute inset-0 rounded-full border-2 ${active ? 'border-nogo' : 'border-hud'}`} />
              <span className={`h-4 w-4 rounded-full shadow-[0_0_14px] ${active ? 'bg-nogo shadow-nogo' : 'bg-hud shadow-hud'} ${open === z.zone ? 'ring-2 ring-white' : ''}`} />
            </button>
          );
        })}

        {/* live heart-rate callout */}
        <div ref={(n) => { els.current.hr = n; }} className="pointer-events-none invisible absolute left-0 top-0">
          <svg width="90" height="44" className="absolute left-0 top-[-44px]" aria-hidden>
            <polyline points="2,44 50,6 90,6" fill="none" stroke="var(--color-hud)" strokeWidth="1.2" />
          </svg>
          <div className="absolute left-[90px] top-[-62px] whitespace-nowrap border border-hud/70 bg-void/85 px-2.5 py-1 font-mono text-sm leading-tight text-hud">
            Heart rate:<br />
            <span className="text-white">{vitals.heartRate} bpm</span>
          </div>
        </div>

        {openGroup.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-line bg-void/90 p-3 backdrop-blur" role="dialog" aria-label={`Symptoms: ${openGroup[0].label}`}>
            <div className="mb-2 flex items-center justify-between">
              <span className="label text-hud">{openGroup.map((g) => g.label).join(' · ')}</span>
              <button onClick={() => setOpen(null)} className="label hover:text-white" aria-label="Close">✕</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {openGroup.flatMap((g) =>
                g.symptoms.map((s) => {
                  const on = symptoms.some((x) => x.id === s.id);
                  return (
                    <button key={s.id} aria-pressed={on} onClick={() => onToggle(g.zone, s)} className={`min-h-10 rounded border px-3 font-mono text-xs ${on ? 'border-nogo bg-nogo/20 text-white' : 'border-line text-dim hover:border-hud hover:text-white'}`}>
                      {s.label}
                    </button>
                  );
                }),
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-line px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2" aria-live="polite">
            <span className="label">NEWS2</span>
            <b className={`hud-title text-4xl leading-none ${r.color}`}>{news2.total}</b>
            <span className={`font-mono text-xs font-bold ${r.color}`}>{r.label}</span>
          </div>
          <div className="flex items-baseline gap-4 font-mono">
            <span className="text-dim text-xs">♥ <b className="text-2xl text-white">{vitals.heartRate}</b> bpm</span>
            <span className="text-dim text-xs">O₂ <b className={`text-2xl ${vitals.spo2 < 94 ? 'text-purple-400' : 'text-white'}`}>{vitals.spo2}</b>%</span>
          </div>
          <span className={`font-mono text-xs ${live ? 'text-hud' : 'text-nogo'}`}>{live ? '● LIVE' : '○ NO SIGNAL'}</span>
        </div>
        <News2Legend news2={news2} vitals={vitals} />
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="label">Needs</span>
          <button onClick={() => onCare('water')} className="rounded border border-line px-2 py-1 hover:border-hud">+250 ml water</button>
          <button onClick={() => onCare('food')} className="rounded border border-line px-2 py-1 hover:border-hud">meal</button>
          <button onClick={() => onCare('urine')} className="rounded border border-line px-2 py-1 hover:border-hud">toilet</button>
          <span className="ml-auto text-dim">water 3 h: <b className={waterMl >= 500 ? 'text-hud' : 'text-amber'}>{waterMl} ml</b></span>
        </div>
      </div>
    </section>
  );
}
