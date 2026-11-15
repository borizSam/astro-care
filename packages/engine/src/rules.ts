import { news2 } from './news2';
import type {
  Finding,
  IntakeLog,
  LabPanel,
  PvtResult,
  SolarParticleEvent,
  Symptom,
  Task,
  Vitals,
  VitalsBaseline,
} from './types';

/** PVT-B lapse threshold (Basner & Dinges, 2011). ⚠️ verify */
export const PVT_LAPSE_MS = 355;
const LONG_TASK_H = 4;

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function pvtStats(pvt: PvtResult, baselineMedianMs: number) {
  const med = median(pvt.reactionTimesMs);
  const lapses = pvt.reactionTimesMs.filter((rt) => rt > PVT_LAPSE_MS).length;
  const slowdownPct = ((med - baselineMedianMs) / baselineMedianMs) * 100;
  return { medianMs: Math.round(med), lapses, slowdownPct: Math.round(slowdownPct) };
}

export function scorePVT(pvt: PvtResult, baselineMedianMs: number, task: Task): Finding[] {
  if (pvt.reactionTimesMs.length === 0) {
    return [{ source: 'pvt', effect: 'block', fixable: true, reason: 'Reaction test not completed.', action: 'Complete the reaction test.' }];
  }
  const s = pvtStats(pvt, baselineMedianMs);
  const ref = 'PVT-B (Basner & Dinges 2011); NASA HRP risk: cognitive fatigue during EVA, sleep loss';
  if (s.slowdownPct > task.pvtMaxSlowdownPct || s.lapses > task.maxLapses) {
    return [{
      source: 'pvt',
      effect: 'block',
      fixable: false,
      reason: `Reaction ${s.slowdownPct}% slower than your baseline (${s.medianMs} ms, ${s.lapses} lapses). Limit for this task: ${task.pvtMaxSlowdownPct}%.`,
      action: 'Rest or sleep, then repeat the check. If urgent, reassign the task.',
      ref,
    }];
  }
  if (s.slowdownPct > task.pvtMaxSlowdownPct / 2) {
    return [{ source: 'pvt', effect: 'advice', fixable: false, reason: `Reaction ${s.slowdownPct}% slower than normal.`, action: 'Plan a break halfway through the task.', ref }];
  }
  return [];
}

export function scoreVitals(v: Vitals, baseline: VitalsBaseline): Finding[] {
  const n = news2(v);
  const ref = 'NEWS2 (Royal College of Physicians 2017), adapted';
  const out: Finding[] = [];
  if (v.consciousness !== 'A') {
    out.push({ source: 'consciousness', effect: 'block', fixable: false, reason: `Not alert (ACVPU: ${v.consciousness}).`, action: 'A crewmate stays with the astronaut. Contact the flight surgeon now.', ref });
  }
  if (n.total >= 5 || n.anySingleThree) {
    out.push({ source: 'vitals', effect: 'block', fixable: false, reason: `NEWS2 score ${n.total}${n.anySingleThree ? ' (one parameter in red)' : ''}.`, action: 'Do not suit up. Repeat vitals in 15 min and report to the flight surgeon.', ref });
  } else if (n.total >= 1) {
    out.push({ source: 'vitals', effect: 'advice', fixable: false, reason: `NEWS2 score ${n.total}.`, action: 'Re-check vitals after the task.', ref });
  }
  if (v.heartRate - baseline.heartRate >= 20) {
    out.push({ source: 'vitals', effect: 'advice', fixable: false, reason: `Resting heart rate ${v.heartRate} bpm, ${v.heartRate - baseline.heartRate} above your baseline.`, action: 'Rest 10 min and measure again.' });
  }
  return out;
}

export function scoreBloodPressureForTask(v: Vitals, task: Task): Finding[] {
  // ⚠️ Orthostatic tolerance before long partial-gravity EVA; to validate.
  if (task.id === 'eva' && v.systolicBP <= 100) {
    return [{ source: 'bp', effect: 'block', fixable: false, reason: `Systolic BP ${v.systolicBP} mmHg: risk of fainting inside the suit.`, action: 'Fluids and rest, then measure again.', ref: 'NASA HRP risk: cardiovascular adaptations' }];
  }
  return [];
}

