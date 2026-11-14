import { Avatar3D } from '../components/Avatar3D';
import { CareDock } from '../components/CareDock';
import { News2Panel } from '../components/News2Panel';
import type { CrewState, TelemetryFrame } from '../api';

interface Props {
  crew: CrewState;
  frame?: TelemetryFrame;
  live: boolean;
  onChange: (c: CrewState) => void;
  onStartTest: () => void;
}

/** Main screen: the avatar, driven by live telemetry, with NEWS2 computed automatically. */
export function Home({ crew, frame, live, onChange, onStartTest }: Props) {
  const vitals = frame?.vitals ?? crew.vitals;
  const news2 = frame?.news2 ?? crew.news2;
  const avatar = frame?.avatar ?? crew.avatar;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <section className="panel flex flex-col items-center gap-3 p-4">
        <div className="flex w-full items-baseline justify-between">
          <span className="label">{crew.id} · {crew.role}</span>
          {crew.lastCheck && (
            <span className="text-xs text-dim">
              Last check: <b className={crew.lastCheck.verdict === 'GO' ? 'text-go' : 'text-nogo'}>{crew.lastCheck.verdict.replace('_', '-')}</b> · {crew.lastCheck.task}
            </span>
          )}
        </div>
        <Avatar3D state={avatar} heartRate={vitals.heartRate} respRate={vitals.respRate} spo2={vitals.spo2} height={520} />
        <button
          onClick={onStartTest}
          className="min-h-14 w-full rounded-xl border-2 border-signal bg-signal/10 font-mono text-lg font-bold tracking-widest text-signal hover:bg-signal/20"
        >
          MISSION READINESS TEST
        </button>
      </section>
      <div className="flex flex-col gap-4">
        <News2Panel vitals={vitals} news2={news2} live={live} />
        <CareDock crew={crew} onChange={onChange} />
      </div>
    </div>
  );
}
