import { create } from 'zustand';
import { paymentAPI, subscriptionAPI } from '../../api/client';
import type { User } from '../../types';
import { getFeatureGate } from './access';
import type { FeatureGate, PaymentStatus, SubscriptionFeature, SubscriptionPlan } from './types';

type CheckoutStatus = 'idle' | 'loading' | 'redirecting' | 'confirming' | 'success' | 'error';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface SubscriptionStore {
  plan: SubscriptionPlan;
  usageCount: number;
  hasAccess: boolean;
  featureAccess: Partial<Record<SubscriptionFeature, FeatureGate>>;
  status: CheckoutStatus;
  error: string | null;
  lastProvider: string | null;
  user: User | null;
  freeAnalysisUsed: boolean;
  analysisCount: number;
  paymentStatus: PaymentStatus;
  mockOrder: { order_id: string; currency: string; amount: number } | null;
  _mockPromiseHandlers: { resolve: () => void; reject: (err: Error) => void } | null;
  simulateSuccess: () => Promise<void>;
  simulateCancel: () => void;
  syncFromUser: (user: User | null | undefined) => void;
  fetchStatus: () => Promise<void>;
  startUpgrade: (feature?: SubscriptionFeature) => Promise<void>;
  incrementUsage: () => void;
  markFreeAnalysisUsed: () => void;
  clearError: () => void;
  resetStatus: () => void;
  getGate: (feature: SubscriptionFeature) => FeatureGate;
  canAccess: (feature: SubscriptionFeature) => boolean;
  /**
   * Callback set by SubscriptionProvider so the store can trigger
   * an auth-context user refresh after a successful payment.
   */
  _onPaymentSuccess: (() => Promise<void>) | null;
  _setOnPaymentSuccess: (cb: (() => Promise<void>) | null) => void;
}

function normalizePlan(plan: unknown): SubscriptionPlan {
  return plan === 'pro' ? 'pro' : 'free';
}

function readApiError(err: any, fallback: string): string {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.upgradeMessage) return detail.upgradeMessage;
  return err?.message || fallback;
}

