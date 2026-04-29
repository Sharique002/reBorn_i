// ═══════════════════════════════════════════════════════════
// reBorn_i — Subscription Context
// Manages user subscription state and payment flow
// ═══════════════════════════════════════════════════════════

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { paymentAPI } from '../api/client';
import { useAuth } from './AuthContext';
import type { PaymentVerifyRequest } from '../types';

interface SubscriptionState {
  isPro: boolean;
  isProcessing: boolean;
  error: string | null;
  startPayment: () => Promise<void>;
  verifyAndUpgrade: (payment_id: string, signature: string) => Promise<void>;
  refetchUserStatus: () => Promise<void>;
  clearError: () => void;
}

const SubscriptionContext = createContext<SubscriptionState | undefined>(undefined);

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = user?.subscription_plan === 'pro';

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refetchUserStatus = useCallback(async () => {
    try {
      // Trigger a refetch from AuthContext by calling me() endpoint
      // This will update the user state with the latest subscription status
      const { authAPI } = await import('../api/client');
      await authAPI.me();
    } catch (err: any) {
      console.error('Failed to refetch user status:', err);
      setError('Failed to verify subscription status');
    }
  }, []);

  const verifyAndUpgrade = useCallback(
    async (payment_id: string, signature: string) => {
      setIsProcessing(true);
      setError(null);

      try {
        const { data } = await paymentAPI.verifyPayment(payment_id, signature);

        if (data.success) {
          // Small delay to ensure backend has committed the change
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Refetch user to get updated subscription status
          await refetchUserStatus();

          setIsProcessing(false);
          return;
        }

        throw new Error(data.message || 'Payment verification failed');
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.detail ||
          err.message ||
          'Payment verification failed. Please try again.';
        setError(errorMsg);
        setIsProcessing(false);
        throw new Error(errorMsg);
      }
    },
    [refetchUserStatus]
  );

  const startPayment = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Create order on backend
      const { data: orderData } = await paymentAPI.createOrder();

      // Step 2: Verify Razorpay SDK is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded');
      }

      // Step 3: Open Razorpay modal
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY;

      if (!razorpayKey) {
        throw new Error('Razorpay key not configured');
      }

      const options = {
        key: razorpayKey,
        order_id: orderData.order_id,
        amount: orderData.amount * 100, // Convert rupees to paisa
        currency: 'INR',
        name: 'reBorn_i',
        description: 'Unlock Premium Hiring Report Access',
        handler: async (response: any) => {
          try {
            // User completed payment - now verify
            await verifyAndUpgrade(
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            setIsProcessing(false);
          } catch (err: any) {
            setError(err.message || 'Payment verification failed');
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setError('Payment cancelled');
          },
        },
        prefill: {
          email: user.email,
          name: user.full_name || user.email,
        },
        theme: {
          color: '#F5A623',
        },
        retry: {
          enabled: false,
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response: any) => {
        setIsProcessing(false);
        setError(`Payment failed: ${response.error.description}`);
      });

      rzp.open();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to initiate payment';
      setError(errorMsg);
      setIsProcessing(false);
      throw new Error(errorMsg);
    }
  }, [user, verifyAndUpgrade]);

  if (authLoading) {
    return <>{children}</>;
  }

  return (
    <SubscriptionContext.Provider
      value={{
        isPro,
        isProcessing,
        error,
        startPayment,
        verifyAndUpgrade,
        refetchUserStatus,
        clearError,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error(
      'useSubscription must be used within SubscriptionProvider'
    );
  }
  return ctx;
}
