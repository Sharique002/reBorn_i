import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { AnimatedCounter } from '../../../components/Animations';
import { useSubscription } from '../SubscriptionProvider';
import PricingCard from '../components/PricingCard';
import UpgradeButton from '../components/UpgradeButton';

const freeFeatures = [
  'Basic Interview Probability',
  'Limited Pipeline Insights',
  '1 Free Analysis',
];

const unlockFeatures = [
  'Full Hiring Report',
  'ATS Diagnosis',
  'Recruiter Analysis',
  'Skill Gap Detection',
  'Action Plan',
  'Career Pivot Insights',
];

const careerProFeatures = [
  'Unlimited Simulations',
  'Resume Tracking',
  'Interview Readiness',
  'Market Intelligence',
  'Priority Analysis',
];

const statCards = [
  { label: 'Average Improvement', value: 38, prefix: '+', suffix: '%', icon: TrendingUp, color: '#5A9E5A' },
  { label: 'Candidates Analyzed', value: 12, suffix: 'K+', icon: ShieldCheck, color: '#0EA5E9' },
  { label: 'ATS → Recruiter → Market Simulation', value: 3, suffix: ' layers', icon: BarChart3, color: '#8B5CF6' },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

export default function PricingPage() {
  const { plan, error, status, clearError, startUpgrade } = useSubscription();
  const [notice, setNotice] = useState<string | null>(null);
  const isProcessing = ['loading', 'redirecting', 'confirming'].includes(status);

  const banner = useMemo(() => {
    if (isProcessing) {
      return {
        icon: Loader2,
        className: 'border-sky-200 bg-sky-50 text-sky-700',
        text: status === 'confirming' ? 'Verifying payment...' : 'Opening Razorpay checkout...',
        spin: true,
      };
    }
    if (status === 'success' || plan === 'pro') {
      return {
        icon: CheckCircle2,
        className: 'border-green-200 bg-green-50 text-green-700',
        text: 'Premium access is active. Your full hiring intelligence is unlocked.',
        spin: false,
      };
    }
    if (notice || error) {
      return {
        icon: AlertCircle,
        className: 'border-amber-200 bg-amber-50 text-amber-700',
        text: notice || error,
        spin: false,
      };
    }
    return null;
  }, [error, isProcessing, notice, plan, status]);

  const handleUnlock = async () => {
    setNotice(null);
    clearError();
    try {
      await startUpgrade('diagnosis');
      setNotice('Payment verified. Premium report unlocked.');
    } catch (err: any) {
      setNotice(err?.message || 'Payment could not be completed. Please retry.');
    }
  };

  const BannerIcon = banner?.icon;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-8"
    >
      <motion.section
        variants={sectionVariants}
        className="relative overflow-hidden rounded-3xl border border-warm-100 bg-white p-7 shadow-sm md:p-10"
      >
        <motion.div
          className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-warm-200/30 blur-3xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-sky-200/20 blur-3xl"
          animate={{ y: [0, -10, 0], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-warm-200 bg-warm-50 px-3 py-1 text-xs font-black text-warm-700">
              <Sparkles className="h-3.5 w-3.5" />
              Hiring Intelligence Pro
            </div>
            <h1 className="font-display text-3xl font-black leading-tight text-bark md:text-5xl">
              Unlock Your Full Hiring Intelligence
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-dusk md:text-lg">
              See exactly why you're getting rejected and how to improve your interview probability.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <UpgradeButton loading={isProcessing} onClick={handleUnlock} label="Unlock Full Report for ₹9" />
              <Link to="/pipeline" className="inline-flex items-center justify-center gap-2 rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm font-bold text-bark transition-colors hover:bg-warm-50">
                View free pipeline <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-2xl border border-warm-100 bg-white/80 p-5 shadow-[0_20px_60px_rgba(45,42,50,0.08)] backdrop-blur"
          >
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-bark">
              <WalletCards className="h-4 w-4 text-warm-500" />
              Razorpay Secure Checkout
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-dusk">
              {['UPI', 'Cards', 'NetBanking'].map((method) => (
                <div key={method} className="rounded-xl border border-warm-100 bg-warm-50 px-3 py-2">
                  {method}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {banner && BannerIcon && (
        <motion.div variants={sectionVariants} className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${banner.className}`}>
          <BannerIcon className={`h-4 w-4 ${banner.spin ? 'animate-spin' : ''}`} />
          <span>{banner.text}</span>
        </motion.div>
      )}

      <motion.section variants={sectionVariants} className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-warm-100 bg-white p-5 shadow-sm transition-all"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${stat.color}14` }}>
                <Icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
              <div className="font-display text-2xl font-black" style={{ color: stat.color }}>
                {stat.prefix}<AnimatedCounter value={stat.value} decimals={0} suffix={stat.suffix} />
              </div>
              <p className="mt-1 text-sm font-semibold text-dusk">{stat.label}</p>
            </motion.div>
          );
        })}
      </motion.section>

      <motion.section variants={sectionVariants} className="grid gap-5 xl:grid-cols-3">
        <PricingCard
          name="Free"
          price="₹0"
          description="A clean first signal for your hiring odds."
          features={freeFeatures}
          current={plan === 'free'}
          ctaLabel="Current Plan"
          disabled
        />
        <PricingCard
          name="Pro Unlock"
          price="₹9"
          description="The complete report that explains what to fix next."
          features={unlockFeatures}
          highlight
          badge="MOST POPULAR"
          current={plan === 'pro'}
          loading={isProcessing}
          ctaLabel="Unlock Now"
          onUpgrade={handleUnlock}
        />
        <PricingCard
          name="Career Pro"
          price="₹499"
          priceSuffix="/month"
          description="For active job searches with continuous optimization."
          features={careerProFeatures}
          ctaLabel="Go Premium"
          onUpgrade={handleUnlock}
        />
      </motion.section>

      <motion.section variants={sectionVariants} className="rounded-3xl border border-warm-100 bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-7 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-700">
              <TrendingUp className="h-3.5 w-3.5" />
              Optimization Preview
            </div>
            <h2 className="font-display text-2xl font-black text-bark">Interview Probability Comparison</h2>
            <p className="mt-2 text-sm leading-relaxed text-dusk">
              Free gives you the signal. Pro shows the exact ATS, recruiter, and market moves that can change the outcome.
            </p>
          </div>

          <div className="space-y-5">
            {[
              { label: 'Current', value: 27, color: '#E84565', bg: 'bg-rose-50', text: 'text-rose-600' },
              { label: 'After Optimization', value: 46, color: '#5A9E5A', bg: 'bg-green-50', text: 'text-green-600' },
            ].map((item, idx) => (
              <div key={item.label} className={`rounded-2xl border border-warm-100 ${item.bg} p-4`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-bark">{item.label}</span>
                  <span className={`font-display text-xl font-black ${item.text}`}>
                    <AnimatedCounter value={item.value} decimals={0} suffix="%" />
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/80">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 0.9, delay: 0.15 + idx * 0.12, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: item.color }}
                  />
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <UpgradeButton loading={isProcessing} onClick={handleUnlock} label="Unlock Full Report for ₹9" />
              <div className="flex items-center gap-2 text-xs font-semibold text-dusk">
                <CreditCard className="h-3.5 w-3.5" />
                UPI • Cards • NetBanking
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
