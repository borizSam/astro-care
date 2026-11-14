import { news2 } from './news2';
import {
  externalConditions,
  scoreBloodPressureForTask,
  scoreHydration,
  scoreLabs,
  scorePVT,
  scoreSleep,
  scoreSymptoms,
  scoreVitals,
} from './rules';
import { TASKS } from './tasks';
import type { CheckInput, Finding, TaskId, VerdictResult } from './types';

export function verdict(task: TaskId, findings: Finding[], news2Total: number, now = new Date()): VerdictResult {
  const blockers = findings.filter((f) => f.effect === 'block');
  const advice = findings.filter((f) => f.effect === 'advice');
  return {
    verdict: blockers.length > 0 ? 'NO_GO' : 'GO',
    task,
    blockers,
    advice,
    fixableOnly: blockers.length > 0 && blockers.every((b) => b.fixable),
    news2: news2Total,
    timestamp: now.toISOString(),
  };
}

export function evaluateCheck(input: CheckInput, now = new Date()): VerdictResult {
  const task = TASKS[input.task];
  const findings: Finding[] = [
    ...scoreSymptoms(input.symptoms, task),
    ...scoreHydration(input.intake, task, input.symptoms),
    ...scorePVT(input.pvt, input.pvtBaselineMedianMs, task),
    ...scoreVitals(input.vitals, input.baseline),
    ...scoreBloodPressureForTask(input.vitals, task),
    ...scoreSleep(input.sleepHours, task),
    ...externalConditions(input.solarEvent, task),
    ...scoreLabs(input.labs),
  ];
  return verdict(input.task, findings, news2(input.vitals).total, now);
}
