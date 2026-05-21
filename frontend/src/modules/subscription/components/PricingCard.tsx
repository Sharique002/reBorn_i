import { motion } from 'framer-motion';
import { Crown, ShieldCheck } from 'lucide-react';
import FeatureList from './FeatureList';
import UpgradeButton from './UpgradeButton';

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlight?: boolean;
  current?: boolean;
  loading?: boolean;
  badge?: string;
  ctaLabel?: string;
  priceSuffix?: string;
  disabled?: boolean;
  onUpgrade?: () => void;
}

export default function PricingCard({
  name,
  price,
  description,
  features,
  highlight = false,
  current = false,
  loading = false,
  badge,
  ctaLabel,
  priceSuffix,
  disabled = false,
  onUpgrade,
}: PricingCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`relative rounded-2xl border bg-white p-6 shadow-sm transition-all ${
        highlight
          ? 'border-warm-300 shadow-[0_24px_70px_rgba(245,166,35,0.20)] ring-1 ring-warm-200/70'
          : 'border-warm-100'
      }`}
    >
      {highlight && (
        <motion.div
          animate={{ boxShadow: ['0 0 0 rgba(245,166,35,0)', '0 0 22px rgba(245,166,35,0.35)', '0 0 0 rgba(245,166,35,0)'] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full border border-warm-200 bg-warm-50 px-3 py-1 text-xs font-black text-warm-700"
        >
          <Crown className="w-3.5 h-3.5" />
          {badge || 'MOST POPULAR'}
        </motion.div>
      )}

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-bark">{name}</h3>
          <p className="mt-1 text-sm text-dusk">{description}</p>
        </div>
        {current && (
          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            Active
          </span>
        )}
      </div>

      <div className="mb-6">
        <span className="font-display text-4xl font-black text-bark">{price}</span>
        {priceSuffix && <span className="ml-1 text-sm font-semibold text-dusk">{priceSuffix}</span>}
      </div>

      <FeatureList features={features} />

      <div className="mt-6">
        {highlight ? (
          <UpgradeButton
            className="w-full"
            loading={loading}
            onClick={onUpgrade}
            disabled={current || disabled}
            label={current ? 'Unlocked' : ctaLabel || 'Unlock Now'}
          />
        ) : (
          <button
            type="button"
            disabled={disabled || current}
            onClick={onUpgrade}
            className="w-full rounded-xl border border-warm-200 bg-warm-50 px-4 py-3 text-sm font-bold text-dusk transition-colors hover:bg-warm-100 disabled:hover:bg-warm-50"
          >
            {current ? 'Current Plan' : ctaLabel || 'Go Premium'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
