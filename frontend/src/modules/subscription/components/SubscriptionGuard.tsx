import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSubscription } from '../SubscriptionProvider';
import type { FeatureGate, SubscriptionFeature } from '../types';
import PaywallOverlay from './PaywallOverlay';

interface SubscriptionGuardProps {
  children: ReactNode;
  feature?: SubscriptionFeature;
  requiresPro?: boolean;
  locked?: boolean;
  fallback?: ReactNode;
  featureName?: string;
  upgradeMessage?: string;
}

export default function SubscriptionGuard({
  children,
  feature = 'diagnosis',
  requiresPro = false,
  locked,
  fallback,
  featureName,
  upgradeMessage,
}: SubscriptionGuardProps) {
  const { isPro, getFeatureGate, isProcessing, status } = useSubscription();
  const gate: FeatureGate = {
    ...getFeatureGate(feature),
    ...(featureName ? { featureName } : {}),
    ...(upgradeMessage ? { upgradeMessage } : {}),
  };
  const isLocked = locked ?? ((requiresPro || gate.isLocked) && !isPro);

  // Track if we just unlocked (transition from locked → unlocked)
  const [wasLocked, setWasLocked] = useState(isLocked);
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    if (wasLocked && !isLocked) {
      // Just unlocked — show reveal animation
      setShowReveal(true);
      const timer = setTimeout(() => setShowReveal(false), 800);
      return () => clearTimeout(timer);
    }
    setWasLocked(isLocked);
  }, [isLocked, wasLocked]);

  if (!isLocked) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="unlocked"
          initial={showReveal ? { opacity: 0, scale: 0.97 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  const activeGate = { ...gate, isLocked: true };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="locked"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="relative min-h-[260px]"
      >
        <div className="pointer-events-none select-none opacity-50 blur-[2px]">
          {children}
        </div>
        <PaywallOverlay feature={feature} gate={activeGate} isProcessing={isProcessing} />
        {fallback && <div className="absolute inset-0 z-50">{fallback}</div>}
      </motion.div>
    </AnimatePresence>
  );
}
