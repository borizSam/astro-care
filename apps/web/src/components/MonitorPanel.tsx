import { useEffect, useRef } from 'react';
import type { News2Breakdown, Vitals } from '@astro-care/engine';
import type { Sample } from '../useTelemetry';

/** Bedside-monitor colour convention: ECG green, SpO₂/pleth yellow, NIBP white, respiration cyan. */
const C = { ecg: '#3dff7a', spo2: '#fde047', nibp: '#f5f5f4', resp: '#22d3ee', temp: '#fb923c', bg: '#010302' };
const SWEEP_PX_PER_S = 110;

const g = (t: number, mu: number, sd: number) => Math.exp(-((t - mu) ** 2) / (2 * sd * sd));

/**
 * Lead II, normal sinus rhythm, time t (s) from P-wave onset. Atrial timings stay fixed;
 * at high rates the ST segment and T wave shorten (QT shortens with rate).
 */
function ecg(t: number, period: number) {
  const k = Math.min(1, period / 0.8);
  return 0.12 * g(t, 0.05, 0.022) // P
    - 0.1 * g(t, 0.165, 0.007) // Q
    + 1.0 * g(t, 0.19, 0.0095) // R
    - 0.24 * g(t, 0.212, 0.009) // S
    + 0.26 * g(t, 0.19 + 0.24 * k, 0.045 * k); // T
}

/** Photoplethysmogram: sharp systolic upstroke, dicrotic notch; u = s since the pulse arrived at the finger. */
function pleth(u: number) {
  if (u < 0) return 0;
  return 1.0 * g(u, 0.13, 0.06) + 0.42 * g(u, 0.36, 0.075);
}

/** Impedance respiration: slightly faster inspiration than expiration. */
function resp(phase: number) {
  const p = phase % 1;
  return p < 0.42 ? -Math.cos((p / 0.42) * Math.PI) : Math.cos(((p - 0.42) / 0.58) * Math.PI);
}

type Level = 0 | 1 | 2;
const level = (score: number): Level => (score >= 3 ? 2 : score >= 1 ? 1 : 0);

/** Live 3-lane sweep (ECG II, PLETH, RESP) drawn on a canvas, driven by the latest vitals. */
function Waves({ vitals }: { vitals: Vitals }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const v = useRef(vitals);
  v.current = vitals;

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    let w = 0, h = 0, x = 0, last = performance.now();
    let beatT = 0, period = 60 / (v.current.heartRate || 60), prevPeriod = period, breath = 0;
    let prev: (number | null)[] = [null, null, null];

    const resize = () => {
      const r = cv.getBoundingClientRect();
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);
      x = 0;
      prev = [null, null, null];
    };
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    resize();

    const frame = () => {
      const now = performance.now();
      const dt = Math.min(0.5, (now - last) / 1000); // keep real time even if frames are throttled
      last = now;
      const cur = v.current;
      const laneH = h / 3;
      // pulse amplitude follows perfusion: smaller with low systolic pressure (e.g. dehydration)
      const perf = Math.max(0.35, Math.min(1, (cur.systolicBP - 80) / 40));
      const steps = Math.max(1, Math.round(dt * SWEEP_PX_PER_S));
      const sdt = dt / steps;
      for (let i = 0; i < steps; i++) {
        beatT += sdt;
        if (beatT >= period) {
          beatT -= period;
          prevPeriod = period;
          // sinus rhythm with a little beat-to-beat variability
          period = (60 / Math.max(30, cur.heartRate)) * (1 + (Math.random() - 0.5) * 0.05);
        }
        breath += (sdt * Math.max(4, cur.respRate)) / 60;
        // pulse reaches the finger ~0.22 s after the R wave (pulse transit time)
        const sinceR = beatT - 0.19 - 0.22;
        const pl = sinceR >= 0 ? pleth(sinceR) : pleth(sinceR + prevPeriod);
        const ys = [
          laneH * 0.68 - ecg(beatT, period) * laneH * 0.52,
          laneH + laneH * 0.86 - pl * perf * laneH * 0.66,
          2 * laneH + laneH * 0.5 - resp(breath) * laneH * 0.26 * Math.min(1.3, 0.7 + cur.respRate / 40),
        ];
        const colors = [C.ecg, C.spo2, C.resp];
        // erase bar ahead of the sweep
        ctx.fillStyle = C.bg;
        ctx.fillRect(x, 0, 12, h);
        ctx.lineWidth = 1.7;
        ctx.lineJoin = 'round';
        for (let k = 0; k < 3; k++) {
          const py = prev[k];
          if (py !== null) {
            ctx.strokeStyle = colors[k];
            ctx.beginPath();
            ctx.moveTo(x - 1, py);
            ctx.lineTo(x, ys[k]);
            ctx.stroke();
          }
          prev[k] = ys[k];
        }
        x += 1;
        if (x >= w) {
          x = 0;
          prev = [null, null, null];
        }
      }
    };
    // a timer (not requestAnimationFrame) keeps the sweep running in background tabs and headless captures
    const timer = window.setInterval(frame, 33);
    return () => {
      window.clearInterval(timer);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative min-h-[210px] flex-1 overflow-hidden rounded border border-line">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />
      <div className="pointer-events-none absolute inset-0 grid grid-rows-3 font-mono text-[10px] uppercase tracking-wider">
        <span className="px-2 pt-1" style={{ color: C.ecg }}>ECG II · ×1 · 25 mm/s</span>
        <span className="border-t border-line/60 px-2 pt-1" style={{ color: C.spo2 }}>Pleth</span>
        <span className="border-t border-line/60 px-2 pt-1" style={{ color: C.resp }}>Resp</span>
      </div>
    </div>
  );
}

