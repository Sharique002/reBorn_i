// ═══════════════════════════════════════════════════════════
// reBorn_i — Premium Conversion Card
// High-converting upgrade card for free users on Dashboard
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Lock,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { AnimatedCounter, AnimatedProgressBar } from './Animations';
import { useSubscription } from '../modules/subscription';
import UpgradeButton from '../modules/subscription/components/UpgradeButton';

const LOCKED_FEATURES = [
  'Full ATS Diagnosis',
  'Recruiter-Level Insights',
  'Skill Gap Detection',
  'Career Pivot Analysis',
  'Personalized Roadmap',
  'Resume Optimization',
];

export default function PremiumConversionCard() {
  const { isPro, startUpgrade, isProcessing, error, clearError, status } = useSubscription();
  const [localError, setLocalError] = useState<string | null>(null);

  if (isPro) return null;

  const handleUnlock = async () => {
    setLocalError(null);
    clearError();
    try {
      await startUpgrade();
    } catch (err: any) {
      setLocalError(err?.message || 'Payment could not be completed. Please retry.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl border border-warm-200 bg-white shadow-[0_8px_40px_rgba(245,166,35,0.08)]"
    >
      {/* Background decorative elements */}
      <motion.div
        className="absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl"
        style={{ background: 'rgba(245,166,35,0.06)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(139,92,246,0.04)' }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <motion.div
            animate={{ boxShadow: ['0 0 0 rgba(245,166,35,0)', '0 0 20px rgba(245,166,35,0.25)', '0 0 0 rgba(245,166,35,0)'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-warm-50"
          >
            <Sparkles className="h-6 w-6 text-warm-600" />
          </motion.div>
          <div>
            <h3 className="font-display text-xl font-black text-bark">
              Your Full Hiring Report Is Ready
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-dusk">
              See exactly why you're getting rejected and how to improve your interview probability.
            </p>
          </div>
        </div>

        {/* Visual Comparison */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-bark">Current Probability</span>
              <span className="font-display text-xl font-black text-rose-600">
                <AnimatedCounter value={27} decimals={0} suffix="%" />
              </span>
            </div>
            <AnimatedProgressBar value={27} color="#E84565" height={10} delay={0.2} />
          </div>
          <div className="rounded-2xl border border-green-100 bg-green-50/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-bark">Potential Improved</span>
              <span className="font-display text-xl font-black text-green-600">
                <AnimatedCounter value={46} decimals={0} suffix="%" />
              </span>
            </div>
            <AnimatedProgressBar value={46} color="#5A9E5A" height={10} delay={0.35} />
          </div>
        </div>

        {/* Insight message */}
        <div className="mb-6 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
          <div className="flex items-start gap-2">
            <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600" />
            <p className="text-sm font-semibold text-bark">
              You are missing insights that could improve your interview probability by{' '}
              <span className="text-green-600">19%</span>.
            </p>
          </div>
        </div>

        {/* Locked Features Grid */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-black uppercase tracking-wider text-dusk">What you'll unlock</p>
          <div className="grid grid-cols-2 gap-2">
            {LOCKED_FEATURES.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 rounded-xl border border-warm-100 bg-warm-50/50 px-3 py-2 text-xs font-semibold text-bark"
              >
                <Lock className="h-3 w-3 flex-shrink-0 text-warm-400" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Error display */}
        {(localError || error) && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* CTA Section */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <UpgradeButton
            className="flex-1 glow-warm"
            loading={isProcessing}
            onClick={handleUnlock}
            label="Unlock Full Report for ₹9"
          />
          <Link
            to="/pricing"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm font-bold text-bark transition-colors hover:bg-warm-50"
          >
            View Plans <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Payment info */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <CreditCard className="h-3 w-3" />
          UPI • Cards • NetBanking • Instant Unlock • Takes less than 10 seconds
        </div>

        {/* Social Proof */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-warm-100 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-dusk">
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            Most users improve by 20–40%
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-dusk">
            <Users className="h-3.5 w-3.5 text-sky-500" />
            Used by 12K+ candidates
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-dusk">
            <Zap className="h-3.5 w-3.5 text-violet-500" />
            Unlock complete hiring intelligence
          </div>
        </div>
      </div>
    </motion.div>
  );
}
