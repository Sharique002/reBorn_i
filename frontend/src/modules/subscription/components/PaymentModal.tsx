import { AnimatePresence, motion } from 'framer-motion';
import { useSubscriptionStore } from '../store';
import PaywallOverlay from './PaywallOverlay';
import PaymentSimulatorCard from './PaymentSimulatorCard';

/**
 * Global payment modal that shows whenever:
 * - User clicks "Unlock" and Razorpay is opening
 * - Payment is being verified
 * - Dev bypass is processing
 */
export default function PaymentModal() {
  const status = useSubscriptionStore((state) => state.status);
  const mockOrder = useSubscriptionStore((state) => state.mockOrder);
  const isPro = useSubscriptionStore((state) => state.plan === 'pro');

  // Don't show modal if already pro
  if (isPro) return null;

  // Show modal only when payment is in progress
  const isPaymentActive = ['loading', 'redirecting', 'confirming'].includes(status);

  return (
    <AnimatePresence>
      {isPaymentActive && (
        <motion.div
          key="payment-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          {mockOrder ? (
            <PaymentSimulatorCard />
          ) : (
            <PaywallOverlay isProcessing={true} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
