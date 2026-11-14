import { motion } from 'motion/react';
import type { AvatarState } from '@astro-care/engine';

const AURA: Record<AvatarState, string> = {
  optimal: '#22c55e',
  low: '#eab308',
  medium: '#f97316',
  high: '#ef4444',
};

const LABEL: Record<AvatarState, string> = {
  optimal: 'Feeling good',
  low: 'A bit tired',
  medium: 'Not well: check guidance',
  high: 'Distress: crew alert',
};

/** Original layered-SVG astronaut. Pose and breathing follow NEWS2 state and respiratory rate. */
export function Avatar({ state, respRate, size = 260 }: { state: AvatarState; respRate: number; size?: number }) {
  const breathS = 60 / Math.max(6, Math.min(40, respRate));
  const pose = {
    optimal: { rotate: 0, y: 0, headRotate: 0 },
    low: { rotate: 0, y: 6, headRotate: 10 },
    medium: { rotate: 0, y: 34, headRotate: 18 },
    high: { rotate: -78, y: 70, headRotate: 0 },
  }[state];
  const aura = AURA[state];

  return (
    <figure className="flex flex-col items-center gap-2" aria-label={`Astronaut avatar: ${LABEL[state]}`}>
      <svg viewBox="0 0 200 240" width={size} height={size * 1.2} role="img">
        <defs>
          <radialGradient id="aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={aura} stopOpacity="0.35" />
            <stop offset="100%" stopColor={aura} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="visor" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor={state === 'optimal' ? '#38bdf8' : aura} />
          </linearGradient>
        </defs>

        <motion.ellipse
          cx="100" cy="125" rx="95" ry="110" fill="url(#aura)"
          animate={{ opacity: state === 'high' ? [0.4, 1, 0.4] : [0.7, 1, 0.7] }}
          transition={{ duration: state === 'high' ? 0.8 : breathS, repeat: Infinity }}
        />
        <ellipse cx="100" cy="228" rx="55" ry="6" fill="#000" opacity="0.5" />

        <motion.g
          style={{ originX: '100px', originY: '200px' }}
          animate={{ rotate: pose.rotate, y: pose.y }}
          transition={{ type: 'spring', stiffness: 80, damping: 14 }}
        >
          {/* legs: bend when kneeling */}
          <motion.g animate={{ scaleY: state === 'medium' ? 0.55 : 1 }} style={{ originY: '160px' }}>
            <rect x="72" y="160" width="22" height="62" rx="10" fill="#d7dce6" />
            <rect x="106" y="160" width="22" height="62" rx="10" fill="#d7dce6" />
            <rect x="68" y="210" width="30" height="14" rx="6" fill="#9aa4b5" />
            <rect x="102" y="210" width="30" height="14" rx="6" fill="#9aa4b5" />
          </motion.g>

          {/* torso breathes */}
          <motion.g
            style={{ originX: '100px', originY: '130px' }}
            animate={{ scaleX: [1, 1.035, 1], scaleY: [1, 1.02, 1] }}
            transition={{ duration: breathS, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="62" y="92" width="76" height="78" rx="22" fill="#eef1f6" />
            <rect x="80" y="110" width="40" height="26" rx="6" fill="#1c2536" />
            <circle cx="90" cy="123" r="4" fill={aura} />
            <rect x="98" y="119" width="16" height="3" rx="1.5" fill="#7dd3fc" />
            <rect x="98" y="125" width="10" height="3" rx="1.5" fill="#7dd3fc" opacity="0.6" />
          </motion.g>

          {/* arms */}
          <rect x="40" y="98" width="20" height="58" rx="10" fill="#e3e7ee" />
          <motion.rect
            x="140" y="98" width="20" height="58" rx="10" fill="#e3e7ee"
            style={{ originX: '150px', originY: '104px' }}
            animate={{ rotate: state === 'medium' ? -150 : 0 }}
            transition={{ type: 'spring', stiffness: 70, damping: 12 }}
          />

          {/* helmet */}
          <motion.g
            style={{ originX: '100px', originY: '92px' }}
            animate={{ rotate: pose.headRotate }}
            transition={{ type: 'spring', stiffness: 80, damping: 14 }}
          >
            <circle cx="100" cy="58" r="40" fill="#f4f6fa" />
            <rect x="70" y="40" width="60" height="38" rx="19" fill="url(#visor)" />
            <path d="M80 48 q8 -6 18 -4" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
          </motion.g>
        </motion.g>
      </svg>
      <figcaption className="label" style={{ color: aura }}>{LABEL[state]}</figcaption>
    </figure>
  );
}
