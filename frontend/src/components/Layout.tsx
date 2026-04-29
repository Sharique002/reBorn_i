// ═══════════════════════════════════════════════════════════
// reBorn_i — Layout Shell (Warm Storybook Theme)
// ═══════════════════════════════════════════════════════════

import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import Sidebar from './Sidebar';
import {
  DashboardIllustration,
  ResumeIllustration,
  AnalysisIllustration,
  MarketIllustration,
  SimulationIllustration,
  BlueprintIllustration,
  HiringIllustration,
} from './Illustrations';

/* ── SVG Doodle Shapes ───────────────────────────────── */
const DoodleStar = ({ size = 18, color = '#F5A623' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2l2.9 8.3H24l-7.1 5.2 2.7 8.5L12 18.8 4.4 24l2.7-8.5L0 10.3h9.1z" fill={color} opacity="0.35" />
  </svg>
);

const DoodleHeart = ({ size = 16, color = '#E84565' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={color} opacity="0.25" />
  </svg>
);

const DoodleCircle = ({ size = 12, color = '#0EA5E9' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" opacity="0.25" strokeDasharray="4 3" />
  </svg>
);

const DoodleDiamond = ({ size = 14, color = '#8B5CF6' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L22 12L12 22L2 12Z" fill={color} opacity="0.2" />
  </svg>
);

const DoodleSparkle = ({ size = 16, color = '#F5A623' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" fill={color} opacity="0.22" />
  </svg>
);

const DoodlePencil = ({ size = 20, color = '#F5A623' }: { size?: number; color?: string }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 20 24" fill="none">
    <rect x="7" y="2" width="6" height="16" rx="1" fill={color} opacity="0.18" />
    <polygon points="7,18 10,23 13,18" fill={color} opacity="0.25" />
    <rect x="7" y="2" width="6" height="3" rx="0.5" fill={color} opacity="0.12" />
  </svg>
);

const DoodleBook = ({ size = 20, color = '#5A9E5A' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={color} strokeWidth="2" opacity="0.25" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={color} strokeWidth="2" opacity="0.2" fill={color} fillOpacity="0.06" />
    <line x1="9" y1="7" x2="16" y2="7" stroke={color} strokeWidth="1.5" opacity="0.2" />
    <line x1="9" y1="11" x2="14" y2="11" stroke={color} strokeWidth="1.5" opacity="0.15" />
  </svg>
);

const DoodleCross = ({ size = 10, color = '#E84565' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <line x1="2" y1="2" x2="10" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.2" />
    <line x1="10" y1="2" x2="2" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.2" />
  </svg>
);

const DoodleWave = ({ size = 40, color = '#0EA5E9' }: { size?: number; color?: string }) => (
  <svg width={size} height={size * 0.3} viewBox="0 0 40 12" fill="none">
    <path d="M0 6C4 2 8 10 12 6C16 2 20 10 24 6C28 2 32 10 36 6C38 4 40 6 40 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.18" fill="none" />
  </svg>
);

/* ── Shape Config for Random Placement ───────────────── */
interface FloatingShape {
  id: number;
  Component: React.FC<{ size?: number; color?: string }>;
  size: number;
  color: string;
  x: string; // CSS left %
  y: string; // CSS top %
  duration: number;
  delay: number;
  drift: { x: number[]; y: number[] };
  rotate: number[];
}

const SHAPES: FloatingShape[] = [
  // Stars
  { id: 1, Component: DoodleStar, size: 20, color: '#F5A623', x: '12%', y: '15%', duration: 18, delay: 0, drift: { x: [0, 25, -10, 0], y: [0, -30, -15, 0] }, rotate: [0, 15, -10, 0] },
  { id: 2, Component: DoodleStar, size: 14, color: '#FF8C42', x: '75%', y: '8%', duration: 22, delay: 3, drift: { x: [0, -20, 10, 0], y: [0, 20, -10, 0] }, rotate: [0, -20, 10, 0] },
  { id: 3, Component: DoodleStar, size: 12, color: '#F5A623', x: '55%', y: '70%', duration: 15, delay: 7, drift: { x: [0, 15, -15, 0], y: [0, -20, 10, 0] }, rotate: [0, 25, 0, 0] },
  // Hearts
  { id: 4, Component: DoodleHeart, size: 16, color: '#E84565', x: '85%', y: '25%', duration: 20, delay: 1, drift: { x: [0, -15, 5, 0], y: [0, -25, -5, 0] }, rotate: [0, 10, -5, 0] },
  { id: 5, Component: DoodleHeart, size: 12, color: '#FF6B8A', x: '30%', y: '80%', duration: 16, delay: 5, drift: { x: [0, 20, -10, 0], y: [0, -30, 0, 0] }, rotate: [0, -15, 5, 0] },
  { id: 6, Component: DoodleHeart, size: 10, color: '#E84565', x: '65%', y: '45%', duration: 19, delay: 9, drift: { x: [0, -10, 15, 0], y: [0, -15, 5, 0] }, rotate: [0, 20, -10, 0] },
  // Circles (dashed)
  { id: 7, Component: DoodleCircle, size: 16, color: '#0EA5E9', x: '20%', y: '55%', duration: 14, delay: 2, drift: { x: [0, 10, -20, 0], y: [0, -20, 10, 0] }, rotate: [0, 90, 180, 360] },
  { id: 8, Component: DoodleCircle, size: 10, color: '#38BDF8', x: '80%', y: '65%', duration: 17, delay: 4, drift: { x: [0, -12, 8, 0], y: [0, 15, -15, 0] }, rotate: [0, -90, -180, -360] },
  // Diamonds
  { id: 9, Component: DoodleDiamond, size: 14, color: '#8B5CF6', x: '45%', y: '12%', duration: 21, delay: 6, drift: { x: [0, 18, -8, 0], y: [0, -12, 20, 0] }, rotate: [0, 45, 0, -45] },
  { id: 10, Component: DoodleDiamond, size: 10, color: '#A78BFA', x: '92%', y: '50%', duration: 13, delay: 8, drift: { x: [0, -15, 5, 0], y: [0, 20, -10, 0] }, rotate: [0, -30, 15, 0] },
  // Sparkles
  { id: 11, Component: DoodleSparkle, size: 16, color: '#F5A623', x: '38%', y: '30%', duration: 11, delay: 0.5, drift: { x: [0, 12, -8, 0], y: [0, -18, 5, 0] }, rotate: [0, 30, -15, 0] },
  { id: 12, Component: DoodleSparkle, size: 12, color: '#FFD700', x: '70%', y: '85%', duration: 16, delay: 3.5, drift: { x: [0, -10, 15, 0], y: [0, -25, 0, 0] }, rotate: [0, -20, 40, 0] },
  // Pencils (study theme)
  { id: 13, Component: DoodlePencil, size: 18, color: '#F5A623', x: '8%', y: '40%', duration: 23, delay: 2, drift: { x: [0, 8, -5, 0], y: [0, -15, 10, 0] }, rotate: [0, -10, 5, 0] },
  { id: 14, Component: DoodlePencil, size: 14, color: '#FF8C42', x: '60%', y: '15%', duration: 19, delay: 10, drift: { x: [0, -12, 8, 0], y: [0, 12, -8, 0] }, rotate: [0, 15, -8, 0] },
  // Books (study theme)
  { id: 15, Component: DoodleBook, size: 20, color: '#5A9E5A', x: '25%', y: '70%', duration: 25, delay: 4, drift: { x: [0, 15, -10, 0], y: [0, -10, 15, 0] }, rotate: [0, 5, -3, 0] },
  { id: 16, Component: DoodleBook, size: 16, color: '#4ADE80', x: '88%', y: '35%', duration: 20, delay: 7, drift: { x: [0, -8, 12, 0], y: [0, -18, 5, 0] }, rotate: [0, -8, 4, 0] },
  // Crosses
  { id: 17, Component: DoodleCross, size: 10, color: '#E84565', x: '50%', y: '55%', duration: 12, delay: 1.5, drift: { x: [0, 15, -15, 0], y: [0, -10, 20, 0] }, rotate: [0, 45, 90, 0] },
  { id: 18, Component: DoodleCross, size: 8, color: '#F59E0B', x: '15%', y: '90%', duration: 18, delay: 6, drift: { x: [0, 10, -5, 0], y: [0, -20, 5, 0] }, rotate: [0, -45, 0, 45] },
  // Waves
  { id: 19, Component: DoodleWave, size: 45, color: '#0EA5E9', x: '35%', y: '92%', duration: 20, delay: 3, drift: { x: [0, 20, -10, 0], y: [0, -8, 5, 0] }, rotate: [0, 3, -2, 0] },
  { id: 20, Component: DoodleWave, size: 35, color: '#8B5CF6', x: '72%', y: '5%', duration: 24, delay: 8, drift: { x: [0, -15, 10, 0], y: [0, 10, -5, 0] }, rotate: [0, -5, 3, 0] },
  // Extra small accent shapes
  { id: 21, Component: DoodleStar, size: 8, color: '#FFD700', x: '95%', y: '75%', duration: 10, delay: 0, drift: { x: [0, -8, 4, 0], y: [0, -12, 6, 0] }, rotate: [0, 30, -15, 0] },
  { id: 22, Component: DoodleSparkle, size: 10, color: '#F5A623', x: '5%', y: '25%', duration: 14, delay: 5, drift: { x: [0, 10, -5, 0], y: [0, -8, 4, 0] }, rotate: [0, 45, 0, -45] },
  { id: 23, Component: DoodleHeart, size: 8, color: '#FF6B8A', x: '48%', y: '95%', duration: 17, delay: 2.5, drift: { x: [0, -5, 10, 0], y: [0, -20, 0, 0] }, rotate: [0, 10, -5, 0] },
  { id: 24, Component: DoodleCircle, size: 8, color: '#38BDF8', x: '40%', y: '5%', duration: 13, delay: 7, drift: { x: [0, 8, -12, 0], y: [0, 15, -5, 0] }, rotate: [0, 180, 360, 540] },
];

/* ── Rising Bubbles (gentle upward float) ─────────── */
interface Bubble {
  id: number;
  x: string;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

const BUBBLES: Bubble[] = [
  { id: 1, x: '10%', size: 4, color: '#F5A623', duration: 18, delay: 0 },
  { id: 2, x: '25%', size: 3, color: '#E84565', duration: 22, delay: 4 },
  { id: 3, x: '40%', size: 5, color: '#0EA5E9', duration: 20, delay: 2 },
  { id: 4, x: '55%', size: 3, color: '#8B5CF6', duration: 16, delay: 6 },
  { id: 5, x: '70%', size: 4, color: '#5A9E5A', duration: 24, delay: 8 },
  { id: 6, x: '85%', size: 3, color: '#FF8C42', duration: 19, delay: 3 },
  { id: 7, x: '18%', size: 3, color: '#A78BFA', duration: 21, delay: 10 },
  { id: 8, x: '62%', size: 4, color: '#F5A623', duration: 17, delay: 5 },
  { id: 9, x: '78%', size: 3, color: '#E84565', duration: 23, delay: 1 },
  { id: 10, x: '33%', size: 5, color: '#38BDF8', duration: 15, delay: 7 },
];

/* ── Floating Decoration Blobs + Shapes ──────────────── */
function FloatingBlobs() {
  // Memoize so shapes don't re-render on route changes
  const shapes = useMemo(() => SHAPES, []);
  const bubbles = useMemo(() => BUBBLES, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* ── Soft gradient blobs ── */}
      <motion.div
        className="absolute -top-20 -right-20 w-96 h-96 rounded-full"
        style={{ background: 'rgba(245, 166, 35, 0.06)', filter: 'blur(80px)' }}
        animate={{ y: [0, -20, 0], x: [0, 15, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full"
        style={{ background: 'rgba(232, 69, 101, 0.04)', filter: 'blur(60px)' }}
        animate={{ y: [0, 20, 0], x: [0, -10, 0], scale: [1, 0.95, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      <motion.div
        className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full"
        style={{ background: 'rgba(14, 165, 233, 0.03)', filter: 'blur(80px)' }}
        animate={{ y: [0, -15, 0], x: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full"
        style={{ background: 'rgba(139, 92, 246, 0.04)', filter: 'blur(60px)' }}
        animate={{ y: [0, 15, 0], x: [0, -12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* ── Floating doodle shapes ── */}
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute"
          style={{ left: shape.x, top: shape.y }}
          animate={{
            x: shape.drift.x,
            y: shape.drift.y,
            rotate: shape.rotate,
            opacity: [0.5, 0.85, 0.6, 0.5],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: shape.delay,
          }}
        >
          <shape.Component size={shape.size} color={shape.color} />
        </motion.div>
      ))}

      {/* ── Rising bubbles ── */}
      {bubbles.map((bubble) => (
        <motion.div
          key={`bubble-${bubble.id}`}
          className="absolute rounded-full"
          style={{
            left: bubble.x,
            bottom: '-10px',
            width: bubble.size,
            height: bubble.size,
            background: bubble.color,
            opacity: 0,
          }}
          animate={{
            y: [0, -window.innerHeight * 1.1],
            opacity: [0, 0.25, 0.35, 0.2, 0],
            scale: [0.5, 1, 1.2, 0.8, 0.3],
          }}
          transition={{
            duration: bubble.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: bubble.delay,
          }}
        />
      ))}

      {/* ── Gentle grid dots overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(245,166,35,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}

/* ── Route-Aware Background Illustration ─────────────── */
const ROUTE_ILLUSTRATIONS: Record<string, React.FC<{ className?: string; size?: number }>> = {
  '/': DashboardIllustration,
  '/resume': ResumeIllustration,
  '/analysis': AnalysisIllustration,
  '/market': MarketIllustration,
  '/simulation': SimulationIllustration,
  '/blueprint': BlueprintIllustration,
  '/pipeline': HiringIllustration,
};

function BackgroundIllustration() {
  const location = useLocation();
  const Illust = ROUTE_ILLUSTRATIONS[location.pathname];

  return (
    <AnimatePresence mode="wait">
      {Illust && (
        <motion.div
          key={location.pathname}
          className="absolute pointer-events-none"
          style={{
            /* fill the content pane, centred */
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
          initial={{ opacity: 0, scale: 0.6, rotate: -4 }}
          animate={{
            opacity: 1,
            scale: [1, 1.03, 1],
            y: [0, -18, 0],
            x: [0, 10, -6, 0],
            rotate: [0, 1.5, -1, 0],
          }}
          exit={{ opacity: 0, scale: 0.7, rotate: 3 }}
          transition={{
            opacity: { duration: 1, ease: 'easeOut' },
            scale: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
            x: { duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2 },
            rotate: { duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 },
          }}
        >
          <div style={{ opacity: 0.18 }}>
            <Illust size={500} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Page Transition Wrapper ─────────────────────────── */
function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Topbar ──────────────────────────────────────────── */
function Topbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="sticky top-0 z-20 flex items-center justify-between px-6"
      style={{
        height: 64,
        background: 'rgba(255, 248, 240, 0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-3">
        <motion.div 
          className="w-2 h-2 rounded-full bg-sage-400"
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-xs font-mono font-semibold text-dusk">
          Study &middot; Hire &middot; Improve
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-display text-sm font-bold gradient-text-warm">
          reBorn_i
        </span>
      </div>
    </motion.header>
  );
}

/* ── Main Layout ─────────────────────────────────────── */
export default function Layout() {
  return (
    <div className="h-full flex" style={{ background: 'var(--bg)' }}>
      <FloatingBlobs />
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ marginLeft: 240 }}>
        <Topbar />
        <main className="flex-1 overflow-y-auto relative z-10">
          {/* Route-aware background character */}
          <BackgroundIllustration />
          <div className="max-w-7xl mx-auto px-8 py-8 relative z-10">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
