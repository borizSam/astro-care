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
    label: 'Head',
    symptoms: [
      { id: 'headache', label: 'Headache', defaultSeverity: 'mild', hrp: 'CO₂ / hypoxia' },
      { id: 'dizziness', label: 'Dizziness', defaultSeverity: 'moderate', hrp: 'Sensorimotor' },
      { id: 'confusion', label: 'Feeling confused', defaultSeverity: 'severe', hrp: 'Hypoxia' },
    ],
  },
  {
    zone: 'eyes',
    label: 'Eyes',
    symptoms: [
      { id: 'blurred-near', label: 'Blurred near vision', defaultSeverity: 'moderate', hrp: 'SANS' },
      { id: 'eye-irritation', label: 'Eye irritation (dust)', defaultSeverity: 'mild' },
    ],
  },
  {
    zone: 'chest',
    label: 'Chest',
    symptoms: [
      { id: 'chest-pain', label: 'Chest pain', defaultSeverity: 'severe', hrp: 'Cardiovascular' },
      { id: 'short-breath', label: 'Shortness of breath', defaultSeverity: 'moderate' },
      { id: 'palpitations', label: 'Palpitations', defaultSeverity: 'moderate' },
    ],
  },
  {
    zone: 'abdomen',
    label: 'Abdomen',
    symptoms: [
      { id: 'nausea', label: 'Nausea', defaultSeverity: 'moderate' },
      { id: 'abdominal-pain', label: 'Abdominal pain', defaultSeverity: 'mild' },
    ],
  },
  {
    zone: 'joints',
    label: 'Joints',
    symptoms: [
      { id: 'joint-pain', label: 'Joint pain (shoulder, knee)', defaultSeverity: 'moderate', hrp: 'Decompression' },
      { id: 'tingling', label: 'Tingling / numbness', defaultSeverity: 'severe', hrp: 'Decompression' },
    ],
  },
  {
    zone: 'skin',
    label: 'Skin',
    symptoms: [{ id: 'rash', label: 'Rash', defaultSeverity: 'mild', hrp: 'Immunity (viral reactivation)' }],
  },
];
