// ═══════════════════════════════════════════════════════════
// reBorn_i — Paywall Overlay
// Displays premium content unlock prompt
// ═══════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import AnimatedButton from './AnimatedButton';

interface PaywallOverlayProps {
  isProcessing?: boolean;
}

const premiumFeatures = [
  'Detailed diagnosis of your hiring bottlenecks',
  'Strategic roadmap to overcome rejections',
  'Personalized improvement actions',
  'Instant unlock - lifetime access',
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export function PaywallOverlay({ isProcessing = false }: PaywallOverlayProps) {
  const { startPayment, error, clearError } = useSubscription();
  const [showError, setShowError] = useState(false);

  const handleUnlock = async () => {
    try {
      clearError();
      await startPayment();
    } catch (err: any) {
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl backdrop-blur-sm p-4 z-40"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,166,35,0.02))',
        }}
      >
        {/* Lock Icon */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-warm-100 to-amber-100 flex items-center justify-center">
            <Lock className="w-7 h-7 text-warm-600" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div variants={itemVariants} className="text-center mb-2">
          <h3 className="text-xl font-display font-bold text-bark">
            Unlock Full Hiring Report
          </h3>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-sm text-dusk text-center mb-5 leading-relaxed"
        >
          See exactly why you're getting rejected and get personalized improvement strategies.
        </motion.p>

        {/* Features List */}
        <motion.div variants={itemVariants} className="space-y-3 mb-6">
          {premiumFeatures.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="flex items-start gap-2.5"
            >
              <div className="w-5 h-5 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-warm-500" />
              </div>
              <p className="text-sm text-bark leading-snug">{feature}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Price Section */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-warm-50 to-amber-50 rounded-2xl p-4 mb-5 border border-warm-200"
        >
          <div className="text-center">
            <p className="text-xs font-semibold text-dusk uppercase tracking-wider mb-1">
              Special Offer
            </p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-display font-bold text-bark">₹9</span>
              <span className="text-sm text-dusk">/lifetime</span>
            </div>
            <p className="text-[11px] text-dusk mt-1">One-time payment. Never expires.</p>
          </div>
        </motion.div>

        {/* Error Message */}
        {showError && error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4 text-xs text-rose-600"
          >
            {error}
          </motion.div>
        )}

        {/* Unlock Button */}
        <motion.div variants={itemVariants}>
          <AnimatedButton
            onClick={handleUnlock}
            loading={isProcessing}
            loadingText="Opening Razorpay..."
            variant="primary"
            className="w-full group"
            ripple={true}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Unlock for ₹9
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </AnimatedButton>
        </motion.div>

        {/* Footer Text */}
        <motion.p
          variants={itemVariants}
          className="text-[10px] text-dusk text-center mt-4"
        >
          Secure payment powered by <span className="font-semibold">Razorpay</span>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

export default PaywallOverlay;
