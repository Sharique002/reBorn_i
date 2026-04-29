// ═══════════════════════════════════════════════════════════
// reBorn_i — Animated Character Illustrations
// Elementary storybook-style SVG people for each module
// ═══════════════════════════════════════════════════════════

import { motion } from 'framer-motion';

/* ── Shared animation helpers ──────────────────────────── */
const floatY = { y: [0, -6, 0] };
const floatSlow = { duration: 4, repeat: Infinity, ease: 'easeInOut' as const };
const floatMed = { duration: 3, repeat: Infinity, ease: 'easeInOut' as const };
const wave = { rotate: [0, 14, -8, 14, 0] };
const waveTrans = { duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' as const };

interface IllustrationProps {
  className?: string;
  size?: number;
}

/* ═══════════════════════════════════════════════════════════
   1. Dashboard — Person waving hello, sitting at desk
   ═══════════════════════════════════════════════════════════ */
export function DashboardIllustration({ className = '', size = 200 }: IllustrationProps) {
  return (
    <motion.svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Desk */}
      <rect x="40" y="160" width="160" height="8" rx="4" fill="#F5A623" opacity="0.3" />
      <rect x="55" y="168" width="8" height="40" rx="2" fill="#F5A623" opacity="0.2" />
      <rect x="177" y="168" width="8" height="40" rx="2" fill="#F5A623" opacity="0.2" />

      {/* Laptop on desk */}
      <motion.g animate={floatY} transition={{ ...floatSlow, delay: 0.5 }}>
        <rect x="85" y="138" width="50" height="22" rx="3" fill="#0EA5E9" opacity="0.25" />
        <rect x="90" y="141" width="40" height="14" rx="2" fill="#0EA5E9" opacity="0.15" />
        {/* Screen glow */}
        <motion.rect
          x="92" y="143" width="36" height="10" rx="1" fill="#0EA5E9"
          animate={{ opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.g>

      {/* Person body */}
      <motion.g animate={floatY} transition={floatSlow}>
        {/* Body / shirt */}
        <path d="M100 120 Q100 100 120 95 Q140 100 140 120 L140 155 L100 155 Z" fill="#F5A623" opacity="0.35" />
        {/* Arms */}
        <path d="M100 110 Q85 115 78 105" stroke="#F5A623" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.3" />
        {/* Waving arm */}
        <motion.path
          d="M140 110 Q155 100 160 85"
          stroke="#F5A623" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.35"
          animate={wave}
          transition={waveTrans}
          style={{ transformOrigin: '140px 110px' }}
        />
        {/* Hand wave */}
        <motion.circle
          cx="160" cy="82" r="6" fill="#FFD4A8" opacity="0.6"
          animate={wave}
          transition={waveTrans}
          style={{ transformOrigin: '140px 110px' }}
        />
      </motion.g>

      {/* Head */}
      <motion.g animate={floatY} transition={floatSlow}>
        <circle cx="120" cy="75" r="22" fill="#FFD4A8" opacity="0.5" />
        {/* Hair */}
        <path d="M100 68 Q105 50 120 48 Q135 50 140 68" fill="#5A3E28" opacity="0.35" />
        {/* Eyes */}
        <circle cx="112" cy="75" r="2.5" fill="#2D2A32" opacity="0.6" />
        <circle cx="128" cy="75" r="2.5" fill="#2D2A32" opacity="0.6" />
        {/* Smile */}
        <path d="M113 82 Q120 88 127 82" stroke="#E84565" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
      </motion.g>

      {/* Floating sparkles */}
      <motion.g
        animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      >
        <path d="M170 60 L172 55 L174 60 L179 62 L174 64 L172 69 L170 64 L165 62 Z" fill="#F5A623" opacity="0.4" />
      </motion.g>
      <motion.g
        animate={{ opacity: [0.15, 0.4, 0.15], scale: [0.9, 1.15, 0.9] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
      >
        <path d="M60 55 L62 50 L64 55 L69 57 L64 59 L62 64 L60 59 L55 57 Z" fill="#8B5CF6" opacity="0.3" />
      </motion.g>
    </motion.svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   2. Resume Upload — Person holding a document / resume
   ═══════════════════════════════════════════════════════════ */
export function ResumeIllustration({ className = '', size = 200 }: IllustrationProps) {
  return (
    <motion.svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Shadow */}
      <ellipse cx="120" cy="215" rx="55" ry="8" fill="#2D2A32" opacity="0.06" />

      {/* Person body */}
      <motion.g animate={floatY} transition={floatSlow}>
        {/* Legs */}
        <rect x="108" y="170" width="8" height="35" rx="4" fill="#0EA5E9" opacity="0.2" />
        <rect x="124" y="170" width="8" height="35" rx="4" fill="#0EA5E9" opacity="0.2" />
        {/* Body / shirt */}
        <path d="M100 115 Q100 95 120 88 Q140 95 140 115 L140 175 L100 175 Z" fill="#0EA5E9" opacity="0.25" />
        {/* Arm left (holding doc) */}
        <path d="M100 120 Q80 130 75 140" stroke="#FFD4A8" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />
        {/* Arm right */}
        <path d="M140 120 Q155 130 155 145" stroke="#FFD4A8" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />

        {/* Head */}
        <circle cx="120" cy="68" r="24" fill="#FFD4A8" opacity="0.5" />
        {/* Hair */}
        <path d="M98 60 Q105 42 120 40 Q135 42 142 60" fill="#8B5CF6" opacity="0.3" />
        {/* Eyes */}
        <circle cx="112" cy="68" r="2.5" fill="#2D2A32" opacity="0.6" />
        <circle cx="128" cy="68" r="2.5" fill="#2D2A32" opacity="0.6" />
        {/* Smile */}
        <path d="M113 76 Q120 82 127 76" stroke="#E84565" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
        {/* Glasses */}
        <circle cx="112" cy="67" r="7" stroke="#2D2A32" strokeWidth="1.5" fill="none" opacity="0.2" />
        <circle cx="128" cy="67" r="7" stroke="#2D2A32" strokeWidth="1.5" fill="none" opacity="0.2" />
        <line x1="119" y1="67" x2="121" y2="67" stroke="#2D2A32" strokeWidth="1.5" opacity="0.2" />
      </motion.g>

      {/* Floating document */}
      <motion.g
        animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="55" y="120" width="40" height="52" rx="4" fill="white" stroke="#F5A623" strokeWidth="2" opacity="0.7" />
        <line x1="62" y1="132" x2="88" y2="132" stroke="#F5A623" strokeWidth="2" opacity="0.3" />
        <line x1="62" y1="140" x2="85" y2="140" stroke="#F5A623" strokeWidth="2" opacity="0.25" />
        <line x1="62" y1="148" x2="82" y2="148" stroke="#F5A623" strokeWidth="2" opacity="0.2" />
        <line x1="62" y1="156" x2="78" y2="156" stroke="#F5A623" strokeWidth="2" opacity="0.15" />
        {/* Check mark on doc */}
        <motion.path
          d="M72 126 L75 129 L82 122"
          stroke="#5A9E5A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5"
          animate={{ pathLength: [0, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
        />
      </motion.g>

      {/* Upload arrow */}
      <motion.g
        animate={{ y: [0, -10, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M168 130 L180 115 L192 130" stroke="#5A9E5A" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />
        <line x1="180" y1="115" x2="180" y2="150" stroke="#5A9E5A" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
      </motion.g>
    </motion.svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   3. Rejection Analysis — Person studying charts / magnifier
   ═══════════════════════════════════════════════════════════ */
export function AnalysisIllustration({ className = '', size = 200 }: IllustrationProps) {
  return (
    <motion.svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <ellipse cx="120" cy="215" rx="55" ry="8" fill="#2D2A32" opacity="0.06" />

      {/* Chart board behind */}
      <motion.g animate={{ y: [0, -3, 0] }} transition={{ ...floatSlow, delay: 1 }}>
        <rect x="135" y="50" width="75" height="60" rx="6" fill="white" stroke="#E84565" strokeWidth="1.5" opacity="0.5" />
        {/* Bar chart */}
        <rect x="145" y="85" width="10" height="18" rx="2" fill="#E84565" opacity="0.3" />
        <rect x="160" y="75" width="10" height="28" rx="2" fill="#F5A623" opacity="0.3" />
        <rect x="175" y="65" width="10" height="38" rx="2" fill="#5A9E5A" opacity="0.3" />
        <rect x="190" y="70" width="10" height="33" rx="2" fill="#0EA5E9" opacity="0.3" />
        {/* Trend line */}
        <motion.path
          d="M150 90 L165 78 L180 68 L195 73"
          stroke="#E84565" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4"
          animate={{ pathLength: [0, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
      </motion.g>

      {/* Person */}
      <motion.g animate={floatY} transition={floatSlow}>
        {/* Legs */}
        <rect x="85" y="175" width="8" height="30" rx="4" fill="#8B5CF6" opacity="0.2" />
        <rect x="105" y="175" width="8" height="30" rx="4" fill="#8B5CF6" opacity="0.2" />
        {/* Body */}
        <path d="M78 125 Q80 100 100 92 Q120 100 120 125 L120 180 L78 180 Z" fill="#8B5CF6" opacity="0.25" />
        {/* Arm pointing at chart */}
        <motion.path
          d="M120 130 Q140 120 150 110"
          stroke="#FFD4A8" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5"
          animate={{ rotate: [0, 3, -2, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{ transformOrigin: '120px 130px' }}
        />
        {/* Other arm */}
        <path d="M78 130 Q65 140 60 150" stroke="#FFD4A8" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />

        {/* Head */}
        <circle cx="100" cy="72" r="24" fill="#FFD4A8" opacity="0.5" />
        <path d="M78 64 Q85 46 100 44 Q115 46 122 64" fill="#2D2A32" opacity="0.3" />
        <circle cx="92" cy="72" r="2.5" fill="#2D2A32" opacity="0.6" />
        <circle cx="108" cy="72" r="2.5" fill="#2D2A32" opacity="0.6" />
        <path d="M95 79 Q100 84 107 79" stroke="#E84565" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
      </motion.g>

      {/* Magnifying glass */}
      <motion.g
        animate={{ rotate: [0, 5, -5, 0], x: [0, 3, -3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '55px 150px' }}
      >
        <circle cx="50" cy="140" r="16" stroke="#E84565" strokeWidth="3" fill="white" fillOpacity="0.3" opacity="0.4" />
        <line x1="61" y1="152" x2="72" y2="165" stroke="#E84565" strokeWidth="3.5" strokeLinecap="round" opacity="0.35" />
        {/* Lens shine */}
        <path d="M42 134 Q46 130 50 134" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />
      </motion.g>

      {/* Warning icon */}
      <motion.g
        animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <polygon points="175,35 180,25 185,35" fill="#F5A623" opacity="0.4" />
        <text x="180" y="33" textAnchor="middle" fontSize="6" fill="#F5A623" opacity="0.5" fontWeight="bold">!</text>
      </motion.g>
    </motion.svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   4. Market Radar — Person with globe / radar screen
   ═══════════════════════════════════════════════════════════ */
export function MarketIllustration({ className = '', size = 200 }: IllustrationProps) {
  return (
    <motion.svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <ellipse cx="120" cy="218" rx="55" ry="8" fill="#2D2A32" opacity="0.06" />

      {/* Radar/Globe */}
      <motion.g animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '170px 90px' }}>
        <circle cx="170" cy="90" r="35" stroke="#0EA5E9" strokeWidth="1.5" fill="#0EA5E9" fillOpacity="0.05" opacity="0.4" />
        <circle cx="170" cy="90" r="25" stroke="#0EA5E9" strokeWidth="1" fill="none" opacity="0.25" />
        <circle cx="170" cy="90" r="15" stroke="#0EA5E9" strokeWidth="1" fill="none" opacity="0.2" />
        <line x1="170" y1="55" x2="170" y2="125" stroke="#0EA5E9" strokeWidth="0.8" opacity="0.15" />
        <line x1="135" y1="90" x2="205" y2="90" stroke="#0EA5E9" strokeWidth="0.8" opacity="0.15" />
      </motion.g>
      {/* Radar sweep */}
      <motion.line
        x1="170" y1="90" x2="170" y2="58"
        stroke="#0EA5E9" strokeWidth="2" opacity="0.35"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '170px 90px' }}
      />
      {/* Blips */}
      <motion.circle cx="160" cy="75" r="3" fill="#5A9E5A" animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.2, 0.5] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} />
      <motion.circle cx="185" cy="100" r="2.5" fill="#F5A623" animate={{ opacity: [0, 0.5, 0], scale: [0.5, 1.2, 0.5] }} transition={{ duration: 4, repeat: Infinity, delay: 2.5 }} />
      <motion.circle cx="175" cy="80" r="2" fill="#E84565" animate={{ opacity: [0, 0.5, 0], scale: [0.5, 1.2, 0.5] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5 }} />

      {/* Person */}
      <motion.g animate={floatY} transition={floatSlow}>
        <rect x="72" y="175" width="8" height="30" rx="4" fill="#0EA5E9" opacity="0.2" />
        <rect x="92" y="175" width="8" height="30" rx="4" fill="#0EA5E9" opacity="0.2" />
        <path d="M65 120 Q67 98 87 90 Q107 98 108 120 L108 180 L65 180 Z" fill="#0EA5E9" opacity="0.25" />
        {/* Arm pointing to radar */}
        <motion.path
          d="M108 125 Q125 110 140 100"
          stroke="#FFD4A8" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5"
          animate={{ y: [0, -2, 0] }}
          transition={floatMed}
        />
        <path d="M65 130 Q50 140 48 150" stroke="#FFD4A8" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />

        {/* Head */}
        <circle cx="87" cy="68" r="24" fill="#FFD4A8" opacity="0.5" />
        <path d="M65 60 Q72 42 87 40 Q102 42 109 60" fill="#E84565" opacity="0.25" />
        <circle cx="80" cy="68" r="2.5" fill="#2D2A32" opacity="0.6" />
        <circle cx="95" cy="68" r="2.5" fill="#2D2A32" opacity="0.6" />
        <path d="M82 76 Q87 82 94 76" stroke="#E84565" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
      </motion.g>

      {/* Globe markers */}
      <motion.g animate={{ opacity: [0.2, 0.45, 0.2] }} transition={{ duration: 3, repeat: Infinity }}>
        <circle cx="50" cy="50" r="4" fill="#F5A623" opacity="0.3" />
        <circle cx="200" cy="170" r="3" fill="#8B5CF6" opacity="0.25" />
      </motion.g>
    </motion.svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   5. Career Simulation — Person with gears / trajectory
   ═══════════════════════════════════════════════════════════ */
export function SimulationIllustration({ className = '', size = 200 }: IllustrationProps) {
  return (
    <motion.svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <ellipse cx="120" cy="218" rx="55" ry="8" fill="#2D2A32" opacity="0.06" />

      {/* Gears */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '175px 65px' }}
      >
        <circle cx="175" cy="65" r="18" stroke="#5A9E5A" strokeWidth="3" fill="none" opacity="0.3" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <rect
            key={angle}
            x="173" y="44"
            width="4" height="8" rx="2"
            fill="#5A9E5A" opacity="0.3"
            transform={`rotate(${angle} 175 65)`}
          />
        ))}
        <circle cx="175" cy="65" r="5" fill="#5A9E5A" opacity="0.2" />
      </motion.g>
      <motion.g
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '200px 95px' }}
      >
        <circle cx="200" cy="95" r="12" stroke="#F5A623" strokeWidth="2.5" fill="none" opacity="0.25" />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <rect
            key={angle}
            x="198.5" y="81"
            width="3" height="6" rx="1.5"
            fill="#F5A623" opacity="0.25"
            transform={`rotate(${angle} 200 95)`}
          />
        ))}
        <circle cx="200" cy="95" r="3.5" fill="#F5A623" opacity="0.2" />
      </motion.g>

      {/* Growth trajectory arrow */}
      <motion.path
        d="M150 150 Q165 120 185 110"
        stroke="#5A9E5A" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.3"
        animate={{ pathLength: [0, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
      />
      <motion.polygon
        points="188,105 192,112 183,112"
        fill="#5A9E5A" opacity="0.35"
        animate={{ opacity: [0, 0.35, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, delay: 2 }}
      />

      {/* Person — thinking pose */}
      <motion.g animate={floatY} transition={floatSlow}>
        <rect x="82" y="175" width="8" height="30" rx="4" fill="#5A9E5A" opacity="0.2" />
        <rect x="102" y="175" width="8" height="30" rx="4" fill="#5A9E5A" opacity="0.2" />
        <path d="M75 120 Q77 98 97 90 Q117 98 118 120 L118 180 L75 180 Z" fill="#5A9E5A" opacity="0.22" />
        {/* Arm at chin (thinking) */}
        <path d="M75 130 Q60 120 65 100 Q68 88 75 85" stroke="#FFD4A8" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />
        <path d="M118 125 Q135 130 140 145" stroke="#FFD4A8" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />

        {/* Head */}
        <circle cx="97" cy="68" r="24" fill="#FFD4A8" opacity="0.5" />
        <path d="M75 60 Q82 42 97 40 Q112 42 119 60" fill="#5A9E5A" opacity="0.25" />
        {/* Eyes looking up at gears */}
        <circle cx="90" cy="66" r="2.5" fill="#2D2A32" opacity="0.6" />
        <circle cx="105" cy="66" r="2.5" fill="#2D2A32" opacity="0.6" />
        {/* Thinking expression */}
        <path d="M92 78 Q97 80 103 78" stroke="#E84565" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
      </motion.g>

      {/* Thought bubble */}
      <motion.g
        animate={{ opacity: [0.2, 0.45, 0.2], y: [0, -4, 0] }}
        transition={{ duration: 3.5, repeat: Infinity }}
      >
        <circle cx="68" cy="55" r="3" fill="#5A9E5A" opacity="0.2" />
        <circle cx="58" cy="45" r="5" fill="#5A9E5A" opacity="0.15" />
        <ellipse cx="45" cy="32" rx="15" ry="10" fill="#5A9E5A" opacity="0.1" />
        <text x="45" y="35" textAnchor="middle" fontSize="8" fill="#5A9E5A" opacity="0.3" fontWeight="bold">?</text>
      </motion.g>
    </motion.svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   6. Blueprint — Person with clipboard / plan
   ═══════════════════════════════════════════════════════════ */
export function BlueprintIllustration({ className = '', size = 200 }: IllustrationProps) {
  return (
    <motion.svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <ellipse cx="120" cy="218" rx="55" ry="8" fill="#2D2A32" opacity="0.06" />

      {/* Large clipboard / plan board */}
      <motion.g animate={{ y: [0, -3, 0] }} transition={{ ...floatSlow, delay: 0.5 }}>
        <rect x="130" y="50" width="80" height="110" rx="8" fill="white" stroke="#8B5CF6" strokeWidth="2" opacity="0.5" />
        {/* Clip */}
        <rect x="155" y="44" width="30" height="12" rx="4" fill="#8B5CF6" opacity="0.3" />
        {/* Checklist items */}
        {[70, 88, 106, 124, 142].map((y, i) => (
          <motion.g key={y} animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}>
            <rect x="142" y={y} width="10" height="10" rx="2" stroke="#8B5CF6" strokeWidth="1.5" fill="none" opacity="0.35" />
            {i < 3 && (
              <motion.path
                d={`M144 ${y + 5} L147 ${y + 8} L151 ${y + 3}`}
                stroke="#5A9E5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5"
                animate={{ pathLength: [0, 1] }}
                transition={{ duration: 0.8, delay: i * 1.5, repeat: Infinity, repeatDelay: 6 }}
              />
            )}
            <rect x="157" y={y + 2} width={35 - i * 4} height="5" rx="2.5" fill="#8B5CF6" opacity={0.15 - i * 0.02} />
          </motion.g>
        ))}
      </motion.g>

      {/* Person */}
      <motion.g animate={floatY} transition={floatSlow}>
        <rect x="62" y="175" width="8" height="30" rx="4" fill="#8B5CF6" opacity="0.2" />
        <rect x="82" y="175" width="8" height="30" rx="4" fill="#8B5CF6" opacity="0.2" />
        <path d="M55 118 Q57 96 77 88 Q97 96 98 118 L98 180 L55 180 Z" fill="#8B5CF6" opacity="0.22" />
        {/* Arm to clipboard */}
        <motion.path
          d="M98 128 Q115 120 130 115"
          stroke="#FFD4A8" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5"
          animate={{ y: [0, -2, 0] }}
          transition={floatMed}
        />
        <path d="M55 130 Q40 135 38 148" stroke="#FFD4A8" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />

        {/* Head */}
        <circle cx="77" cy="66" r="24" fill="#FFD4A8" opacity="0.5" />
        <path d="M55 58 Q62 40 77 38 Q92 40 99 58" fill="#F5A623" opacity="0.3" />
        <circle cx="70" cy="66" r="2.5" fill="#2D2A32" opacity="0.6" />
        <circle cx="85" cy="66" r="2.5" fill="#2D2A32" opacity="0.6" />
        <path d="M72 74 Q77 80 84 74" stroke="#E84565" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
      </motion.g>

      {/* Pencil writing */}
      <motion.g
        animate={{ rotate: [0, -5, 5, 0], x: [0, 2, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ transformOrigin: '132px 115px' }}
      >
        <rect x="125" y="108" width="4" height="18" rx="1" fill="#F5A623" opacity="0.4" transform="rotate(-30 127 117)" />
        <polygon points="124,124 127,130 130,124" fill="#F5A623" opacity="0.35" transform="rotate(-30 127 127)" />
      </motion.g>
    </motion.svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   7. Hiring Pipeline — Person at interview / funnel
   ═══════════════════════════════════════════════════════════ */
export function HiringIllustration({ className = '', size = 200 }: IllustrationProps) {
  return (
    <motion.svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <ellipse cx="120" cy="218" rx="55" ry="8" fill="#2D2A32" opacity="0.06" />

      {/* Funnel */}
      <motion.g animate={{ y: [0, -4, 0] }} transition={{ ...floatSlow, delay: 0.3 }}>
        <path d="M140 50 L210 50 L190 100 L160 100 Z" fill="#F5A623" opacity="0.15" stroke="#F5A623" strokeWidth="1.5" />
        <rect x="160" y="100" width="30" height="30" rx="2" fill="#F5A623" opacity="0.12" stroke="#F5A623" strokeWidth="1.5" />
        {/* Items going through funnel */}
        <motion.circle cx="165" cy="60" r="4" fill="#0EA5E9" opacity="0.4"
          animate={{ y: [0, 70], opacity: [0.5, 0], scale: [1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0 }}
        />
        <motion.circle cx="180" cy="55" r="4" fill="#5A9E5A" opacity="0.4"
          animate={{ y: [0, 75], opacity: [0.5, 0], scale: [1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        />
        <motion.circle cx="190" cy="58" r="4" fill="#8B5CF6" opacity="0.4"
          animate={{ y: [0, 72], opacity: [0.5, 0], scale: [1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, delay: 2 }}
        />
      </motion.g>

      {/* Star output */}
      <motion.g
        animate={{ opacity: [0, 0.5, 0], y: [0, 10, 20], scale: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, delay: 2.5 }}
      >
        <path d="M175 140 L177 135 L179 140 L184 141 L179 143 L177 148 L175 143 L170 141 Z" fill="#F5A623" opacity="0.5" />
      </motion.g>

      {/* Person - interviewer/candidate */}
      <motion.g animate={floatY} transition={floatSlow}>
        <rect x="62" y="175" width="8" height="30" rx="4" fill="#F5A623" opacity="0.2" />
        <rect x="82" y="175" width="8" height="30" rx="4" fill="#F5A623" opacity="0.2" />
        <path d="M55 118 Q57 96 77 88 Q97 96 98 118 L98 180 L55 180 Z" fill="#F5A623" opacity="0.22" />
        {/* Tie */}
        <polygon points="74,100 77,95 80,100 77,115" fill="#E84565" opacity="0.25" />
        {/* Arms */}
        <path d="M98 125 Q115 118 130 110" stroke="#FFD4A8" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />
        <path d="M55 128 Q42 135 40 148" stroke="#FFD4A8" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />

        {/* Head */}
        <circle cx="77" cy="66" r="24" fill="#FFD4A8" opacity="0.5" />
        <path d="M55 58 Q62 40 77 38 Q92 40 99 58" fill="#2D2A32" opacity="0.3" />
        <circle cx="70" cy="66" r="2.5" fill="#2D2A32" opacity="0.6" />
        <circle cx="85" cy="66" r="2.5" fill="#2D2A32" opacity="0.6" />
        <path d="M72 74 Q77 80 84 74" stroke="#E84565" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
      </motion.g>

      {/* Briefcase */}
      <motion.g
        animate={{ y: [0, -5, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="28" y="148" width="24" height="18" rx="3" fill="#F5A623" opacity="0.3" stroke="#F5A623" strokeWidth="1.5" />
        <rect x="35" y="144" width="10" height="6" rx="2" fill="none" stroke="#F5A623" strokeWidth="1.5" opacity="0.3" />
      </motion.g>

      {/* Handshake gesture */}
      <motion.g
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <path d="M120 160 Q130 155 135 160 Q130 165 120 160" fill="#5A9E5A" opacity="0.3" />
        <path d="M135 160 Q125 155 120 160 Q125 165 135 160" fill="#5A9E5A" opacity="0.25" />
      </motion.g>
    </motion.svg>
  );
}
