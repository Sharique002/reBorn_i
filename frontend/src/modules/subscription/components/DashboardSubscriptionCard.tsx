import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CreditCard,
  LockKeyhole,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { AnimatedProgressBar, AnimatedCounter } from '../../../components/Animations';
import { useSubscription } from '../SubscriptionProvider';
import UpgradeButton from './UpgradeButton';

export default function DashboardSubscriptionCard() {
  const { plan, startUpgrade, isProcessing, error, clearError } = useSubscription();
  const [localError, setLocalError] = useState<string | null>(null);
  const isPro = plan === 'pro';

  const handleUnlock = async () => {
    setLocalError(null);
    clearError();
    try {
      await startUpgrade();
    } catch (err: any) {
      setLocalError(err?.message || 'Payment could not be completed. Please retry.');
    }
  };

  if (isPro) {
    return (
      <motion.div
        whileHover={{ y: -3 }}
        className="rounded-3xl border border-green-100 bg-green-50/50 p-5 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-green-100">
            <Sparkles className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-bark">Pro intelligence active</p>
            <p className="text-sm text-dusk">Diagnosis, skill gaps, simulations, and action plans are unlocked.</p>
          </div>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #5A9E5A, #468246)' }}
          >
            View plan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="relative overflow-hidden rounded-3xl border border-warm-200 bg-white p-6 shadow-[0_4px_24px_rgba(245,166,35,0.08)]"
    >
      {/* Background decoration */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-warm-100/30 blur-2xl" />

      <div className="relative z-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <motion.div
              animate={{ boxShadow: ['0 0 0 rgba(245,166,35,0)', '0 0 14px rgba(245,166,35,0.2)', '0 0 0 rgba(245,166,35,0)'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-warm-50 text-warm-600"
            >
              <LockKeyhole className="h-6 w-6" />
            </motion.div>
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-black text-bark">
                Your Full Hiring Report Is Ready
                <span className="rounded-full border border-warm-200 bg-warm-50 px-2 py-0.5 text-[10px] text-warm-700">₹9</span>
              </div>
              <p className="text-sm text-dusk">
                See exactly why you're getting rejected and how to improve your interview probability.
              </p>
            </div>
          </div>
        </div>

        {/* Visual comparison */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-bold text-bark">Current</span>
              <span className="font-display text-lg font-black text-rose-600">
                <AnimatedCounter value={27} decimals={0} suffix="%" />
              </span>
            </div>
            <AnimatedProgressBar value={27} color="#E84565" height={6} delay={0.1} />
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50/50 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-bold text-bark">After Optimization</span>
              <span className="font-display text-lg font-black text-green-600">
                <AnimatedCounter value={46} decimals={0} suffix="%" />
              </span>
            </div>
            <AnimatedProgressBar value={46} color="#5A9E5A" height={6} delay={0.25} />
          </div>
        </div>

        {/* Insight */}
        <p className="mt-3 text-xs font-semibold text-dusk">
          You are missing insights that could improve your interview probability by <span className="text-green-600">19%</span>.
        </p>

        {/* Error */}
        {(localError || error) && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <UpgradeButton loading={isProcessing} onClick={handleUnlock} label="Unlock Now" className="flex-1" />
          <Link
            to="/pricing"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm font-bold text-bark transition-colors hover:bg-warm-50"
          >
            View Plans <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-warm-100 pt-3">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-dusk">
            <TrendingUp className="h-3 w-3 text-green-500" /> 20–40% avg improvement
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-dusk">
            <Users className="h-3 w-3 text-sky-500" /> 12K+ candidates
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-dusk">
            <CreditCard className="h-3 w-3 text-warm-400" /> UPI · Cards · NetBanking
          </span>
        </div>
      </div>
    </motion.div>
  );
}
