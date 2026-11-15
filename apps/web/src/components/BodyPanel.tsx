import { useRef, useState } from 'react';
import type { AvatarState, BodyZone, News2Breakdown, Symptom, SymptomDef, Vitals } from '@astro-care/engine';
import type { CrewState, PvtSummary } from '../api';
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

type Level = 0 | 1 | 2;
const LEVEL = [
  { label: 'GOOD', text: 'text-hud', border: 'border-hud', bg: 'bg-hud shadow-hud' },
  { label: 'WATCH', text: 'text-amber', border: 'border-amber', bg: 'bg-amber shadow-amber' },
  { label: 'ALERT', text: 'text-nogo', border: 'border-nogo', bg: 'bg-nogo shadow-nogo' },
] as const;

function risk(n: News2Breakdown) {
  if (n.total >= 7) return { label: 'HIGH RISK', color: 'text-nogo' };
  if (n.total >= 5 || n.anySingleThree) return { label: 'MEDIUM RISK', color: 'text-orange-400' };
  if (n.total >= 1) return { label: 'LOW RISK', color: 'text-yellow-400' };
  return { label: 'NORMAL', color: 'text-hud' };
}

const hours = (min: number) => (min >= 24 * 60 ? 'not logged' : min < 60 ? `${min} min ago` : `${Math.round(min / 60)} h ago`);
const fromScore = (s: number): Level => (s >= 3 ? 2 : s >= 1 ? 1 : 0);

interface Reading {
  label: string;
  value: string;
  level: Level;
}

/** Today's numbers for one body zone, each with its own traffic-light level. */
function readings(zone: string, v: Vitals, n: News2Breakdown, intake: CrewState['intake'], pvt?: PvtSummary): Reading[] {
  switch (zone) {
    case 'head': {
      const sleep = intake.sleepHours;
      return [
        { label: 'Sleep', value: sleep === undefined ? 'not logged' : `${sleep} h`, level: sleep === undefined ? 0 : sleep < 5 ? 2 : sleep < 6 ? 1 : 0 },
        { label: 'Reaction', value: pvt ? `${pvt.medianMs} ms (${pvt.slowdownPct >= 0 ? '+' : ''}${pvt.slowdownPct} %)` : 'take the test', level: !pvt ? 0 : pvt.slowdownPct > 15 ? 2 : pvt.slowdownPct > 7 ? 1 : 0 },
      ];
    }
    case 'chest':
      return [
        { label: 'Heart rate', value: `${v.heartRate} bpm`, level: fromScore(n.heartRate) },
        { label: 'Oxygen', value: `${v.spo2} %`, level: fromScore(n.spo2) },
        { label: 'Breathing', value: `${v.respRate} /min`, level: fromScore(n.respRate) },
        { label: 'Blood pressure', value: `${v.systolicBP} mmHg`, level: fromScore(n.systolicBP) },
      ];
    case 'abdomen':
      return [
        { label: 'Water (3 h)', value: `${intake.waterMlLast3h} ml`, level: intake.waterMlLast3h < 500 ? 1 : 0 },
        { label: 'Meal', value: hours(intake.minutesSinceMeal), level: intake.minutesSinceMeal > 300 ? 1 : 0 },
        { label: 'Toilet', value: hours(intake.minutesSinceVoid), level: intake.minutesSinceVoid > 120 ? 1 : 0 },
      ];
    case 'joints':
      return [{ label: 'Exercise today', value: `${intake.exerciseMinToday} / 120 min`, level: intake.exerciseMinToday < 30 ? 1 : 0 }];
    case 'skin':
      return [{ label: 'Temperature', value: `${v.tempC.toFixed(1)} °C`, level: fromScore(n.tempC) }];
    default:
      return [];
  }
}

interface Props {
  zones: BodyZone[];
  symptoms: Symptom[];
  onToggle: (zone: string, s: SymptomDef) => void;
  vitals: Vitals;
  news2: News2Breakdown;
  avatar: AvatarState;
  live: boolean;
  intake: CrewState['intake'];
  pvt?: PvtSummary;
  checkedToday: boolean;
  onCare: (type: 'water' | 'food' | 'urine' | 'exercise') => void;
}

