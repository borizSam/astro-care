import { Avatar } from '../components/Avatar';
import { Bars } from '../components/Bars';
import { CareDock } from '../components/CareDock';
import { LabsCard } from '../components/LabsCard';
import type { CrewState } from '../api';

export function Home({ crew, labTimepoint, onChange, onStartTest }: { crew: CrewState; labTimepoint: string; onChange: (c: CrewState) => void; onStartTest: () => void }) {
  const v = crew.vitals;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <section className="panel flex flex-col items-center gap-4 p-5">
        <div className="flex w-full items-baseline justify-between">
          <span className="label">{crew.id} · {crew.role}</span>
          <span className="font-mono text-xs text-dim">NEWS2 {crew.news2.total}</span>
        </div>
        <Avatar state={crew.avatar} respRate={v.respRate} />
        <dl className="grid w-full grid-cols-5 gap-2 text-center font-mono text-sm">
          {[
            ['HR', v.heartRate],
            ['SpO₂', `${v.spo2}%`],
            ['SBP', v.systolicBP],
            ['RR', v.respRate],
            ['T', v.tempC],
          ].map(([k, val]) => (
            <div key={k} className="rounded-lg border border-line py-2">
              <dt className="text-[10px] text-dim">{k}</dt>
              <dd>{val}</dd>
            </div>
          ))}
        </dl>
        <button
          onClick={onStartTest}
          className="mt-1 min-h-14 w-full rounded-xl border-2 border-signal bg-signal/10 font-mono text-lg font-bold tracking-widest text-signal hover:bg-signal/20"
        >
          MISSION READINESS TEST
        </button>
        {crew.lastCheck && (
          <p className="text-xs text-dim">
            Last check: <b className={crew.lastCheck.verdict === 'GO' ? 'text-go' : 'text-nogo'}>{crew.lastCheck.verdict.replace('_', '-')}</b> for {crew.lastCheck.task} · {new Date(crew.lastCheck.timestamp).toLocaleTimeString()}
          </p>
        )}
      </section>
      <div className="flex flex-col gap-4">
        <section className="panel p-4">
          <div className="label mb-3">Daily balance</div>
          <Bars crew={crew} />
        </section>
        <CareDock crew={crew} onChange={onChange} />
        <LabsCard crewId={crew.id} timepoint={labTimepoint} />
      </div>
    </div>
  );
}
