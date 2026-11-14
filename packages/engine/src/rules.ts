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
    return [{ source: 'pvt', effect: 'block', fixable: true, reason: 'Prueba de reacción sin completar.', action: 'Completa la prueba de reacción.' }];
  }
  const s = pvtStats(pvt, baselineMedianMs);
  const ref = 'PVT-B (Basner & Dinges 2011); riesgo NASA HRP: fatiga cognitiva en EVA, sueño insuficiente';
  if (s.slowdownPct > task.pvtMaxSlowdownPct || s.lapses > task.maxLapses) {
    return [{
      source: 'pvt',
      effect: 'block',
      fixable: false,
      reason: `Reacción un ${s.slowdownPct}% más lenta que tu valor normal (${s.medianMs} ms, ${s.lapses} lapsus). Límite para esta tarea: ${task.pvtMaxSlowdownPct}%.`,
      action: 'Descansa o duerme y repite el chequeo. Si es urgente, reasigna la tarea.',
      ref,
    }];
  }
  if (s.slowdownPct > task.pvtMaxSlowdownPct / 2) {
    return [{ source: 'pvt', effect: 'advice', fixable: false, reason: `Reacción un ${s.slowdownPct}% más lenta de lo normal.`, action: 'Planifica una pausa a mitad de la tarea.', ref }];
  }
  return [];
}

export function scoreVitals(v: Vitals, baseline: VitalsBaseline): Finding[] {
  const n = news2(v);
  const ref = 'NEWS2 (Royal College of Physicians 2017), adaptada';
  const out: Finding[] = [];
  if (v.consciousness !== 'A') {
    out.push({ source: 'consciousness', effect: 'block', fixable: false, reason: `Consciencia no alerta (ACVPU: ${v.consciousness}).`, action: 'Un compañero se queda con el astronauta. Contacta ya con el médico de vuelo.', ref });
  }
  if (n.total >= 5 || n.anySingleThree) {
    out.push({ source: 'vitals', effect: 'block', fixable: false, reason: `Puntuación NEWS2 ${n.total}${n.anySingleThree ? ' (un parámetro en rojo)' : ''}.`, action: 'No te pongas el traje. Repite las constantes en 15 min e informa al médico de vuelo.', ref });
  } else if (n.total >= 1) {
    out.push({ source: 'vitals', effect: 'advice', fixable: false, reason: `Puntuación NEWS2 ${n.total}.`, action: 'Vuelve a medir las constantes después de la tarea.', ref });
  }
  if (v.heartRate - baseline.heartRate >= 20) {
    out.push({ source: 'vitals', effect: 'advice', fixable: false, reason: `Pulso en reposo ${v.heartRate} lpm, ${v.heartRate - baseline.heartRate} por encima de tu valor normal.`, action: 'Descansa 10 min y vuelve a medir.' });
  }
  return out;
}

export function scoreBloodPressureForTask(v: Vitals, task: Task): Finding[] {
  // ⚠️ Orthostatic tolerance before long partial-gravity EVA; to validate.
  if (task.id === 'eva' && v.systolicBP <= 100) {
    return [{ source: 'bp', effect: 'block', fixable: false, reason: `Presión sistólica ${v.systolicBP} mmHg: riesgo de desmayo dentro del traje.`, action: 'Líquidos y reposo; después vuelve a medir.', ref: 'riesgo NASA HRP: adaptaciones cardiovasculares' }];
  }
  return [];
}

