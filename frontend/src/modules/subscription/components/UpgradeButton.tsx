import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

interface UpgradeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  label?: string;
  loadingText?: string;
}

export default function UpgradeButton({
  loading = false,
  label = 'Unlock for ₹9',
  loadingText = 'Opening Razorpay...',
  className = '',
  disabled,
  ...props
}: UpgradeButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(245,166,35,0.28)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 ${className}`}
      style={{ background: 'linear-gradient(135deg, #F5A623, #FF8C42)' }}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
      {loading ? loadingText : label}
      {!loading && <ArrowRight className="w-4 h-4" />}
    </button>
  );
}
