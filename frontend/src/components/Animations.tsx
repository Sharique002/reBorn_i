// ═══════════════════════════════════════════════════════════
// reBorn_i — Skeleton Loaders & Micro-Animation Utilities
// ═══════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════
   SKELETON LOADERS
   ═══════════════════════════════════════════════════════════ */

/** A single shimmering skeleton bar */
export function SkeletonBar({ width = '100%', height = 16, rounded = 8 }: {
  width?: string | number;
  height?: number;
  rounded?: number;
}) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width,
        height,
        borderRadius: rounded,
      }}
    />
  );
}

/** Skeleton card mimicking a content card */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="card space-y-3"
    >
      <SkeletonBar width="60%" height={20} rounded={10} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBar
          key={i}
          width={i === lines - 1 ? '45%' : '100%'}
          height={14}
          rounded={7}
        />
      ))}
    </motion.div>
  );
}

/** Skeleton for stats / metric cards */
export function SkeletonStat() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="card flex items-center gap-4"
    >
      <div className="skeleton-shimmer w-11 h-11 rounded-xl" />
      <div className="flex-1 space-y-2">
        <SkeletonBar width="40%" height={24} rounded={8} />
        <SkeletonBar width="60%" height={12} rounded={6} />
      </div>
    </motion.div>
  );
}

/** Full page skeleton for data-heavy pages */
export function PageSkeleton({ cards = 3, stats = 3 }: { cards?: number; stats?: number }) {
  return (
    <div className="space-y-6 animate-pulse-slow">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBar width={220} height={28} rounded={14} />
          <SkeletonBar width={320} height={14} rounded={7} />
        </div>
        <div className="hidden sm:block skeleton-shimmer w-32 h-32 rounded-2xl" />
      </div>

      {/* Stats row */}
      {stats > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: stats }).map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
      )}

      {/* Content cards */}
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={i} lines={i === 0 ? 4 : 3} />
      ))}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════════ */

/** Counts up from 0 to `value` on mount */
export function AnimatedCounter({
  value,
  duration = 1.2,
  suffix = '',
  prefix = '',
  className = '',
  decimals = 0,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const startTime = performance.now();
    const dur = duration * 1000;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / dur, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}


/* ═══════════════════════════════════════════════════════════
   TYPEWRITER TEXT
   ═══════════════════════════════════════════════════════════ */

export function TypewriterText({
  text,
  speed = 35,
  className = '',
  onComplete,
}: {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-0.5 h-4 bg-current ml-0.5 align-text-top"
      />
    </span>
  );
}


/* ═══════════════════════════════════════════════════════════
   PULSING NOTIFICATION DOT
   ═══════════════════════════════════════════════════════════ */

export function PulsingDot({
  color = '#5A9E5A',
  size = 8,
  className = '',
}: {
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex ${className}`}>
      <motion.span
        animate={{ scale: [1, 2], opacity: [0.6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute inset-0 rounded-full"
        style={{ background: color }}
      />
      <span
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: color,
        }}
      />
    </span>
  );
}


/* ═══════════════════════════════════════════════════════════
   SUCCESS CELEBRATION (Mini Confetti Burst)
   ═══════════════════════════════════════════════════════════ */

const CONFETTI_COLORS = ['#F5A623', '#E84565', '#0EA5E9', '#5A9E5A', '#8B5CF6', '#FF8C42'];

export function ConfettiBurst({ show }: { show: boolean }) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    angle: (i / 20) * 360 + Math.random() * 18,
    distance: 40 + Math.random() * 60,
    size: 4 + Math.random() * 5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    duration: 0.6 + Math.random() * 0.4,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
  }));

  return (
    <AnimatePresence>
      {show && (
        <span className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center z-50">
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const tx = Math.cos(rad) * p.distance;
            const ty = Math.sin(rad) * p.distance;
            return (
              <motion.span
                key={p.id}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: tx,
                  y: ty,
                  scale: 0,
                  opacity: 0,
                  rotate: Math.random() * 360,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: p.duration, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: p.shape === 'circle' ? p.size : p.size * 0.5,
                  borderRadius: p.shape === 'circle' ? '50%' : 2,
                  background: p.color,
                }}
              />
            );
          })}
        </span>
      )}
    </AnimatePresence>
  );
}


/* ═══════════════════════════════════════════════════════════
   STAGGER CONTAINER — wraps children with stagger entrance
   ═══════════════════════════════════════════════════════════ */

export function StaggerIn({
  children,
  delay = 0,
  stagger = 0.08,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        show: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};


/* ═══════════════════════════════════════════════════════════
   FLOATING BADGE — gently floats up and down
   ═══════════════════════════════════════════════════════════ */

export function FloatingBadge({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.span
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      className={`inline-flex ${className}`}
    >
      {children}
    </motion.span>
  );
}


/* ═══════════════════════════════════════════════════════════
   PROGRESS BAR — animated fill
   ═══════════════════════════════════════════════════════════ */

export function AnimatedProgressBar({
  value,
  max = 100,
  color = '#F5A623',
  height = 8,
  className = '',
  delay = 0,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  className?: string;
  delay?: number;
}) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div
      className={`w-full rounded-full overflow-hidden ${className}`}
      style={{ height, background: 'var(--border)' }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        className="h-full rounded-full relative"
        style={{ background: color }}
      >
        {/* Shine effect */}
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 2, repeat: Infinity, delay: delay + 0.8 }}
        />
      </motion.div>
    </div>
  );
}
