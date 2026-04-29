// ═══════════════════════════════════════════════════════════
// reBorn_i — Subscription Guard
// HOC wrapper that shows paywall overlay for locked content
// ═══════════════════════════════════════════════════════════

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { PaywallOverlay } from './PaywallOverlay';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiresPro?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Subscription Guard: Wraps content and shows paywall if user needs upgrade
 *
 * @param children - Content to protect
 * @param requiresPro - If true and user is free, show paywall
 * @param fallback - Optional fallback UI if user is free
 */
export function SubscriptionGuard({
  children,
  requiresPro = false,
  fallback,
}: SubscriptionGuardProps) {
  const { isPro, isProcessing } = useSubscription();
  const { user } = useAuth();

  // If pro or no requirement, show children
  if (!requiresPro || isPro) {
    return <>{children}</>;
  }

  // User is free and requires pro - show paywall
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {/* Blurred content underneath */}
        <div className="opacity-40 pointer-events-none">
          {children}
        </div>

        {/* Paywall overlay */}
        <PaywallOverlay isProcessing={isProcessing} />

        {/* Fallback UI if provided */}
        {fallback && (
          <div className="absolute inset-0 flex items-center justify-center">
            {fallback}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default SubscriptionGuard;
