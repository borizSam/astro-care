import type { Severity } from './types';

export interface SymptomDef {
  id: string;
  label: string;
  defaultSeverity: Severity;
  hrp?: string;
}

// ⚠️ Draft list; the nurse selects final symptoms (max 3–4 per zone).
export const BODY_ZONES: { zone: string; label: string; symptoms: SymptomDef[] }[] = [
  {
    zone: 'head',
    label: 'Cabeza',
    symptoms: [
      { id: 'headache', label: 'Dolor de cabeza', defaultSeverity: 'mild', hrp: 'CO₂ / hipoxia' },
      { id: 'dizziness', label: 'Mareo', defaultSeverity: 'moderate', hrp: 'Sensoriomotor' },
      { id: 'confusion', label: 'Sensación de confusión', defaultSeverity: 'severe', hrp: 'Hipoxia' },
    ],
  },
  {
    zone: 'eyes',
    label: 'Ojos',
    symptoms: [
      { id: 'blurred-near', label: 'Visión borrosa de cerca', defaultSeverity: 'moderate', hrp: 'SANS' },
      { id: 'eye-irritation', label: 'Irritación ocular (polvo)', defaultSeverity: 'mild' },
    ],
  },
  {
    zone: 'chest',
    label: 'Pecho',
    symptoms: [
      { id: 'chest-pain', label: 'Dolor en el pecho', defaultSeverity: 'severe', hrp: 'Cardiovascular' },
      { id: 'short-breath', label: 'Falta de aire', defaultSeverity: 'moderate' },
      { id: 'palpitations', label: 'Palpitaciones', defaultSeverity: 'moderate' },
    ],
  },
  {
    zone: 'abdomen',
    label: 'Abdomen',
    symptoms: [
      { id: 'nausea', label: 'Náuseas', defaultSeverity: 'moderate' },
      { id: 'abdominal-pain', label: 'Dolor abdominal', defaultSeverity: 'mild' },
    ],
  },
  {
    zone: 'joints',
    label: 'Articulaciones',
    symptoms: [
      { id: 'joint-pain', label: 'Dolor articular (hombro, rodilla)', defaultSeverity: 'moderate', hrp: 'Descompresión' },
      { id: 'tingling', label: 'Hormigueo / entumecimiento', defaultSeverity: 'severe', hrp: 'Descompresión' },
    ],
  },
  {
    zone: 'skin',
    label: 'Piel',
    symptoms: [{ id: 'rash', label: 'Erupción', defaultSeverity: 'mild', hrp: 'Inmunidad (reactivación viral)' }],
  },
];
