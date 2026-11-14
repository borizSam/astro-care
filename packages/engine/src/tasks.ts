import type { Task, TaskId } from './types';

// ⚠️ Thresholds proposed by the team; must be validated by the aerospace engineer.
export const TASKS: Record<TaskId, Task> = {
  eva: {
    id: 'eva',
    label: 'Lunar EVA (6–8 h)',
    durationH: 7,
    pvtMaxSlowdownPct: 15,
    maxLapses: 2,
    blockedBySolarParticles: true,
    minSleepH: 5,
  },
  rover: {
    id: 'rover',
    label: 'Rover driving',
    durationH: 4,
    pvtMaxSlowdownPct: 15,
    maxLapses: 2,
    blockedBySolarParticles: true,
    minSleepH: 5,
  },
  lab: {
    id: 'lab',
    label: 'Habitat lab work',
    durationH: 2,
    pvtMaxSlowdownPct: 30,
    maxLapses: 5,
    blockedBySolarParticles: false,
    minSleepH: 4,
  },
};
