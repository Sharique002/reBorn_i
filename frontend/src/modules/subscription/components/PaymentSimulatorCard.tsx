import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import { useSubscriptionStore } from '../store';

export default function PaymentSimulatorCard() {
  const mockOrder = useSubscriptionStore((state) => state.mockOrder);
  const simulateSuccess = useSubscriptionStore((state) => state.simulateSuccess);
  const simulateCancel = useSubscriptionStore((state) => state.simulateCancel);
  const status = useSubscriptionStore((state) => state.status);
  
  const [loading, setLoading] = useState(false);

  if (!mockOrder) return null;

  const handleSimulateSuccess = async () => {
    setLoading(true);
    try {
      await simulateSuccess();
    } catch (err) {
      // Error handled by store
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateCancel = () => {
    simulateCancel();
  };

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: mockOrder.currency,
  }).format(mockOrder.amount / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-md overflow-hidden rounded-3xl border border-amber-200/50 bg-gradient-to-b from-amber-50/80 to-white p-6 shadow-2xl backdrop-blur-md"
    >
      {/* Header Banner */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-amber-500/10 p-3.5 text-amber-800 border border-amber-200/30">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 animate-pulse" />
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Development Simulator</p>
          <p className="text-[11px] font-medium leading-normal text-amber-850">
            Razorpay API initialization was bypassed. This sandbox mock flow is active in local development.
          </p>
        </div>
      </div>

      {/* Brand & Security Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col text-left">
          <span className="font-display text-xl font-bold tracking-tight text-slate-800">
            reBorn<span className="text-amber-500">_i</span>
          </span>
          <span className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">Hiring Intelligence</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-100">
          <Shield className="h-3 w-3" />
          Test Transaction
        </div>
      </div>

      {/* Transaction Details */}
      <div className="mb-6 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-left">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold text-slate-500">Amount to Pay</span>
          <span className="font-display text-xl font-black text-slate-850">{formattedAmount}</span>
        </div>
        
        <div className="h-px bg-slate-200/60 my-3" />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold text-slate-400">Order ID</span>
            <span className="font-mono text-[11px] font-semibold text-slate-600 truncate max-w-[200px]" title={mockOrder.order_id}>
              {mockOrder.order_id}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold text-slate-400">Currency</span>
            <span className="text-[11px] font-semibold text-slate-600">{mockOrder.currency}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleSimulateSuccess}
          disabled={loading || status === 'confirming'}
          className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/10 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          {loading || status === 'confirming' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying mock transaction...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>Simulate Successful Payment</span>
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSimulateCancel}
            disabled={loading || status === 'confirming'}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50/50 px-3 py-3 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100/60 active:scale-[0.98] disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Simulate Fail
          </button>
          
          <button
            onClick={handleSimulateCancel}
            disabled={loading || status === 'confirming'}
            className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <p className="mt-4 text-[10px] text-center text-slate-400">
        This is a local sandbox environment. No actual funds will be transferred.
      </p>
    </motion.div>
  );
}