/** Map CheckoutStatus → simplified PaymentStatus for external consumers. */
function derivePaymentStatus(status: CheckoutStatus): PaymentStatus {
  switch (status) {
    case 'loading':
    case 'redirecting':
    case 'confirming':
      return 'processing';
    case 'success':
      return 'success';
    case 'error':
      return 'failed';
    default:
      return 'idle';
  }
}

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  const existingScript = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Razorpay checkout failed to load.')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay checkout failed to load. Check your connection and retry.'));
    document.body.appendChild(script);
  });
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  (set, get) => ({
    plan: 'free',
    usageCount: 0,
    hasAccess: false,
    featureAccess: {},
    status: 'idle',
    error: null,
    lastProvider: null,
    user: null,
    freeAnalysisUsed: false,
    analysisCount: 0,
    paymentStatus: 'idle',
    mockOrder: null,
    _mockPromiseHandlers: null,

    simulateSuccess: async () => {
      const state = get();
      if (!state.mockOrder || !state._mockPromiseHandlers) return;

      set({ status: 'confirming', error: null, paymentStatus: 'processing' });
      try {
        const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 9)}`;
        const mockSignature = `sig_mock_${Math.random().toString(36).substring(2, 9)}`;

        const { data } = await paymentAPI.verifyPayment(
          state.mockOrder.order_id,
          mockPaymentId,
          mockSignature
        );

        if (!data.success) {
          throw new Error(data.message || 'Payment verification failed.');
        }

        set({
          plan: normalizePlan(data.subscription_plan),
          hasAccess: true,
          status: 'success',
          error: null,
          paymentStatus: 'success',
          mockOrder: null,
          _mockPromiseHandlers: null,
        });

        await get()._onPaymentSuccess?.();
        state._mockPromiseHandlers.resolve();
      } catch (err: any) {
        const errorMsg = readApiError(err, 'Mock payment verification failed.');
        set({
          status: 'error',
          error: errorMsg,
          paymentStatus: 'failed',
          mockOrder: null,
          _mockPromiseHandlers: null,
        });
        state._mockPromiseHandlers.reject(err);
      }
    },

    simulateCancel: () => {
      const state = get();
      if (!state._mockPromiseHandlers) return;

      state._mockPromiseHandlers.reject(new Error('Payment simulation cancelled by user.'));
      set({
        status: 'error',
        error: 'Payment simulation cancelled.',
        paymentStatus: 'failed',
        mockOrder: null,
        _mockPromiseHandlers: null,
      });
    },

    _onPaymentSuccess: null,
    _setOnPaymentSuccess: (cb) => set({ _onPaymentSuccess: cb }),

    syncFromUser: (user) => {
      if (!user) {
        set({ plan: 'free', usageCount: 0, hasAccess: false, featureAccess: {}, user: null });
        return;
      }
      const plan = normalizePlan(user?.subscription_plan);
      set({ plan, hasAccess: plan === 'pro', user });
    },

    fetchStatus: async () => {
      try {
        const { data } = await subscriptionAPI.status();
        const plan = normalizePlan(data.plan);
        set({
          plan,
          usageCount: Number.isFinite(data.usageCount) ? data.usageCount : 0,
          hasAccess: data.hasAccess || plan === 'pro',
          featureAccess: data.featureAccess || {},
          error: null,
        });
      } catch {
        // fetchStatus failed — fall back to plan already synced from user object.
        // Do NOT override plan here; syncFromUser already set the correct plan
        // from the backend /auth/me response.
      }
    },

    startUpgrade: async (feature) => {
      const state = get();

      // ── Duplicate-click guard ──────────────────────────
      if (['loading', 'redirecting', 'confirming'].includes(state.status)) {
        return; // Already processing — silently ignore
      }

      set({ status: 'loading', error: null, paymentStatus: 'processing' });
      try {
        const user = state.user;
        if (!user) throw new Error('Please sign in before upgrading.');

        // Step 1: Create the payment order first
        const { data: order } = await paymentAPI.createOrder();

        // Step 2: Check if it's a mock order (development flow)
        if (order.order_id && order.order_id.startsWith('order_mock_')) {
          set({
            status: 'redirecting',
            lastProvider: 'simulation',
            paymentStatus: 'processing',
            mockOrder: {
              order_id: order.order_id,
              currency: order.currency || 'INR',
              amount: order.amount,
            },
          });

          await new Promise<void>((resolve, reject) => {
            set({
              _mockPromiseHandlers: { resolve, reject },
            });
          });
          return;
        }

        // Step 3: Otherwise, run the real Razorpay checkout flow
        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY;
        if (!razorpayKey) {
          throw new Error('Payment gateway is not configured. Please contact support.');
        }

        await loadRazorpayScript();
        set({ status: 'redirecting', lastProvider: 'razorpay', paymentStatus: 'processing' });

        await new Promise<void>((resolve, reject) => {
          const checkout = new window.Razorpay({
            key: razorpayKey,
            order_id: order.order_id,
            currency: order.currency || 'INR',
            name: 'reBorn_i',
            description: feature === 'simulation' ? 'Unlock Skill ROI Simulation' : 'Unlock Full Hiring Report',
            prefill: {
              name: user.full_name || user.email,
              email: user.email,
            },
            method: {
              upi: true,
              card: true,
              netbanking: true,
            },
            theme: {
              color: '#F5A623',
            },
            modal: {
              ondismiss: () => {
                reject(new Error('Payment cancelled. You can retry anytime.'));
              },
            },
            handler: async (response: any) => {
              try {
                set({ status: 'confirming', error: null, paymentStatus: 'processing' });
                const { data } = await paymentAPI.verifyPayment(
                  response.razorpay_order_id || order.order_id || '',
                  response.razorpay_payment_id,
                  response.razorpay_signature
                );
                if (!data.success) {
                  throw new Error(data.message || 'Payment verification failed.');
                }
                // Payment verified by backend — update local state
                set({
                  plan: normalizePlan(data.subscription_plan),
                  hasAccess: true,
                  status: 'success',
                  error: null,
                  paymentStatus: 'success',
                });
                // Refresh from backend to confirm DB state
                await get()._onPaymentSuccess?.();
                resolve();
              } catch (err) {
                reject(err);
              }
            },
          });

          checkout.on('payment.failed', (response: any) => {
            reject(new Error(response?.error?.description || 'Payment failed. Please retry.'));
          });

          checkout.open();
        });
      } catch (err: any) {
        set({
          status: 'error',
          error: readApiError(err, 'Payment could not be completed. Please retry.'),
          paymentStatus: 'failed',
        });
        throw err;
      }
    },

    incrementUsage: () => {
      set((state) => ({ usageCount: state.usageCount + 1 }));
    },

    markFreeAnalysisUsed: () => {
      set((state) => ({
        freeAnalysisUsed: true,
        analysisCount: state.analysisCount + 1,
      }));
    },

    clearError: () => set({ error: null, status: 'idle', paymentStatus: 'idle' }),

    resetStatus: () => set({ status: 'idle', error: null, paymentStatus: 'idle' }),

    getGate: (feature) => {
      const state = get();
      return getFeatureGate(state.plan, feature, state.featureAccess[feature]);
    },

    canAccess: (feature) => !get().getGate(feature).isLocked,
  })
);
