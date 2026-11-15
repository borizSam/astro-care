import type { Severity } from './types';

export interface SymptomDef {
  id: string;
  label: string;
  defaultSeverity: Severity;
  hrp?: string;
}

// ⚠️ Draft list; the nurse selects final symptoms (max 3–4 per zone).
/** Plain-language explainer shown when the astronaut taps a body zone (NASA HRP risks). */
export interface ZoneInfo {
  /** what this part of the body does */
  job: string;
  /** what spaceflight does to it */
  space: string;
  /** NASA Human Research Program risk it maps to */
  hrp: string;
  /** what the astronaut can do about it */
  care: string;
}

export interface BodyZone {
  zone: string;
  label: string;
  info: ZoneInfo;
  symptoms: SymptomDef[];
}

export const BODY_ZONES: BodyZone[] = [
  {
    zone: 'head',
    label: 'Head',
    info: {
      job: 'Thinks, coordinates and keeps your balance.',
      space: 'Short sleep and isolation slow your reactions; the inner ear gets confused when gravity changes, causing dizziness.',
      hrp: 'Sleep loss · sensorimotor function',
      care: 'Sleep 7–8 h and take the reaction test before every critical task.',
    },
    symptoms: [
      { id: 'headache', label: 'Headache', defaultSeverity: 'mild', hrp: 'CO₂ / hypoxia' },
      { id: 'dizziness', label: 'Dizziness', defaultSeverity: 'moderate', hrp: 'Sensorimotor' },
      { id: 'confusion', label: 'Feeling confused', defaultSeverity: 'severe', hrp: 'Hypoxia' },
    ],
  },
  {
    zone: 'eyes',
    label: 'Eyes',
    info: {
      job: 'Near and far vision.',
      space: 'Without gravity, fluids shift to the head and press on the optic nerve: near vision can get worse.',
      hrp: 'Spaceflight-associated neuro-ocular syndrome (SANS)',
      care: 'Report it if reading up close gets hard; adjustable glasses are on board.',
    },
    symptoms: [
      { id: 'blurred-near', label: 'Blurred near vision', defaultSeverity: 'moderate', hrp: 'SANS' },
      { id: 'eye-irritation', label: 'Eye irritation (dust)', defaultSeverity: 'mild' },
    ],
  },
  {
    zone: 'chest',
    label: 'Chest',
    info: {
      job: 'Heart and lungs: they carry oxygen to the whole body.',
      space: 'Weightlessness changes circulation and deconditions the heart; inside the suit there can be too little oxygen or too much CO₂.',
      hrp: 'Cardiovascular adaptations · hypoxia',
      care: 'The wristband measures heart rate, oxygen and breathing every second. If NEWS2 rises, stop and tell the crew.',
    },
    symptoms: [
      { id: 'chest-pain', label: 'Chest pain', defaultSeverity: 'severe', hrp: 'Cardiovascular' },
      { id: 'short-breath', label: 'Shortness of breath', defaultSeverity: 'moderate' },
      { id: 'palpitations', label: 'Palpitations', defaultSeverity: 'moderate' },
    ],
  },
  {
    zone: 'abdomen',
    label: 'Abdomen',
    info: {
      job: 'Digestion, hydration and energy.',
      space: 'In space you feel less thirst and hunger; too little water lowers blood pressure and performance.',
      hrp: 'Inadequate food and nutrition',
      care: 'Drink 500 ml and eat before suiting up; log water, meals and toilet with one tap.',
    },
    symptoms: [
      { id: 'nausea', label: 'Nausea', defaultSeverity: 'moderate' },
      { id: 'abdominal-pain', label: 'Abdominal pain', defaultSeverity: 'mild' },
    ],
  },
  {
    zone: 'joints',
    label: 'Joints',
    info: {
      job: 'Bones, muscles and joints.',
      space: 'Without load you lose about 1 % of bone per month; when suit pressure drops, nitrogen can form bubbles.',
      hrp: 'Bone changes · decompression sickness',
      care: '2 h of exercise a day. Pain or tingling after a suit session: report it at once.',
    },
    symptoms: [
      { id: 'joint-pain', label: 'Joint pain (shoulder, knee)', defaultSeverity: 'moderate', hrp: 'Decompression' },
      { id: 'tingling', label: 'Tingling / numbness', defaultSeverity: 'severe', hrp: 'Decompression' },
    ],
  },
  {
    zone: 'skin',
    label: 'Skin',
    info: {
      job: 'Barrier against infection; regulates temperature.',
      space: 'Spaceflight stress weakens immunity and can wake dormant viruses, which show up as rashes.',
      hrp: 'Altered immune response',
      care: 'Check your skin daily; note any rash and its size.',
    },
    symptoms: [{ id: 'rash', label: 'Rash', defaultSeverity: 'mild', hrp: 'Immunity (viral reactivation)' }],
  },
];
