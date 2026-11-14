import { motion } from 'motion/react';
import type { CrewState } from '../api';

function Bar({ label, value, detail }: { label: string; value: number; detail: string }) {
  const color = value >= 60 ? 'var(--color-go)' : value >= 30 ? '#eab308' : 'var(--color-nogo)';
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono text-xs text-dim">{detail}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${value}%` }} transition={{ type: 'spring', stiffness: 60, damping: 15 }} />
      </div>
    </div>
  );
}

const h = (m: number) => (m >= 24 * 60 ? 'none today' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`);

export function Bars({ crew }: { crew: CrewState }) {
  const { levels, intake } = crew;
  return (
    <div className="flex flex-col gap-3">
      <Bar label="Hydration" value={levels.hydration} detail={`${intake.waterMlLast3h} ml / 3 h`} />
      <Bar label="Nutrition" value={levels.nutrition} detail={`meal ${h(intake.minutesSinceMeal)}`} />
      <Bar label="Activity" value={levels.activity} detail={`${intake.exerciseMinToday} min today`} />
      <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-dim">
        <span>🚻 {h(intake.minutesSinceVoid)}</span>
        <span>🧻 {h(intake.minutesSinceStool)}</span>
        <span>🛏️ {intake.sleepHours ?? '?'} h</span>
      </div>
    </div>
  );
}
