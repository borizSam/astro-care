import { useEffect, useState } from 'react';
import type { TelemetryFrame } from './api';

/** Seconds of live history kept per crew member for the trend charts. */
export const HISTORY_S = 120;

export interface Sample {
  heartRate: number;
  spo2: number;
  news2: number;
}

/** Subscribes to the habitat server's live telemetry stream (SSE). Reconnects automatically. */
export function useTelemetry() {
  const [frames, setFrames] = useState<Record<string, TelemetryFrame>>({});
  const [history, setHistory] = useState<Record<string, Sample[]>>({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource('/api/telemetry/stream');
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      const list = JSON.parse(e.data) as TelemetryFrame[];
      setFrames(Object.fromEntries(list.map((f) => [f.id, f])));
      setHistory((h) =>
        Object.fromEntries(
          list.map((f) => [f.id, [...(h[f.id] ?? []), { heartRate: f.vitals.heartRate, spo2: f.vitals.spo2, news2: f.news2.total }].slice(-HISTORY_S)]),
        ),
      );
      setConnected(true);
    };
    return () => es.close();
  }, []);

  return { frames, history, connected };
}
