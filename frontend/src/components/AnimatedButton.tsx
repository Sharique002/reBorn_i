// ═══════════════════════════════════════════════════════════
// reBorn_i — Animated Button with Loader, Ripple & Success
// ═══════════════════════════════════════════════════════════

import { useState, useRef, type MouseEvent, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Ripple Effect ──────────────────────────────────────── */

interface Ripple {
  id: number;
  x: number;
  y: number;
}

function RippleLayer({ ripples }: { ripples: Ripple[] }) {
  return (
    <span className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ scale: 0, opacity: 0.45 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="absolute rounded-full bg-white/30"
            style={{
              left: r.x - 10,
              top: r.y - 10,
              width: 20,
              height: 20,
            }}
          />
        ))}
      </AnimatePresence>
    </span>
  );
}

/* ── Dot Loader ─────────────────────────────────────────── */

function DotLoader() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  );
}

/* ── Spinner Loader ─────────────────────────────────────── */

function SpinnerLoader({ size = 18 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.25"
      />
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        animate={{ strokeDashoffset: [62.8, 0] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </motion.svg>
  );
}

/* ── Success Check ──────────────────────────────────────── */

function SuccessCheck({ size = 18 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4 }}
      />
      <motion.path
        d="M8 12.5l2.5 2.5 5.5-5.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      />
    </motion.svg>
  );
}

/* ── Animated Button ────────────────────────────────────── */

export type ButtonState = 'idle' | 'loading' | 'success' | 'error';
export type LoaderStyle = 'dots' | 'spinner';

interface AnimatedButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  children: ReactNode;
  loading?: boolean;
  success?: boolean;
  loadingText?: string;
  successText?: string;
  loaderStyle?: LoaderStyle;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary';
  ripple?: boolean;
  /** Extra framer-motion whileHover / whileTap values */
  hoverScale?: number;
  tapScale?: number;
}

export default function AnimatedButton({
  children,
  loading = false,
  success = false,
  loadingText,
  successText = 'Done!',
  loaderStyle = 'spinner',
  icon,
  variant = 'primary',
  ripple = true,
  hoverScale = 1.02,
  tapScale = 0.97,
  className = '',
  disabled,
  onClick,
  ...rest
}: AnimatedButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (ripple && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const newRipple: Ripple = {
        id: nextId.current++,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setRipples((prev) => [...prev, newRipple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 800);
    }
    onClick?.(e);
  };

  const state: ButtonState = success ? 'success' : loading ? 'loading' : 'idle';
  const isDisabled = disabled || loading || success;

  const baseClass =
    variant === 'primary'
      ? 'btn-primary'
      : 'btn-secondary';

  return (
    <motion.button
      ref={btnRef}
      whileHover={isDisabled ? undefined : { scale: hoverScale }}
      whileTap={isDisabled ? undefined : { scale: tapScale }}
      disabled={isDisabled}
      onClick={handleClick}
      className={`${baseClass} relative flex items-center justify-center gap-2 ${className}`}
      {...rest}
    >
      {ripple && <RippleLayer ripples={ripples} />}

      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-2"
          >
            {icon}
            {children}
          </motion.span>
        )}

        {state === 'loading' && (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-2"
          >
            {loaderStyle === 'spinner' ? <SpinnerLoader /> : <DotLoader />}
            {loadingText || children}
          </motion.span>
        )}

        {state === 'success' && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2"
          >
            <SuccessCheck />
            {successText}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Shine sweep on hover */}
      <span className="animated-btn-shine" />
    </motion.button>
  );
}

export { SpinnerLoader, DotLoader, SuccessCheck };
