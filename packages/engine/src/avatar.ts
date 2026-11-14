import { news2 } from './news2';
import type { Vitals } from './types';

export type AvatarState = 'optimal' | 'low' | 'medium' | 'high';

/** Maps NEWS2 to the avatar's daily state (not the GO/NO-GO verdict). */
export function avatarState(v: Vitals): AvatarState {
  const n = news2(v);
  if (n.total >= 7) return 'high';
  if (n.total >= 5 || n.anySingleThree) return 'medium';
  if (n.total >= 1) return 'low';
  return 'optimal';
}

export interface CareLevels {
  hydration: number; // 0–100
  nutrition: number;
  activity: number;
}

export function careLevels(waterMlLast3h: number, minutesSinceMeal: number, exerciseMinToday: number): CareLevels {
  const clamp = (x: number) => Math.max(0, Math.min(100, Math.round(x)));
  return {
    hydration: clamp((waterMlLast3h / 750) * 100),
    nutrition: clamp(100 - (minutesSinceMeal / 360) * 100),
    activity: clamp((exerciseMinToday / 120) * 100), // ~2 h/day ISS exercise target
  };
}
