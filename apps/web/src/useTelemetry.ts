import { useEffect, useState } from 'react';
import type { TelemetryFrame } from './api';

/** Subscribes to the habitat server's live telemetry stream (SSE). Reconnects automatically. */
export function useTelemetry() {
  const [frames, setFrames] = useState<Record<string, TelemetryFrame>>({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource('/api/telemetry/stream');
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      const list = JSON.parse(e.data) as TelemetryFrame[];
      setFrames(Object.fromEntries(list.map((f) => [f.id, f])));
      setConnected(true);
    };
    return () => es.close();
  }, []);

  return { frames, connected };
}
