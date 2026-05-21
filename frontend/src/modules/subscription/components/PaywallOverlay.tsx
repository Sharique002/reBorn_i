import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, CreditCard, Lock, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { useSubscription } from '../SubscriptionProvider';
import type { FeatureGate, SubscriptionFeature } from '../types';
import UpgradeButton from './UpgradeButton';

const LOCKED_FEATURES = [
  'ATS diagnosis',
  'Recruiter-level insights',
  'Skill gap detection',
  'Career pivot analysis',
  'Personalized roadmap',
  'Resume optimization',
];

interface PaywallOverlayProps {
  feature?: SubscriptionFeature;
  gate?: FeatureGate;
  isProcessing?: boolean;
}

export default function PaywallOverlay({ feature = 'diagnosis', gate, isProcessing }: PaywallOverlayProps) {
  const { error, clearError, getFeatureGate, startUpgrade, status } = useSubscription();
  const [localError, setLocalError] = useState<string | null>(null);
  const activeGate = gate || getFeatureGate(feature);
  const processing = isProcessing ?? ['loading', 'redirecting'].includes(status);

  const handleUnlock = async () => {
    setLocalError(null);
    clearError();
    try {
      await startUpgrade(feature);
    } catch (err: any) {
      setLocalError(err?.message || 'Checkout could not be started. Please retry.');
    }
  };

  if (status === 'confirming') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl bg-bark/20 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center w-full max-w-sm rounded-2xl border border-warm-100 bg-white p-8 shadow-2xl text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-sky-600">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h3 className="font-display text-xl font-bold text-bark">Verifying Payment</h3>
          <p className="mt-2 text-sm text-dusk">
            Please wait while we confirm your payment and unlock your premium features.
            Do not close this window.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl bg-bark/20 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="w-full max-w-md rounded-2xl border border-warm-100 bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex justify-center">
          <motion.div
            animate={{ boxShadow: ['0 0 0 rgba(245,166,35,0)', '0 0 16px rgba(245,166,35,0.25)', '0 0 0 rgba(245,166,35,0)'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warm-50 text-warm-600"
          >
            <Lock className="h-7 w-7" />
          </motion.div>
        </div>

        <div className="mb-4 text-center">
          <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-warm-200 bg-warm-50 px-2.5 py-1 text-xs font-bold text-warm-700">
            <Sparkles className="h-3.5 w-3.5" />
            Pro insight
          </div>
          <h3 className="font-display text-xl font-bold text-bark">Unlock Full Hiring Intelligence</h3>
          <p className="mt-2 text-sm leading-relaxed text-dusk">
            {activeGate.upgradeMessage || "See exactly why you're getting rejected and how to improve."}
          </p>
        </div>

        {/* Locked features list */}
        <div className="mb-5 space-y-1.5">
          {LOCKED_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-bark">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-warm-400" />
              {f}
            </div>
          ))}
        </div>

        {(localError || error) && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          {(localError || error) ? (
            <button
              onClick={handleUnlock}
              disabled={processing}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm font-bold text-bark transition-colors hover:bg-warm-50"
            >
              <RefreshCw className="h-4 w-4" /> Retry Payment
            </button>
          ) : (
            <UpgradeButton className="flex-1" loading={processing} onClick={handleUnlock} label="Unlock Full Report for ₹9" />
          )}
          <Link
            to="/pricing"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm font-bold text-bark transition-colors hover:bg-warm-50"
          >
            View plans <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <CreditCard className="h-3 w-3" />
            UPI • Cards • NetBanking
          </div>
          <p className="text-[11px] text-muted">Instant Unlock • Takes less than 10 seconds</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