export function BodyPanel({ zones, symptoms, onToggle, vitals, news2, avatar, live, intake, pvt, checkedToday, onCare }: Props) {
  const els = useRef<Record<string, HTMLElement | null>>({});
  const [open, setOpen] = useState<string | null>(null);
  const r = risk(news2);
  // eyes share the head hotspot (too close to tap separately)
  const hotspots = zones.filter((z) => z.zone !== 'eyes');
  const group = (zone: string) => zones.filter((z) => z.zone === zone || (zone === 'head' && z.zone === 'eyes'));
  const openGroup = open ? group(open) : [];

  const zoneReadings = (zone: string) => readings(zone, vitals, news2, intake, pvt);
  const zoneLevel = (zone: string): Level => {
    const marked = symptoms.filter((s) => group(zone).some((g) => g.zone === s.zone));
    const fromSymptoms: Level = marked.some((s) => s.severity !== 'mild') ? 2 : marked.length ? 1 : 0;
    return Math.max(fromSymptoms, ...zoneReadings(zone).map((x) => x.level)) as Level;
  };

  const routine: { id: string; label: string; done: boolean; tap?: 'water' | 'food' | 'urine' | 'exercise'; hint: string }[] = [
    { id: 'water', label: 'Water', done: intake.waterMlLast3h >= 500, tap: 'water', hint: '+250 ml' },
    { id: 'food', label: 'Meal', done: intake.minutesSinceMeal <= 300, tap: 'food', hint: 'one ration' },
    { id: 'urine', label: 'Toilet', done: intake.minutesSinceVoid <= 120, tap: 'urine', hint: 'log it' },
    { id: 'exercise', label: 'Exercise', done: intake.exerciseMinToday >= 30, tap: 'exercise', hint: '+30 min' },
    { id: 'sleep', label: 'Sleep', done: (intake.sleepHours ?? 0) >= 6, hint: 'wristband' },
    { id: 'check', label: 'Check', done: checkedToday, hint: 'reaction test' },
  ];
  const doneCount = routine.filter((x) => x.done).length;

  return (
    <section className="hud flex flex-col" aria-label="Astronaut status">
      <h2 className="hud-title flex items-baseline justify-between border-b border-line px-4 py-2.5">
        Your body today <span className="label">tap a zone</span>
      </h2>

      <div className="grid-bg relative min-h-[380px] flex-1 overflow-hidden">
        <Avatar3D state={avatar} heartRate={vitals.heartRate} respRate={vitals.respRate} spo2={vitals.spo2} anchors={ANCHORS} anchorEls={els} />

        {hotspots.map((z) => {
          const lv = LEVEL[zoneLevel(z.zone)];
          return (
            <button
              key={z.zone}
              ref={(n) => { els.current[z.zone] = n; }}
              onClick={() => setOpen(open === z.zone ? null : z.zone)}
              aria-label={`${z.label}: ${lv.label.toLowerCase()}`}
              aria-expanded={open === z.zone}
              className="invisible absolute left-0 top-0 -ml-5 -mt-5 flex h-10 w-10 items-center justify-center"
            >
              <span className={`hotspot-ring absolute inset-0 rounded-full border-2 ${lv.border}`} />
              <span className={`h-4 w-4 rounded-full shadow-[0_0_14px] ${lv.bg} ${open === z.zone ? 'ring-2 ring-white' : ''}`} />
            </button>
          );
        })}

        {/* live heart-rate callout */}
        <div ref={(n) => { els.current.hr = n; }} className={`pointer-events-none invisible absolute left-0 top-0 ${open ? 'opacity-0' : ''}`}>
          <svg width="90" height="44" className="absolute left-0 top-[-44px]" aria-hidden>
            <polyline points="2,44 50,6 90,6" fill="none" stroke="var(--color-hud)" strokeWidth="1.2" />
          </svg>
          <div className="absolute left-[90px] top-[-62px] whitespace-nowrap border border-hud/70 bg-void/85 px-2.5 py-1 font-mono text-sm leading-tight text-hud">
            Heart rate:<br />
            <span className="text-white">{vitals.heartRate} bpm</span>
          </div>
        </div>

        {open && openGroup.length > 0 && (
          <div className="absolute inset-x-3 bottom-3 rounded-lg border border-line bg-void/92 p-3 backdrop-blur" role="dialog" aria-label={openGroup[0].label}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="hud-title text-base">
                {openGroup.map((g) => g.label).join(' · ')}{' '}
                <span className={`ml-1 font-mono text-xs font-bold ${LEVEL[zoneLevel(open)].text}`}>● {LEVEL[zoneLevel(open)].label}</span>
              </span>
              <button onClick={() => setOpen(null)} className="label -m-2 p-2 hover:text-white" aria-label="Close">✕</button>
            </div>

            <div className="grid gap-x-4 gap-y-2 sm:grid-cols-[1fr_auto]">
              <dl className="flex flex-col gap-1 font-mono text-xs leading-snug">
                <div><dt className="label inline">What it does · </dt><dd className="inline text-white">{openGroup[0].info.job}</dd></div>
                <div><dt className="label inline text-amber">In space · </dt><dd className="inline">{openGroup[0].info.space}</dd></div>
                <div><dt className="label inline text-hud">What to do · </dt><dd className="inline">{openGroup[0].info.care}</dd></div>
                <div className="text-[10px] text-dim">NASA HRP risk: {openGroup.map((g) => g.info.hrp).join(' · ')}</div>
              </dl>
              <ul className="flex min-w-40 flex-col gap-1 border-line font-mono text-xs sm:border-l sm:pl-4">
                {zoneReadings(open).map((x) => (
                  <li key={x.label} className="flex items-baseline justify-between gap-3">
                    <span className="text-dim">{x.label}</span>
                    <b className={`tabular-nums ${LEVEL[x.level].text}`}>{x.value}</b>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line pt-2">
              <span className="label">Feeling anything?</span>
              {openGroup.flatMap((g) =>
                g.symptoms.map((s) => {
                  const on = symptoms.some((x) => x.id === s.id);
                  return (
                    <button key={s.id} aria-pressed={on} onClick={() => onToggle(g.zone, s)} className={`min-h-9 rounded border px-3 font-mono text-xs ${on ? 'border-nogo bg-nogo/20 text-white' : 'border-line text-dim hover:border-hud hover:text-white'}`}>
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
            <b className={`hud-title text-4xl leading-none tabular-nums ${r.color}`}>{news2.total}</b>
            <span className={`font-mono text-xs font-bold ${r.color}`}>{r.label}</span>
          </div>
          <div className="flex items-baseline gap-4 font-mono tabular-nums">
            <span className="text-xs text-dim">♥ <b className="text-2xl text-white">{vitals.heartRate}</b> bpm</span>
            <span className="text-xs text-dim">O₂ <b className={`text-2xl ${vitals.spo2 < 94 ? 'text-purple-400' : 'text-white'}`}>{vitals.spo2}</b>%</span>
          </div>
          <span className={`font-mono text-xs ${live ? 'text-hud' : 'text-nogo'}`}>{live ? '● LIVE' : '○ NO SIGNAL'}</span>
        </div>
        <News2Legend news2={news2} />
        <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
          <span className="label mr-1">
            Routine <b className={doneCount === routine.length ? 'text-hud' : 'text-amber'}>{doneCount}/{routine.length}</b>
          </span>
          {routine.map((x) => (
            <button
              key={x.id}
              disabled={!x.tap}
              onClick={() => x.tap && onCare(x.tap)}
              title={x.tap ? `Log: ${x.hint}` : `Automatic (${x.hint})`}
              className={`rounded border px-1.5 py-1 transition-colors ${x.done ? 'border-hud/60 bg-hud/10 text-hud' : 'border-line text-dim'} ${x.tap ? 'hover:border-hud hover:text-white' : 'cursor-default'}`}
            >
              {x.done ? '✓' : '○'} {x.label}
            </button>
          ))}
          {doneCount === routine.length && <span className="ml-auto font-bold text-hud">★ Day complete</span>}
        </div>
      </div>
    </section>
  );
}
