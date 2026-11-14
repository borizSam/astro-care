import { useEffect, useState } from 'react';
import { api, type LabRow } from '../api';

const SHOWN = ['HEMOGLOBIN', 'HEMATOCRIT', 'UREA NITROGEN (BUN)', 'CREATININE', 'SODIUM', 'WHITE BLOOD CELL COUNT'];

export function LabsCard({ crewId, timepoint }: { crewId: string; timepoint: string }) {
  const [rows, setRows] = useState<LabRow[]>([]);
  useEffect(() => {
    api.labs(crewId, timepoint).then((r) => setRows(r.rows)).catch(() => setRows([]));
  }, [crewId, timepoint]);

  const shown = SHOWN.map((a) => rows.find((r) => r.analyte === a)).filter((r): r is LabRow => !!r);
  const bun = rows.find((r) => r.analyte === 'UREA NITROGEN (BUN)')?.value;
  const cr = rows.find((r) => r.analyte === 'CREATININE')?.value;

  return (
    <section className="panel p-4" aria-label="Blood test">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="label">Last blood test · {timepoint}</span>
        <span className="font-mono text-[10px] text-dim">NASA OSDR</span>
      </div>
      <p className="mb-3 text-xs text-dim">Real Inspiration4 crew data (OSD-569 CBC, OSD-575 CMP)</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {shown.map((r) => (
          <div key={r.analyte} className="flex justify-between gap-2">
            <dt className="truncate text-dim">{r.analyte.replace('UREA NITROGEN (BUN)', 'BUN').replace('WHITE BLOOD CELL COUNT', 'WBC').toLowerCase()}</dt>
            <dd className={`font-mono ${r.outOfRange ? 'text-nogo' : ''}`}>{r.value}</dd>
          </div>
        ))}
        {bun && cr ? (
          <div className="col-span-2 flex justify-between border-t border-line pt-2">
            <dt className="text-dim">BUN / creatinine</dt>
            <dd className={`font-mono ${bun / cr > 20 ? 'text-nogo' : ''}`}>{(bun / cr).toFixed(1)}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
