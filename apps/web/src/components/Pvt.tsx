import { useCallback, useEffect, useRef, useState } from 'react';
import type { PvtResult } from '@astro-care/engine';

type Phase = 'ready' | 'waiting' | 'stimulus' | 'feedback' | 'done';

/**
 * Psychomotor Vigilance Test (PVT-B style): random 2–10 s foreperiod, respond to the counter.
 * Responses < 100 ms after stimulus or before it count as false starts.
 */
export function Pvt({ durationS = 60, onDone }: { durationS?: number; onDone: (r: PvtResult) => void }) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [ms, setMs] = useState(0);
  const [left, setLeft] = useState(durationS);
  const rts = useRef<number[]>([]);
  const falseStarts = useRef(0);
  const stimAt = useRef(0);
  const endAt = useRef(0);
  const timer = useRef<number>(0);
  const raf = useRef<number>(0);

  const finish = useCallback(() => {
    window.clearTimeout(timer.current);
    cancelAnimationFrame(raf.current);
    setPhase('done');
    onDone({ reactionTimesMs: rts.current, falseStarts: falseStarts.current });
  }, [onDone]);

  const schedule = useCallback(() => {
    if (performance.now() >= endAt.current) return finish();
    setPhase('waiting');
    const delay = 2000 + Math.random() * 8000;
    timer.current = window.setTimeout(() => {
      if (performance.now() >= endAt.current) return finish();
      stimAt.current = performance.now();
      setPhase('stimulus');
      const tick = () => {
        setMs(Math.round(performance.now() - stimAt.current));
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    }, delay);
  }, [finish]);

  const start = () => {
    rts.current = [];
    falseStarts.current = 0;
    endAt.current = performance.now() + durationS * 1000;
    schedule();
  };

  const respond = useCallback(() => {
    if (phase === 'ready' || phase === 'done' || phase === 'feedback') return;
    if (phase === 'waiting') {
      falseStarts.current += 1;
      window.clearTimeout(timer.current);
      setMs(-1);
      setPhase('feedback');
      window.setTimeout(schedule, 800);
      return;
    }
    cancelAnimationFrame(raf.current);
    const rt = Math.round(performance.now() - stimAt.current);
    if (rt < 100) falseStarts.current += 1;
    else rts.current.push(Math.min(rt, 30000));
    setMs(rt);
    setPhase('feedback');
    window.setTimeout(schedule, 800);
  }, [phase, schedule]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        respond();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [respond]);

  useEffect(() => {
    if (phase === 'ready' || phase === 'done') return;
    const id = window.setInterval(() => setLeft(Math.max(0, Math.ceil((endAt.current - performance.now()) / 1000))), 250);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => () => {
    window.clearTimeout(timer.current);
    cancelAnimationFrame(raf.current);
  }, []);

  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="max-w-md text-dim">When the red counter appears, tap the box (or press <kbd className="rounded border border-line px-1">Space</kbd>) as fast as you can. Don't tap before it appears.</p>
        <button onClick={start} className="min-h-12 rounded-xl bg-signal px-6 font-semibold text-void">Start {durationS}s reaction test</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="font-mono text-xs text-dim">{left}s left · {rts.current.length} responses · {falseStarts.current} false starts</div>
      <button
        onPointerDown={respond}
        aria-label="Reaction target"
        className="flex h-56 w-full max-w-md select-none items-center justify-center rounded-2xl border border-line bg-black font-mono text-6xl"
      >
        {phase === 'stimulus' && <span className="text-nogo">{ms}</span>}
        {phase === 'feedback' && <span className={ms < 0 ? 'text-base text-dim' : 'text-signal'}>{ms < 0 ? 'Too early' : `${ms} ms`}</span>}
        {phase === 'done' && <span className="text-base text-dim">Done</span>}
      </button>
    </div>
  );
}
