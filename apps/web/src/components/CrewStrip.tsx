import { useEffect } from 'react';
import { motion } from 'motion/react';
import type { AvatarState } from '@astro-care/engine';
import type { CrewState, TelemetryFrame } from '../api';
import { Avatar3D } from './Avatar3D';

export const CREW_STATE: Record<AvatarState, { label: string; color: string }> = {
  optimal: { label: 'NORMAL', color: '#4ade80' },
  low: { label: 'LOW RISK', color: '#eab308' },
  medium: { label: 'MEDIUM RISK', color: '#f97316' },
  high: { label: 'HIGH RISK', color: '#f43f5e' },
};

interface Props {
  crew: CrewState[];
  frames: Record<string, TelemetryFrame>;
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

/** Full-screen crew status: one card per crew member with the same live 3D hologram. */
export function CrewOverlay({ crew, frames, selected, onSelect, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.section
        initial={{ y: 24, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 24, scale: 0.98 }}
        role="dialog"
        aria-modal="true"
        aria-label="Crew status"
        className="hud w-full max-w-6xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <h2 className="hud-title">Crew status</h2>
          <button onClick={onClose} className="rounded border border-line px-3 py-1 font-mono text-xs text-dim hover:border-hud hover:text-white" aria-label="Close">
            CLOSE ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
          {crew.map((c) => {
            const f = frames[c.id];
            const state = f?.avatar ?? c.avatar;
            const v = f?.vitals ?? c.vitals;
            const n = f?.news2.total ?? c.news2.total;
            const last = f?.lastCheck ?? c.lastCheck;
            const s = CREW_STATE[state];
            const active = c.id === selected;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                aria-pressed={active}
                className={`grid-bg flex flex-col items-center gap-2 overflow-hidden rounded-lg border pb-3 text-center transition ${active ? 'border-hud shadow-[0_0_18px] shadow-hud/30' : 'border-line hover:border-dim'}`}
                style={state === 'high' ? { borderColor: s.color } : undefined}
              >
                <div className="relative h-60 w-full" style={{ background: `radial-gradient(ellipse at 50% 45%, ${s.color}22, transparent 65%)` }}>
                  <Avatar3D compact state={state} heartRate={v.heartRate} respRate={v.respRate} spo2={v.spo2} />
                  <span className="pointer-events-none absolute left-2 top-2 font-mono text-[11px] text-nogo">♥ {v.heartRate}</span>
                </div>
                <div>
                  <div className="hud-title text-xl leading-tight">{c.id}</div>
                  <div className="font-mono text-[11px] text-dim">{c.role}</div>
                </div>
                <span className="rounded-full border px-3 py-0.5 font-mono text-[11px] font-bold" style={{ color: s.color, borderColor: s.color }}>
                  {s.label}
                </span>
                <div className="flex gap-3 font-mono text-[11px] text-dim">
                  <span>NEWS2 <b style={{ color: s.color }}>{n}</b></span>
                  <span>O₂ <b className="text-white">{v.spo2}%</b></span>
                  <span>RR <b className="text-white">{v.respRate}</b></span>
                </div>
                <div className={`font-mono text-[11px] font-bold ${!last ? 'text-dim' : last.verdict === 'GO' ? 'text-hud' : 'text-nogo'}`}>
                  {last ? `Last test: ${last.verdict === 'GO' ? 'GO' : 'NO-GO'} · ${last.task.toUpperCase()}` : 'No test today'}
                </div>
              </button>
            );
          })}
        </div>
        <p className="px-4 pb-3 font-mono text-[10px] text-dim">Tap a crew member to open their console · Esc to close</p>
      </motion.section>
    </motion.div>
  );
}