export function scoreHydration(intake: IntakeLog, task: Task, symptoms: Symptom[]): Finding[] {
  const out: Finding[] = [];
  const long = task.durationH >= LONG_TASK_H;
  const ref = 'NASA HRP risk: inadequate food and nutrition';
  if (intake.waterMlLast3h < 500) {
    out.push({
      source: 'hydration',
      effect: long ? 'block' : 'advice',
      fixable: true,
      reason: `Only ${intake.waterMlLast3h} ml of water in the last 3 h.`,
      action: 'Drink 500 ml before suiting up.',
      ref,
    });
  }
  if (long && intake.minutesSinceVoid > 120) {
    out.push({ source: 'void', effect: 'block', fixable: true, reason: `Last void ${Math.round(intake.minutesSinceVoid / 60)} h ago; ${task.durationH} h inside the suit ahead.`, action: 'Use the toilet before suiting up.' });
  }
  if (long && intake.minutesSinceMeal > 5 * 60) {
    out.push({ source: 'meal', effect: 'advice', fixable: true, reason: `Last meal ${Math.round(intake.minutesSinceMeal / 60)} h ago.`, action: 'Eat a ration before the task.', ref });
  }
  if (intake.urineColor !== undefined) {
    const dizzy = symptoms.some((s) => s.id === 'dizziness');
    if (intake.urineColor >= 8 && dizzy) {
      out.push({ source: 'urine', effect: 'block', fixable: false, reason: 'Very dark urine and dizziness: significant dehydration.', action: 'Rehydrate and contact the flight surgeon before any task.' });
    } else if (intake.urineColor >= 6) {
      out.push({ source: 'urine', effect: 'advice', fixable: true, reason: `Urine color ${intake.urineColor}/8.`, action: 'Drink more water today.' });
    }
  }
  return out;
}

export function scoreSymptoms(symptoms: Symptom[], task: Task): Finding[] {
  return symptoms.map((s): Finding => {
    const critical = task.id === 'eva' || task.id === 'rover';
    const effect =
      s.severity === 'severe' ? 'block' : s.severity === 'moderate' && critical ? 'block' : 'advice';
    return {
      source: 'symptoms',
      effect,
      fixable: false,
      reason: `${s.label} (${s.severity}).`,
      action: effect === 'block' ? 'Do not start the task. Tell the flight surgeon.' : 'Monitor it and report if it gets worse.',
    };
  });
}

export function scoreSleep(hours: number, task: Task): Finding[] {
  const ref = 'NASA HRP risk: sleep loss (ARCHeR actigraphy, Artemis II)';
  if (hours < task.minSleepH) {
    return [{ source: 'sleep', effect: 'block', fixable: false, reason: `Only ${hours} h of sleep.`, action: 'Sleep before attempting this task.', ref }];
  }
  if (hours < 6) {
    return [{ source: 'sleep', effect: 'advice', fixable: false, reason: `${hours} h of sleep (under 6 h).`, action: 'Prioritise sleep tonight.', ref }];
  }
  return [];
}

export function externalConditions(event: SolarParticleEvent | null, task: Task): Finding[] {
  if (!event || !task.blockedBySolarParticles) return [];
  return [{
    source: 'external',
    effect: 'block',
    fixable: false,
    reason: `Solar particle event in progress (${event.sepID}, ${event.instrument}). The Moon has no magnetic field.`,
    action: 'Stay in the shielded habitat. Postpone the surface task.',
    ref: 'NASA DONKI (CCMC); NASA HRP hazard: space radiation',
  }];
}

export function scoreLabs(labs: LabPanel | undefined): Finding[] {
  if (!labs) return [];
  const out: Finding[] = [];
  if (labs.bun !== undefined && labs.creatinine) {
    const ratio = labs.bun / labs.creatinine;
    if (ratio > 20) {
      out.push({ source: 'labs', effect: 'advice', fixable: false, reason: `BUN/creatinine ratio ${ratio.toFixed(1)} in the last blood test (${labs.timepoint}): possible dehydration.`, action: 'Keep up a good fluid intake.', ref: labs.source });
    }
  }
  if (labs.hemoglobin !== undefined && labs.hemoglobinMin !== undefined && labs.hemoglobin < labs.hemoglobinMin) {
    out.push({ source: 'labs', effect: 'advice', fixable: false, reason: `Hemoglobin ${labs.hemoglobin} g/dL below range (${labs.timepoint}).`, action: 'Avoid maximal effort; discuss with the flight surgeon.', ref: labs.source });
  }
  return out;
}
