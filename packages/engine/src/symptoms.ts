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
    label: 'Cabeza',
    info: {
      job: 'Decide, coordina y mantiene el equilibrio.',
      space: 'Dormir poco y el aislamiento enlentecen la reacción; el oído interno se desajusta al cambiar de gravedad y marea.',
      hrp: 'Sueño insuficiente · función sensoriomotora',
      care: 'Duerme 7–8 h y haz la prueba de reacción antes de cada tarea crítica.',
    },
    symptoms: [
      { id: 'headache', label: 'Dolor de cabeza', defaultSeverity: 'mild', hrp: 'CO₂ / hipoxia' },
      { id: 'dizziness', label: 'Mareo', defaultSeverity: 'moderate', hrp: 'Sensoriomotor' },
      { id: 'confusion', label: 'Sensación de confusión', defaultSeverity: 'severe', hrp: 'Hipoxia' },
    ],
  },
  {
    zone: 'eyes',
    label: 'Ojos',
    info: {
      job: 'Visión de cerca y de lejos.',
      space: 'Sin gravedad los líquidos suben a la cabeza y presionan el nervio óptico: la visión de cerca puede empeorar.',
      hrp: 'Síndrome neuro-ocular (SANS)',
      care: 'Avisa si te cuesta leer de cerca; hay gafas de ajuste a bordo.',
    },
    symptoms: [
      { id: 'blurred-near', label: 'Visión borrosa de cerca', defaultSeverity: 'moderate', hrp: 'SANS' },
      { id: 'eye-irritation', label: 'Irritación ocular (polvo)', defaultSeverity: 'mild' },
    ],
  },
  {
    zone: 'chest',
    label: 'Pecho',
    info: {
      job: 'Corazón y pulmones: llevan oxígeno a todo el cuerpo.',
      space: 'La ingravidez cambia la circulación y desentrena el corazón; dentro del traje puede faltar oxígeno o sobrar CO₂.',
      hrp: 'Adaptaciones cardiovasculares · hipoxia',
      care: 'La pulsera mide pulso, oxígeno y respiración cada segundo. Si NEWS2 sube, para y avisa.',
    },
    symptoms: [
      { id: 'chest-pain', label: 'Dolor en el pecho', defaultSeverity: 'severe', hrp: 'Cardiovascular' },
      { id: 'short-breath', label: 'Falta de aire', defaultSeverity: 'moderate' },
      { id: 'palpitations', label: 'Palpitaciones', defaultSeverity: 'moderate' },
    ],
  },
  {
    zone: 'abdomen',
    label: 'Abdomen',
    info: {
      job: 'Digestión, hidratación y energía.',
      space: 'En el espacio se tiene menos sed y menos hambre; con poca agua baja la presión y el rendimiento.',
      hrp: 'Alimentación y nutrición inadecuadas',
      care: 'Bebe 500 ml y come antes de ponerte el traje; registra agua, comida y baño con un toque.',
    },
    symptoms: [
      { id: 'nausea', label: 'Náuseas', defaultSeverity: 'moderate' },
      { id: 'abdominal-pain', label: 'Dolor abdominal', defaultSeverity: 'mild' },
    ],
  },
  {
    zone: 'joints',
    label: 'Articulaciones',
    info: {
      job: 'Huesos, músculos y articulaciones.',
      space: 'Sin carga se pierde alrededor de un 1 % de hueso al mes; al bajar la presión del traje, el nitrógeno puede formar burbujas.',
      hrp: 'Cambios óseos · enfermedad por descompresión',
      care: '2 h de ejercicio al día. Dolor u hormigueo después del traje: avisa enseguida.',
    },
    symptoms: [
      { id: 'joint-pain', label: 'Dolor articular (hombro, rodilla)', defaultSeverity: 'moderate', hrp: 'Descompresión' },
      { id: 'tingling', label: 'Hormigueo / entumecimiento', defaultSeverity: 'severe', hrp: 'Descompresión' },
    ],
  },
  {
    zone: 'skin',
    label: 'Piel',
    info: {
      job: 'Barrera frente a infecciones; regula la temperatura.',
      space: 'El estrés del vuelo debilita las defensas y puede despertar virus dormidos, que aparecen como erupciones.',
      hrp: 'Respuesta inmunitaria alterada',
      care: 'Revisa la piel a diario; anota cualquier erupción y su tamaño.',
    },
    symptoms: [{ id: 'rash', label: 'Erupción', defaultSeverity: 'mild', hrp: 'Inmunidad (reactivación viral)' }],
  },
];
