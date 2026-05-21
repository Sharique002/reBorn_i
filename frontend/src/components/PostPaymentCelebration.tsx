// ═══════════════════════════════════════════════════════════
// reBorn_i — Post-Payment Celebration Overlay
// Shown after successful Razorpay payment verification
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { ConfettiBurst } from './Animations';

interface PostPaymentCelebrationProps {
  show: boolean;
  onDismiss?: () => void;
}

export default function PostPaymentCelebration({ show, onDismiss }: PostPaymentCelebrationProps) {
  const [visible, setVisible] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const onDismissRef = useRef(onDismiss);

  // Keep ref in sync without triggering effect
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // Trigger confetti slightly after mount
      const confettiTimer = setTimeout(() => setConfetti(true), 300);
      // Auto-dismiss after 3.5 seconds
      const dismissTimer = setTimeout(() => {
        setVisible(false);
        setConfetti(false);
        onDismissRef.current?.();
      }, 3500);
      return () => {
        clearTimeout(confettiTimer);
        clearTimeout(dismissTimer);
      };
    } else {
      setVisible(false);
      setConfetti(false);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-bark/30 backdrop-blur-sm"
          onClick={() => {
            setVisible(false);
            setConfetti(false);
            onDismiss?.();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="relative mx-4 max-w-sm rounded-3xl border border-green-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(90,158,90,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confetti burst */}
            <ConfettiBurst show={confetti} />

            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50"
            >
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Premium Unlocked
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-display text-xl font-black text-bark"
            >
              Full Hiring Intelligence Unlocked
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-2 text-sm leading-relaxed text-dusk"
            >
              All premium insights, simulations, and action plans are now available.
              Your dashboard has been updated.
            </motion.p>

            {/* Animated glow ring */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(90,158,90,0)',
                  '0 0 0 4px rgba(90,158,90,0.15)',
                  '0 0 0 0 rgba(90,158,90,0)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