export function scoreHydration(intake: IntakeLog, task: Task, symptoms: Symptom[]): Finding[] {
  const out: Finding[] = [];
  const long = task.durationH >= LONG_TASK_H;
  const ref = 'riesgo NASA HRP: alimentación inadecuada';
  if (intake.waterMlLast3h < 500) {
    out.push({
      source: 'hydration',
      effect: long ? 'block' : 'advice',
      fixable: true,
      reason: `Solo ${intake.waterMlLast3h} ml de agua en las últimas 3 h.`,
      action: 'Bebe 500 ml antes de ponerte el traje.',
      ref,
    });
  }
  if (long && intake.minutesSinceVoid > 120) {
    out.push({ source: 'void', effect: 'block', fixable: true, reason: `Última micción hace ${Math.round(intake.minutesSinceVoid / 60)} h; te esperan ${task.durationH} h dentro del traje.`, action: 'Ve al baño antes de ponerte el traje.' });
  }
  if (long && intake.minutesSinceMeal > 5 * 60) {
    out.push({ source: 'hydration', effect: 'advice', fixable: true, reason: `Última comida hace ${Math.round(intake.minutesSinceMeal / 60)} h.`, action: 'Come una ración antes de la tarea.', ref });
  }
  if (intake.urineColor !== undefined) {
    const dizzy = symptoms.some((s) => s.id === 'dizziness');
    if (intake.urineColor >= 8 && dizzy) {
      out.push({ source: 'urine', effect: 'block', fixable: false, reason: 'Orina muy oscura y mareo: deshidratación importante.', action: 'Rehidrátate y contacta con el médico de vuelo antes de cualquier tarea.' });
    } else if (intake.urineColor >= 6) {
      out.push({ source: 'urine', effect: 'advice', fixable: true, reason: `Color de orina ${intake.urineColor}/8.`, action: 'Bebe más agua hoy.' });
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
      reason: `${s.label} (${s.severity === 'severe' ? 'grave' : s.severity === 'moderate' ? 'moderado' : 'leve'}).`,
      action: effect === 'block' ? 'No empieces la tarea. Avisa al médico de vuelo.' : 'Vigílalo y avisa si empeora.',
    };
  });
}

export function scoreSleep(hours: number, task: Task): Finding[] {
  const ref = 'riesgo NASA HRP: sueño insuficiente (actigrafía ARCHeR, Artemis II)';
  if (hours < task.minSleepH) {
    return [{ source: 'sleep', effect: 'block', fixable: false, reason: `Solo ${hours} h de sueño.`, action: 'Duerme antes de intentar esta tarea.', ref }];
  }
  if (hours < 6) {
    return [{ source: 'sleep', effect: 'advice', fixable: false, reason: `${hours} h de sueño (menos de 6 h).`, action: 'Prioriza dormir esta noche.', ref }];
  }
  return [];
}

export function externalConditions(event: SolarParticleEvent | null, task: Task): Finding[] {
  if (!event || !task.blockedBySolarParticles) return [];
  return [{
    source: 'external',
    effect: 'block',
    fixable: false,
    reason: `Evento de partículas solares en curso (${event.sepID}, ${event.instrument}). La Luna no tiene campo magnético.`,
    action: 'Quédate en el hábitat protegido. Pospón la tarea en superficie.',
    ref: 'NASA DONKI (CCMC); peligro NASA HRP: radiación espacial',
  }];
}

export function scoreLabs(labs: LabPanel | undefined): Finding[] {
  if (!labs) return [];
  const out: Finding[] = [];
  if (labs.bun !== undefined && labs.creatinine) {
    const ratio = labs.bun / labs.creatinine;
    if (ratio > 20) {
      out.push({ source: 'labs', effect: 'advice', fixable: false, reason: `Relación BUN/creatinina ${ratio.toFixed(1)} en el último análisis (${labs.timepoint}): posible deshidratación.`, action: 'Mantén una buena ingesta de líquidos.', ref: labs.source });
    }
  }
  if (labs.hemoglobin !== undefined && labs.hemoglobinMin !== undefined && labs.hemoglobin < labs.hemoglobinMin) {
    out.push({ source: 'labs', effect: 'advice', fixable: false, reason: `Hemoglobina ${labs.hemoglobin} g/dL por debajo del rango (${labs.timepoint}).`, action: 'Evita esfuerzos máximos; coméntalo con el médico de vuelo.', ref: labs.source });
  }
  return out;
}