function Spark({ data, color, min, max }: { data: number[]; color: string; min: number; max: number }) {
  if (data.length < 2) return <div className="h-4" />;
  const W = 100;
  const H = 16;
  const pts = data.map((d, i) => `${((i / (data.length - 1)) * W).toFixed(1)},${(H - ((Math.min(max, Math.max(min, d)) - min) / (max - min)) * H).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-4 w-full opacity-80" aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Box({ label, unit, color, value, limits, lv, children }: { label: string; unit: string; color: string; value: React.ReactNode; limits?: [string, string]; lv: Level; children?: React.ReactNode }) {
  const alarm = lv === 2 ? 'border-nogo bg-nogo/20' : lv === 1 ? 'border-amber bg-amber/10' : 'border-line';
  return (
    <div className={`flex min-w-0 flex-col rounded border px-2 py-1 ${alarm}`}>
      <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-wider" style={{ color }}>
        <span>{label}</span>
        {lv > 0 && <span className={`rounded-sm px-1 font-bold text-void ${lv === 2 ? 'animate-pulse bg-nogo' : 'bg-amber'}`}>{lv === 2 ? '!!!' : '!'}</span>}
        <span className="text-dim">{unit}</span>
      </div>
      <div className="flex items-center justify-between gap-1">
        <b className="font-mono text-4xl leading-none tabular-nums" style={{ color }}>{value}</b>
        {limits && (
          <span className="flex flex-col text-right font-mono text-[9px] leading-tight text-dim">
            <span>{limits[0]}</span>
            <span>{limits[1]}</span>
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/** Hospital-style bedside monitor: live waveforms plus numeric parameters with NEWS2-based alarm colours. */
export function MonitorPanel({ vitals, news2, samples }: { vitals: Vitals; news2: News2Breakdown; samples: Sample[] }) {
  // Simulated feed: diastolic is estimated from systolic (OSDR has no wearable data for this crew).
  const dia = Math.round(vitals.systolicBP * 0.62 + 4);
  const map = Math.round((vitals.systolicBP + 2 * dia) / 3);
  return (
    <section className="hud flex flex-col" aria-label="Bedside monitor">
      <h2 className="hud-title flex items-baseline justify-between border-b border-line px-4 py-2.5">
        Vital signs monitor <span className="label">live · 2-min trend</span>
      </h2>
      <div className="flex gap-3 p-3" style={{ background: C.bg }}>
        <Waves vitals={vitals} />
        <div className="grid w-52 shrink-0 grid-cols-2 gap-1.5">
          <div className="col-span-2">
            <Box label="HR · ECG" unit="bpm" color={C.ecg} value={vitals.heartRate} limits={['90', '51']} lv={level(news2.heartRate)}>
              <Spark data={samples.map((s) => s.heartRate)} color={C.ecg} min={40} max={130} />
            </Box>
          </div>
          <div className="col-span-2">
            <Box label="SpO₂" unit="%" color={C.spo2} value={vitals.spo2} limits={['100', '96']} lv={level(news2.spo2)}>
              <Spark data={samples.map((s) => s.spo2)} color={C.spo2} min={86} max={100} />
            </Box>
          </div>
          <div className="col-span-2">
            <Box label="NIBP" unit="mmHg" color={C.nibp} value={<span className="text-3xl">{vitals.systolicBP}/{dia}</span>} lv={level(news2.systolicBP)}>
              <span className="font-mono text-[10px] text-dim">MAP ({map})</span>
            </Box>
          </div>
          <Box label="Resp" unit="rpm" color={C.resp} value={<span className="text-3xl">{vitals.respRate}</span>} lv={level(news2.respRate)} />
          <Box label="Temp" unit="°C" color={C.temp} value={<span className="text-2xl">{vitals.tempC.toFixed(1)}</span>} lv={level(news2.tempC)} />
        </div>
      </div>
    </section>
  );
}
